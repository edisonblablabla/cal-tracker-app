import React from "react";
import MapTracker from "./MapTracker";
import { WORKOUT_ACTIVITIES } from "../constants/data";

export default function HomeTab({
  appData,
  activeTab,
  setShowAboutModal,
  quote,
  shuffleQuote,
  totalCal,
  activeGoal,
  totalP,
  totalC,
  totalF,
  strokeOffset,
  pct,
  saveToCloud,
  showToast,
  selectedActivity,
  setSelectedActivity,
  workoutDuration,
  handleSetWorkoutTarget,
  timerMinDisplay,
  timerSecDisplay,
  estimatedWorkoutBurn,
  isTimerRunning,
  startTimer,
  pauseTimer,
  finishWorkoutSession
}) {
  return (
    <div className="screen active">
      {/* HEADER GREETING */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", gap: "8px" }}>
        <div style={{ minWidth: 0, flex: 1, display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "linear-gradient(135deg, #4f46e5, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "11px", boxShadow: "0 2px 6px rgba(79,70,229,0.3)", flexShrink: 0 }}>
            <i className="fa-solid fa-heart-pulse"></i>
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <span style={{ fontSize: "9px", fontWeight: 800, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", lineHeight: 1 }}>NUTRIPULSE</span>
            <h2 style={{ 
              fontSize: "14px", 
              fontWeight: 900, 
              margin: 0, 
              lineHeight: 1.2, 
              color: "#0f172a",
              whiteSpace: "nowrap", 
              overflow: "hidden", 
              textOverflow: "ellipsis" 
            }}>
              Hey, {appData?.userName || "Athlete"}! 
            </h2>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "5px", flexShrink: 0 }}>
          <div className="streak-badge" style={{ padding: "4px 8px", fontSize: "10px" }}><i className="fa-solid fa-fire"></i> <span>{appData?.streakDays || 1}</span>d</div>
          <button onClick={() => setShowAboutModal(true)} style={{ background: "#e0e7ff", border: "none", color: "var(--primary)", borderRadius: "8px", width: "26px", height: "26px", fontWeight: 900, cursor: "pointer", fontSize: "11px" }}>?</button>
        </div>
      </div>

      {/* DAILY MOTIVATION */}
      <div className="motivation-card" onClick={shuffleQuote} style={{ cursor: "pointer", padding: "8px 12px", marginBottom: "12px", borderRadius: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
          <span style={{ fontSize: "9px", textTransform: "uppercase", opacity: 0.7, fontWeight: 800 }}>Daily Motivation</span>
          <i className="fa-solid fa-rotate" style={{ fontSize: "10px", opacity: 0.6 }}></i>
        </div>
        <div style={{ fontSize: "11px", fontWeight: 700, lineHeight: 1.3 }}>"{quote}"</div>
      </div>

      {/* DAILY CALORIE MONITORING CIRCLE */}
      <div className="card" style={{ padding: "16px", borderRadius: "20px", marginBottom: "14px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#ffffff", boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: "10px", fontWeight: 800, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Daily Intake</span>
          <h3 style={{ fontSize: "22px", fontWeight: 900, color: "#0f172a", margin: "2px 0 4px 0" }}>
            {totalCal} <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>/ {activeGoal} kcal</span>
          </h3>
          <div style={{ display: "flex", gap: "10px", fontSize: "10px", color: "#64748b", fontWeight: 700 }}>
            <span>P: <strong style={{ color: "#0f172a" }}>{totalP}g</strong></span>
            <span>C: <strong style={{ color: "#0f172a" }}>{totalC}g</strong></span>
            <span>F: <strong style={{ color: "#0f172a" }}>{totalF}g</strong></span>
          </div>
        </div>

        {/* CIRCULAR PROGRESS RING */}
        <div style={{ position: "relative", width: "72px", height: "72px", flexShrink: 0 }}>
          <svg width="72" height="72" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="50" cy="50" r="45" stroke="#f1f5f9" strokeWidth="10" fill="transparent" />
            <circle 
              cx="50" 
              cy="50" 
              r="45" 
              stroke="var(--primary)" 
              strokeWidth="10" 
              strokeDasharray="283" 
              strokeDashoffset={strokeOffset} 
              strokeLinecap="round" 
              fill="transparent" 
              style={{ transition: "stroke-dashoffset 0.5s ease" }}
            />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 900, color: "var(--primary)" }}>
            {pct}%
          </div>
        </div>
      </div>

      {/* GPS MAP TRACKER */}
      <MapTracker
        activeTab={activeTab}
        appData={appData}
        saveToCloud={saveToCloud}
        showToast={showToast}
      />

      {/* WORKOUT COUNTDOWN TIMER */}
      <div className="card" style={{ padding: "16px", borderRadius: "20px", background: "linear-gradient(135deg, #0f172a, #1e293b)", color: "white", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <i className="fa-solid fa-stopwatch" style={{ fontSize: "18px", color: "#38bdf8" }}></i>
          <h4 style={{ fontSize: "15px", fontWeight: 800 }}>Workout Countdown Timer</h4>
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700, display: "block", marginBottom: "4px" }}>Select Activity</label>
          <select 
            value={selectedActivity} 
            onChange={e => setSelectedActivity(e.target.value)}
            style={{ width: "100%", background: "#1e293b", border: "1px solid #334155", color: "white", borderRadius: "10px", padding: "8px", fontSize: "11px", fontWeight: 700, outline: "none" }}
          >
            {WORKOUT_ACTIVITIES.map(a => (
              <option key={a.name} value={a.name}>{a.name}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "12px" }}>
          <label style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700, display: "block", marginBottom: "4px" }}>Target Duration (Minutes)</label>
          <input 
            type="number" 
            value={workoutDuration} 
            onChange={e => handleSetWorkoutTarget(e.target.value)}
            style={{ width: "100%", background: "#1e293b", border: "1px solid #334155", color: "white", borderRadius: "10px", padding: "8px", fontSize: "12px", fontWeight: 800, outline: "none" }} 
          />
        </div>

        <div style={{ background: "rgba(255,255,255,0.05)", padding: "14px", borderRadius: "14px", textAlign: "center", border: "1px solid rgba(255,255,255,0.1)", marginBottom: "12px" }}>
          <div style={{ fontSize: "28px", fontWeight: 900, letterSpacing: "2px", color: "#38bdf8", fontFamily: "monospace" }}>
            {timerMinDisplay}:{timerSecDisplay}
          </div>
          <div style={{ fontSize: "11px", color: "#f59e0b", fontWeight: 800, marginTop: "4px" }}>
            Est. Burn: {estimatedWorkoutBurn} kcal
          </div>

          <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginTop: "12px" }}>
            {!isTimerRunning ? (
              <button onClick={startTimer} style={{ background: "#10b981", color: "white", border: "none", padding: "8px 16px", borderRadius: "10px", fontWeight: 800, fontSize: "11px", cursor: "pointer" }}>
                Start Timer
              </button>
            ) : (
              <button onClick={pauseTimer} style={{ background: "#f59e0b", color: "white", border: "none", padding: "8px 16px", borderRadius: "10px", fontWeight: 800, fontSize: "11px", cursor: "pointer" }}>
                Pause
              </button>
            )}
            <button onClick={finishWorkoutSession} style={{ background: "#38bdf8", color: "#0f172a", border: "none", padding: "8px 16px", borderRadius: "10px", fontWeight: 800, fontSize: "11px", cursor: "pointer" }}>
              Finish & Log
            </button>
          </div>
        </div>

        {(appData?.todayBurnedCal || 0) > 0 && (
          <div style={{ fontSize: "10px", color: "#10b981", fontWeight: 800, textAlign: "center" }}>
            Total Active Workout Burn Today: {appData.todayBurnedCal} kcal
          </div>
        )}
      </div>
    </div>
  );
}
