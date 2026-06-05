use std::path::PathBuf;
use tauri::Manager;

/// Returns the default lyrics directory inside the app's data directory.
#[tauri::command]
pub async fn get_default_lyrics_dir(app_handle: tauri::AppHandle) -> Result<String, String> {
    let dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("lyrics");
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.to_string_lossy().to_string())
}

/// Saves lyrics content to a .txt file inside the given directory.
#[tauri::command]
pub async fn save_lyrics(dir: String, filename: String, content: String) -> Result<(), String> {
    let path = PathBuf::from(&dir).join(&filename);
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    std::fs::write(&path, content.as_bytes()).map_err(|e| e.to_string())
}

/// Reads the content of a lyrics .txt file.
#[tauri::command]
pub async fn read_lyrics(dir: String, filename: String) -> Result<String, String> {
    let path = PathBuf::from(&dir).join(&filename);
    std::fs::read_to_string(&path).map_err(|e| e.to_string())
}

/// Lists all .txt filenames in the given directory.
#[tauri::command]
pub async fn list_lyrics_files(dir: String) -> Result<Vec<String>, String> {
    let dir_path = PathBuf::from(&dir);
    if !dir_path.exists() {
        return Ok(vec![]);
    }
    let entries = std::fs::read_dir(&dir_path).map_err(|e| e.to_string())?;
    let mut files: Vec<String> = entries
        .filter_map(|e| e.ok())
        .filter_map(|e| {
            let path = e.path();
            if path.extension().and_then(|s| s.to_str()) == Some("txt") {
                path.file_name()
                    .and_then(|s| s.to_str())
                    .map(|s| s.to_string())
            } else {
                None
            }
        })
        .collect();
    files.sort();
    Ok(files)
}

/// Renames a lyrics file. Returns an error if the new name already exists.
#[tauri::command]
pub async fn rename_lyrics(
    dir: String,
    old_name: String,
    new_name: String,
) -> Result<(), String> {
    let dir_path = PathBuf::from(&dir);
    let old_path = dir_path.join(&old_name);
    let new_path = dir_path.join(&new_name);

    if !old_path.exists() {
        return Err(format!("File '{}' not found", old_name));
    }
    if new_path.exists() {
        return Err(format!("A file named '{}' already exists", new_name));
    }
    std::fs::rename(&old_path, &new_path).map_err(|e| e.to_string())
}

/// Deletes a lyrics .txt file.
#[tauri::command]
pub async fn delete_lyrics(dir: String, filename: String) -> Result<(), String> {
    let path = PathBuf::from(&dir).join(&filename);
    if path.exists() {
        std::fs::remove_file(&path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Checks whether a filename already exists in the given lyrics directory.
/// Returns the resolved filename (with (1), (2)... appended if needed).
#[tauri::command]
pub async fn resolve_lyrics_filename(dir: String, base_name: String) -> Result<String, String> {
    let dir_path = PathBuf::from(&dir);
    std::fs::create_dir_all(&dir_path).map_err(|e| e.to_string())?;

    // Strip .txt extension for iteration
    let stem = if base_name.to_lowercase().ends_with(".txt") {
        base_name[..base_name.len() - 4].to_string()
    } else {
        base_name.clone()
    };

    let candidate = format!("{}.txt", stem);
    if !dir_path.join(&candidate).exists() {
        return Ok(candidate);
    }

    let mut i = 1u32;
    loop {
        let candidate = format!("{} ({}).txt", stem, i);
        if !dir_path.join(&candidate).exists() {
            return Ok(candidate);
        }
        i += 1;
        if i > 999 {
            return Err("Could not resolve a unique filename".to_string());
        }
    }
}
