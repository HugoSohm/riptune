pub mod audio_processor;
use tauri::Manager;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(audio_processor::ProcessState(std::sync::Mutex::new(None)))
        .setup(|app| {
            if let Some(monitor) = app.primary_monitor().ok().flatten() {
                let size = monitor.size();
                let scale_factor = monitor.scale_factor();

                // Target 60% of screen width and height, but maintain a decent max if you prefer
                let width = (size.width as f64 * 0.6 / scale_factor) as f64;
                let height = (size.height as f64 * 0.6 / scale_factor) as f64;

                if let Some(window) = app.get_webview_window("main") {
                    window
                        .set_size(tauri::Size::Logical(tauri::LogicalSize { width, height }))
                        .ok();
                    window.center().ok();
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            audio_processor::download_audio,
            audio_processor::check_url_info,
            audio_processor::cancel_download,
            audio_processor::extract_bpm_key,
            audio_processor::open_file,
            audio_processor::open_folder,
            audio_processor::delete_file,
            audio_processor::update_metadata,
            audio_processor::get_default_download_dir
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
