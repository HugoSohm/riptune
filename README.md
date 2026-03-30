<div align="center">
  <img src="public/logo.svg" width="120" height="120" />
  <h1>RipTune</h1>
  <p>Ultra-Fast Music Analyzer (BPM & Key) with Integrated YouTube Downloader.</p>

  [![Tauri 2.0](https://img.shields.io/badge/Tauri-2.0-blue?logo=tauri)](https://tauri.app/)
  [![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
  [![Rust](https://img.shields.io/badge/Rust-Latest-orange?logo=rust)](https://www.rust-lang.org/)
</div>

---

**RipTune** is a modern Desktop application designed for anyone recording on a DAW with a "typebeat". It instantly finds the **BPM** and **Key** you need to perfectly set up your Auto-Tune and DAW session in a flash.

### ✨ Features

- 🚀 **Flash Analysis**: Thanks to partial extraction via FFmpeg, BPM & Key analysis takes less than 3 seconds.
- 🎵 **Pro Quality**: High-precision acoustic analysis powered by the Essentia engine (UPF).
- 📥 **YouTube Downloader**: Download your favorite tracks directly to WAV for high-quality audio.
- 🏷️ **Smart Metadata**: Automatic retrieval of title and artist information.
- 🛠️ **Robust Filenames**: Fully compatible with complex filenames (accents, emojis, symbols) on Windows.

---

### 🚀 Quick Start Guide

#### 1. Prerequisites
- [Node.js](https://nodejs.org/) (Latest LTS version)
- [Rust](https://www.rust-lang.org/tools/install) (via rustup)

#### 2. Installation
Clone the repo and install dependencies:
```powershell
npm install
```

#### 3. Setup Binaries (Sideloads)
RipTune relies on external tools (`ffmpeg`, `yt-dlp`, `essentia`). Download them automatically with:
```powershell
npm run setup
```

#### 4. Run in Development
```powershell
npm run tauri dev
```

---

### 🏗️ Build (Production)
To generate the Windows installer (`.exe` and `.msi`):
```powershell
npm run tauri build
```
Installers will be located in: `src-tauri/target/release/bundle/`

### 🛠️ Tech Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend**: Rust (Tauri 2.0).
- **Engines**: FFmpeg, yt-dlp, Essentia Streaming Extractor.
61: 
62: ---
63: 
64: ### ⚖️ Disclaimer
65: 
66: This software is intended for **personal and educational use only**. Respect the terms of service of any third-party content platforms you use (like YouTube). The developer is not responsible for any misuse of this software including copyright infringement. Use of this application is at your own risk.
67: 
68: ---
69: 
70: ### 🛡️ Security
71: 
72: If you discover a security vulnerability within RipTune, please report it privately via the [Security Policy](SECURITY.md).
73: 
74: ### 📜 License
75: 
76: This project is licensed under the [MIT License](LICENSE).