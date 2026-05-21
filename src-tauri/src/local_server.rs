use tauri::{AppHandle, Emitter, Manager};
use tiny_http::{Header, Request, Response, Server};

pub struct AnalysisResults(pub std::sync::Mutex<std::collections::HashMap<String, (f64, String)>>);

#[tauri::command]
pub fn report_analysis_result(
    url: String,
    bpm: f64,
    key: String,
    state: tauri::State<AnalysisResults>,
) {
    if url.is_empty() {
        return;
    }
    let mut current = state.0.lock().unwrap();
    current.insert(url, (bpm, key));
}

pub fn init(app_handle: AppHandle) {
    std::thread::spawn(move || {
        let server = match Server::http("127.0.0.1:4774") {
            Ok(s) => s,
            Err(_) => return, // Server could not start (port in use, etc)
        };

        for request in server.incoming_requests() {
            handle_request(&app_handle, request);
        }
    });
}

/// Dispatches incoming local HTTP requests to the appropriate handler
fn handle_request(app_handle: &AppHandle, request: Request) {
    let cors_headers = get_cors_headers();

    // 1. Handle preflight CORS OPTIONS requests
    if request.method() == &tiny_http::Method::Options {
        let response = Response::empty(204);
        let _ = request.respond(with_headers(response, &cors_headers));
        return;
    }

    // 2. Handle POST /command
    if request.method() == &tiny_http::Method::Post && request.url() == "/command" {
        handle_command_route(app_handle, request, &cors_headers);
        return;
    }

    // 3. Handle POST /status
    if request.method() == &tiny_http::Method::Post && request.url() == "/status" {
        handle_status_route(app_handle, request, &cors_headers);
        return;
    }

    // 4. Handle GET /audio?path=<url_encoded_path>
    if (request.method() == &tiny_http::Method::Get || request.method() == &tiny_http::Method::Head)
        && request.url().starts_with("/audio")
    {
        handle_audio_route(request, &cors_headers);
        return;
    }

    // 5. Default 404 handler
    let response = Response::from_string("Not Found").with_status_code(404);
    let _ = request.respond(with_headers(response, &cors_headers));
}

/// Decodes a percent-encoded URL query string value (UTF-8 aware)
fn url_decode(s: &str) -> String {
    let mut bytes: Vec<u8> = Vec::new();
    let mut chars = s.chars().peekable();
    while let Some(c) = chars.next() {
        if c == '%' {
            let h1 = chars.next().unwrap_or('0');
            let h2 = chars.next().unwrap_or('0');
            if let Ok(byte) = u8::from_str_radix(&format!("{}{}", h1, h2), 16) {
                bytes.push(byte);
            }
        } else if c == '+' {
            bytes.push(b' ');
        } else {
            // Encode the char as UTF-8 bytes
            let mut buf = [0u8; 4];
            let encoded = c.encode_utf8(&mut buf);
            bytes.extend_from_slice(encoded.as_bytes());
        }
    }
    String::from_utf8(bytes).unwrap_or_default()
}

/// Returns the MIME type for an audio file based on its extension
fn audio_mime_type(path: &str) -> &'static str {
    let lower = path.to_lowercase();
    if lower.ends_with(".mp3") {
        "audio/mpeg"
    } else if lower.ends_with(".flac") {
        "audio/flac"
    } else if lower.ends_with(".wav") {
        "audio/wav"
    } else if lower.ends_with(".m4a") || lower.ends_with(".aac") {
        "audio/mp4"
    } else if lower.ends_with(".ogg") || lower.ends_with(".opus") {
        "audio/ogg"
    } else {
        "audio/mpeg"
    }
}

/// Serves a local audio file, with basic Range support for seeking
fn handle_audio_route(request: Request, cors_headers: &[Header]) {
    // Parse ?path= from URL
    let url = request.url().to_string();
    let path_param = url
        .split('?')
        .nth(1)
        .and_then(|query| {
            query.split('&').find_map(|kv| {
                let (key, val) = kv.split_once('=')?;
                if key == "path" {
                    Some(val.to_string())
                } else {
                    None
                }
            })
        })
        .map(|v| url_decode(&v))
        .unwrap_or_default();

    if path_param.is_empty() {
        let response = Response::from_string("Missing path").with_status_code(400);
        let _ = request.respond(with_headers(response, cors_headers));
        return;
    }

    let file_path = std::path::Path::new(&path_param);
    let data = match std::fs::read(file_path) {
        Ok(d) => d,
        Err(_) => {
            let response = Response::from_string("Not Found").with_status_code(404);
            let _ = request.respond(with_headers(response, cors_headers));
            return;
        }
    };

    let total_len = data.len();
    let mime = audio_mime_type(&path_param);

    // Parse Range header if present
    let range_header = request
        .headers()
        .iter()
        .find(|h| h.field.equiv("Range"))
        .map(|h| h.value.as_str().to_string());

    let (start, end, status) = if let Some(range_val) = range_header {
        // e.g. "bytes=0-1023"
        let range_str = range_val.trim_start_matches("bytes=");
        let mut parts = range_str.splitn(2, '-');
        let s: usize = parts.next().and_then(|v| v.parse().ok()).unwrap_or(0);
        let e: usize = parts
            .next()
            .and_then(|v| if v.is_empty() { None } else { v.parse().ok() })
            .unwrap_or(total_len.saturating_sub(1));
        let e = e.min(total_len.saturating_sub(1));
        (s, e, 206u16)
    } else {
        (0, total_len.saturating_sub(1), 200u16)
    };

    let slice = &data[start..=end];
    let content_length = slice.len();

    let mut extra_headers = cors_headers.to_vec();
    extra_headers.push(Header::from_bytes(&b"Content-Type"[..], mime.as_bytes()).unwrap());
    extra_headers.push(Header::from_bytes(&b"Accept-Ranges"[..], &b"bytes"[..]).unwrap());
    extra_headers.push(
        Header::from_bytes(
            &b"Content-Length"[..],
            content_length.to_string().as_bytes(),
        )
        .unwrap(),
    );
    if status == 206 {
        let cr = format!("bytes {}-{}/{}", start, end, total_len);
        extra_headers.push(Header::from_bytes(&b"Content-Range"[..], cr.as_bytes()).unwrap());
    }

    let cursor = std::io::Cursor::new(slice.to_vec());
    let response = Response::new(
        tiny_http::StatusCode(status),
        extra_headers,
        cursor,
        Some(content_length),
        None,
    );
    let _ = request.respond(response);
}

/// Generates standard CORS headers for local integration
fn get_cors_headers() -> Vec<Header> {
    vec![
        Header::from_bytes(&b"Access-Control-Allow-Origin"[..], &b"*"[..]).unwrap(),
        Header::from_bytes(
            &b"Access-Control-Allow-Methods"[..],
            &b"POST, GET, OPTIONS"[..],
        )
        .unwrap(),
        Header::from_bytes(&b"Access-Control-Allow-Headers"[..], &b"Content-Type"[..]).unwrap(),
        Header::from_bytes(&b"Access-Control-Allow-Private-Network"[..], &b"true"[..]).unwrap(),
    ]
}

/// Helper to attach a slice of headers to a response
fn with_headers<R: std::io::Read>(mut response: Response<R>, headers: &[Header]) -> Response<R> {
    for header in headers {
        response = response.with_header(header.clone());
    }
    response
}

/// Handles incoming commands (e.g. focusing the window or triggering deep links)
fn handle_command_route(app_handle: &AppHandle, mut request: Request, cors_headers: &[Header]) {
    let mut content = String::new();
    if request.as_reader().read_to_string(&mut content).is_err() {
        let response = Response::from_string("Bad Request").with_status_code(400);
        let _ = request.respond(with_headers(response, cors_headers));
        return;
    }

    if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
        if let Some(action) = json["action"].as_str() {
            if action == "focus" {
                if let Some(window) = app_handle.get_webview_window("main") {
                    let _ = window.set_focus();
                    let _ = window.unminimize();
                    let _ = window.show();
                }
                let response = Response::from_string("{\"status\":\"ok\"}").with_status_code(200);
                let _ = request.respond(with_headers(response, cors_headers));
                return;
            } else if let Some(url) = json["url"].as_str() {
                let format_param = json["format"].as_str().unwrap_or("mp3");
                // Re-emit standard deep link payload internally
                let payload = format!("riptune://{}?url={}&format={}", action, url, format_param);
                let _ = app_handle.emit("deep-link-received", payload);

                let response = Response::from_string("{\"status\":\"ok\"}").with_status_code(200);

                // Clear previous analysis for this URL
                if (action == "analyze" || action == "both") && !url.is_empty() {
                    let state = app_handle.state::<AnalysisResults>();
                    let mut current = state.0.lock().unwrap();
                    current.remove(url);
                }

                let _ = request.respond(with_headers(response, cors_headers));
                return;
            }
        }
    }

    let response = Response::from_string("Bad Request").with_status_code(400);
    let _ = request.respond(with_headers(response, cors_headers));
}

/// Handles querying track analysis status
fn handle_status_route(app_handle: &AppHandle, mut request: Request, cors_headers: &[Header]) {
    let mut content = String::new();
    if request.as_reader().read_to_string(&mut content).is_err() {
        let response = Response::from_string("Bad Request").with_status_code(400);
        let _ = request.respond(with_headers(response, cors_headers));
        return;
    }

    if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
        let url_key = json["url"].as_str().unwrap_or("").to_string();
        let state = app_handle.state::<AnalysisResults>();
        let mut current = state.0.lock().unwrap();

        // Look up by URL if provided, otherwise take any available result
        let result = if !url_key.is_empty() {
            current.remove(&url_key)
        } else {
            let key = current.keys().next().cloned();
            key.and_then(|k| current.remove(&k))
        };

        if let Some((bpm, key)) = result {
            let response_body =
                format!("{{\"status\":\"ok\",\"bpm\":{},\"key\":\"{}\"}}", bpm, key);
            let response = Response::from_string(response_body).with_status_code(200);
            let _ = request.respond(with_headers(response, cors_headers));
            return;
        } else {
            let response = Response::from_string("{\"status\":\"pending\"}").with_status_code(200);
            let _ = request.respond(with_headers(response, cors_headers));
            return;
        }
    }

    let response = Response::from_string("Bad Request").with_status_code(400);
    let _ = request.respond(with_headers(response, cors_headers));
}
