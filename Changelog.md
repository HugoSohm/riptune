# RipTune Changelog

## 0.3.2 (2026-04-29)

### 🎵 SoundCloud Integration & Source Awareness
- **SoundCloud Support**: Added full support for downloading and analyzing SoundCloud tracks and sets (playlists).
- **Source Identification**: Updated the history view to display the origin platform (YouTube, SoundCloud, or Local) with dedicated colored icons.
- **Smart SoundCloud Detection**: Implemented specific error handling for SoundCloud's private or non-existent tracks using real-time `stderr` extraction from `yt-dlp`.
- **New Format Support**: Added **M4A** to the available download formats for high-quality audio without unnecessary re-encoding.
- **Improved Error Feedback**: Refactored the backend to return the actual error message from `yt-dlp` (e.g., `404: Not Found`) instead of generic failure messages.

### 🧩 UI & Settings Polish
- **Chrome Extension Link**: Added a direct link to the RipTune Chrome Extension in the Settings page with a dedicated icon.
- **Refined Settings UX**: Reorganized the "About" section with distinct brand colors for each external link (Website, Extension, GitHub, Ko-fi).
- **Clean Interface**: Removed redundant "Code available on GitHub" text from descriptions to simplify the layout.
- **Translation Updates**: Synchronized all new features and messages across English, French, and Spanish.

## 0.3.1 (2026-04-29)

### 🔄 Parallel Analysis & Multi-Tasking
- **Concurrent Web Workers**: Implemented a multi-threaded analysis engine using Web Workers, allowing audio files to be analyzed off the main thread for a fluid experience.
- **Multi-Task Management**: Enabled concurrent processing of separate download and analysis tasks, allowing users to start new jobs while others are still running.
- **Private Playlist Detection**: Implemented advanced `stderr` inspection in the Rust downloader to distinguish between generic failures and private/non-existent YouTube playlists.
- **Smart Playlist Detection**: Automatically detects pure playlist URLs to force playlist mode, while maintaining choice for individual videos within a playlist.
- **Improved Pre-flight Checks**: Enhanced `check_url_info` to detect unavailable content before attempting a full download, providing immediate visual feedback.
- **Task-Specific Loading**: Differentiated between "Analysis" and "Download" task types to prevent overlapping loaders on history items during concurrent operations.

### 🏷️ Metadata & UI Synchronization
- **Windows ID3 Compatibility**: Switched metadata writing from ID3v2.4 to **ID3v2.3**, ensuring that Title, Artist, and BPM are natively visible in Windows File Explorer.
- **Instant Tagging**: Implemented immediate ID3 tag writing (Title, Artist) upon download completion, even when analysis is not requested.
- **Persistent Analysis Carry-over**: BPM and Key data from temporary "Analyze-only" tasks are now automatically preserved and written to the final file when downloaded later from history.
- **Smart Metadata defaults**: Reverted to using Video Title and Channel Name for tags to ensure reliable metadata across varying YouTube naming conventions.

## 0.3.0 (2026-04-27)

### 🧩 Chrome Extension & Seamless Integration
- **Extension Server**: Built a lightweight local background server for seamless two-way communication between the desktop app and the RipTune Chrome Extension.
- **Metadata Polling**: Enabled real-time extraction of BPM and Key data directly to the Chrome extension via a dedicated status endpoint.
- **Deep-Link Infrastructure**: Implemented robust `riptune://` deep-link parsing to ensure flawless "Analyze & Download" triggers from external sources.
- **Visual Identity Update**: Completely refreshed application logos and regenerated optimized icon assets for all platforms (macOS, Windows, Linux, iOS, Android).

## 0.2.9 (2026-04-20)

### 🛠️ Ultimate Updater Fix
- **Signature Verification**: Regenerated the signing keypair (public & private) to fix a cryptographic algorithm mismatch that caused "The signature verification failed" errors during updates.
- **Signature Integrity**: Fixed a multi-line encoding bug that was causing "Invalid encoding" errors during app updates.
- **Signature Extraction**: Implemented zero-newline Base64 signature extraction for robust update verification.

## 0.2.8 (2026-04-19)

### 🛠️ Critical Auto-Update Fix
- **Corrected Public Key**: Fixed a critical "Invalid input length: 57" error by restoring the valid 56-character public key for the Tauri updater.
- **Robust Signature Pipeline**: Re-engineered the release workflow to correctly preserve multi-line minisign signatures, ensuring valid update verification across all platforms.
- **Improved Build Artifacts**: Enabled `createUpdaterArtifacts` in the Tauri configuration to guarantee that signing assets are correctly generated and published.
- **Secure Key Management**: Transitioned to a new password-protected signing key architecture with automated credential management in the release pipeline.

## 0.2.7 (2026-04-17)

### 🌐 Rebranding & Website Launch
- **Domain Migration**: Officially rebranded repository to `riptune` and updated all internal links to point the newly registered domain: `riptune.app`.
- **Security Updates**: Updated bug report and security emails to utilize the new `@riptune.app` addresses for increased professionalism.
- **Settings UI Enhancement**: Added a dedicated `Website` button in the Settings footer next to the GitHub repository and Ko-fi support items.
- **Translation Completeness**: Localized the new Settings footer buttons for French, Spanish, and English.
- **Clean Configuration**: Updated internal manifest files, crate names, and `latest.json` fetching configurations to match the new GitHub address without redirections.

## 0.2.6 (2026-04-17)

### 🌍 Global Reach & Infrastructure Polish
- **Full i18n Support**: Completed the internationalization engine and systematically replaced all remaining hardcoded UI strings with i18n tokens for a 100% localized experience across all supported languages.
- **TitleBar Refactoring**: Re-engineered the backend architecture by moving window setup logic to a dedicated `setup.rs` module for better maintainability.
- **Linux UX Fix**: Resolved an issue where the native title bar would sporadically reappear on Linux/Wayland by ensuring window decorations are disabled regardless of monitor detection status.
- **Robust Release Pipeline**:
    - Fixed specialized GitHub download URLs in `latest.json` to prevent invalid "untagged" links during draft releases.
    - Improved signature verification logic to eliminate cross-platform signature mixups (e.g., Windows installers using macOS signatures).

## 0.2.5 (2026-04-17)

### 🚀 Layout Stability & Engine Refinement
- **Deep Analysis Engine**: Added a new "Deep Analysis" setting for more precise BPM and Key detection, using the entire track instead of a 60-second snippet.
- **History Search Dashboard**: Implemented a fluid search bar in the History tab that shrinks progressively to maximize space, with an integrated search-by-title-or-artist feature.
- **Home Page Stabilization**: Added dynamic skeleton placeholders for the latest analysis card to eliminate layout shifts when results appear.
- **Improved Window Constraints**: Enforced a strict 1080x800 minimum window size to prevent UI clipping and ensure a consistent, professional layout across all resolutions.
- **History UI Refinement**: 
    - Fixed icon overlap in the Actions column by increasing its minimum width and centering content.
    - Standardized BPM and Key column sizes for perfect visual symmetry.
- **Playlist Progress Fix**: Resolved a critical state-sync bug where the playlist download progress would get stuck as `--` during updates.
- **Smart Notification Management**: Isolated task notifications with unique IDs to prevent interference between processes.

## 0.2.4 (2026-04-16)

### 🎨 UI Polish & Robust File Management
- **Smart Metadata Embedding**: RipTune now automatically writes the Title and Artist (Channel Name) directly into the audio file's ID3 tags using FFmpeg, compatible with all major music players.
- **Clear History Feature**: Added a "Clear History" global action with a secure confirmation modal, allowing for instant database management.
- **Visual Stability in History**: Standardized action icon sizes and spacing in the History table to prevent layout shifts during hover and interaction.
- **Ergonomic Tooltip Management**: Smarter tooltip logic that automatically silences popups when select menus or modals are active, reducing UI noise.
- **Optimized History UX**: Refined table hover effects with rectangular middle-rows and rounded-corner last-row logic for a cleaner visual hierarchy.
- **Premium Badge Redesign**: Restored high-vibrancy BPM and Key badges with subtle `bg-gradient-to-br` "fades" and high-contrast `font-black` typography, matching the original design.
- **Rich Status Indicators**: Reintroduced context-specific status icons (Analysis, Download, Full) with specialized tooltips and distinct color profiles.
- **UX Boundaries**: Homepage Title and Subtitle are now non-selectable to prevent accidental highlighting, while BPM and Key data are explicitly selectable for easy copying.
- **"Beautiful" Filenames**: Removed aggressive sanitization; RipTune now preserves original video names including spaces (instead of underscores), parentheses, and commas.
- **Robust Path Resolution**: Re-engineered the `open_file` command on Windows to use a properly argumented `explorer /select` syntax, ensuring complex filenames are opened correctly even with commas or dots.
- **Backend Hygiene**: Optimized Rust downloader logic by removing redundant string clones and silencing compiler warnings for a leaner, more robust application.


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