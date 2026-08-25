import fs from 'fs';

let code = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Compact Header Greeting
code = code.replace(
  '<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>',
  '<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>'
);
code = code.replace(
  '<h2 style={{ fontSize: "20px", fontWeight: 800 }}>Welcome back, {appData.userName}!</h2>',
  '<h2 style={{ fontSize: "16px", fontWeight: 800, margin: 0 }}>Welcome back, {appData.userName}!</h2>'
);

// 2. Compact Daily Motivation Card
code = code.replace(
  '<div className="motivation-card" onClick={shuffleQuote} style={{ cursor: "pointer" }}>',
  '<div className="motivation-card" onClick={shuffleQuote} style={{ cursor: "pointer", padding: "8px 12px", marginBottom: "10px" }}>'
);
code = code.replace(
  '<div style={{ fontSize: "13px", fontWeight: 700 }}>"{quote}"</div>',
  '<div style={{ fontSize: "11px", fontWeight: 700, lineHeight: 1.3 }}>"{quote}"</div>'
);

fs.writeFileSync('src/App.jsx', code);
console.log('✅ Home tab header & motivation card successfully compacted!');
