use crate::audio_processor::models::{AudioAnalysis, ProcessState};
use id3::frame::{Content, Frame};
use id3::{Tag, TagLike};
use std::process::{Command, Stdio};
use std::io::Read;
use std::io::BufReader;
use tauri::Manager;

#[tauri::command]
pub async fn extract_bpm_key(
    app_handle: tauri::AppHandle,
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
    let bin_dir = app_handle
        .path()
        .resource_dir()
        .map_err(|e: tauri::Error| e.to_string())?
        .join("bin");
    let ffmpeg_path = bin_dir.join(format!("ffmpeg{}", std::env::consts::EXE_EXTENSION));
    let extractor_path = bin_dir.join(format!("streaming_extractor_music{}", std::env::consts::EXE_EXTENSION));

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

    {
        let mut lock = state.0.lock().map_err(|e| e.to_string())?;
        *lock = Some(child);
    }

    let mut out_buf = Vec::new();
    let mut err_buf = Vec::new();
    let _ = BufReader::new(stdout).read_to_end(&mut out_buf);
    let _ = BufReader::new(stderr).read_to_end(&mut err_buf);

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
        let _ = std::fs::remove_file(&temp_audio_path); 
        return Err(format!("Analysis failed: {}", err_msg));
    }

    let json_str = std::fs::read_to_string(&json_out).map_err(|e| e.to_string())?;
    let _ = std::fs::remove_file(&json_out); 
    let _ = std::fs::remove_file(&temp_audio_path); 

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
pub async fn update_metadata(
    filepath: String,
    title: String,
    artist: String,
    bpm: f64,
) -> Result<(), String> {
    let mut tag = Tag::new();

    if let Ok(existing_tag) = Tag::read_from_path(&filepath) {
        tag = existing_tag;
    }

    tag.set_title(title);
    tag.set_artist(artist);

    tag.add_frame(Frame::with_content(
        "TBPM",
        Content::Text((bpm.round() as u32).to_string()),
    ));

    tag.write_to_path(&filepath, id3::Version::Id3v24)
        .map_err(|e| e.to_string())?;
    Ok(())
}
