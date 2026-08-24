const fs = require('fs');

let content = fs.readFileSync('src/App.jsx', 'utf8');

// Enhance file input feedback for Avatar selection
const targetUpload = `const handleAvatarChange = (e) => {
    if (e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
    }
  };`;

const enhancedUpload = `const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      // Generate temporary preview URL for immediate feedback
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
    }
  };`;

if (content.includes('handleAvatarChange')) {
  content = content.replace(targetUpload, enhancedUpload);
}

fs.writeFileSync('src/App.jsx', content);
console.log('Successfully added live Avatar selection indicator!');
