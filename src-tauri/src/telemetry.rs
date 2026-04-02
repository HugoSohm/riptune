#[tauri::command]
pub async fn track_event(
    event_name: String,
    props: Option<serde_json::Value>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    let api_key = option_env!("APTABASE_API_KEY").unwrap_or("");
    if api_key.is_empty() {
        // Silently ignore if no key is found
        return Ok(());
    }

    let client = reqwest::Client::new();
    let package_info = app.package_info();

    // We send data to Aptabase endpoint
    // Determine the base URL depending on the region (e.g., EU)
    let url = if api_key.starts_with("A-EU-") {
        "https://eu.aptabase.com/api/v0/event"
    } else if api_key.starts_with("A-US-") {
        "https://us.aptabase.com/api/v0/event"
    } else {
        "https://aptabase.com/api/v0/event" // Fallback
    };

    // Create random session ID for simplistic tracking
    let session_id = format!("{:016x}", rand::random::<u64>());

    let body = serde_json::json!({
        "timestamp": chrono::Utc::now().to_rfc3339(),
        "sessionId": session_id,
        "eventName": event_name,
        "systemProps": {
            "osName": std::env::consts::OS,
            "osVersion": "",
            "locale": "",
            "appVersion": package_info.version.to_string(),
            "appBuildNumber": "",
            "sdkVersion": "riptune-custom-rust@0.1.0"
        },
        "props": props
    });

    let _ = client
        .post(url)
        .header("App-Key", api_key)
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await;

    Ok(())
}
