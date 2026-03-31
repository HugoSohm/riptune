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

# Helper function to check if a download was successful and not a small error file
check_download() {
    local file=$1
    local min_size=$2
    if [ ! -f "$file" ]; then
        echo "Error: $file was not downloaded."
        exit 1
    fi
    local size=$(wc -c <"$file")
    if [ "$size" -lt "$min_size" ]; then
        echo "Error: $file is too small ($size bytes). Download probably failed or returned an error page."
        cat "$file" # Print content for debugging (likely HTML error)
        exit 1
    fi
}

# 1. yt-dlp
echo "Downloading yt-dlp..."
if [ "$OS_NAME" == "Darwin" ]; then
    URL="https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos"
else
    # Default to Linux x86_64 for now
    URL="https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux"
fi
curl -L "$URL" -o "$BIN_DIR/yt-dlp"
check_download "$BIN_DIR/yt-dlp" 1000000 # ~1MB minimum
chmod +x "$BIN_DIR/yt-dlp"

# 2. ffmpeg
echo "Downloading FFmpeg..."
if [ "$OS_NAME" == "Darwin" ]; then
    # Download static macOS build from evermeet.cx
    FFMPEG_URL="https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip"
    curl -L "$FFMPEG_URL" -o ffmpeg.zip
    check_download "ffmpeg.zip" 10000000 # ~10MB minimum
    unzip -o ffmpeg.zip -d "$BIN_DIR"
    rm ffmpeg.zip
else
    # Download static Linux build from johnvansickle.com
    FFMPEG_URL="https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz"
    curl -L "$FFMPEG_URL" -o ffmpeg.tar.xz
    check_download "ffmpeg.tar.xz" 10000000 # ~10MB minimum
    mkdir -p ffmpeg_tmp
    tar -xJf ffmpeg.tar.xz -C ffmpeg_tmp --strip-components=1
    cp ffmpeg_tmp/ffmpeg "$BIN_DIR/"
    cp ffmpeg_tmp/ffprobe "$BIN_DIR/"
    rm -rf ffmpeg_tmp ffmpeg.tar.xz
fi
chmod +x "$BIN_DIR/ffmpeg"

# 3. streaming_extractor_music (Essentia)
echo "Downloading Essentia extractor..."
if [ "$OS_NAME" == "Darwin" ]; then
    ESSENTIA_URL="https://essentia.upf.edu/extractors/essentia-extractors-v2.1_beta2-osx-x86_64.tar.gz"
    curl -L "$ESSENTIA_URL" -o essentia.tar.gz
    check_download "essentia.tar.gz" 10000000 # ~10MB minimum
    tar -xzf essentia.tar.gz -C "$BIN_DIR"
    rm essentia.tar.gz
else
    ESSENTIA_URL="https://essentia.upf.edu/extractors/essentia-extractors-v2.1_beta2-linux-x86_64.tar.gz"
    curl -L "$ESSENTIA_URL" -o essentia.tar.xz
    check_download "essentia.tar.xz" 10000000 # ~10MB minimum
    tar -xJf essentia.tar.xz -C "$BIN_DIR"
    rm essentia.tar.xz
fi
chmod +x "$BIN_DIR/streaming_extractor_music"

echo "--- Setup Complete! ---"
echo "Binaries are located in: $BIN_DIR"
