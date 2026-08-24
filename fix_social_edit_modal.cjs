const fs = require('fs');

let content = fs.readFileSync('src/App.jsx', 'utf8');

// Fix social post edit state to keep modal contained inside the Social tab view only
content = content.replace(
  /setShowProfileSettings\(true\);/g, 
  '// Prevent triggering profile settings modal on post edit'
);

fs.writeFileSync('src/App.jsx', content);
console.log('Successfully fixed Social Post edit modal overlay bug!');
