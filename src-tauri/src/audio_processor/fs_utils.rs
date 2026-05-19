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
    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .arg("/select,")
            .arg(&filepath)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg("-R")
            .arg(&filepath)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    {
        let parent = std::path::Path::new(&filepath)
            .parent()
            .unwrap_or(std::path::Path::new("."));
        Command::new("xdg-open")
            .arg(parent)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn open_folder(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    {
        Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
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

#[tauri::command]
pub async fn copy_file_to_clipboard(filepath: String) -> Result<(), String> {
    if !std::path::Path::new(&filepath).exists() {
        return Err("File does not exist".to_string());
    }

    #[cfg(target_os = "windows")]
    {
        let mut cmd = Command::new("powershell");
        cmd.arg("-NoProfile")
            .arg("-Command")
            .arg(format!("Set-Clipboard -Path '{}'", filepath));
        super::utils::hide_window(&mut cmd);
        let status = cmd.status().map_err(|e| e.to_string())?;
        if !status.success() {
            return Err("Failed to copy file to clipboard".to_string());
        }
    }

    #[cfg(target_os = "macos")]
    {
        let mut cmd = Command::new("osascript");
        cmd.arg("-e").arg(format!(
            "set the clipboard to (POSIX file \"{}\")",
            filepath
        ));
        let status = cmd.status().map_err(|e| e.to_string())?;
        if !status.success() {
            return Err("Failed to copy file to clipboard".to_string());
        }
    }

    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    {
        let mut cmd = Command::new("sh");
        cmd.arg("-c")
            .arg(format!("echo -ne 'copy\\nfile://{}' | xclip -selection clipboard -t x-special/gnome-copied-files", filepath));
        let status = cmd.status().map_err(|e| e.to_string())?;
        if !status.success() {
            return Err("Failed to copy file to clipboard".to_string());
        }
    }

    Ok(())
}
