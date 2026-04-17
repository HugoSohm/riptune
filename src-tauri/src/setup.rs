use tauri::{App, Manager, Runtime};

pub fn init<R: Runtime>(app: &mut App<R>) -> Result<(), Box<dyn std::error::Error>> {
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
