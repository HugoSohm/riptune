use tauri::AppHandle;
use tauri_plugin_updater::UpdaterExt;
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_dialog::{MessageDialogButtons, MessageDialogKind};

pub fn setup_update_check(handle: AppHandle) {
    tauri::async_runtime::spawn(async move {
        // 1. Get the updater
        if let Ok(updater) = handle.updater() {
            // 2. Check for update
            if let Ok(Some(update)) = updater.check().await {
                let version = update.version.clone();
                
                // 3. Ask the user
                handle.dialog()
                    .message(format!("A new version {} is ready for RipTune. Do you want to install it now?", version))
                    .title("New version available!")
                    .kind(MessageDialogKind::Info)
                    .buttons(MessageDialogButtons::OkCancel)
                    .show(move |result| {
                        if result {
                            let h = handle.clone();
                            tauri::async_runtime::spawn(async move {
                                if let Ok(updater) = h.updater() {
                                    if let Ok(Some(update)) = updater.check().await {
                                        // 4. Download and install
                                        let _ = update.download_and_install(
                                            |_chunk_size: usize, _total_size: Option<u64>| {
                                                // You could display a progress bar here!
                                            },
                                            || {
                                                // Download finished
                                            }
                                        ).await;
                                    }
                                }
                            });
                        }
                    });
            }
        }
    });
}
