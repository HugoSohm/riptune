use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

pub fn resolve_bin_path(app_handle: &AppHandle, binary_name: &str) -> Result<PathBuf, String> {
    let resource_dir = app_handle
        .path()
        .resource_dir()
        .map_err(|e| e.to_string())?;

    let extension = std::env::consts::EXE_EXTENSION;
    let exe_name = if extension.is_empty() {
        binary_name.to_string()
    } else {
        format!("{}.{}", binary_name, extension)
    };

    // The canonical path we expect in production
    let expected_path = resource_dir.join("bin").join(&exe_name);

    if expected_path.exists() {
        return Ok(expected_path);
    }

    // DIAGNOSTIC LOGIC: If not found, build a detailed report
    let mut report = format!(
        "Binary '{}' not found at expected path: {}\n\n",
        binary_name,
        expected_path.display()
    );

    report.push_str("--- Filesystem Diagnostic ---\n");
    report.push_str(&format!("Resource Dir: {}\n", resource_dir.display()));

    // List top-level files
    report.push_str("\nContents of Resource Dir:\n");
    if let Ok(entries) = fs::read_dir(&resource_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            let name = path.file_name().unwrap_or_default().to_string_lossy();
            let type_str = if path.is_dir() { "[DIR]" } else { "[FILE]" };
            report.push_str(&format!("  {} {}\n", type_str, name));
        }
    } else {
        report.push_str("  (Could not read directory)\n");
    }

    // List bin/ subfolder if it exists
    let bin_path = resource_dir.join("bin");
    if bin_path.exists() {
        report.push_str("\nContents of bin/ subfolder:\n");
        if let Ok(entries) = fs::read_dir(&bin_path) {
            for entry in entries.flatten() {
                let path = entry.path();
                let name = path.file_name().unwrap_or_default().to_string_lossy();
                report.push_str(&format!("  [FILE] {}\n", name));
            }
        }
    } else {
        report.push_str("\n'bin/' subfolder does NOT exist.\n");
    }

    report.push_str("\n--- Check the 'resources' glob in tauri.conf.json ---");

    Err(report)
}

#[cfg(windows)]
pub fn hide_window(cmd: &mut std::process::Command) {
    use std::os::windows::process::CommandExt;
    const CREATE_NO_WINDOW: u32 = 0x08000000;
    cmd.creation_flags(CREATE_NO_WINDOW);
}

#[cfg(not(windows))]
pub fn hide_window(_cmd: &mut std::process::Command) {
    // Other platforms don't need this
}
