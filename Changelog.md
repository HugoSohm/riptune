# RipTune Changelog

## 0.2.3 (2026-04-15)

### 🛠️ Critical Updater & Deployment Fixes
- **Validated Update Manifest**: Fixed a major issue where `latest.json` was generated with empty signatures and wrong architecture URLs.
- **Improved Windows Arch Support**: Corrected the release workflow to properly distinguish between **x64** and **ARM64** Windows binaries in the update manifest.
- **Authenticated Signature Fetching**: Switched to GitHub CLI for cross-platform signature extraction, ensuring valid update verification even during draft releases.
- **Robust Updater UI**: The application now displays real-time **download percentage** and provides a clear error state with a retry button if a signature check fails.
- **Enhanced Diagnostics**: Integrated detailed frontend logging to the updater hook for faster troubleshooting of network or verification issues.

## 0.2.2 (2026-04-15)

### 💎 Ultra-Native macOS Experience & Smart Scaling
- **Native Traffic Lights**: Switched to Tauri's native `trafficLightPosition` and `Overlay` title bar style for a 100% authentic macOS window experience.
- **Improved Responsiveness**: All TitleBar interactions now use `onMouseDown` to bypass macOS system focus delays, making the UI feel instantaneous.
- **Dynamic Window Scaling**: The application now automatically calculates the optimal window size based on the user's monitor resolution (70% width, 80% height) and centers itself on startup.
- **Clean Architecture**: Simplified the codebase by removing custom CSS traffic light logic and deprecated macOS repair scripts.
- **System Integration**: Enabled `macos-private-api` and refined window configurations to ensure perfect rounded corners and native system shadows.
- **CI/CD Refinement**: Updated the release workflow for better stability and leaner artifact packaging.

## 0.2.1 (2026-04-09)

### 🎨 Native macOS Aesthetics & CI/CD Restoration
- **Improve TitleBar**: Implemented a native macOS `NSToolbar` workaround to perfectly center traffic light buttons within the 60px header.
- **Precision UI Alignment**: Fine-tuned vertical positioning of system controls for a professional, integrated look.
- **Restored Linux Packages**: Re-enabled `.deb` and `.rpm` generation in the release workflow.
- **Expanded Windows Support**: Added **Windows ARM64** to the automated build matrix for dual-architecture coverage.
- **Workflow Cleanup**: Silenced compiler warnings and optimized build steps for a cleaner, faster release process.

## 0.2.0 (2026-04-09)

### 🚀 Official Major Release & Stability
- **Stabilized Multi-Arch CI/CD**: Finalized the automated build system for all architectures (Intel & Apple Silicon).
- **Production-Ready Installers**: Validated the custom DMG layouts and repair tools for end-users.
- **Workflow Optimization**: Fully integrated Rust/NPM caching for high-speed releases.
- **Final Packaging Polish**: Atomicity guaranteed for all future releases.

## 0.1.9 (2026-04-08)

### 💎 Pro macOS Installer & Dual-Arch CI
- **Native Custom DMG**: The macOS installer now features a premium layout with custom icons, background branding, and a dedicated repair utility.
- **GUI-Based Repair Tool**: Replaced the terminal-based fix script with "Fix RipTune.app", a native AppleScript-based utility with pop-up success/error dialogs.
- **Dual-Architecture Support**: Upgraded CI/CD to build and publish separate, optimized DMGs for both Intel (x64) and Apple Silicon (aarch64).
- **Interactive Instructions**: Included a bilingual instructions file inside the DMG explaining why the repair utility is necessary (to avoid Apple's $99/year developer fee).
- **CI/CD Stabilization**: Refactored the release workflow to use a robust, architecture-aware script for bundling and asset cleanup.
- **Bilingual Assets**: Translated all installer-related scripts and instructions into English and French.

## 0.1.8 (2026-04-08)

### ✨ Integrated Updater & Enhanced Reporting
- **Custom Updater UI**: Replaced the native system update modal with a premium React-based button in the TitleBar for a seamless, non-intrusive update experience.
- **Auto-Restart**: Implemented automatic application relaunch after a successful update installation using the Tauri Process plugin.
- **Mandatory Email Field**: Added a required email input to the Bug Report modal to enable direct communication and follow-up with reporters.
- **Smart Reply-To Logic**: Bug report emails now include the user's email in the `reply-to` header, allowing developers to respond with a single click.
- **GitHub Issues Integration**: Added a direct shortcut to GitHub Issues within the bug report modal as an alternative reporting channel.
- **Precise Version Tracking**: Bug reports now automatically include the exact application version (retrieved via Rust AppHandle) for faster debugging.
- **Script Cleanup**: Fixed redundant `chmod` commands in the binary setup scripts for macOS and Linux.

## 0.1.7 (2026-04-08)

### 🛠️ Auto-Update Fix
- **Restored Auto-Updates**: Corrected a critical issue where the application would not detect or download new versions due to missing permissions in Tauri v2.
- **Workflow Optimization**: Upgraded the CI/CD pipeline to ensure the update manifest (`latest.json`) is always generated and signed correctly for all platforms.

## 0.1.6 (2026-04-08)

### 🚀 Ultra-Fast WASM Analysis
- **Essentia WASM Migration**: Fully migrated audio analysis (BPM & Key) from native Rust binaries to a high-performance frontend WASM engine.
- **Engine Optimization**: Dramatically reduced analysis time by eliminating backend process spawning, temporary file creation, and disk I/O.
- **Lightweight Architecture**: Removed heavy Essentia binaries (~15MB), simplifying the install process and reducing the final application size.
- **Smart Memory Management**: Implemented automatic WASM memory cleanup and optimized audio decoding for fast, reliable processing in the sandbox.
- **Tauri v2 Permission Sync**: Synchronized all Tauri plugin versions and implemented granular filesystem capabilities for secure, hardware-accelerated analysis.

## 0.1.5 (2026-04-03)

### 💎 Ultra-Premium macOS Installer
- **Interactive DMG Bundle**: The macOS installer is now a single, polished DMG containing the application, a setup guide, and an auto-healing script.
- **GUI-Based Fix Tool**: Replaced the terminal-based script with a native macOS `.command` file that uses clear pop-up dialogs and automatically closes the terminal window.
- **Zero-Config Experience**: Simplified troubleshooting instructions to a single "Right-Click > Open" action, providing a seamless setup for users facing Gatekeeper restrictions.
- **Standardized Packaging**: Adopted standard naming conventions while maintaining a custom, high-end installation experience for macOS.


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