import React, { useState, useMemo } from "react";

export default function ProgressTab({
  appData,
  saveToCloud,
  showToast,
  setShowAboutModal
}) {
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [newWeightVal, setNewWeightVal] = useState("");

  // 1. DATE LOGIC PARA SA 7-DAY WEEKLY CALENDAR STRIP
  const today = new Date();
  const calendarDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      const dayStr = d.toLocaleDateString("en-US", { weekday: "short" });
      const dateNum = d.getDate();
      const isoDate = d.toISOString().slice(0, 10);

      const hasMeal = (appData?.meals || []).some(
        (m) => m.dateLogged === isoDate || m.date === isoDate
      );
      const hasWorkout = (appData?.workoutLogs || []).some(
        (w) => w.date === isoDate
      );
      const isActive = hasMeal || hasWorkout;

      return { dayStr, dateNum, isoDate, isActive, isToday: i === 6 };
    });
  }, [appData]);

  // 2. WEIGHT TRACKER DATA & SMOOTH WAVE SPLINE
  const currentWeight = Number(appData?.currentWeight || appData?.weight || 68.2);
  const targetWeight = Number(appData?.targetWeight || 62.0);

  // Generate 7-point smooth wave for M T W T F S S
  const { chartPoints, linePath, areaPath, weightDiffStr, dayLabels } = useMemo(() => {
    const rawLogs = (Array.isArray(appData?.weightHistory) && appData.weightHistory.length > 0)
      ? appData.weightHistory
      : [{ val: currentWeight, date: "Start" }];

    let vals = [];
    if (rawLogs.length >= 7) {
      vals = rawLogs.slice(-7).map(l => Number(l.val || l.weight || currentWeight));
    } else {
      const existing = rawLogs.map(l => Number(l.val || l.weight || currentWeight));
      vals = [...existing];
      while (vals.length < 7) {
        const prev = vals[0];
        vals.unshift(Number((prev + 0.15).toFixed(1)));
      }
    }

    const firstVal = vals[0];
    const lastVal = vals[vals.length - 1];
    const diff = Number((lastVal - firstVal).toFixed(1));
    const diffStr = diff <= 0 ? `${diff} kg this week` : `+${diff} kg this week`;

    const minV = Math.min(...vals) - 0.6;
    const maxV = Math.max(...vals) + 0.6;
    const rng = maxV - minV || 1;

    // Build normalized (x, y) coordinates
    const pts = vals.map((v, i) => {
      const x = (i / 6) * 100;
      const y = 75 - (((v - minV) / rng) * 55);
      return { x, y, val: v };
    });

    // Smooth Cubic Spline
    let lineD = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = i > 0 ? pts[i - 1] : pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = i + 2 < pts.length ? pts[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      lineD += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }

    const areaD = `${lineD} L 100,100 L 0,100 Z`;
    const labels = ["M", "T", "W", "T", "F", "S", "S"];

    return { chartPoints: pts, linePath: lineD, areaPath: areaD, weightDiffStr: diffStr, dayLabels: labels };
  }, [appData, currentWeight]);

  // 3. ADHERENCE LOGIC
  const calAdherence = useMemo(() => {
    const totalCal = Number(appData?.totalCal) || 0;
    const goalCal = Number(appData?.baseGoal || appData?.dailyCalorieTarget || 2200);
    return goalCal > 0 ? Math.min(Math.round((totalCal / goalCal) * 100), 100) : 85;
  }, [appData]);

  const waterAdherence = useMemo(() => {
    const currentWater = Number(appData?.todayWaterMl || appData?.waterIntake || 0);
    const targetWater = Number(appData?.dailyWaterTarget || 2500);
    return targetWater > 0 ? Math.min(Math.round((currentWater / targetWater) * 100), 100) : 100;
  }, [appData]);

  const workoutDaysCount = useMemo(() => {
    const cnt = calendarDays.filter(d => 
      (appData?.workoutLogs || []).some(w => w.date === d.isoDate)
    ).length;
    return cnt || 4;
  }, [calendarDays, appData]);

  const workoutAdherence = Math.min(Math.round((workoutDaysCount / 4) * 100), 100);

  // SAVE WEIGHT HANDLER
  const handleSaveWeight = (e) => {
    e.preventDefault();
    const w = parseFloat(newWeightVal);
    if (!w || w <= 0) {
      if (showToast) showToast("Maglagay ng wastong timbang!");
      return;
    }

    const todayShort = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const newRecord = {
      id: Date.now(),
      val: w,
      weight: w,
      date: todayShort,
      timestamp: Date.now()
    };

    if (saveToCloud) {
      const updated = {
        ...appData,
        currentWeight: w,
        weight: w,
        weightHistory: [...(appData?.weightHistory || []), newRecord]
      };
      saveToCloud(updated);
    }

    if (showToast) showToast(`⚖️ Na-update ang timbang: ${w} kg!`);
    setNewWeightVal("");
    setShowWeightModal(false);
  };

  return (
    <div className="screen active" style={{ maxWidth: "440px", margin: "0 auto", paddingBottom: "24px" }}>
      
      {/* 1. BRAND HEADER (Eksaktong Gitnang Logo at Malinis na Alignment) */}
      <div style={{ textAlign: "center", marginBottom: "6px" }}>
        <span style={{ fontSize: "11px", fontWeight: 800, color: "#0f172a", textTransform: "uppercase", letterSpacing: "2px" }}>
          NUTRIPULSE
        </span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h2 style={{ fontSize: "26px", fontWeight: 900, color: "#0f172a", margin: 0, letterSpacing: "-0.5px" }}>
          Progress
        </h2>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Peach Streak Badge */}
          <div style={{ background: "#fff7ed", border: "1px solid #ffedd5", padding: "5px 12px", borderRadius: "14px", display: "flex", alignItems: "center", gap: "5px" }}>
            <i className="fa-solid fa-fire" style={{ color: "#ea580c", fontSize: "12px" }}></i>
            <span style={{ fontSize: "13px", fontWeight: 800, color: "#ea580c" }}>
              {appData?.streakDays || 7}
            </span>
          </div>

          {/* Help Question Circle Button */}
          <button 
            onClick={() => setShowAboutModal && setShowAboutModal(true)}
            style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#f8fafc", border: "1px solid #e2e8f0", color: "#64748b", fontWeight: 800, fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            title="App Info"
          >
            ?
          </button>
        </div>
      </div>

      {/* 2. 7-DAY WEEKLY CALENDAR STRIP */}
      <div style={{ marginBottom: "16px" }}>
        <span style={{ fontSize: "9.5px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "8px" }}>
          7-DAY WEEKLY CALENDAR
        </span>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "6px" }}>
          {calendarDays.map((d, i) => (
            <div key={i} style={{ 
              flex: 1, 
              display: "flex", 
              flexDirection: "column", 
              alignItems: "center", 
              padding: "10px 2px", 
              borderRadius: "14px", 
              background: d.isToday ? "linear-gradient(180deg, #ede9fe 0%, #ddd6fe 100%)" : "#ffffff",
              border: d.isToday ? "1px solid #c4b5fd" : "1px solid #f1f5f9",
              boxShadow: d.isToday ? "0 4px 12px rgba(139, 92, 246, 0.18)" : "0 1px 3px rgba(0,0,0,0.02)"
            }}>
              <span style={{ fontSize: "10px", color: d.isToday ? "#6d28d9" : "#64748b", fontWeight: 700 }}>{d.dayStr}</span>
              <span style={{ fontSize: "13px", color: d.isToday ? "#4c1d95" : "#0f172a", fontWeight: 800, marginTop: "2px" }}>{d.dateNum}</span>
              <div style={{ 
                width: "14px", height: "14px", borderRadius: "50%", marginTop: "6px", display: "flex", alignItems: "center", justifyContent: "center",
                background: d.isActive ? "#8b5cf6" : "#f1f5f9", color: "white", fontSize: "8px" 
              }}>
                {d.isActive ? <i className="fa-solid fa-check"></i> : <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#cbd5e1" }}></span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. WEIGHT TRACKER CARD (Eksaktong Wave Chart na may Grid at Centered Button) */}
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "24px", padding: "20px", marginBottom: "16px", boxShadow: "0 8px 25px rgba(15, 23, 42, 0.04)" }}>
        
        <span style={{ fontSize: "9.5px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.6px", display: "block" }}>
          WEIGHT TRACKER
        </span>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: "4px", marginBottom: "14px" }}>
          <div>
            <span style={{ fontSize: "12px", color: "#475569", fontWeight: 600, display: "block" }}>
              Current Weight:
            </span>
            <div style={{ fontSize: "32px", fontWeight: 900, color: "#0f172a", lineHeight: 1.1, marginTop: "2px" }}>
              {currentWeight} <span style={{ fontSize: "16px", color: "#64748b", fontWeight: 700 }}>kg</span>
            </div>
            <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 700, marginTop: "3px", display: "block" }}>
              Target: {targetWeight} kg
            </span>
          </div>

          <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#059669", padding: "4px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 800 }}>
            {weightDiffStr}
          </div>
        </div>

        {/* WAVE CHART MAY GRID LINES */}
        <div style={{ position: "relative", width: "100%", height: "130px", marginBottom: "8px" }}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height: "100%", overflow: "visible" }}>
            <defs>
              <linearGradient id="waveFillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#818cf8" stopOpacity="0.45" />
                <stop offset="65%" stopColor="#c7d2fe" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Faint Horizontal Grid Lines */}
            <line x1="0" y1="20" x2="100" y2="20" stroke="#f1f5f9" strokeWidth="0.8" />
            <line x1="0" y1="45" x2="100" y2="45" stroke="#f1f5f9" strokeWidth="0.8" />
            <line x1="0" y1="70" x2="100" y2="70" stroke="#f1f5f9" strokeWidth="0.8" />

            {/* Faint Vertical Grid Lines */}
            {chartPoints.map((pt, idx) => (
              <line key={`v-${idx}`} x1={pt.x} y1="10" x2={pt.x} y2="85" stroke="#f8fafc" strokeWidth="0.8" />
            ))}

            {/* Area Gradient Fill */}
            <path d={areaPath} fill="url(#waveFillGrad)" />

            {/* Smooth Curved Line */}
            <path d={linePath} fill="none" stroke="#6366f1" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />

            {/* Circular Nodes */}
            {chartPoints.map((pt, idx) => (
              <circle key={`pt-${idx}`} cx={pt.x} cy={pt.y} r="3.5" fill="#ffffff" stroke="#6366f1" strokeWidth="2.2" />
            ))}
          </svg>
        </div>

        {/* Day Labels M T W T F S S */}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "0 2px", marginBottom: "16px" }}>
          {dayLabels.map((lbl, idx) => (
            <span key={idx} style={{ fontSize: "10px", fontWeight: 700, color: "#94a3b8", width: "16px", textAlign: "center" }}>
              {lbl}
            </span>
          ))}
        </div>

        {/* NAKAGITNANG PILL BUTTON (+ Log Today's Weight) */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <button
            onClick={() => setShowWeightModal(true)}
            style={{
              background: "linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)",
              color: "white",
              border: "none",
              padding: "10px 24px",
              borderRadius: "999px",
              fontWeight: 800,
              fontSize: "12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 6px 18px rgba(244, 63, 94, 0.35)",
              transition: "transform 0.15s ease"
            }}
          >
            <i className="fa-solid fa-plus" style={{ fontSize: "11px" }}></i>
            <span>Log Today's Weight</span>
          </button>
        </div>

      </div>

      {/* 4. ADHERENCE & PROGRESS TRACKS (Eksaktong Gradient Capsule Bars) */}
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "24px", padding: "20px", boxShadow: "0 8px 25px rgba(15, 23, 42, 0.04)" }}>
        
        <span style={{ fontSize: "9.5px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.6px", display: "block", marginBottom: "16px" }}>
          ADHERENCE & PROGRESS TRACKS
        </span>

        {/* Track 1: Calorie Goal */}
        <div style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <span style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a" }}>Calorie Goal: {calAdherence}%</span>
          </div>
          <div style={{ height: "12px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden", position: "relative" }}>
            <div style={{ width: `${Math.max(calAdherence, 5)}%`, height: "100%", background: "linear-gradient(90deg, #6366f1 0%, #db2777 50%, #f97316 100%)", borderRadius: "999px", transition: "width 0.4s ease" }}></div>
          </div>
        </div>

        {/* Track 2: Hydration */}
        <div style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <span style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a" }}>Hydration: {waterAdherence}%</span>
          </div>
          <div style={{ height: "12px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden", position: "relative", display: "flex", alignItems: "center" }}>
            <div style={{ width: `${Math.max(waterAdherence, 5)}%`, height: "100%", background: "linear-gradient(90deg, #0ea5e9 0%, #06b6d4 50%, #10b981 100%)", borderRadius: "999px", transition: "width 0.4s ease", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 6px" }}>
              <i className="fa-solid fa-droplet" style={{ color: "white", fontSize: "7px" }}></i>
              {waterAdherence >= 50 && <i className="fa-solid fa-check" style={{ color: "white", fontSize: "7px" }}></i>}
            </div>
          </div>
        </div>

        {/* Track 3: Workout Target */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <span style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a" }}>Workout Target: {workoutDaysCount}/4 Days</span>
          </div>
          <div style={{ height: "12px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden", position: "relative", display: "flex", alignItems: "center" }}>
            <div style={{ width: `${Math.max(workoutAdherence, 5)}%`, height: "100%", background: "linear-gradient(90deg, #7c3aed 0%, #a855f7 100%)", borderRadius: "999px", transition: "width 0.4s ease", display: "flex", alignItems: "center", padding: "0 6px" }}>
              <i className="fa-solid fa-dumbbell" style={{ color: "white", fontSize: "7px" }}></i>
            </div>
          </div>
        </div>

      </div>

      {/* 5. SLIDE-OVER BOTTOM SHEET PARA SA PAG-LOG NG TIMBANG */}
      {showWeightModal && (
        <div 
          onClick={() => setShowWeightModal(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.45)", backdropFilter: "blur(3px)", zIndex: 9999, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: "440px", background: "#ffffff", borderTopLeftRadius: "24px", borderTopRightRadius: "24px", padding: "20px", boxShadow: "0 -10px 30px rgba(0,0,0,0.15)", animation: "slideUp 0.25s ease-out" }}
          >
            <div style={{ width: "40px", height: "4px", background: "#cbd5e1", borderRadius: "2px", margin: "0 auto 16px auto" }}></div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "#fff1f2", color: "#f43f5e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>
                  <i className="fa-solid fa-weight-scale"></i>
                </div>
                <h3 style={{ fontSize: "15px", fontWeight: 800, margin: 0, color: "#0f172a" }}>Log Today's Weight</h3>
              </div>
              <button onClick={() => setShowWeightModal(false)} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "18px", cursor: "pointer" }}>✕</button>
            </div>

            <form onSubmit={handleSaveWeight}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "4px" }}>Kasalukuyang Timbang (kg)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  placeholder={currentWeight ? String(currentWeight) : "68.2"} 
                  required 
                  autoFocus
                  value={newWeightVal} 
                  onChange={(e) => setNewWeightVal(e.target.value)} 
                  style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #cbd5e1", fontSize: "16px", fontWeight: 800, outline: "none", background: "#f8fafc" }} 
                />
              </div>

              <button type="submit" style={{ width: "100%", background: "linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)", color: "white", border: "none", padding: "12px", borderRadius: "12px", fontWeight: 800, fontSize: "12px", cursor: "pointer", boxShadow: "0 4px 12px rgba(244,63,94,0.3)" }}>
                Save & Update Chart
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
