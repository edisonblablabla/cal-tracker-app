import React, { useState } from "react";

export default function ProgressTab({ appData, saveToCloud, showToast }) {
  // 1. DATE LOGIC PARA SA CALENDAR STRIP (Huling 7 Araw)
  const today = new Date();
  const calendarDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const dayStr = d.toLocaleDateString("en-US", { weekday: "short" });
    const dateNum = d.getDate();
    const isoDate = d.toISOString().slice(0, 10);
    
    // Alamin kung active ang araw (may na-log na pagkain o workout)
    const hasMeal = (appData?.meals || []).some(m => m.dateLogged === isoDate || m.date === isoDate);
    const hasWorkout = (appData?.workoutLogs || []).some(w => w.date === isoDate);
    const isActive = hasMeal || hasWorkout;

    return { dayStr, dateNum, isoDate, isActive, isToday: i === 6 };
  });

  // 2. WEIGHT TREND LOGIC PARA SA CHART
  const rawLogs = Array.isArray(appData?.weightHistory) && appData.weightHistory.length > 0 
    ? appData.weightHistory 
    : [{ val: appData?.currentWeight || 65, date: "Start" }];
    
  // Kunin lamang ang huling 7 logs para sa graph
  const recentWeights = rawLogs.slice(-7);
  const currentWeight = recentWeights[recentWeights.length - 1]?.val || 0;
  const startWeight = rawLogs[0]?.val || currentWeight;
  const targetWeight = Number(appData?.targetWeight) || (currentWeight > 60 ? 60 : 75);
  
  // Weight Loss/Gain this week
  const weekStartWeight = recentWeights[0]?.val || currentWeight;
  const diffWeek = (currentWeight - weekStartWeight).toFixed(1);
  const diffBadgeColor = diffWeek <= 0 ? "#10b981" : "#f43f5e"; // Green if lost/maintained, Red if gained

  // Simpleng SVG Line Graph Calculation
  const minW = Math.min(...recentWeights.map(w => w.val)) - 2;
  const maxW = Math.max(...recentWeights.map(w => w.val)) + 2;
  const range = maxW - minW || 1;
  const wPoints = recentWeights.map((w, i) => {
    const x = (i / Math.max(recentWeights.length - 1, 1)) * 100;
    const y = 100 - (((w.val - minW) / range) * 100);
    return `${x},${y}`;
  }).join(" ");

  // 3. ADHERENCE LOGIC (Porsyento ng Goal)
  // A. Calorie Goal
  const totalCal = Number(appData?.totalCal) || 0;
  const goalCal = Number(appData?.baseGoal) || 2200;
  const calAdherence = goalCal > 0 ? Math.min(Math.round((totalCal / goalCal) * 100), 100) : 0;

  // B. Hydration
  const currentWater = Number(appData?.todayWaterMl) || 0;
  const targetWater = Number(appData?.dailyWaterTarget) || 2500;
  const waterAdherence = Math.min(Math.round((currentWater / targetWater) * 100), 100);

  // C. Workout (Simpleng bilang kung ilang araw nag-workout this week)
  const activeWorkoutDays = calendarDays.filter(d => 
    (appData?.workoutLogs || []).some(w => w.date === d.isoDate)
  ).length;
  const workoutTargetDays = 4; // Target na 4 araw
  const workoutAdherence = Math.min(Math.round((activeWorkoutDays / workoutTargetDays) * 100), 100);

  // In-tab Weight Input State
  const [quickWeightKg, setQuickWeightKg] = useState("");

  const handleLogWeight = () => {
    const w = parseFloat(quickWeightKg);
    if (!w || w <= 0) {
      if (showToast) showToast("Maglagay ng wastong timbang!");
      return;
    }
    const todayShort = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const newRecord = { id: Date.now(), val: w, weight: w, date: todayShort, timestamp: Date.now() };

    if (saveToCloud) {
      const updated = {
        ...appData,
        currentWeight: w,
        weightHistory: [...(appData?.weightHistory || []), newRecord]
      };
      saveToCloud(updated);
    }
    if (showToast) showToast(`⚖️ Na-update ang timbang: ${w} kg`);
    setQuickWeightKg("");
  };

  return (
    <div className="screen active" style={{ maxWidth: "440px", margin: "0 auto", paddingBottom: "24px" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <div>
          <span style={{ fontSize: "10px", fontWeight: 800, color: "#6366f1", textTransform: "uppercase", letterSpacing: "1px", display: "block" }}>
            NUTRIPULSE
          </span>
          <h2 style={{ fontSize: "18px", fontWeight: 900, color: "#0f172a", margin: "2px 0 0 0", letterSpacing: "-0.3px" }}>
            Progress
          </h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ background: "#fff7ed", border: "1px solid #ffedd5", padding: "4px 8px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 800, color: "#ea580c" }}>
            <span>🔥 {appData?.streakDays || 1}d</span>
          </div>
          <button style={{ width: "26px", height: "26px", borderRadius: "8px", background: "#f1f5f9", border: "none", color: "#64748b", fontWeight: 800, fontSize: "12px" }}>?</button>
        </div>
      </div>

      {/* 1. 7-DAY WEEKLY CALENDAR STRIP */}
      <div style={{ marginBottom: "16px" }}>
        <span style={{ fontSize: "9px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "8px" }}>
          7-DAY WEEKLY CALENDAR
        </span>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "6px" }}>
          {calendarDays.map((d, i) => (
            <div key={i} style={{ 
              flex: 1, 
              display: "flex", 
              flexDirection: "column", 
              alignItems: "center", 
              padding: "8px 0", 
              borderRadius: "14px", 
              background: d.isToday ? "#e0e7ff" : "#f8fafc",
              border: d.isToday ? "1px solid #c7d2fe" : "1px solid #f1f5f9",
              boxShadow: d.isToday ? "0 2px 6px rgba(99, 102, 241, 0.15)" : "none"
            }}>
              <span style={{ fontSize: "10px", color: d.isToday ? "#4f46e5" : "#64748b", fontWeight: 600 }}>{d.dayStr}</span>
              <span style={{ fontSize: "13px", color: d.isToday ? "#1e1b4b" : "#0f172a", fontWeight: 800, marginTop: "2px" }}>{d.dateNum}</span>
              <div style={{ 
                width: "12px", height: "12px", borderRadius: "50%", marginTop: "6px", display: "flex", alignItems: "center", justifyContent: "center",
                background: d.isActive ? "#8b5cf6" : "#e2e8f0", color: "white", fontSize: "7px" 
              }}>
                {d.isActive ? <i className="fa-solid fa-check"></i> : ""}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. WEIGHT TRACKER CARD WITH WAVE CHART */}
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "20px", padding: "18px", marginBottom: "16px", boxShadow: "0 4px 12px rgba(15, 23, 42, 0.04)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div>
            <span style={{ fontSize: "9px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              WEIGHT TRACKER
            </span>
            <div style={{ marginTop: "4px" }}>
              <span style={{ fontSize: "28px", fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>{currentWeight} <span style={{ fontSize: "14px", color: "#64748b" }}>kg</span></span>
            </div>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "#64748b" }}>Target: {targetWeight} kg</span>
          </div>
          <div style={{ background: `${diffBadgeColor}15`, color: diffBadgeColor, padding: "4px 8px", borderRadius: "8px", fontSize: "10px", fontWeight: 800 }}>
            {diffWeek > 0 ? "+" : ""}{diffWeek} kg this week
          </div>
        </div>

        {/* SVG Wave Line Chart */}
        <div style={{ position: "relative", height: "80px", width: "100%", marginBottom: "16px", borderBottom: "1px solid #f1f5f9" }}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height: "100%", overflow: "visible" }}>
            <defs>
              <linearGradient id="waveGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <polyline fill="url(#waveGrad)" stroke="none" points={`0,100 ${wPoints} 100,100`} />
            <polyline fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinejoin="round" points={wPoints} />
            {/* Draw data points */}
            {recentWeights.map((w, i) => {
              const x = (i / Math.max(recentWeights.length - 1, 1)) * 100;
              const y = 100 - (((w.val - minW) / range) * 100);
              return <circle key={i} cx={x} cy={y} r="3" fill="#ffffff" stroke="#8b5cf6" strokeWidth="2" />;
            })}
          </svg>
          {/* Day Labels Below Chart */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px", color: "#94a3b8", fontSize: "9px", fontWeight: 600 }}>
            {recentWeights.map((w, i) => (
              <span key={i}>{w.date.split(" ")[0]}</span>
            ))}
          </div>
        </div>

        {/* Action Button: Log Today's Weight */}
        <div style={{ display: "flex", gap: "8px" }}>
          <input 
            type="number" 
            placeholder="e.g. 68.5" 
            value={quickWeightKg} 
            onChange={(e) => setQuickWeightKg(e.target.value)} 
            style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "12px", outline: "none", background: "#f8fafc" }} 
          />
          <button 
            onClick={handleLogWeight}
            style={{ flex: 1, background: "#f43f5e", color: "white", border: "none", padding: "10px", borderRadius: "10px", fontWeight: 800, fontSize: "11px", cursor: "pointer", boxShadow: "0 4px 10px rgba(244,63,94,0.2)" }}
          >
            + Log Today's Weight
          </button>
        </div>
      </div>

      {/* 3. ADHERENCE & PROGRESS TRACKS */}
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "20px", padding: "18px", boxShadow: "0 4px 12px rgba(15, 23, 42, 0.04)" }}>
        <span style={{ fontSize: "9px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "16px" }}>
          ADHERENCE & PROGRESS TRACKS
        </span>

        {/* Calorie Goal Track */}
        <div style={{ marginBottom: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#0f172a" }}>Calorie Goal: {calAdherence}%</span>
          </div>
          <div style={{ height: "10px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
            <div style={{ width: `${calAdherence}%`, height: "100%", background: "linear-gradient(90deg, #ec4899, #f97316)", borderRadius: "999px" }}></div>
          </div>
        </div>

        {/* Hydration Goal Track */}
        <div style={{ marginBottom: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#0f172a" }}>Hydration: {waterAdherence}%</span>
          </div>
          <div style={{ height: "10px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
            <div style={{ width: `${waterAdherence}%`, height: "100%", background: "linear-gradient(90deg, #38bdf8, #06b6d4)", borderRadius: "999px" }}></div>
          </div>
        </div>

        {/* Workout Target Track */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#0f172a" }}>Workout Target: {activeWorkoutDays}/{workoutTargetDays} Days</span>
          </div>
          <div style={{ height: "10px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
            <div style={{ width: `${workoutAdherence}%`, height: "100%", background: "linear-gradient(90deg, #8b5cf6, #6366f1)", borderRadius: "999px" }}></div>
          </div>
        </div>

      </div>

    </div>
  );
}
