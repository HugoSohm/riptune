use crate::audio_processor::models::{
    DownloadArgs, DownloadResponse, DownloadResult, ProcessState, ProgressEvent, UrlInfo,
};
use std::fs::File;
use std::io::{BufRead, BufReader, Write};
use std::process::{Command, Stdio};
use std::sync::{Arc, Mutex};
use std::thread;
use tauri::{Emitter, Manager};

fn sanitize_folder_name(name: &str) -> String {
    let invalid_chars = ['<', '>', ':', '"', '/', '\\', '|', '?', '*'];
    name.chars()
        .map(|c| if invalid_chars.contains(&c) { '_' } else { c })
        .collect::<String>()
        .trim()
        .to_string()
}

/// Prepares a hidden Command object for yt-dlp binary
fn prepare_yt_dlp_command(
    app_handle: &tauri::AppHandle,
) -> Result<(Command, std::path::PathBuf), String> {
    let yt_dlp_path = crate::audio_processor::utils::resolve_bin_path(app_handle, "yt-dlp")?;
    let mut cmd = Command::new(&yt_dlp_path);
    crate::audio_processor::utils::hide_window(&mut cmd);
    cmd.env("PYTHONUTF8", "1");
    Ok((cmd, yt_dlp_path))
}

/// Sets up a temporary cookies JSON file if cookies are provided in args
fn setup_cookies(
    cmd: &mut Command,
    cookies: &Option<String>,
    prefix: &str,
) -> Result<Option<std::path::PathBuf>, String> {
    if let Some(c) = cookies {
        if !c.is_empty() {
            let ts = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs();
            let temp_path = std::env::temp_dir().join(format!("riptune_{}_{}.json", prefix, ts));
            let mut file = File::create(&temp_path).map_err(|e| e.to_string())?;
            file.write_all(c.as_bytes()).map_err(|e| e.to_string())?;
            cmd.arg("--cookies").arg(&temp_path);
            return Ok(Some(temp_path));
        }
    }
    Ok(None)
}

/// Checks if standard yt-dlp stderr output indicates that a video or playlist is private/unavailable
fn is_unavailable_error(stderr: &str) -> bool {
    stderr.contains("Private video")
        || stderr.contains("This playlist does not exist")
        || stderr.contains("This video is private")
        || stderr.contains("This video has been removed")
        || stderr.contains("Video unavailable")
        || stderr.contains("playlist does not exist")
        || stderr.contains("is not available")
        || stderr.contains("members-only")
        || stderr.contains("The requested track is not available")
        || stderr.contains("track has been removed")
        || stderr.contains("404")
        || stderr.contains("403")
        || stderr.contains("Not Found")
        || stderr.contains("Unable to download JSON metadata")
        || (stderr.contains("ERROR") && stderr.contains("Private"))
        || (stderr.contains("ERROR") && stderr.contains("does not exist"))
}

/// Cleans raw yt-dlp stderr to extract the core ERROR message line
fn clean_stderr(stderr: &str) -> &str {
    stderr
        .lines()
        .find(|l| l.contains("ERROR:"))
        .map(|l| l.split("ERROR:").last().unwrap_or(l).trim())
        .unwrap_or(stderr.trim())
}

/// Determines and creates the target download directory based on DownloadArgs
fn determine_download_directory(
    app_handle: &tauri::AppHandle,
    args: &DownloadArgs,
) -> Result<std::path::PathBuf, String> {
    let downloads_dir = if let Some(ref path) = args.custom_path {
        if path == "TMP_ANALYSIS" {
            std::env::temp_dir().join("riptune_analysis")
        } else {
            std::path::PathBuf::from(path)
        }
    } else {
        app_handle
            .path()
            .download_dir()
            .unwrap_or_else(|_| std::env::current_dir().unwrap().join("downloads"))
    };

    std::fs::create_dir_all(&downloads_dir).map_err(|e| e.to_string())?;

    let mut final_dir = downloads_dir;
    if args.download_playlist {
        if let Some(ref title) = args.playlist_title {
            let safe_title = sanitize_folder_name(title);
            if !safe_title.is_empty() {
                final_dir = final_dir.join(safe_title);
                std::fs::create_dir_all(&final_dir).map_err(|e| e.to_string())?;
            }
        }
    }

    Ok(final_dir)
}

/// Spawns the yt-dlp child process and sets up required args and cookies
fn spawn_yt_dlp(
    app_handle: &tauri::AppHandle,
    args: &DownloadArgs,
    out_template: &str,
) -> Result<(std::process::Child, Option<std::path::PathBuf>), String> {
    let (mut cmd, yt_dlp_path) = prepare_yt_dlp_command(app_handle)?;
    let bin_dir = yt_dlp_path
        .parent()
        .ok_or("Could not find binary directory")?;

    let cookie_path = setup_cookies(&mut cmd, &args.cookies, "dl")?;

    cmd.arg("--ffmpeg-location")
        .arg(bin_dir)
        .arg("--embed-metadata")
        .arg("-x")
        .arg("--audio-format")
        .arg(&args.format)
        .arg("-o")
        .arg(out_template)
        .arg("--encoding")
        .arg("utf-8")
        .arg("--print")
        .arg("TITLE:%(title)s")
        .arg("--print")
        .arg("ARTIST:%(uploader)s")
        .arg("--print")
        .arg("URL:%(webpage_url)s")
        .arg("--print")
        .arg("DESCRIPTION:%(description)j")
        .arg("--print")
        .arg("after_move:FILEPATH:%(filepath)s")
        .arg("--newline")
        .arg("--progress");

    if !args.download_playlist {
        cmd.arg("--no-playlist");
    }

    let child = cmd
        .arg(&args.url)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| e.to_string())?;

    Ok((child, cookie_path))
}

/// Parses raw yt-dlp stdout and maps tracks to DownloadResult objects
fn process_download_output(
    app_handle: &tauri::AppHandle,
    stdout: std::process::ChildStdout,
    fallback_url: &str,
) -> Result<Vec<DownloadResult>, String> {
    let mut last_title = String::new();
    let mut last_artist = String::new();
    let mut last_url = String::new();
    let mut last_description: Option<String> = None;
    let mut results: Vec<DownloadResult> = Vec::new();
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
            results.push(DownloadResult {
                filepath,
                title: last_title.clone(),
                artist: last_artist.clone(),
                url: if last_url.is_empty() {
                    fallback_url.to_string()
                } else {
                    last_url.clone()
                },
                description: last_description.clone(),
            });
            last_description = None;
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
            if !val.is_empty() && !val.contains('%') {
                last_title = val;
            }
        } else if line.starts_with("ARTIST:") {
            let val = line.replace("ARTIST:", "").trim().to_string();
            if !val.is_empty() && !val.contains('%') {
                last_artist = val;
            }
        } else if line.starts_with("URL:") {
            let val = line.replace("URL:", "").trim().to_string();
            if !val.is_empty() && !val.contains('%') {
                last_url = val;
            }
        } else if line.starts_with("DESCRIPTION:") {
            let val = line.replace("DESCRIPTION:", "").trim().to_string();
            if !val.is_empty() && !val.contains('%') && val != "null" {
                if let Ok(desc) = serde_json::from_str::<String>(&val) {
                    last_description = Some(desc);
                } else {
                    last_description = Some(val);
                }
            }
        }
    }

    Ok(results)
}

#[tauri::command]
pub async fn check_url_info(
    app_handle: tauri::AppHandle,
    url: String,
    cookies: Option<String>,
) -> Result<UrlInfo, String> {
    let (mut cmd, _) = prepare_yt_dlp_command(&app_handle)?;
    let cookie_path = setup_cookies(&mut cmd, &cookies, "check")?;

    let output = cmd
        .arg("--flat-playlist")
        .arg("--print")
        .arg("%(playlist_count)s")
        .arg("--print")
        .arg("%(playlist_title)s")
        .arg("--print")
        .arg("%(album)s")
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
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(if is_unavailable_error(&stderr) {
            "PLAYLIST_NOT_FOUND".to_string()
        } else {
            clean_stderr(&stderr).to_string()
        });
    }

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let lines: Vec<&str> = stdout.lines().collect();

    if lines.is_empty() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(if is_unavailable_error(&stderr) {
            "PLAYLIST_NOT_FOUND".to_string()
        } else {
            "Failed to fetch URL info".to_string()
        });
    }

    let mut is_playlist = false;
    let mut count = None;

    // Logic to pick the best title: playlist_title > album > title
    let mut title = "Unknown Playlist".to_string();
    if lines.len() >= 3 {
        let p_title = lines[lines.len() - 3];
        let a_title = lines[lines.len() - 2];
        let s_title = lines[lines.len() - 1];

        if p_title != "NA" && !p_title.is_empty() {
            title = p_title.to_string();
        } else if a_title != "NA" && !a_title.is_empty() {
            title = a_title.to_string();
        } else if s_title != "NA" && !s_title.is_empty() {
            title = s_title.to_string();
        }
    } else if !lines.is_empty() {
        title = lines[lines.len() - 1].to_string();
    }

    if lines.len() >= 4 {
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
pub async fn cancel_download(
    state: tauri::State<'_, ProcessState>,
    task_id: Option<String>,
) -> Result<(), String> {
    let mut lock = state.0.lock().map_err(|e| e.to_string())?;
    if let Some(id) = task_id {
        if let Some(mut child) = lock.remove(&id) {
            let _ = child.kill();
        }
    } else {
        // Cancel all if no specific task_id
        for (_, mut child) in lock.drain() {
            let _ = child.kill();
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn download_audio(
    app_handle: tauri::AppHandle,
    state: tauri::State<'_, ProcessState>,
    args: DownloadArgs,
) -> Result<DownloadResponse, String> {
    let final_dir = determine_download_directory(&app_handle, &args)?;

    let separator = std::path::MAIN_SEPARATOR;
    let out_template = format!("{}{}%(title)s.%(ext)s", final_dir.display(), separator);

    let (mut child, cookie_path) = spawn_yt_dlp(&app_handle, &args, &out_template)?;

    let stdout = child.stdout.take().ok_or("Failed to capture stdout")?;
    let stderr_handle = child.stderr.take();

    if let Some(path) = cookie_path {
        let _ = std::fs::remove_file(path);
    }

    // Collect stderr in a background thread so it doesn't block stdout reading
    let stderr_buf: Arc<Mutex<String>> = Arc::new(Mutex::new(String::new()));
    let stderr_buf_clone = Arc::clone(&stderr_buf);
    if let Some(stderr) = stderr_handle {
        thread::spawn(move || {
            let reader = BufReader::new(stderr);
            let mut buf = stderr_buf_clone.lock().unwrap();
            for line in reader.lines().map_while(Result::ok) {
                buf.push_str(&line);
                buf.push('\n');
            }
        });
    }

    {
        let mut lock = state.0.lock().map_err(|e| e.to_string())?;
        lock.insert(args.task_id.clone(), child);
    }

    let results = process_download_output(&app_handle, stdout, &args.url)?;

    {
        let mut lock = state.0.lock().map_err(|e| e.to_string())?;
        // If our task_id is no longer in the map, we were cancelled
        if !lock.contains_key(&args.task_id) {
            return Err("Cancelled".to_string());
        }
        lock.remove(&args.task_id);
    }

    if results.is_empty() {
        // Give the stderr thread a moment to finish writing
        thread::sleep(std::time::Duration::from_millis(200));
        let stderr_output = stderr_buf.lock().map(|g| g.clone()).unwrap_or_default();

        if is_unavailable_error(&stderr_output) {
            return Err("PLAYLIST_NOT_FOUND".to_string());
        }
        let stderr_clean = clean_stderr(&stderr_output);
        return Err(if stderr_clean.is_empty() {
            "Download failed or interrupted".to_string()
        } else {
            stderr_clean.to_string()
        });
    }

    Ok(DownloadResponse {
        results,
        playlist_dir: if args.download_playlist {
            Some(final_dir.display().to_string())
        } else {
            None
        },
    })
}
