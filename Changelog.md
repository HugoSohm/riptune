# RipTune Changelog

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