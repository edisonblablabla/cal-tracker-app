import fs from 'fs';

let code = fs.readFileSync('src/App.jsx', 'utf8');

// Clean hidden space characters
code = code.replace(/[\u00a0\xa0]/g, ' ');

// 1. Update handleUpdateWeight to keep an array of up to 5 historical weight logs
const oldUpdateWeight = `await saveToCloud({
        ...appData,
        prevWeight: appData.weight || w,
        weight: w,
        baseGoal: tdee
      });`;

const newUpdateWeight = `const currentHistory = Array.isArray(appData.weightHistory) ? appData.weightHistory : [appData.weight || w];
      const updatedHistory = [...currentHistory, w].slice(-5); // Keep last 5 updates only

      await saveToCloud({
        ...appData,
        prevWeight: appData.weight || w,
        weight: w,
        weightHistory: updatedHistory,
        baseGoal: tdee
      });`;

if (code.includes('prevWeight: appData.weight || w,')) {
  code = code.replace(oldUpdateWeight, newUpdateWeight);
}

// 2. Replace Chart Block to Render up to 5 Bars Dynamically
const oldChartRender = `<div style={{ display: "flex", justifyContent: "space-around", alignItems: "flex-end", height: "80px", paddingBottom: "8px", borderBottom: "2px solid #cbd5e1" }}>
                  {appData.prevWeight && appData.prevWeight !== currentWeight ? (
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                      <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748b" }}>{appData.prevWeight} kg</span>
                      <div style={{ height: "50%", width: "6px", background: "#818cf8", borderRadius: "3px", margin: "4px 0" }}></div>
                      <span style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: 700 }}>Previous Log</span>
                    </div>
                  ) : null}

                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                    <span style={{ fontSize: "11px", fontWeight: 900, color: "var(--primary)" }}>{currentWeight} kg</span>
                    <div style={{ height: "75%", width: "8px", background: "var(--primary)", borderRadius: "4px", margin: "4px 0" }}></div>
                    <span style={{ fontSize: "9px", color: "var(--primary)", fontWeight: 800 }}>Current Baseline</span>
                  </div>
                </div>`;

const newChartRender = `<div style={{ display: "flex", justifyContent: "space-around", alignItems: "flex-end", height: "95px", paddingBottom: "8px", borderBottom: "2px solid #cbd5e1", gap: "6px" }}>
                  {(() => {
                    const logs = (Array.isArray(appData.weightHistory) && appData.weightHistory.length > 0) 
                      ? appData.weightHistory 
                      : [currentWeight];
                    
                    const minW = Math.min(...logs) - 2;
                    const maxW = Math.max(...logs) + 2;
                    const range = (maxW - minW) || 1;

                    return logs.map((val, idx) => {
                      const isLatest = idx === logs.length - 1;
                      const heightPct = Math.max(25, Math.min(90, ((val - minW) / range) * 100));

                      return (
                        <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                          <span style={{ fontSize: "9px", fontWeight: isLatest ? 900 : 700, color: isLatest ? "var(--primary)" : "#64748b" }}>
                            {val}kg
                          </span>
                          <div style={{ 
                            height: heightPct + "%", 
                            width: isLatest ? "8px" : "5px", 
                            background: isLatest ? "var(--primary)" : "#818cf8", 
                            borderRadius: "3px", 
                            margin: "4px 0" 
                          }}></div>
                          <span style={{ fontSize: "8px", color: isLatest ? "var(--primary)" : "var(--text-muted)", fontWeight: isLatest ? 800 : 600 }}>
                            {isLatest ? "Current" : \`Log #\${idx + 1}\`}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>`;

if (code.includes('Previous Log')) {
  code = code.replace(oldChartRender, newChartRender);
}

fs.writeFileSync('src/App.jsx', code);
console.log('✅ Dynamic 5-entry weight trend chart installed successfully!');
