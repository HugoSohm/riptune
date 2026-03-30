use id3::frame::{Content, Frame};
use id3::{Tag, TagLike};
use serde::{Deserialize, Serialize};
use std::env;
use std::fs::File;
use std::io::{BufRead, BufReader, Read, Write};
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use tauri::{Emitter, Manager};

pub struct ProcessState(pub Mutex<Option<Child>>);

#[derive(Serialize, Deserialize, Debug)]
pub struct UrlInfo {
    pub is_playlist: bool,
    pub count: Option<u32>,
    pub title: String,
}

#[derive(Serialize, Clone)]
pub struct ProgressEvent {
    pub current: u32,
    pub total: u32,
    pub title: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct AudioAnalysis {
    pub rhythm: Rhythm,
    pub tonal: Tonal,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Rhythm {
    pub bpm: f64,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Tonal {
    pub key_key: String,
    pub key_scale: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct DownloadResult {
    pub filepath: String,
    pub title: String,
    pub artist: String,
}

#[tauri::command]
pub async fn check_url_info(url: String, cookies: Option<String>) -> Result<UrlInfo, String> {
    let manifest_dir = env!("CARGO_MANIFEST_DIR");
    let bin_dir = std::path::Path::new(manifest_dir).join("bin");
    let yt_dlp_path = bin_dir.join("yt-dlp.exe");

    let mut cmd = Command::new(yt_dlp_path);
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
    let manifest_dir = env!("CARGO_MANIFEST_DIR");

    let downloads_dir = if let Some(path) = custom_path {
        std::path::PathBuf::from(&path)
    } else {
        app_handle
            .path()
            .download_dir()
            .unwrap_or_else(|_| std::env::current_dir().unwrap().join("downloads"))
    };

    std::fs::create_dir_all(&downloads_dir).map_err(|e| e.to_string())?;

    let out_template = format!("{}\\%(title)s.%(ext)s", downloads_dir.display());

    let bin_dir = std::path::Path::new(manifest_dir).join("bin");
    let yt_dlp_path = bin_dir.join("yt-dlp.exe");

    let mut cmd = Command::new(yt_dlp_path);
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

    // Store child for cancellation
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

    while reader.read_until(b'\n', &mut line_buf).map_err(|e| e.to_string())? > 0 {
        let line = String::from_utf8_lossy(&line_buf).trim().to_string();
        line_buf.clear();

        // Structured parsing from --print
        if line.starts_with("FILEPATH:") {
            let original_path = line.replace("FILEPATH:", "");
            let path_buf = std::path::PathBuf::from(&original_path);
            
            // Custom Sanitization to match user request: Jeune_Morty-Ivoire_Feeling_Official_Video.wav
            let sanitized_path = if let (Some(parent), Some(file_name)) = (path_buf.parent(), path_buf.file_name()) {
                let name_str = file_name.to_string_lossy();
                let sanitized_name = name_str
                    .replace(" - ", "-")   // Remove spaces around hyphen
                    .replace(" ", "_")     // Replace remaining spaces with underscores
                    .replace("(", "")      // Remove parentheses
                    .replace(")", "")
                    .replace("[", "")
                    .replace("]", "")
                    .replace("__", "_");   // Collapse double underscores
                
                let new_path = parent.join(sanitized_name);
                if original_path != new_path.to_string_lossy() {
                    let _ = std::fs::rename(&original_path, &new_path);
                    new_path.to_string_lossy().to_string()
                } else {
                    original_path
                }
            } else {
                original_path
            };

            last_valid_result = Some(DownloadResult {
                filepath: sanitized_path,
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
            last_title = line.replace("TITLE:", "").trim().to_string();
        } else if line.starts_with("ARTIST:") {
            last_artist = line.replace("ARTIST:", "").trim().to_string();
        } else if line.contains("%") && line.contains("of") {
            // These are the printed title and artist
            if last_title.is_empty() {
                last_title = line;
            } else if last_artist.is_empty() {
                last_artist = line;
            }
        }
    }

    // Check if we were interrupted
    {
        let mut lock = state.0.lock().map_err(|e| e.to_string())?;
        if lock.is_none() {
            return Err("Cancelled".to_string());
        }
        *lock = None; // Normal completion
    }

    last_valid_result.ok_or_else(|| "Download failed or interrupted".to_string())
}

#[tauri::command]
pub async fn extract_bpm_key(
    state: tauri::State<'_, ProcessState>,
    filepath: String,
) -> Result<(f64, String), String> {
    let ts = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();
    let temp_name = format!("analysis_{}.json", ts);
    let json_out = std::env::temp_dir().join(temp_name);
    let json_out_str = json_out.to_string_lossy().to_string();

    let audio_ext = std::path::Path::new(&filepath).extension().and_then(|s| s.to_str()).unwrap_or("wav");
    let temp_audio_path = std::env::temp_dir().join(format!("audio_{}.{}", ts, audio_ext));
    let temp_audio_path_str = temp_audio_path.to_string_lossy().to_string();
    let manifest_dir = env!("CARGO_MANIFEST_DIR");
    let ffmpeg_path = std::path::Path::new(manifest_dir).join("bin").join("ffmpeg.exe");
    let extractor_path = std::path::Path::new(manifest_dir).join("bin").join("streaming_extractor_music.exe");

    // Optimized Step: Use FFmpeg to extract only the first 60s for analysis
    // This handles special characters, makes a tiny file, and speeds up Essentia X10
    let ffmpeg_status = Command::new(ffmpeg_path)
        .arg("-ss")
        .arg("0")
        .arg("-t")
        .arg("60")
        .arg("-i")
        .arg(&filepath)
        .arg("-y")
        .arg(&temp_audio_path)
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status()
        .map_err(|e| format!("Fast extraction (FFmpeg) failed: {}", e))?;

    if !ffmpeg_status.success() {
        return Err("Failed to extract audio segment for analysis".to_string());
    }

    let mut child = Command::new(extractor_path)
        .arg(&temp_audio_path_str)
        .arg(&json_out_str)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| e.to_string())?;

    let stdout = child.stdout.take().ok_or("Failed to capture stdout")?;
    let stderr = child.stderr.take().ok_or("Failed to capture stderr")?;

    // Store child for cancellation
    {
        let mut lock = state.0.lock().map_err(|e| e.to_string())?;
        *lock = Some(child);
    }

    // This blocks until completion or kill
    let mut out_buf = Vec::new();
    let mut err_buf = Vec::new();
    let _ = BufReader::new(stdout).read_to_end(&mut out_buf);
    let _ = BufReader::new(stderr).read_to_end(&mut err_buf);

    // Now check if it was cancelled and cleanup
    let status = {
        let mut lock = state.0.lock().map_err(|e| e.to_string())?;
        if let Some(mut c) = lock.take() {
            c.wait().map_err(|e| e.to_string())?
        } else {
            let _ = std::fs::remove_file(&temp_audio_path);
            return Err("Cancelled".to_string());
        }
    };

    if !status.success() {
        let err_msg = String::from_utf8_lossy(&err_buf);
        let _ = std::fs::remove_file(&temp_audio_path); // Cleanup temp audio
        return Err(format!("Analysis failed: {}", err_msg));
    }

    let json_str = std::fs::read_to_string(&json_out).map_err(|e| e.to_string())?;
    let _ = std::fs::remove_file(&json_out); // Clean up
    let _ = std::fs::remove_file(&temp_audio_path); // Cleanup temp audio

    let analysis: AudioAnalysis = serde_json::from_str(&json_str).map_err(|e| e.to_string())?;
    let key_str = format!(
        "{} {}",
        analysis.tonal.key_key,
        if analysis.tonal.key_scale == "minor" {
            "min"
        } else {
            "maj"
        }
    );

    Ok((analysis.rhythm.bpm, key_str))
}

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
pub async fn update_metadata(
    filepath: String,
    title: String,
    artist: String,
    bpm: f64,
) -> Result<(), String> {
    let mut tag = Tag::new();

    // Attempt to read existing tags if possible, otherwise start fresh
    if let Ok(existing_tag) = Tag::read_from_path(&filepath) {
        tag = existing_tag;
    }

    tag.set_title(title);
    tag.set_artist(artist);

    // Set BPM using TBPM frame
    tag.add_frame(Frame::with_content(
        "TBPM",
        Content::Text((bpm.round() as u32).to_string()),
    ));

    tag.write_to_path(&filepath, id3::Version::Id3v24)
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
