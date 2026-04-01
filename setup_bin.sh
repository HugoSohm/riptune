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
    # Download static Linux build from johnvansickle.com
    FFMPEG_URL="https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz"
    download_file "$FFMPEG_URL" "ffmpeg.tar.xz"
    mkdir -p ffmpeg_tmp
    tar -xJf ffmpeg.tar.xz -C ffmpeg_tmp --strip-components=1
    cp ffmpeg_tmp/ffmpeg "$BIN_DIR/"
    cp ffmpeg_tmp/ffprobe "$BIN_DIR/"
    rm -rf ffmpeg_tmp ffmpeg.tar.xz
fi
chmod +x "$BIN_DIR/ffmpeg"
chmod +x "$BIN_DIR/ffprobe"

# 3. streaming_extractor_music (Essentia)
if [ "$OS_NAME" == "Darwin" ]; then
    ESSENTIA_URL="https://data.metabrainz.org/pub/musicbrainz/acousticbrainz/extractors/essentia-extractor-v2.1_beta2-2-gbb40004-osx.tar.gz"
else
    ESSENTIA_URL="https://data.metabrainz.org/pub/musicbrainz/acousticbrainz/extractors/essentia-extractor-v2.1_beta2-linux-x86_64.tar.gz"
fi

download_file "$ESSENTIA_URL" "essentia.tar.gz"
# Extract without stripping to handle both root and subfolder structures
tar -xzf essentia.tar.gz -C "$BIN_DIR"
# If it was in a subfolder, move it up
if [ ! -f "$BIN_DIR/streaming_extractor_music" ]; then
    find "$BIN_DIR" -name "streaming_extractor_music" -exec mv {} "$BIN_DIR/" \;
fi
rm essentia.tar.gz

chmod +x "$BIN_DIR/streaming_extractor_music"

echo "--- Setup Complete! ---"
echo "Binaries are located in: $BIN_DIR"
