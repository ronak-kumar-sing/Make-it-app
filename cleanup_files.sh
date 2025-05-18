#!/bin/zsh
# Advanced Cleanup script for Make-it app
# This will move non-working and redundant files to a backup folder
# rather than deleting them permanently

# Create a backup folder with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/Users/ronakkumar/Desktop/Make-it_backup_$TIMESTAMP"
mkdir -p "$BACKUP_DIR"
echo "Created backup directory: $BACKUP_DIR"

# Move backup files (.bak, .bak2, .backup)
echo "\nMoving backup files..."
find /Users/ronakkumar/Desktop/Make-it/app -name "*.bak" -o -name "*.bak2" -o -name "*.backup" | while read file; do
  dest="$BACKUP_DIR/$(basename $file)"
  echo "Moving $file to $dest"
  mv "$file" "$dest"
done

# Move ExamsScreen_fixed.tsx as it's not referenced
echo "\nMoving unused ExamsScreen_fixed.tsx..."
if [ -f "/Users/ronakkumar/Desktop/Make-it/app/screens/ExamsScreen_fixed.tsx" ]; then
  echo "Moving /Users/ronakkumar/Desktop/Make-it/app/screens/ExamsScreen_fixed.tsx to $BACKUP_DIR/"
  mv "/Users/ronakkumar/Desktop/Make-it/app/screens/ExamsScreen_fixed.tsx" "$BACKUP_DIR/"
else
  echo "ExamsScreen_fixed.tsx not found"
fi

# Check for any remaining notification .js files (should be .ts or .tsx now)
echo "\nChecking for obsolete notification JS files..."
find /Users/ronakkumar/Desktop/Make-it/app -name "Notification*.js" | while read file; do
  echo "Found obsolete JS file: $file, moving to backup"
  mv "$file" "$BACKUP_DIR/$(basename $file)"
done

# Check for any temp files
echo "\nMoving temporary files..."
find /Users/ronakkumar/Desktop/Make-it -name "*.tmp" -o -name "*.temp" -o -name "temp*" | while read file; do
  if [ -f "$file" ]; then
    echo "Moving temporary file: $file"
    mv "$file" "$BACKUP_DIR/$(basename $file)"
  fi
done

# Create a log of all notification services and files
echo "\nCreating notification files log for reference..."
NOTIFICATION_LOG="$BACKUP_DIR/notification_files_log.txt"
echo "Notification System Files as of $(date)" > $NOTIFICATION_LOG
echo "=======================================" >> $NOTIFICATION_LOG
echo "\nNotification Service Files:" >> $NOTIFICATION_LOG
find /Users/ronakkumar/Desktop/Make-it/app/services -name "*Notification*.ts*" -ls >> $NOTIFICATION_LOG
echo "\nNotification Component Files:" >> $NOTIFICATION_LOG
find /Users/ronakkumar/Desktop/Make-it/app/components -name "*Notification*.tsx" -ls >> $NOTIFICATION_LOG
echo "\nNotification Helper Files:" >> $NOTIFICATION_LOG
find /Users/ronakkumar/Desktop/Make-it/app/utils -name "*Notification*.ts" -ls >> $NOTIFICATION_LOG

echo "\nCleanup completed. Files have been moved to $BACKUP_DIR"
echo "A log of notification files has been created at $NOTIFICATION_LOG"
echo "You can delete this backup directory if the app works properly after cleanup."
