use std::process::Command;
use tauri::Manager;

#[tauri::command]
pub async fn delete_file(filepath: String) -> Result<(), String> {
    if std::path::Path::new(&filepath).exists() {
        std::fs::remove_file(&filepath).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn open_file(filepath: String) -> Result<(), String> {
    Command::new("explorer")
        .arg("/select,")
        .arg(&filepath)
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn open_folder(path: String) -> Result<(), String> {
    Command::new("explorer")
        .arg(&path)
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn get_default_download_dir(app_handle: tauri::AppHandle) -> Result<String, String> {
    let path = app_handle
        .path()
        .download_dir()
        .unwrap_or_else(|_| std::env::current_dir().unwrap().join("downloads"));
    Ok(path.to_string_lossy().to_string())
}
