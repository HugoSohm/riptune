/// Send a bug report email using Resend API
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
