import fs from 'fs';

let code = fs.readFileSync('src/App.jsx', 'utf8');

// Linisin ang hidden spaces
code = code.replace(/[\u00a0\xa0]/g, ' ');

// 1. Update handleUpdateWeight to save objects with { val, date }
const oldUpdateFunc = `const currentHistory = Array.isArray(appData.weightHistory) ? appData.weightHistory : [appData.weight || w];
      const updatedHistory = [...currentHistory, w].slice(-5); // Keep last 5 updates only

      await saveToCloud({
        ...appData,
        prevWeight: appData.weight || w,
        weight: w,
        weightHistory: updatedHistory,
        baseGoal: tdee
      });`;

const newUpdateFunc = `const nowStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const currentHistory = Array.isArray(appData.weightHistory) ? appData.weightHistory : [{ val: appData.weight || w, date: nowStr }];
      
      // Convert legacy numbers to objects if any exist
      const normalizedHistory = currentHistory.map(item => 
        typeof item === 'object' ? item : { val: item, date: "Prev" }
      );

      const updatedHistory = [...normalizedHistory, { val: w, date: nowStr }].slice(-5);

      await saveToCloud({
        ...appData,
        prevWeight: appData.weight || w,
        weight: w,
        weightHistory: updatedHistory,
        baseGoal: tdee
      });`;

if (code.includes('const currentHistory = Array.isArray(appData.weightHistory)')) {
  code = code.replace(oldUpdateFunc, newUpdateFunc);
}

// 2. Update Chart Render to show actual logged Date below each bar
const oldChartLoop = `return logs.map((val, idx) => {
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
                    });`;

const newChartLoop = `const todayShort = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });

                    return logs.map((item, idx) => {
                      const val = typeof item === 'object' ? item.val : item;
                      const logDate = typeof item === 'object' ? item.date : todayShort;
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
                            {logDate}
                          </span>
                        </div>
                      );
                    });`;

if (code.includes('Log #${idx + 1}')) {
  code = code.replace(oldChartLoop, newChartLoop);
}

fs.writeFileSync('src/App.jsx', code);
console.log('✅ Date stamps added to Weight Trend Chart!');
