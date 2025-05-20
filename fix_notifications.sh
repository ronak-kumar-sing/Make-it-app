#!/bin/zsh

# Script to fix notification trigger formats in the app

echo "==== Fixing notification trigger formats in NotificationService.ts ===="

# We already created the notification-fix.cjs file separately
const fs = require('fs');
const path = require('path');

const servicePath = path.join(__dirname, 'app/services/NotificationService.ts');
let content = fs.readFileSync(servicePath, 'utf8');

// 1. Fix the task notification triggers
content = content.replace(
  /trigger: \{\s*date: ([^,]+),\s*channelId: ([^,]+),?\s*\},/g,
  'trigger: {\n        date: $1,\n        type: \'date\',\n        channelId: $2,\n      },'
);

// 2. Fix the exam notification triggers
content = content.replace(
  /trigger: \{\s*date: ([^,]+),\s*channelId: ([^,]+),?\s*\},/g,
  'trigger: {\n        date: $1,\n        type: \'date\',\n        channelId: $2,\n      },'
);

// 3. Fix timer notification content
content = content.replace(
  /content: \{\s*title,\s*body,\s*data: \{ type: 'TIMER_RUNNING', notificationId \},\s*sticky: true, \/\/ Make it persistent\s*autoDismiss: false, \/\/ Prevent auto-dismissal\s*priority: 'high',\s*\/\/ Channel ID for Android\s*channelId: 'timer'[^}]*\},/g,
  'content: {\n          title,\n          body,\n          data: { type: \'TIMER_RUNNING\', notificationId },\n          sticky: true, // Make it persistent\n          autoDismiss: false, // Prevent auto-dismissal\n          priority: \'high\',\n          channelId: \'timer\'\n        },'
);

// 4. Fix the permissions logic to specifically handle Android 13+
content = content.replace(
  /\/\/ If already granted, we're good\s*let finalStatus = existingStatus;\s*if \(existingStatus !== 'granted'\) \{/g,
  '// If already granted, we\'re good\n  let finalStatus = existingStatus;\n  if (existingStatus !== \'granted\') {\n    // On Android 13+ (API 33+), specifically request the POST_NOTIFICATIONS permission\n    console.log(`Platform ${Platform.OS}, version ${Platform.Version} - requesting notification permissions`);\n'
);

// Write the changes back to the file
fs.writeFileSync(servicePath, content, 'utf8');
console.log('✅ NotificationService.ts updated successfully');
EOL

# Execute the fix script
echo "Running notification fixes..."
node notification-fix.js

# Make sure the notification plugin is properly added to app.json
if ! grep -q "expo-notifications" /Users/ronakkumar/Desktop/Make-it-app/app.json; then
  echo "Adding expo-notifications plugin to app.json..."
  # Add the expo-notifications plugin
  node -e "
    const fs = require('fs');
    const path = require('path');
    const appJsonPath = path.join(__dirname, 'app.json');
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

    // Check if plugins array exists
    if (!appJson.expo.plugins) {
      appJson.expo.plugins = [];
    }

    // Check if expo-notifications is already in the plugins
    const hasNotifications = appJson.expo.plugins.some(p =>
      typeof p === 'string' ? p === 'expo-notifications' : (Array.isArray(p) && p[0] === 'expo-notifications')
    );

    if (!hasNotifications) {
      // Add the plugin
      appJson.expo.plugins.push([
        'expo-notifications',
        {
          'icon': './assets/images/icon.png',
          'color': '#ffffff'
        }
      ]);

      // Save the updated app.json
      fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2), 'utf8');
      console.log('✅ Added expo-notifications plugin to app.json');
    } else {
      console.log('✓ expo-notifications plugin already exists in app.json');
    }
  "
fi

echo "==== All notification fixes have been applied! ===="
echo "To apply these changes, please rebuild your app."