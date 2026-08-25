import fs from 'fs';

let code = fs.readFileSync('src/App.jsx', 'utf8');

// Linisin ang hidden spaces
code = code.replace(/[\u00a0\xa0]/g, ' ');

// Old Hardcoded Chart UI
const oldChartCard = `<div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", height: "90px", paddingBottom: "8px", borderBottom: "2px solid #cbd5e1", position: "relative" }}>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                    <span style={{ fontSize: "9px", fontWeight: 800, color: "#64748b" }}>{((appData.prevWeight || currentWeight) + 2).toFixed(1)}kg</span>
                    <div style={{ height: "75%", width: "4px", background: "#cbd5e1", borderRadius: "2px", margin: "4px 0" }}></div>
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                    <span style={{ fontSize: "9px", fontWeight: 800, color: "#64748b" }}>{(appData.prevWeight || currentWeight).toFixed(1)}kg</span>
                    <div style={{ height: "55%", width: "4px", background: "#818cf8", borderRadius: "2px", margin: "4px 0" }}></div>
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                    <span style={{ fontSize: "10px", fontWeight: 900, color: "var(--primary)" }}>{currentWeight}kg</span>
                    <div style={{ height: "35%", width: "6px", background: "var(--primary)", borderRadius: "3px", margin: "4px 0" }}></div>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "var(--text-muted)", fontWeight: 700, marginTop: "6px" }}>
                  <span>30 Days Ago</span>
                  <span>Previous</span>
                  <span>Today ({currentWeight} kg)</span>
                </div>`;

// Dynamic Clean Chart UI based on actual account age & data
const newChartCard = `<div style={{ display: "flex", justifyContent: "space-around", alignItems: "flex-end", height: "90px", paddingBottom: "8px", borderBottom: "2px solid #cbd5e1", position: "relative" }}>
                  {appData.prevWeight && appData.prevWeight !== currentWeight ? (
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                      <span style={{ fontSize: "9px", fontWeight: 800, color: "#64748b" }}>{appData.prevWeight} kg</span>
                      <div style={{ height: "55%", width: "6px", background: "#818cf8", borderRadius: "3px", margin: "4px 0" }}></div>
                      <span style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: 700, marginTop: "4px" }}>Previous</span>
                    </div>
                  ) : null}

                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                    <span style={{ fontSize: "11px", fontWeight: 900, color: "var(--primary)" }}>{currentWeight} kg</span>
                    <div style={{ height: "75%", width: "8px", background: "var(--primary)", borderRadius: "4px", margin: "4px 0" }}></div>
                    <span style={{ fontSize: "9px", color: "var(--primary)", fontWeight: 800, marginTop: "4px" }}>Current Weight</span>
                  </div>
                </div>
                
                {(!appData.prevWeight || appData.prevWeight === currentWeight) && (
                  <div style={{ fontSize: "10px", color: "#64748b", textAlign: "center", marginTop: "8px", fontWeight: 600 }}>
                    📍 Initial weight baseline recorded. Log new weight updates to track your progression!
                  </div>
                )}`;

if (code.includes('30 Days Ago')) {
  code = code.replace(oldChartCard, newChartCard);
}

fs.writeFileSync('src/App.jsx', code);
console.log('✅ Dynamic Progress Weight Chart applied!');
