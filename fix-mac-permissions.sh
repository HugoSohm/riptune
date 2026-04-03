#!/bin/bash

# RipTune macOS Permission Fixer
# This script removes the "quarantine" attribute that macOS adds to apps downloaded from the internet
# which often causes the "App is damaged and cannot be opened" error.

APP_NAME="RipTune.app"
APPLICATIONS_DIR="/Applications"
APP_PATH="${APPLICATIONS_DIR}/${APP_NAME}"

echo "--- RipTune macOS Permission Fixer ---"

if [ ! -d "$APP_PATH" ]; then
    echo "Error: ${APP_NAME} not found in ${APPLICATIONS_DIR}."
    echo "Please make sure you have moved the app to your Applications folder first."
    exit 1
fi

echo "Fixing permissions for ${APP_PATH}..."
sudo xattr -cr "$APP_PATH"

if [ $? -eq 0 ]; then
    echo "Success! You should now be able to open RipTune."
else
    echo "Failed to fix permissions. You might need to run this command manually:"
    echo "sudo xattr -cr ${APP_PATH}"
fi
