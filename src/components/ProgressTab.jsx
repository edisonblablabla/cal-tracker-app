import React from "react";

export default function ProgressTab({
  appData,
  currentWeight,
  newLogWeight,
  setNewLogWeight,
  handleUpdateWeight,
  isUpdatingWeight,
  bmiScore,
  bmiCategory,
  bmiColor,
  bmiBarPct,
  estimatedWaterLiters,
  trendMessage,
  badgeStyle
}) {
  const todayShort = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const rawLogs = (Array.isArray(appData?.weightHistory) && appData.weightHistory.length > 0) 
    ? appData.weightHistory 
    : [{ val: currentWeight, date: todayShort }];

  const logs = rawLogs.map(item => typeof item === "object" ? item : { val: item, date: "Prev" });
  const valList = logs.map(l => l.val);
  const minW = Math.min(...valList) - 2;
  const maxW = Math.max(...valList) + 2;
  const range = (maxW - minW) || 1;

  return (
    <div className="screen active">
      <h3 style={{ fontSize: "18px", fontWeight: 800, textAlign: "center", marginBottom: "14px" }}>Weight & Health Progress</h3>
      
      <div className="card" style={{ padding: "16px", borderRadius: "20px", marginBottom: "16px" }}>
        <div style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a", marginBottom: "12px" }}>Your Weight Trend (Last 5 Logs)</div>
        
        <div style={{ background: "#f8fafc", padding: "16px 12px 12px 12px", borderRadius: "16px", border: "1px solid #e2e8f0", marginBottom: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-around", alignItems: "flex-end", height: "95px", paddingBottom: "8px", borderBottom: "2px solid #cbd5e1", gap: "6px" }}>
            {logs.map((item, idx) => {
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
            })}
          </div>

          {(!appData?.weightHistory || appData.weightHistory.length <= 1) && (
            <div style={{ fontSize: "10px", color: "#64748b", textAlign: "center", marginTop: "8px", fontWeight: 600 }}>
              Initial weight baseline recorded. Log new weight updates below to build your 5-entry trend chart!
            </div>
          )}
        </div>

        <div style={{ fontSize: "11px", fontWeight: 700, padding: "10px 12px", borderRadius: "12px", lineHeight: 1.4, ...badgeStyle }}>
          {trendMessage}
        </div>
      </div>

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
          <strong>Status Tip:</strong> {parseFloat(bmiScore) < 18.5 ? "Slightly underweight. Consider adding nutrient-dense meals to your daily routine." : parseFloat(bmiScore) <= 24.9 ? "You are in a healthy BMI range! Maintain your current balanced lifestyle." : "Above recommended BMI range. Stick to your active calorie deficit plan for steady results."}
        </div>
      </div>

      <div className="card" style={{ padding: "16px", borderRadius: "20px" }}>
        <div style={{ fontSize: "13px", fontWeight: 800, marginBottom: "10px" }}>Unlocked Achievements</div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <div style={{ background: "#f1f5f9", padding: "6px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, color: "var(--primary)" }}><i className="fa-solid fa-fire"></i> {appData?.streakDays || 1}-Day Streak</div>
          <div style={{ background: "#f1f5f9", padding: "6px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, color: "var(--water)" }}><i className="fa-solid fa-droplet"></i> Hydration Target ({estimatedWaterLiters}L)</div>
        </div>
      </div>
    </div>
  );
}
