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
