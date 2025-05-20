#!/bin/bash

# Script to fix missing default exports in all necessary files

# Files with the "missing the required default export" warning
FILES=(
  "./app/_layout.tsx"
  "./app/components/DataSyncProvider.tsx"
  "./app/components/NotificationInitializer.tsx"
  "./app/context/AppContext.tsx"
  "./app/screens/AchievementsScreen.tsx"
  "./app/screens/AddTaskScreen.tsx"
  "./app/screens/AnalyticsScreen.tsx"
  "./app/screens/DashboardScreen.tsx"
  "./app/screens/ExamsScreen.tsx"
  "./app/screens/ResourcesScreen.tsx"
  "./app/screens/SettingsScreen.tsx"
  "./app/screens/StreaksScreen.tsx"
  "./app/screens/TaskDetailScreen.tsx"
  "./app/screens/TasksScreen.tsx"
  "./app/screens/TimerScreen.tsx"
  "./app/services/AndroidNotificationFixes.ts"
  "./app/services/NotificationAlternatives.ts"
  "./app/services/NotificationService.ts"
  "./app/services/NotificationService_new.ts"
  "./app/services/NotificationService_updated.ts"
  "./app/services/NotificationWarning.tsx"
  "./app/services/PermissionsManager.ts"
  "./app/utils/SimpleNotificationHelper.ts"
  "./app/utils/StorageSync.ts"
)

for file in "${FILES[@]}"; do
  fullpath="/Users/ronakkumar/Desktop/Make-it-app/$file"

  if [ -f "$fullpath" ]; then
    # Check if file already has default export
    if ! grep -q "export default" "$fullpath"; then
      # For component files (likely ending with Screen.tsx), extract the component name
      if [[ $file =~ .*Screen\.tsx$ ]] || [[ $file =~ .*Provider\.tsx$ ]] || [[ $file =~ .*\_layout\.tsx$ ]]; then
        # Extract the component name from the file content
        component_name=$(grep -o -E "const [A-Za-z0-9]+ ?= ?[\(\{]" "$fullpath" | head -1 | awk '{print $2}' | tr -d '({=')

        if [ -n "$component_name" ]; then
          echo "Adding default export for component $component_name in $file"

          # Add the export default line at the end of the file
          echo -e "\nexport default $component_name;" >> "$fullpath"
        else
          echo "Could not find component name in $file"
        fi
      else
        # For service/utility files, add a dummy default export
        echo -e "\n// Added default export to satisfy React Navigation\nexport default {};" >> "$fullpath"
      fi
    else
      echo "File $file already has default export"
    fi
  else
    echo "File $fullpath does not exist"
  fi
done

echo "Done fixing missing default exports!"
