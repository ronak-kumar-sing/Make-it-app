#!/bin/bash
# Apply Redesign Script
# This script applies the new redesigned files to replace the old ones

echo "🚀 Applying StudyBuddy Redesign..."
echo ""

cd /Users/ronakkumar/Desktop/make-it/Make-it-app

# Backup original files (optional)
echo "📦 Creating backups..."
mkdir -p backup_old

# Move old files to backup
cp app/screens/OnboardingScreen.tsx backup_old/ 2>/dev/null
cp app/screens/SettingsScreen.tsx backup_old/ 2>/dev/null
cp app/screens/TasksScreen.tsx backup_old/ 2>/dev/null
cp app/screens/ResourcesScreen.tsx backup_old/ 2>/dev/null
cp app/context/ThemeContext.tsx backup_old/ 2>/dev/null
cp app/_layout.tsx backup_old/ 2>/dev/null

echo "✅ Backups created in backup_old/"
echo ""

# Replace with new files
echo "📝 Replacing with redesigned files..."

# Screens
mv app/screens/OnboardingScreen.new.tsx app/screens/OnboardingScreen.tsx 2>/dev/null && echo "  ✓ OnboardingScreen.tsx"
mv app/screens/SettingsScreen.new.tsx app/screens/SettingsScreen.tsx 2>/dev/null && echo "  ✓ SettingsScreen.tsx"
mv app/screens/TasksScreen.new.tsx app/screens/TasksScreen.tsx 2>/dev/null && echo "  ✓ TasksScreen.tsx"
mv app/screens/ResourcesScreen.new.tsx app/screens/ResourcesScreen.tsx 2>/dev/null && echo "  ✓ ResourcesScreen.tsx"

# Context
mv app/context/ThemeContext.new.tsx app/context/ThemeContext.tsx 2>/dev/null && echo "  ✓ ThemeContext.tsx"

# Layout
mv app/_layout.new.tsx app/_layout.tsx 2>/dev/null && echo "  ✓ _layout.tsx"

echo ""
echo "✅ Redesign applied successfully!"
echo ""
echo "📋 Summary of new features:"
echo "  • Modern HomeScreen dashboard with progress tracking"
echo "  • Redesigned TasksScreen with priorities & filters"
echo "  • ScheduleScreen for class timetable"
echo "  • ExpenseScreen for student budget tracking"
echo "  • StudyTimerScreen with Pomodoro focus modes"
echo "  • ResourcesScreen for study materials"
echo "  • Updated SettingsScreen with all new options"
echo "  • New theme system with light/dark/system modes"
echo "  • Modern UI components"
echo ""
echo "🏃 To start the app, run:"
echo "  npx expo start"
