// CommonJS script to fix notification issues
const fs = require('fs');
const path = require('path');

const servicePath = path.join(__dirname, 'app/services/NotificationService.ts');
console.log(`Processing file: ${servicePath}`);
let content = fs.readFileSync(servicePath, 'utf8');

// 1. Fix the task notification triggers
let replacementCount = 0;
content = content.replace(
  /trigger: \{\s*date: ([^,]+),(?!\s*type:)/g,
  (match) => {
    replacementCount++;
    return 'trigger: {\n        date: $1,\n        type: \'date\',';
  }
);
console.log(`Fixed ${replacementCount} date triggers without type field`);

// 2. Fix timer notification content
content = content.replace(
  /content: \{\s*title,\s*body,\s*data: \{ type: 'TIMER_RUNNING', notificationId \},\s*sticky: true,[\s\S]*?priority: 'high',\s*\/\/ (Android|Channel)[^}]*channelId: 'timer'/g,
  'content: {\n          title,\n          body,\n          data: { type: \'TIMER_RUNNING\', notificationId },\n          sticky: true, // Make it persistent\n          autoDismiss: false, // Prevent auto-dismissal\n          priority: \'high\',\n          channelId: \'timer\''
);

// 3. Fix the permissions logic to specifically handle Android 13+
content = content.replace(
  /(console\.log\('Current notification permission status:[^;]*\);[\s\S]*?\/\/ If already granted, we're good\s*let finalStatus = existingStatus;\s*if \(existingStatus !== 'granted'\) \{)/g,
  '$1\n    // On Android 13+ (API 33+), specifically request the POST_NOTIFICATIONS permission\n    if (Platform.OS === \'android\' && Platform.Version >= 33) {\n      console.log(\'Android 13+ detected, explicitly requesting POST_NOTIFICATIONS permission\');\n    }'
);

// Write the changes back to the file
fs.writeFileSync(servicePath, content, 'utf8');
console.log('✅ NotificationService.ts updated successfully');

// Add the notification plugin to app.json if needed
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

console.log('✅ All notification fixes have been applied!');
