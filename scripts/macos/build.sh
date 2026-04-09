#!/bin/bash
set -e

# Configuration
APP_NAME="RipTune"
VOLUME_NAME="RipTune"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
STAGING_DIR="$ROOT_DIR/dmg-staging"
OUTPUT_DIR="$ROOT_DIR/dist"

# Metadata extraction
VERSION=$(node -p "require('$ROOT_DIR/package.json').version")

# Allow overriding ARCH from environment (aarch64 or x64)
if [ -n "$ARCH_OVERRIDE" ]; then
    ARCH_NAME="$ARCH_OVERRIDE"
    if [ "$ARCH_NAME" = "aarch64" ]; then 
        TARGET_DIR="aarch64-apple-darwin"
    else 
        TARGET_DIR="x86_64-apple-darwin"
    fi
else
    ARCH=$(uname -m)
    if [ "$ARCH" = "arm64" ]; then
        ARCH_NAME="aarch64"
        TARGET_DIR="aarch64-apple-darwin"
    elif [ "$ARCH" = "x86_64" ]; then
        ARCH_NAME="x64"
        TARGET_DIR="x86_64-apple-darwin"
    else
        ARCH_NAME="$ARCH"
        TARGET_DIR="" # Fallback to native
    fi
fi

OUTPUT_DMG="$OUTPUT_DIR/${APP_NAME}_${VERSION}_${ARCH_NAME}.dmg"

# Assets
BACKGROUND="$SCRIPT_DIR/dmg-background.png"
INSTRUCTIONS_FILE="$SCRIPT_DIR/instructions.txt"
FIXER_APP="$SCRIPT_DIR/Fix RipTune.app"
FIXER_SRC="$SCRIPT_DIR/fix-riptune.applescript"
FIXER_ICON="$SCRIPT_DIR/fix-riptune.icns"

# Check for app in common locations (native vs cross-compiled)
if [ -d "$ROOT_DIR/src-tauri/target/$TARGET_DIR/release/bundle/macos/${APP_NAME}.app" ]; then
    MACOS_APP="$ROOT_DIR/src-tauri/target/$TARGET_DIR/release/bundle/macos/${APP_NAME}.app"
    BUNDLE_DMG_SCRIPT="$ROOT_DIR/src-tauri/target/$TARGET_DIR/release/bundle/dmg/bundle_dmg.sh"
else
    MACOS_APP="$ROOT_DIR/src-tauri/target/release/bundle/macos/${APP_NAME}.app"
    BUNDLE_DMG_SCRIPT="$ROOT_DIR/src-tauri/target/release/bundle/dmg/bundle_dmg.sh"
fi

echo "--- Preparing custom macOS installer ---"

# 1. Verify main application
if [ ! -d "$MACOS_APP" ]; then
    echo "Error: ${APP_NAME}.app not found in target/release/bundle/macos/."
    echo "Running 'npm run build'..."
    npm run build
fi

# Apply the native icon to the already compiled RipTune application
echo "Updating RipTune.app icon..."
cp "$ROOT_DIR/src-tauri/icons/icon.icns" "$MACOS_APP/Contents/Resources/icon.icns"
touch "$MACOS_APP"

# 2. Prepare Fixer utility
echo "Compiling repair script..."
rm -rf "$FIXER_APP"
osacompile -o "$FIXER_APP" "$FIXER_SRC"

# Apply custom icon to Fixer utility
echo "Applying custom icon to Fixer..."
cp "$FIXER_ICON" "$FIXER_APP/Contents/Resources/applet.icns"
# Force macOS to refresh the icon
touch "$FIXER_APP"

# 3. Create staging directory
echo "Creating staging folder..."
rm -rf "$STAGING_DIR"
mkdir -p "$STAGING_DIR"

# Copy files to DMG staging area
cp -R "$MACOS_APP" "$STAGING_DIR/"
cp -R "$FIXER_APP" "$STAGING_DIR/"

# 4. Create DMG
echo "Generating DMG..."
mkdir -p "$OUTPUT_DIR"
rm -f "$OUTPUT_DMG"

# Call Tauri's DMG script to generate the DMG with a specific layout
"$BUNDLE_DMG_SCRIPT" \
    --volname "$VOLUME_NAME" \
    --volicon "$ROOT_DIR/src-tauri/icons/icon.icns" \
    --background "$BACKGROUND" \
    --window-pos 200 120 \
    --window-size 800 625 \
    --icon-size 80 \
    --icon "${APP_NAME}.app" 200 250 \
    --app-drop-link 600 250 \
    --icon "Fix RipTune.app" 475 110 \
    --hide-extension "Fix RipTune.app" \
    --add-file "instructions.txt" "$INSTRUCTIONS_FILE" 325 110 \
    "$OUTPUT_DMG" \
    "$STAGING_DIR"

echo "---"
echo "Success! The DMG has been created here: $OUTPUT_DMG"
echo "Cleaning up..."
rm -rf "$STAGING_DIR"
