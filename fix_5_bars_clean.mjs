import fs from 'fs';

let code = fs.readFileSync('src/App.jsx', 'utf8');

// Linisin ang hidden spaces
code = code.replace(/[\u00a0\xa0]/g, ' ');

// 1. Siguraduhing tama ang handleUpdateWeight logic para mag-save ng array
const oldUpdateWeight = /const handleUpdateWeight = async \(\) => \{[\s\S]*?\};/;

const newUpdateWeight = `const handleUpdateWeight = async () => {
    if (!newLogWeight || isNaN(newLogWeight)) return;
    setIsUpdatingWeight(true);
    try {
      const w = parseFloat(newLogWeight);
      const userDocRef = doc(db, "users", user.uid);
      const nowStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
      
      const currentHistory = Array.isArray(appData.weightHistory) ? appData.weightHistory : [];
      const normalizedHistory = currentHistory.map(item => 
        typeof item === 'object' ? item : { val: item, date: "Prev" }
      );

      // If empty history, push baseline weight first
      if (normalizedHistory.length === 0 && appData.weight) {
        normalizedHistory.push({ val: appData.weight, date: "Start" });
      }

      const updatedHistory = [...normalizedHistory, { val: w, date: nowStr }].slice(-5);

      const bmr = 10 * w + 6.25 * (appData.height || 165) - 5 * 25 + 5;
      const tdee = Math.round(bmr * 1.375);

      const updatedData = {
        ...appData,
        prevWeight: appData.weight || w,
        weight: w,
        weightHistory: updatedHistory,
        baseGoal: tdee
      };

      await setDoc(userDocRef, updatedData, { merge: true });
      setAppData(updatedData);
      setNewLogWeight("");
    } catch (err) {
      console.error("Error updating weight:", err);
    } finally {
      setIsUpdatingWeight(false);
    }
  };`;

code = code.replace(oldUpdateWeight, newUpdateWeight);

// 2. I-replace ang buong Weight Trend Card sa Progress Tab
const oldTrendCard = /\{s*?\/\* 1\. VISUAL WEIGHT TREND CHART CARD \*\/[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;

const newTrendCard = `{/* 1. VISUAL WEIGHT TREND CHART CARD */}
            <div className="card" style={{ padding: "16px", borderRadius: "20px", marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a", marginBottom: "12px" }}>Your Weight Trend</div>
              
              <div style={{ background: "#f8fafc", padding: "16px 12px 12px 12px", borderRadius: "16px", border: "1px solid #e2e8f0", marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-around", alignItems: "flex-end", height: "95px", paddingBottom: "8px", borderBottom: "2px solid #cbd5e1", gap: "6px" }}>
                  {(() => {
                    const todayShort = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
                    const rawLogs = (Array.isArray(appData.weightHistory) && appData.weightHistory.length > 0) 
                      ? appData.weightHistory 
                      : [{ val: currentWeight, date: todayShort }];

                    const logs = rawLogs.map(item => typeof item === 'object' ? item : { val: item, date: "Prev" });
                    const valList = logs.map(l => l.val);

                    const minW = Math.min(...valList) - 2;
                    const maxW = Math.max(...valList) + 2;
                    const range = (maxW - minW) || 1;

                    return logs.map((item, idx) => {
                      const isLatest = idx === logs.length - 1;
                      const heightPct = Math.max(25, Math.min(90, ((item.val - minW) / range) * 100));

                      return (
                        <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                          <span style={{ fontSize: "9px", fontWeight: isLatest ? 900 : 700, color: isLatest ? "var(--primary)" : "#64748b" }}>
                            {item.val}kg
                          </span>
                          <div style={{ 
                            height: heightPct + "%", 
                            width: isLatest ? "8px" : "5px", 
                            background: isLatest ? "var(--primary)" : "#818cf8", 
                            borderRadius: "3px", 
                            margin: "4px 0" 
                          }}></div>
                          <span style={{ fontSize: "8px", color: isLatest ? "var(--primary)" : "var(--text-muted)", fontWeight: isLatest ? 800 : 600 }}>
                            {item.date}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>

                {(!appData.weightHistory || appData.weightHistory.length <= 1) && (
                  <div style={{ fontSize: "10px", color: "#64748b", textAlign: "center", marginTop: "8px", fontWeight: 600 }}>
                    📍 Initial weight baseline recorded. Log new weight updates to build your 5-entry trend chart!
                  </div>
                )}
              </div>

              <div style={{ fontSize: "11px", fontWeight: 700, color: weightChange <= 0 ? "var(--success)" : "var(--danger)", background: weightChange <= 0 ? "#f0fdf4" : "#fef2f2", padding: "10px 12px", borderRadius: "12px", border: weightChange <= 0 ? "1px solid #bbf7d0" : "1px solid #fecaca" }}>
                {weightChange < 0 ? \`Great progress! You lost \${Math.abs(weightChange)} kg in recent days.\` : weightChange === 0 ? "Weight maintained! Keeping up steady progress." : \`Weight increased by \${weightChange} kg. Stick to your active calorie target.\`}
              </div>
            </div>`;

if (code.includes('Your Weight Trend')) {
  // Direct block replacement around Your Weight Trend card
  const startIndex = code.indexOf('{/* 1. VISUAL WEIGHT TREND CHART CARD */}');
  const endIndex = code.indexOf('{/* 2. LOG NEW WEIGHT CARD */}');
  
  if (startIndex !== -1 && endIndex !== -1) {
    code = code.substring(0, startIndex) + newTrendCard + "\n\n            " + code.substring(endIndex);
  }
}

fs.writeFileSync('src/App.jsx', code);
console.log('✅ Dynamic multi-bar weight trend chart successfully applied!');
