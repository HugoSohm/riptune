use base64::{engine::general_purpose, Engine as _};

#[tauri::command]
pub async fn read_image_base64(path: String) -> Result<String, String> {
    let bytes = std::fs::read(&path).map_err(|e| e.to_string())?;

    // Check if it's an image by extension
    let path_lower = path.to_lowercase();
    let mime = if path_lower.ends_with(".png") {
        "image/png"
    } else if path_lower.ends_with(".jpg") || path_lower.ends_with(".jpeg") {
        "image/jpeg"
    } else if path_lower.ends_with(".gif") {
        "image/gif"
    } else if path_lower.ends_with(".webp") {
        "image/webp"
    } else {
        return Err("Unsupported image format".to_string());
    };

    let base64_str = general_purpose::STANDARD.encode(&bytes);
    Ok(format!("data:{};base64,{}", mime, base64_str))
}
