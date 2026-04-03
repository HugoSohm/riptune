#!/bin/bash

# RipTune macOS Permission Fixer (GUI Version)
# This script uses macOS native dialogs to guide the user.

APP_NAME="RipTune.app"
APPLICATIONS_DIR="/Applications"
APP_PATH="${APPLICATIONS_DIR}/${APP_NAME}"

# 1. Check if the app exists in Applications folder
if [ ! -d "$APP_PATH" ]; then
    osascript -e "display dialog \"Error: RipTune is not in your Applications folder.\n\nPlease drag the app to your Applications folder before running this fix.\" buttons {\"OK\"} default button 1 with icon stop with title \"RipTune Fixer\""
    # Close terminal and exit
    osascript -e 'tell application "Terminal" to close (every window whose name contains "fix-mac-permissions")' &
    exit 1
fi

# 2. Run the fix (will prompt for password in terminal if needed)
echo "--- Fixing permissions for $APP_NAME ---"
echo "Please enter your Mac password if prompted."
sudo xattr -cr "$APP_PATH"

# 3. Final confirmation or error
if [ $? -eq 0 ]; then
    osascript -e "display dialog \"Success! \n\nYou can now open RipTune from your Applications folder.\" buttons {\"OK\"} default button 1 with icon note with title \"RipTune Fixer\""
else
    osascript -e "display dialog \"Failed to fix permissions.\n\nPlease try again or contact support.\" buttons {\"OK\"} default button 1 with icon stop with title \"RipTune Fixer\""
fi

# 4. Auto-close the terminal window
osascript -e 'tell application "Terminal" to close (every window whose name contains "fix-mac-permissions")' &
exit
