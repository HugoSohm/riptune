<div align="center">
  <img src="public/logo.svg" width="120" height="120" />
  <h1>RipTune</h1>
  <p>Ultra-Fast Music Analyzer (BPM & Key) with Integrated YouTube Downloader.</p>

  [![Latest Release](https://img.shields.io/github/v/release/HugoSohm/rip-tune?style=flat-square&color=A855F7)](https://github.com/HugoSohm/rip-tune/releases/latest)
  [![Tauri 2.0](https://img.shields.io/badge/Tauri-2.0-2496ED?style=flat-square&logo=tauri&logoColor=white)](https://tauri.app/)
  [![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
  [![Rust](https://img.shields.io/badge/Rust-Latest-E34C26?style=flat-square&logo=rust&logoColor=white)](https://www.rust-lang.org/)
  [![Support on Ko-fi](https://img.shields.io/badge/Support%20on%20Ko--fi-F16061?style=flat-square&logo=ko-fi&logoColor=white)](https://ko-fi.com/riptune)
</div>

---

**RipTune** is a modern Desktop application designed for **DJs and Music Producers**. Whether you're mixing live or recording on a DAW with a "typebeat", it instantly finds the **BPM** and **Key** you need to perfectly set up your session in a flash.

### ✨ Features

- 🚀 **Flash Analysis**: Thanks to partial extraction via FFmpeg, BPM & Key analysis takes less than 3 seconds.
- 📥 **YouTube & Playlist Downloader**: Download individual tracks or **entire YouTube playlists** directly to WAV/MP3.
- 🎵 **Pro Quality**: High-precision acoustic analysis powered by the Essentia engine (UPF).
- 🔒 **100% Local Processing**: All downloads, BPM calculations, and key extractions are computed entirely on your machine. No cloud APIs are used for core features (we only use Resend for bug reporting and Aptabase for anonymous telemetry).

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
RipTune relies on external tools (`ffmpeg`, `ffprobe`, `yt-dlp`). Download them automatically for your platform:
```bash
npm run setup
```
> [!NOTE]
> This command will automatically detect your OS and download the correct binaries into `src-tauri/bin`. These files are ignored by Git to keep the repository light.

#### 4. Run in Development
```powershell
npm run tauri dev
```

---

### 🏗️ Build (Production)
To generate the Windows or macOS installer:
```bash
npm run tauri build
```
Installers will be located in: `src-tauri/target/release/bundle/`

### 🍎 macOS Troubleshooting
If you encounter the error: **"RipTune is damaged and can't be opened"** when launching the app, this is due to macOS Gatekeeper security as the app is currently unsigned.

**Solution:**
1. Move `RipTune.app` to your `/Applications` folder.
2. Open a terminal and run the following command:
   ```bash
   sudo xattr -c /Applications/RipTune.app
   ```

### 🛠️ Tech Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend**: Rust (Tauri 2.0).
- **Engines**: FFmpeg, yt-dlp, Essentia.js (WASM).

---

### ⚖️ Disclaimer

This software is intended for **personal and educational use only**. Respect the terms of service of any third-party content platforms you use (like YouTube). The developer is not responsible for any misuse of this software including copyright infringement. Use of this application is at your own risk.

---

### 🛡️ Security

If you discover a security vulnerability within RipTune, please report it privately via the [Security Policy](SECURITY.md).

---

### 📊 Privacy & Telemetry

RipTune collects **completely anonymous** telemetry (app launches, general usage statistics) to help improve performance and feature adoption. We use [Aptabase](https://aptabase.com/), a privacy-first, open-source analytics platform.

- 🛑 **No PII** (Personally Identifiable Information) is ever collected.
- 🛑 **No IPs** are stored.
- 🛑 **No audio files** or private local data are transmitted.

All telemetry implementation is 100% visible in the open-source code.

---

### 📜 License

This project is licensed under the [MIT License](LICENSE).

