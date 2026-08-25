import fs from 'fs';

let code = fs.readFileSync('src/App.jsx', 'utf8');

// Linisin ang hidden space characters
code = code.replace(/[\u00a0\xa0]/g, ' ');

// 1. Palitan ang hardcoded Title
code = code.replace(
  'Your Weight Trend (Last 30 Days)',
  'Your Weight Trend'
);

// 2. Palitan ang buong Visual Weight Trend Card ng malinis at totoong Dynamic Version
const oldCardBlock = `<div className="card" style={{ padding: "16px", borderRadius: "20px", marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a", marginBottom: "12px" }}>Your Weight Trend</div>
              
              <div style={{ background: "#f8fafc", padding: "16px 12px 10px 12px", borderRadius: "16px", border: "1px solid #e2e8f0", marginBottom: "12px" }}>`;

const newCardBlock = `<div className="card" style={{ padding: "16px", borderRadius: "20px", marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a", marginBottom: "12px" }}>Your Weight Trend</div>
              
              <div style={{ background: "#f8fafc", padding: "16px 12px 12px 12px", borderRadius: "16px", border: "1px solid #e2e8f0", marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-around", alignItems: "flex-end", height: "80px", paddingBottom: "8px", borderBottom: "2px solid #cbd5e1" }}>
                  {appData.prevWeight && appData.prevWeight !== currentWeight ? (
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                      <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748b" }}>{appData.prevWeight} kg</span>
                      <div style={{ height: "50%", width: "6px", background: "#818cf8", borderRadius: "3px", margin: "4px 0" }}></div>
                      <span style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: 700 }}>Previous</span>
                    </div>
                  ) : null}

                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                    <span style={{ fontSize: "11px", fontWeight: 900, color: "var(--primary)" }}>{currentWeight} kg</span>
                    <div style={{ height: "75%", width: "8px", background: "var(--primary)", borderRadius: "4px", margin: "4px 0" }}></div>
                    <span style={{ fontSize: "9px", color: "var(--primary)", fontWeight: 800 }}>Current Baseline</span>
                  </div>
                </div>

                {(!appData.prevWeight || appData.prevWeight === currentWeight) && (
                  <div style={{ fontSize: "10px", color: "#64748b", textAlign: "center", marginTop: "8px", fontWeight: 600 }}>
                    📍 Initial weight baseline recorded. Log new weight updates to track your progression over time!
                  </div>
                )}
              </div>`;

// Apply block replacement if title exists
if (code.includes('Your Weight Trend')) {
  code = code.replace(/<div className="card" style=\{\{ padding: "16px", borderRadius: "20px", marginBottom: "16px" \}\}>[\s\S]*?<div style=\{\{ background: "#f8fafc", padding: "16px 12px 10px 12px", borderRadius: "16px", border: "1px solid #e2e8f0", marginBottom: "12px" \}\}>/, newCardBlock);
}

fs.writeFileSync('src/App.jsx', code);
console.log('✅ Title and 30-day chart block cleaned up successfully!');
