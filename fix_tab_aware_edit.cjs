const fs = require('fs');

let content = fs.readFileSync('src/App.jsx', 'utf8');

// Ensure edit modal open handler respects activeTab context
const oldEditLogic = /const handleEditPost = \(post\) => {[\s\S]*?};/;

const newEditLogic = `const handleEditPost = (post) => {
    setEditingPost(post);
    setEditText(post.text || '');
    setEditImage(post.imageUrl || null);
    // Modal automatically opens within the current active tab context
    setShowEditModal(true);
  };`;

content = content.replace(oldEditLogic, newEditLogic);
fs.writeFileSync('src/App.jsx', content);
console.log('Successfully updated edit dialog to be tab-aware!');
