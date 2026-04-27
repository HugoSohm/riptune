use tauri::{AppHandle, Emitter, Manager};

pub struct AnalysisResults(pub std::sync::Mutex<Option<(f64, String)>>);

#[tauri::command]
pub fn report_analysis_result(_url: String, bpm: f64, key: String, state: tauri::State<AnalysisResults>) {
    let mut current = state.0.lock().unwrap();
    *current = Some((bpm, key));
}

pub fn init(app_handle: AppHandle) {
    std::thread::spawn(move || {
        let server = match tiny_http::Server::http("127.0.0.1:4774") {
            Ok(s) => s,
            Err(_) => return, // Server could not start (port in use, etc)
        };

        for mut request in server.incoming_requests() {
            let cors1 =
                tiny_http::Header::from_bytes(&b"Access-Control-Allow-Origin"[..], &b"*"[..])
                    .unwrap();
            let cors2 = tiny_http::Header::from_bytes(
                &b"Access-Control-Allow-Methods"[..],
                &b"POST, GET, OPTIONS"[..],
            )
            .unwrap();
            let cors3 = tiny_http::Header::from_bytes(
                &b"Access-Control-Allow-Headers"[..],
                &b"Content-Type"[..],
            )
            .unwrap();
            let cors4 = tiny_http::Header::from_bytes(
                &b"Access-Control-Allow-Private-Network"[..],
                &b"true"[..],
            )
            .unwrap();

            if request.method() == &tiny_http::Method::Options {
                let response = tiny_http::Response::empty(204)
                    .with_header(cors1.clone())
                    .with_header(cors2.clone())
                    .with_header(cors3.clone())
                    .with_header(cors4.clone());
                let _ = request.respond(response);
                continue;
            }

            if request.method() == &tiny_http::Method::Post && request.url() == "/command" {
                let mut content = String::new();
                let _ = request.as_reader().read_to_string(&mut content);

                // Parse JSON simply without dragging in full serde_derive if not strictly needed
                if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
                    if let Some(action) = json["action"].as_str() {
                        if action == "focus" {
                            if let Some(window) = app_handle.get_webview_window("main") {
                                let _ = window.set_focus();
                                let _ = window.unminimize();
                                let _ = window.show();
                            }
                            let response = tiny_http::Response::from_string("{\"status\":\"ok\"}")
                                .with_status_code(200)
                                .with_header(cors1.clone())
                                .with_header(cors2.clone())
                                .with_header(cors3.clone())
                                .with_header(cors4.clone());
                            let _ = request.respond(response);
                            continue;
                        } else if let Some(url) = json["url"].as_str() {
                            let format_param = json["format"].as_str().unwrap_or("mp3");
                            // Re-emit standard deep link payload internally
                            let payload =
                                format!("riptune://{}?url={}&format={}", action, url, format_param);
                            let _ = app_handle.emit("deep-link-received", payload);

                            let response = tiny_http::Response::from_string("{\"status\":\"ok\"}")
                                .with_status_code(200)
                                .with_header(cors1.clone())
                                .with_header(cors2.clone())
                                .with_header(cors3.clone())
                                .with_header(cors4.clone());
                                
                            // Clear previous analysis
                            if action == "analyze" || action == "both" {
                                let state = app_handle.state::<AnalysisResults>();
                                let mut current = state.0.lock().unwrap();
                                *current = None;
                            }
                                
                            let _ = request.respond(response);
                            continue;
                        }
                    }
                }
            }

            if request.method() == &tiny_http::Method::Post && request.url() == "/status" {
                let mut content = String::new();
                let _ = request.as_reader().read_to_string(&mut content);

                if let Ok(_json) = serde_json::from_str::<serde_json::Value>(&content) {
                    // Ignore the URL and just fetch the latest available result
                    let state = app_handle.state::<AnalysisResults>();
                    let mut current = state.0.lock().unwrap();
                    
                    if let Some((bpm, key)) = current.take() {
                        let response_body = format!("{{\"status\":\"ok\",\"bpm\":{},\"key\":\"{}\"}}", bpm, key);
                        let response = tiny_http::Response::from_string(response_body)
                            .with_status_code(200)
                            .with_header(cors1.clone())
                            .with_header(cors2.clone())
                            .with_header(cors3.clone())
                            .with_header(cors4.clone());
                        let _ = request.respond(response);
                        continue;
                    } else {
                        let response = tiny_http::Response::from_string("{\"status\":\"pending\"}")
                            .with_status_code(200)
                            .with_header(cors1.clone())
                            .with_header(cors2.clone())
                            .with_header(cors3.clone())
                            .with_header(cors4.clone());
                        let _ = request.respond(response);
                        continue;
                    }
                }
            }

            let response = tiny_http::Response::from_string("Not Found")
                .with_status_code(404)
                .with_header(cors1)
                .with_header(cors2)
                .with_header(cors3)
                .with_header(cors4);
            let _ = request.respond(response);
        }
    });
}
