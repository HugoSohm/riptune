#!/bin/bash

# Bash script to download RipTune binaries for macOS and Linux
# Usage: ./setup_bin.sh

set -e

# Directory where binaries will be stored
BIN_DIR="$(pwd)/src-tauri/bin"
mkdir -p "$BIN_DIR"

echo "--- RipTune: Setting up bin binaries for $(uname) ---"

OS_NAME=$(uname -s)
ARCH_NAME=$(uname -m)

# Helper function to download and check file
download_file() {
    local url=$1
    local output=$2
    
    echo "Downloading from $url..."
    if ! curl --fail -L "$url" -o "$output"; then
        echo "Error: Failed to download from $url (HTTP Error or Network issue)."
        exit 1
    fi

    if [ ! -f "$output" ]; then
        echo "Error: $output was not created."
        exit 1
    fi
}

# 1. yt-dlp
if [ "$OS_NAME" == "Darwin" ]; then
    URL="https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos"
else
    URL="https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux"
fi
download_file "$URL" "$BIN_DIR/yt-dlp"
chmod +x "$BIN_DIR/yt-dlp"

# 2. ffmpeg
if [ "$OS_NAME" == "Darwin" ]; then
    # Download static macOS build from evermeet.cx
    FFMPEG_URL="https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip"
    download_file "$FFMPEG_URL" "ffmpeg.zip"
    unzip -o ffmpeg.zip -d "$BIN_DIR"
    rm ffmpeg.zip

    FFPROBE_URL="https://evermeet.cx/ffmpeg/getrelease/ffprobe/zip"
    download_file "$FFPROBE_URL" "ffprobe.zip"
    unzip -o ffprobe.zip -d "$BIN_DIR"
    rm ffprobe.zip
else
    # Download static Linux build from a more reliable GitHub mirror (ffmpeg-static)
    FFMPEG_URL="https://github.com/eugeneware/ffmpeg-static/releases/download/b5.0.1/linux-x64.gz"
    download_file "$FFMPEG_URL" "ffmpeg.gz"
    gunzip -c ffmpeg.gz > "$BIN_DIR/ffmpeg"
    rm ffmpeg.gz
    
    # ffprobe is also available on similar stable mirrors
    FFPROBE_URL="https://github.com/ffbinaries/ffbinaries-prebuilt/releases/download/v4.4.1/ffprobe-4.4.1-linux-64.zip"
    download_file "$FFPROBE_URL" "ffprobe.zip"
    unzip -o ffprobe.zip -d "$BIN_DIR"
    rm ffprobe.zip
fi
chmod +x "$BIN_DIR/ffmpeg"
chmod +x "$BIN_DIR/ffprobe"

chmod +x "$BIN_DIR/ffprobe"

echo "--- Setup Complete! ---"
echo "Binaries are located in: $BIN_DIR"
