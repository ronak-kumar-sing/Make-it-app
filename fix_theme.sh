#!/bin/zsh

echo "Fixing app by removing theme context references..."

# Backup original files
echo "Backing up original files..."
mkdir -p /Users/ronakkumar/Desktop/Make-it/backup
cp /Users/ronakkumar/Desktop/Make-it/app/screens/ExamsScreen.js /Users/ronakkumar/Desktop/Make-it/backup/
cp /Users/ronakkumar/Desktop/Make-it/app/screens/SettingsScreen.js /Users/ronakkumar/Desktop/Make-it/backup/
cp /Users/ronakkumar/Desktop/Make-it/app/context/ThemeContext.js /Users/ronakkumar/Desktop/Make-it/backup/

# Replace files with fixed versions
echo "Replacing ExamsScreen.js with fixed version..."
cp /Users/ronakkumar/Desktop/Make-it/app/screens/fixed-ExamsScreen.js /Users/ronakkumar/Desktop/Make-it/app/screens/ExamsScreen.js

echo "Replacing SettingsScreen.js with fixed version..."
cp /Users/ronakkumar/Desktop/Make-it/app/screens/fixed-SettingsScreen.js /Users/ronakkumar/Desktop/Make-it/app/screens/SettingsScreen.js

echo "Replacing ThemeContext.js with empty version..."
cp /Users/ronakkumar/Desktop/Make-it/app/context/empty-ThemeContext.js /Users/ronakkumar/Desktop/Make-it/app/context/ThemeContext.js

echo "Fix complete! Try restarting the app."
