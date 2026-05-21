use tauri::{App, Emitter, Manager, Runtime};
use tauri_plugin_deep_link::DeepLinkExt;

pub fn init<R: Runtime>(app: &mut App<R>) -> Result<(), Box<dyn std::error::Error>> {
    setup_deep_link(app)?;
    configure_window_dimensions(app);
    configure_window_decorations(app);

    Ok(())
}

/// Handle deep link on cold start (app was opened via riptune://)
fn setup_deep_link<R: Runtime>(app: &mut App<R>) -> Result<(), Box<dyn std::error::Error>> {
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
    Ok(())
}

/// Calculate and apply optimal logical window dimensions based on screen real estate
fn configure_window_dimensions<R: Runtime>(app: &App<R>) {
    // ── Window Sizing Configuration Constants ─────────────────────────────────
    // Screen thresholds to distinguish between compact and spacious monitors
    const COMPACT_SCREEN_WIDTH_THRESHOLD: f64 = 1400.0;
    const COMPACT_SCREEN_HEIGHT_THRESHOLD: f64 = 850.0;

    // Compact Screens Configuration (e.g., small monitors or high-DPI scaling)
    const COMPACT_WIDTH_SCALE: f64 = 0.65;
    const COMPACT_HEIGHT_SCALE: f64 = 0.65;
    const COMPACT_MIN_WIDTH: f64 = 960.0;
    const COMPACT_MIN_HEIGHT: f64 = 680.0;

    // Spacious Screens Configuration (large/high-res desktop monitors)
    const SPACIOUS_WIDTH_SCALE: f64 = 0.65;
    const SPACIOUS_HEIGHT_SCALE: f64 = 0.68;
    const SPACIOUS_STARTUP_MIN_WIDTH: f64 = 1280.0;
    const SPACIOUS_STARTUP_MIN_HEIGHT: f64 = 800.0;
    const SPACIOUS_ABSOLUTE_MIN_WIDTH: f64 = 1140.0;
    const SPACIOUS_ABSOLUTE_MIN_HEIGHT: f64 = 760.0;
    // ─────────────────────────────────────────────────────────────────────────

    if let Some(monitor) = app.primary_monitor().ok().flatten() {
        let size = monitor.size();
        let scale_factor = monitor.scale_factor();

        // Calculate logical screen size
        let screen_logical_width = size.width as f64 / scale_factor;
        let screen_logical_height = size.height as f64 / scale_factor;

        // Determine optimal window dimension limits based on actual screen space
        let (default_width, default_height, min_w, min_h) = if screen_logical_width
            < COMPACT_SCREEN_WIDTH_THRESHOLD
            || screen_logical_height < COMPACT_SCREEN_HEIGHT_THRESHOLD
        {
            (
                (screen_logical_width * COMPACT_WIDTH_SCALE)
                    .max(COMPACT_MIN_WIDTH)
                    .min(screen_logical_width),
                (screen_logical_height * COMPACT_HEIGHT_SCALE)
                    .max(COMPACT_MIN_HEIGHT)
                    .min(screen_logical_height),
                COMPACT_MIN_WIDTH,
                COMPACT_MIN_HEIGHT,
            )
        } else {
            (
                (screen_logical_width * SPACIOUS_WIDTH_SCALE).max(SPACIOUS_STARTUP_MIN_WIDTH),
                (screen_logical_height * SPACIOUS_HEIGHT_SCALE).max(SPACIOUS_STARTUP_MIN_HEIGHT),
                SPACIOUS_ABSOLUTE_MIN_WIDTH,
                SPACIOUS_ABSOLUTE_MIN_HEIGHT,
            )
        };

        if let Some(window) = app.get_webview_window("main") {
            // Dynamically override the minimum constraints first
            window
                .set_min_size(Some(tauri::Size::Logical(tauri::LogicalSize {
                    width: min_w,
                    height: min_h,
                })))
                .ok();

            // Set the optimal logical dimensions
            window
                .set_size(tauri::Size::Logical(tauri::LogicalSize {
                    width: default_width,
                    height: default_height,
                }))
                .ok();

            window.center().ok();
        }
    }
}

/// Set window decorations and shadow settings for Windows/Linux platforms
fn configure_window_decorations<R: Runtime>(app: &App<R>) {
    // This should be outside the monitor check to ensure it runs even on Linux/Wayland if monitor detection is flaky
    if let Some(window) = app.get_webview_window("main") {
        #[cfg(any(target_os = "windows", target_os = "linux"))]
        {
            window.set_decorations(false).ok();
            window.set_shadow(true).ok();
        }
    }
}
