#!/bin/zsh
# Script to set up permissions for the Make-it app

# Color codes for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "${BLUE}Setting up permissions for Make-it app...${NC}"

# Check operating system
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  echo "${GREEN}Detected macOS environment${NC}"

  # Check for iOS project
  if [ -d "ios" ]; then
    echo "${BLUE}Updating iOS permissions in Info.plist...${NC}"
    echo "The following permissions will be manually configured for iOS:"
    echo "- NSUserNotificationsUsageDescription"
    echo "- NSPhotoLibraryUsageDescription"
    echo "- NSPhotoLibraryAddUsageDescription"

    echo "${GREEN}iOS permissions are configured in app.json and will be applied during the build process.${NC}"
  else
    echo "${RED}iOS directory not found. Skipping iOS permissions setup.${NC}"
  fi
fi

# Check for Android project
if [ -d "android" ]; then
  echo "${BLUE}Checking Android permissions...${NC}"

  # Verify that permissions are properly declared in AndroidManifest.xml
  MANIFEST_FILE="android/app/src/main/AndroidManifest.xml"

  if [ -f "$MANIFEST_FILE" ]; then
    echo "${GREEN}Found AndroidManifest.xml${NC}"

    # Check for required permissions
    REQUIRED_PERMISSIONS=(
      "android.permission.INTERNET"
      "android.permission.NOTIFICATIONS"
      "android.permission.READ_EXTERNAL_STORAGE"
      "android.permission.WRITE_EXTERNAL_STORAGE"
      "android.permission.VIBRATE"
    )

    MISSING_PERMISSIONS=()

    for PERM in "${REQUIRED_PERMISSIONS[@]}"; do
      if ! grep -q "$PERM" "$MANIFEST_FILE"; then
        MISSING_PERMISSIONS+=("$PERM")
      fi
    done

    if [ ${#MISSING_PERMISSIONS[@]} -eq 0 ]; then
      echo "${GREEN}All required Android permissions are declared.${NC}"
    else
      echo "${RED}Missing Android permissions in $MANIFEST_FILE:${NC}"
      for PERM in "${MISSING_PERMISSIONS[@]}"; do
        echo "- $PERM"
      done

      echo "${RED}Please update your AndroidManifest.xml with the missing permissions.${NC}"
    fi
  else
    echo "${RED}AndroidManifest.xml not found. Skipping Android permissions check.${NC}"
  fi
else
  echo "${RED}Android directory not found. Skipping Android permissions setup.${NC}"
fi

echo "${BLUE}Checking required npm packages for permissions...${NC}"
REQUIRED_PACKAGES=(
  "expo-device"
  "expo-notifications"
  "expo-media-library"
  "expo-image-picker"
  "expo-file-system"
)

MISSING_PACKAGES=()

for PKG in "${REQUIRED_PACKAGES[@]}"; do
  if ! grep -q "\"$PKG\"" "package.json"; then
    MISSING_PACKAGES+=("$PKG")
  fi
done

if [ ${#MISSING_PACKAGES[@]} -eq 0 ]; then
  echo "${GREEN}All required permission-related packages are installed.${NC}"
else
  echo "${RED}Missing packages for permissions:${NC}"
  for PKG in "${MISSING_PACKAGES[@]}"; do
    echo "- $PKG"
  done
  echo "${BLUE}Installing missing packages...${NC}"
  npm install --save "${MISSING_PACKAGES[@]}"
fi

echo "${GREEN}Permissions setup completed!${NC}"
echo "To test all permissions, open the app and go to:"
echo "Settings > Manage App Permissions"
