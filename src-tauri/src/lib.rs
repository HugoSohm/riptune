#![allow(unexpected_cfgs)]
pub mod audio_processor;
pub mod reporting;
pub mod telemetry;
pub mod updater;
pub mod utils;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(audio_processor::ProcessState(std::sync::Mutex::new(None)))
        .setup(|app| {
            // Automatic update check on startup
            updater::setup_update_check(app.handle().clone());

            if let Some(monitor) = app.primary_monitor().ok().flatten() {
                let size = monitor.size();
                let scale_factor = monitor.scale_factor();

                // Target 70% of screen width and height, but ensure it's at least the design minimum
                let width = (size.width as f64 * 0.7 / scale_factor).max(1280.0);
                let height = (size.height as f64 * 0.8 / scale_factor).max(750.0);

                if let Some(window) = app.get_webview_window("main") {
                    window
                        .set_size(tauri::Size::Logical(tauri::LogicalSize { width, height }))
                        .ok();
                    window.center().ok();

                    // Disable decorations on Windows to use the custom TitleBar
                    #[cfg(any(target_os = "windows", target_os = "linux"))]
                    {
                        window.set_decorations(false).ok();
                        window.set_shadow(true).ok();
                    }
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            reporting::send_bug_report,
            telemetry::track_event,
            utils::read_image_base64,
            audio_processor::download_audio,
            audio_processor::check_url_info,
            audio_processor::cancel_download,
            audio_processor::open_file,
            audio_processor::open_folder,
            audio_processor::delete_file,
            audio_processor::update_metadata,
            audio_processor::get_default_download_dir
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
