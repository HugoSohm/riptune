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
else
    MACOS_APP="$ROOT_DIR/src-tauri/target/release/bundle/macos/${APP_NAME}.app"
fi

echo "--- Preparing Pro macOS installer (${ARCH_NAME}) ---"

# 1. Verify main application
if [ ! -d "$MACOS_APP" ]; then
    echo "Error: ${APP_NAME}.app not found in expected target location: $MACOS_APP"
    exit 1
fi

# Apply the native icon to the already compiled RipTune application
echo "Updating RipTune.app icon..."
cp "$ROOT_DIR/src-tauri/icons/icon.icns" "$MACOS_APP/Contents/Resources/icon.icns"
touch "$MACOS_APP"

# 2. Prepare Fixer utility
echo "Compiling repair script..."
rm -rf "$FIXER_APP"
osacompile -o "$FIXER_APP" "$FIXER_SRC"
cp "$FIXER_ICON" "$FIXER_APP/Contents/Resources/applet.icns"
touch "$FIXER_APP"

# 3. Create staging directory
echo "Creating staging folder..."
rm -rf "$STAGING_DIR"
mkdir -p "$STAGING_DIR"
cp -R "$MACOS_APP" "$STAGING_DIR/"
cp -R "$FIXER_APP" "$STAGING_DIR/"
cp "$INSTRUCTIONS_FILE" "$STAGING_DIR/instructions.txt"

# 4. Generate DMG logic (Hand-crafted equivalent of Tauri's bundle_dmg.sh)
echo "Generating Pro DMG..."
mkdir -p "$OUTPUT_DIR"
rm -f "$OUTPUT_DMG"

# Create a temporary writable DMG
TEMP_DMG="${OUTPUT_DMG}.temp.dmg"
hdiutil create -size 500m -fs HFS+ -volname "$VOLUME_NAME" "$TEMP_DMG"

# Mount it
MOUNT_DIR="/Volumes/$VOLUME_NAME"
# Unmount if already mounted
hdiutil detach "$MOUNT_DIR" 2>/dev/null || true
hdiutil attach "$TEMP_DMG"

# Copy files to the mounted image
cp -R "$STAGING_DIR"/* "$MOUNT_DIR/"
# Link to Applications
ln -s /Applications "$MOUNT_DIR/Applications"

# Set Background
mkdir "$MOUNT_DIR/.background"
cp "$BACKGROUND" "$MOUNT_DIR/.background/background.png"

# Use AppleScript to set layout (match Tauri's bundle_dmg.sh logic)
echo "Setting DMG visuals (Icons & Background)..."
osascript <<EOF
tell application "Finder"
    tell disk "$VOLUME_NAME"
        open
        set theView to container window
        set current view of theView to icon view
        set toolbar visible of theView to false
        set statusbar visible of theView to false
        set items_pos to {200, 120, 1000, 745}
        set bounds of theView to items_pos
        
        set theIconViewOpts to icon view options of theView
        set icon size of theIconViewOpts to 85
        set arrangement of theIconViewOpts to not arranged
        set background picture of theIconViewOpts to file ".background:background.png"
        
        -- Matching your original layout
        set position of item "${APP_NAME}.app" of theView to {200, 250}
        set position of item "Applications" of theView to {600, 250}
        set position of item "Fix RipTune.app" of theView to {475, 110}
        set position of item "instructions.txt" of theView to {325, 110}
        
        update (items of theView)
        -- Give it a moment to save .DS_Store
        delay 2
        close
    end tell
end tell
EOF

# Unmount
hdiutil detach "$MOUNT_DIR"

# Convert to compressed image
hdiutil convert "$TEMP_DMG" -format UDZO -o "$OUTPUT_DMG"
rm "$TEMP_DMG"

echo "---"
echo "Success! The Pro DMG has been created here: $OUTPUT_DMG"
echo "Cleaning up..."
rm -rf "$STAGING_DIR"
rm -rf "$FIXER_APP"
