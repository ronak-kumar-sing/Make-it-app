// Simple React syntax validator
const fs = require('fs');
const path = require('path');

try {
  const filePath = path.join(__dirname, 'app', 'screens', 'ResourcesScreen.js');
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Look for common syntax issues in React component code
  const lines = content.split('\n');
  
  // Check for missing semicolons after useState declarations
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.includes('useState(') && !line.endsWith(';') && !line.endsWith(',') && !line.endsWith('{')) {
      console.error(`Possible missing semicolon at line ${i + 1}:`, line);
    }
    
    // Check for misplaced JSX
    if ((line.startsWith('<') && !line.includes('const') && !line.includes('return') && !line.startsWith('//') && !line.startsWith('*')) ||
        (line.includes('<') && line.includes('=') && !line.includes('const') && !line.includes('=>'))) {
      console.error(`Possible misplaced JSX at line ${i + 1}:`, line);
    }
  }
  
  console.log('Basic syntax check complete');
} catch (error) {
  console.error('Error checking file:', error);
}
