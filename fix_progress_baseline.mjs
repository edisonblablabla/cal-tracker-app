import fs from 'fs';

let code = fs.readFileSync('src/App.jsx', 'utf8');

// Linisin ang hidden space characters
code = code.replace(/[\u00a0\xa0]/g, ' ');

// Target biological exact Progress Tab Screen replacement
const oldProgressTab = /{activeTab === "progress" && \([\s\S]*?\)\s*}/;

const cleanProgressTab = `{activeTab === "progress" && (
          <div className="screen active">
            <h3 style={{ fontSize: "18px", fontWeight: 800, textAlign: "center", marginBottom: "14px" }}>Weight & Health Progress</h3>
            
            {/* 1. VISUAL WEIGHT TREND CHART CARD */}
            <div className="card" style={{ padding: "16px", borderRadius: "20px", marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a", marginBottom: "12px" }}>Your Weight Trend</div>
              
              <div style={{ background: "#f8fafc", padding: "16px 12px 12px 12px", borderRadius: "16px", border: "1px solid #e2e8f0", marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-around", alignItems: "flex-end", height: "80px", paddingBottom: "8px", borderBottom: "2px solid #cbd5e1" }}>
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
                </div>

                {(!appData.prevWeight || appData.prevWeight === currentWeight) && (
                  <div style={{ fontSize: "10px", color: "#64748b", textAlign: "center", marginTop: "8px", fontWeight: 600 }}>
                    📍 Initial weight baseline recorded. Log new weight updates to track your progression over time!
                  </div>
                )}
              </div>

              <div style={{ fontSize: "11px", fontWeight: 700, color: weightChange <= 0 ? "var(--success)" : "var(--danger)", background: weightChange <= 0 ? "#f0fdf4" : "#fef2f2", padding: "10px 12px", borderRadius: "12px", border: weightChange <= 0 ? "1px solid #bbf7d0" : "1px solid #fecaca" }}>
                {weightChange < 0 ? \`Great progress! You lost \${Math.abs(weightChange)} kg in recent days.\` : weightChange === 0 ? "Weight maintained! Keeping up steady progress." : \`Weight increased by \${weightChange} kg. Stick to your active calorie target.\`}
              </div>
            </div>

            {/* 2. LOG NEW WEIGHT CARD */}
            <div className="card" style={{ padding: "16px", borderRadius: "20px", marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: 800, marginBottom: "8px" }}>Log New Weight Entry</div>
              <div style={{ display: "flex", gap: "8px" }}>
                <input 
                  type="number" 
                  className="form-input" 
                  style={{ marginBottom: 0 }} 
                  placeholder="Enter Weight (kg)" 
                  value={newLogWeight} 
                  onChange={e => setNewLogWeight(e.target.value)} 
                />
                <button className="btn-block" style={{ width: "120px" }} onClick={handleUpdateWeight} disabled={isUpdatingWeight}>
                  {isUpdatingWeight ? "Updating..." : "Update Weight"}
                </button>
              </div>
            </div>

            {/* 3. HEALTH & BMI STATUS SUMMARY */}
            <div className="card" style={{ padding: "16px", borderRadius: "20px", marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: 800, marginBottom: "12px", color: "#0f172a" }}>Health & BMI Status Summary</div>
              
              <div style={{ marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 800, marginBottom: "4px" }}>
                  <span>BMI Score: {bmiScore}</span>
                  <span style={{ color: bmiColor }}>{bmiCategory}</span>
                </div>
                <div style={{ height: "8px", background: "#e2e8f0", borderRadius: "4px", overflow: "hidden", position: "relative" }}>
                  <div style={{ height: "100%", width: bmiBarPct + "%", background: bmiColor, borderRadius: "4px" }}></div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "var(--text-muted)", marginTop: "4px", fontWeight: 700 }}>
                  <span>Underweight</span>
                  <span>Normal</span>
                  <span>Overweight</span>
                  <span>Obese</span>
                </div>
              </div>

              {/* ESTIMATED WATER NEED BADGE */}
              <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", padding: "10px 12px", borderRadius: "12px", marginBottom: "12px" }}>
                <div style={{ fontSize: "11px", fontWeight: 800, color: "#0284c7" }}>
                  <i className="fa-solid fa-droplet" style={{ marginRight: "6px" }}></i> Estimated Daily Water Need
                </div>
                <div style={{ fontSize: "14px", fontWeight: 900, color: "#0369a1", marginTop: "2px" }}>
                  {estimatedWaterLiters} Liters / day
                </div>
                <div style={{ fontSize: "10px", color: "#0284c7", marginTop: "2px" }}>
                  Calculated based on your body weight ({currentWeight} kg).
                </div>
              </div>

              <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: "12px", fontSize: "11px", color: "#334155", lineHeight: 1.5 }}>
                <strong>Status Tip:</strong> {bmiScore < 18.5 ? "Slightly underweight. Consider adding nutrient-dense meals to your daily routine." : bmiScore <= 24.9 ? "You are in a healthy BMI range! Maintain your current balanced lifestyle." : "Above recommended BMI range. Stick to your active calorie deficit plan for steady results."}
              </div>
            </div>

            {/* 4. UNLOCKED ACHIEVEMENTS */}
            <div className="card" style={{ padding: "16px", borderRadius: "20px" }}>
              <div style={{ fontSize: "13px", fontWeight: 800, marginBottom: "10px" }}>Unlocked Achievements</div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <div style={{ background: "#f1f5f9", padding: "6px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, color: "var(--primary)" }}><i className="fa-solid fa-fire"></i> {appData.streakDays || 1}-Day Streak</div>
                <div style={{ background: "#f1f5f9", padding: "6px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, color: "var(--water)" }}><i className="fa-solid fa-droplet"></i> Hydration Target ({estimatedWaterLiters}L)</div>
              </div>
            </div>
          </div>
        )}`;

code = code.replace(oldProgressTab, cleanProgressTab);

fs.writeFileSync('src/App.jsx', code);
console.log('✅ Progress Tab completely overhauled! No more 82kg fake data.');
