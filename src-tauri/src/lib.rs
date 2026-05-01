use tauri::{Emitter, Manager};

pub mod audio_processor;
pub mod local_server;
pub mod reporting;
pub mod setup;
pub mod telemetry;
pub mod utils;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run(context: tauri::Context) {
    let mut builder = tauri::Builder::default();

    // Single-instance + deep-link integration:
    // Prevents a new window from being opened when riptune:// is triggered
    // while the app is already running. Instead, it focuses the main window
    // and emits the deep-link URL to the frontend.
    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            // Focus the existing window
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_focus();
                let _ = window.unminimize();
                let _ = window.show();
            }
            // Emit deep link event if a riptune:// URL was passed as argv
            for arg in &argv {
                if arg.starts_with("riptune://") {
                    let _ = app.emit("deep-link-received", arg.clone());
                    break;
                }
            }
        }));
    }

    builder
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_deep_link::init())
        .manage(audio_processor::ProcessState(std::sync::Mutex::new(
            std::collections::HashMap::new(),
        )))
        .manage(local_server::AnalysisResults(std::sync::Mutex::new(
            std::collections::HashMap::new(),
        )))
        .setup(|app| {
            local_server::init(app.handle().clone());
            setup::init(app)
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
            audio_processor::get_default_download_dir,
            local_server::report_analysis_result
        ])
        .run(context)
        .expect("error while running tauri application");
}
