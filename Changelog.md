# RipTune Changelog

## 0.1.4 (2026-04-03)

### 📦 Premium macOS Installer Experience
- **Bundled DMG Installer**: The macOS release now provides a unified ZIP package containing the official DMG installer, the permission fix script, and setup instructions.
- **Smart Asset Cleanup**: Fixed the release workflow to automatically remove all default macOS artifacts (DMG, TAR.GZ), offering a single entry point for each architecture (`x64` and `aarch64`).
- **Streamlined Setup**: Simplified instructions to guide users through the standard DMG "Drag-to-Applications" process, followed by a one-click permission fix if needed.

## 0.1.3 (2026-04-03)

### 📦 Optimized macOS Distribution
- **Automated Bundle Packaging**: The GitHub Actions workflow now automatically packages a self-contained ZIP for macOS (`RipTune_v0.1.3_macOS_x64.zip`) containing the app, troubleshooting script, and setup guide.
- **Release Automation**: Automates the removal of default DMG/TAR.GZ artifacts on macOS to ensure users only download the single, validated bundle.
- **Improved ZIP Structure**: Cleaned up the internal folder structure of the macOS bundle for better user experience.

## 0.1.2 (2026-04-03)

### 🍎 macOS Support & Stability
- **Permission Fix Tool**: Included a dedicated `fix-mac-permissions.sh` script to resolve the "App is damaged" error caused by macOS Gatekeeper.
- **Improved Documentation**: Updated README with clear troubleshooting steps for macOS users.
- **Cross-Platform File System**: Refactored file and folder opening to support Windows (`explorer`), macOS (`open`), and Linux (`xdg-open`).
- **Path Bug Fix**: Resolved a critical issue where download templates were using Windows-specific backslashes, preventing successful downloads on macOS and Linux.
- **Enhanced File Reliability**: Improved file sanitization and renaming logic to ensure history entries always point to existing files, even if cleanup fails.

## 0.1.1 (2026-04-02)

### 🚀 Improvements & UX
- **Native Image Drag & Drop**: Implemented native support for dragging and dropping screenshots directly into the bug report modal with a professional yellow dashed overlay for visual feedback.
- **Improved UI Hierarchy**: Automatically italicized all parenthetical text segments <i class='italic'>(like this)</i> across the application for a better visual distinction of supplemental information.
- **Branding & Consistency**: Removed the trailing dot from the main 'Rip the perfect tune' slogan and updated the YouTube cookies label to lowercase for a modern feel.
- **External Indicators**: Added official GitHub icon and external link indicators to the About section to clearly signal browser-level navigation.
- **Installer Branding Overhaul**: Fully customized Windows (NSIS) installer with high-quality BMP banners, a dedicated sidebar image, and a custom application icon.
- **Workflow Stabilization**: Simplified the GitHub Actions release pipeline by adopting Tauri's standard naming convention for more reliable cross-platform deployments.
- **UX Polish**: General UI refinements, including smart tooltips in history that only appear when text is actually truncated.

### 🛠️ Fixes & Refinements
- **Settings Tooltip**: Resolved an issue where the settings tab tooltip was empty due to a missing translation key.
- **Playlist Logic**: Simplified the playlist download tooltip to consistently state it downloads all files, regardless of current input state.
- **Table Stability & Layout**: Resolved overlapping action icons in history by implementing a rigid column system with fixed-width constraints and horizontal overflow protection.
- **Responsive Guardrails**: Optimized application minimum window width (1240px) to prevent layout breakages and ensure critical actions are always fully visible.
- **Localization**: Synchronized all UI changes across English, French, and Spanish locales.

## 0.1.0 (2026-03-31)

### Features
- **Smart Extraction**: Automatic BPM, Key, and Metadata identification using the Essentia engine.
- **High-Quality Downloads**: HQ audio extraction from YouTube with support for WAV, MP3, and FLAC.
- **Interactive History**: Track and manage your library with a dedicated dashboard and search history.
- **Advanced Management**: Custom download locations, file cleanup settings, and YouTube cookies support.
- **Global reach**: Internationalized interface with English, French, and Spanish support.
- **Premium Interface**: Custom title bar, glassmorphism design, and smooth transitions.
- **Cross-Platform**: Native builds available for Windows, macOS, and Linux.

### Improvements & Feedback
- Integrated bug reporting system for community feedback.
- Intelligent notification system for background tasks status.
- Windows console suppression for a cleaner background experience.