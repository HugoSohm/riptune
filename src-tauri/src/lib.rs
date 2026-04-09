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

            #[cfg(target_os = "macos")]
            #[allow(deprecated)]
            {
                use cocoa::base::{id, nil};
                use objc::{msg_send, sel, sel_impl};

                let window = app.get_webview_window("main").unwrap();
                let ns_window = window.ns_window().unwrap() as id;

                unsafe {
                    use cocoa::foundation::{NSString, NSRect};
                    
                    let toolbar_class = objc::runtime::Class::get("NSToolbar").unwrap();
                    let toolbar: id = msg_send![toolbar_class, alloc];
                    let identifier = NSString::alloc(nil).init_str("main-toolbar");
                    let toolbar: id = msg_send![toolbar, initWithIdentifier: identifier];
                    let _: () = msg_send![ns_window, setToolbar: toolbar];

                    // Décaler les boutons vers le bas (via le superview du bouton fermer)
                    use cocoa::appkit::NSWindowButton;
                    let close_button: id = msg_send![ns_window, standardWindowButton: NSWindowButton::NSWindowCloseButton];
                    if close_button != nil {
                        let container: id = msg_send![close_button, superview];
                        if container != nil {
                            let mut frame: NSRect = msg_send![container, frame];
                            frame.origin.y -= 6.0; // On descend de 6px
                            let _: () = msg_send![container, setFrame: frame];
                        }
                    }
                }
            }

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
