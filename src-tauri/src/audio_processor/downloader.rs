use crate::audio_processor::models::{DownloadResult, ProcessState, ProgressEvent, UrlInfo};
use std::fs::File;
use std::io::{BufRead, BufReader, Write};
use std::process::{Command, Stdio};
use tauri::{Emitter, Manager};

#[tauri::command]
pub async fn check_url_info(
    app_handle: tauri::AppHandle,
    url: String,
    cookies: Option<String>,
) -> Result<UrlInfo, String> {
    let yt_dlp_path = crate::audio_processor::utils::resolve_bin_path(&app_handle, "yt-dlp")?;

    let mut cmd = Command::new(yt_dlp_path);
    crate::audio_processor::utils::hide_window(&mut cmd);
    cmd.env("PYTHONUTF8", "1");

    let mut cookie_path = None;
    if let Some(c) = cookies {
        if !c.is_empty() {
            let ts = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs();
            let temp_path = std::env::temp_dir().join(format!("riptune_check_{}.json", ts));
            let mut file = File::create(&temp_path).map_err(|e| e.to_string())?;
            file.write_all(c.as_bytes()).map_err(|e| e.to_string())?;
            cmd.arg("--cookies").arg(&temp_path);
            cookie_path = Some(temp_path);
        }
    }

    let output = cmd
        .arg("--flat-playlist")
        .arg("--print")
        .arg("%(playlist_count)s")
        .arg("--print")
        .arg("%(title)s")
        .arg("--ignore-errors")
        .arg("--no-warnings")
        .arg("--simulate")
        .arg(&url)
        .output()
        .map_err(|e| e.to_string())?;

    if let Some(path) = cookie_path {
        let _ = std::fs::remove_file(path);
    }

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let lines: Vec<&str> = stdout.lines().collect();

    if lines.is_empty() {
        return Err("Failed to fetch URL info".to_string());
    }

    let mut is_playlist = false;
    let mut count = None;
    let title = lines[lines.len() - 1].to_string();

    if lines.len() >= 2 {
        if let Ok(c) = lines[0].parse::<u32>() {
            count = Some(c);
            is_playlist = c > 1;
        }
    }

    Ok(UrlInfo {
        is_playlist,
        count,
        title,
    })
}

#[tauri::command]
pub async fn cancel_download(state: tauri::State<'_, ProcessState>) -> Result<(), String> {
    let mut lock = state.0.lock().map_err(|e| e.to_string())?;
    if let Some(mut child) = lock.take() {
        let _ = child.kill();
    }
    Ok(())
}

#[tauri::command]
pub async fn download_audio(
    app_handle: tauri::AppHandle,
    state: tauri::State<'_, ProcessState>,
    url: String,
    format: String,
    custom_path: Option<String>,
    cookies: Option<String>,
    download_playlist: bool,
) -> Result<DownloadResult, String> {
    let downloads_dir = if let Some(path) = custom_path {
        if path == "TMP_ANALYSIS" {
            std::env::temp_dir().join("riptune_analysis")
        } else {
            std::path::PathBuf::from(&path)
        }
    } else {
        app_handle
            .path()
            .download_dir()
            .unwrap_or_else(|_| std::env::current_dir().unwrap().join("downloads"))
    };

    std::fs::create_dir_all(&downloads_dir).map_err(|e| e.to_string())?;

    let separator = std::path::MAIN_SEPARATOR;
    let out_template = format!("{}{}%(title)s.%(ext)s", downloads_dir.display(), separator);

    let yt_dlp_path = crate::audio_processor::utils::resolve_bin_path(&app_handle, "yt-dlp")?;
    let bin_dir = yt_dlp_path
        .parent()
        .ok_or("Could not find binary directory")?;

    let mut cmd = Command::new(&yt_dlp_path);
    crate::audio_processor::utils::hide_window(&mut cmd);
    cmd.env("PYTHONUTF8", "1");

    let mut cookie_path = None;
    if let Some(c) = cookies {
        if !c.is_empty() {
            let ts = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs();
            let temp_path = std::env::temp_dir().join(format!("riptune_dl_{}.json", ts));
            let mut file = File::create(&temp_path).map_err(|e| e.to_string())?;
            file.write_all(c.as_bytes()).map_err(|e| e.to_string())?;
            cmd.arg("--cookies").arg(&temp_path);
            cookie_path = Some(temp_path);
        }
    }

    cmd.arg("--ffmpeg-location")
        .arg(&bin_dir)
        .arg("-x")
        .arg("--audio-format")
        .arg(&format)
        .arg("-o")
        .arg(&out_template)
        .arg("--encoding")
        .arg("utf-8")
        .arg("--print")
        .arg("TITLE:%(title)s")
        .arg("--print")
        .arg("ARTIST:%(uploader)s")
        .arg("--print")
        .arg("after_move:FILEPATH:%(filepath)s")
        .arg("--newline")
        .arg("--progress");

    if !download_playlist {
        cmd.arg("--no-playlist");
    }

    let mut child = cmd
        .arg(&url)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| e.to_string())?;

    let stdout = child.stdout.take().ok_or("Failed to capture stdout")?;

    if let Some(path) = cookie_path {
        let _ = std::fs::remove_file(path);
    }

    {
        let mut lock = state.0.lock().map_err(|e| e.to_string())?;
        *lock = Some(child);
    }

    let mut last_title = String::new();
    let mut last_artist = String::new();
    let mut last_valid_result: Option<DownloadResult> = None;
    let mut current_track_count = 0;
    let mut reader = BufReader::new(stdout);
    let mut line_buf = Vec::new();

    while reader
        .read_until(b'\n', &mut line_buf)
        .map_err(|e| e.to_string())?
        > 0
    {
        let line = String::from_utf8_lossy(&line_buf).trim().to_string();
        line_buf.clear();

        if line.starts_with("FILEPATH:") {
            let filepath = line.replace("FILEPATH:", "");
            last_valid_result = Some(DownloadResult {
                filepath,
                title: last_title.clone(),
                artist: last_artist.clone(),
            });


            current_track_count += 1;
            let _ = app_handle.emit(
                "download-progress",
                ProgressEvent {
                    current: current_track_count,
                    total: 0,
                    title: last_title.clone(),
                },
            );
        } else if line.starts_with("TITLE:") {
            let val = line.replace("TITLE:", "").trim().to_string();
            if !val.is_empty() && !val.contains("%") {
                last_title = val;
            }
        } else if line.starts_with("ARTIST:") {
            let val = line.replace("ARTIST:", "").trim().to_string();
            if !val.is_empty() && !val.contains("%") {
                last_artist = val;
            }
        }
    }

    {
        let mut lock = state.0.lock().map_err(|e| e.to_string())?;
        if lock.is_none() {
            return Err("Cancelled".to_string());
        }
        *lock = None;
    }

    last_valid_result.ok_or_else(|| "Download failed or interrupted".to_string())
}
