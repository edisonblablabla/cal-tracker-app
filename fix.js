import fs from 'fs';
let content = fs.readFileSync('src/App.jsx', 'utf8');
content = content.replace(/[\u00a0\xa0]/g, ' ');
content = content.replace(/fontWeight 700/g, 'fontWeight: 700');
fs.writeFileSync('src/App.jsx', content);
console.log('App.jsx successfully cleaned!');
