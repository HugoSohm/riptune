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

    // 4. Default 404 handler
    let response = Response::from_string("Not Found").with_status_code(404);
    let _ = request.respond(with_headers(response, &cors_headers));
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
