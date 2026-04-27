use tauri::{App, Manager, Runtime, Emitter};
use tauri_plugin_deep_link::DeepLinkExt;

pub fn init<R: Runtime>(app: &mut App<R>) -> Result<(), Box<dyn std::error::Error>> {
    // Handle deep link on cold start (app was opened via riptune://)
    #[cfg(desktop)]
    {
        // Force registration of the deep link scheme (essential for dev mode on Windows)
        let _ = app.deep_link().register("riptune");

        if let Ok(Some(urls)) = app.deep_link().get_current() {
            for url in urls {
                let _ = app.emit("deep-link-received", url.to_string());
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

    // This should be outside the monitor check to ensure it runs even on Linux/Wayland if monitor detection is flaky
    if let Some(window) = app.get_webview_window("main") {
        #[cfg(any(target_os = "windows", target_os = "linux"))]
        {
            window.set_decorations(false).ok();
            window.set_shadow(true).ok();
        }
    }

    Ok(())
}
