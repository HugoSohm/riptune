#[tauri::command]
pub async fn send_bug_report(message: String, screenshot: Option<String>) -> Result<(), String> {
    // Injected at compile time. No hardcoded fallback for security in open-source.
    let api_key = option_env!("RESEND_API_KEY").unwrap_or("");
    let client = reqwest::Client::new();

    let html = format!(
        r#"<div style="font-family: sans-serif; line-height: 1.5; color: #333;">
              <h2>Bug Report Details</h2>
              <p><strong>Message:</strong></p>
              <div style="background: #f4f4f4; padding: 15px; border-radius: 8px;">{}</div>
              <p><strong>App Version:</strong> 0.1.0</p>
              <p><strong>Platform:</strong> Windows (Tauri Backend)</p>
              <hr>
              <p><strong>Status:</strong> {}</p>
            </div>"#,
        message.replace("\n", "<br>"),
        screenshot
            .as_ref()
            .map(|_| "<em>Screenshot Attached (Check email attachments)</em>".to_string())
            .unwrap_or_else(|| "<em>No screenshot provided.</em>".to_string())
    );

    let mut body = serde_json::json!({
        "from": "RipTune App <no-reply@riptune.hugosohm.fr>",
        "to": ["help@riptune.hugosohm.fr"],
        "subject": "[Bug Report] RipTune",
        "html": html
    });

    if let Some(s) = screenshot {
        // Clean the base64 string if it contains a data URL prefix
        let base64_image = s
            .replace("data:image/png;base64,", "")
            .replace("data:image/jpeg;base64,", "");

        body["attachments"] = serde_json::json!([{
            "filename": "screenshot.png",
            "content": base64_image
        }]);
    }

    let res = client
        .post("https://api.resend.com/emails")
        .header("Authorization", format!("Bearer {}", api_key))
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        let err_text = res.text().await.unwrap_or_default();
        return Err(format!("Resend error: {}", err_text));
    }

    Ok(())
}

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
