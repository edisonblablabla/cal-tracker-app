import React from "react";
import MapTracker from "./MapTracker";
import { WORKOUT_ACTIVITIES } from "../constants/data";

export default function HomeTab({
  appData,
  activeTab,
  setActiveTab,
  setLogPanelCategory,
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", gap: "8px" }}>
        <div style={{ minWidth: 0, flex: 1, display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "linear-gradient(135deg, #4f46e5, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "12px", boxShadow: "0 2px 6px rgba(79,70,229,0.3)", flexShrink: 0 }}>
            <i className="fa-solid fa-heart-pulse"></i>
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <span style={{ fontSize: "9px", fontWeight: 800, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", lineHeight: 1 }}>NUTRIPULSE</span>
            <h2 style={{ 
              fontSize: "15px", 
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
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          <div className="streak-badge" style={{ padding: "4px 8px", fontSize: "10px" }}><i className="fa-solid fa-fire"></i> <span>{appData?.streakDays || 1}</span>d</div>
          <button onClick={() => setShowAboutModal(true)} style={{ background: "#e0e7ff", border: "none", color: "var(--primary)", borderRadius: "8px", width: "26px", height: "26px", fontWeight: 900, cursor: "pointer", fontSize: "11px" }}>?</button>
        </div>
      </div>

      {/* COMPACT DAILY MOTIVATION BANNER */}
      <div 
        onClick={shuffleQuote} 
        style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: "#f8fafc", borderRadius: "14px", marginBottom: "16px", border: "1px solid #e2e8f0" }}
        title="Tap to shuffle daily motivation"
      >
        <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", flexShrink: 0 }}>
          <i className="fa-solid fa-quote-left"></i>
        </div>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "#475569", lineHeight: 1.3, fontStyle: "italic", flex: 1 }}>
          "{quote}"
        </div>
        <i className="fa-solid fa-rotate" style={{ fontSize: "10px", color: "#94a3b8" }}></i>
      </div>

      {/* UNIFIED HERO CARD (INTAKE + PROGRESS RING + BURN) */}
      <div className="card" style={{ padding: "20px", borderRadius: "24px", marginBottom: "16px", background: "#ffffff", boxShadow: "0 8px 24px rgba(0,0,0,0.06)", position: "relative", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: (appData?.todayBurnedCal || 0) > 0 ? "14px" : "0px" }}>
          <div>
            <span style={{ fontSize: "10px", fontWeight: 800, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Daily Intake</span>
            <h3 style={{ fontSize: "26px", fontWeight: 900, color: "#0f172a", margin: "2px 0 6px 0" }}>
              {totalCal} <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>/ {activeGoal} kcal</span>
            </h3>
            <div style={{ display: "flex", gap: "10px", fontSize: "11px", color: "#64748b", fontWeight: 700 }}>
              <span>P: <strong style={{ color: "#0f172a" }}>{totalP}g</strong></span>
              <span>C: <strong style={{ color: "#0f172a" }}>{totalC}g</strong></span>
              <span>F: <strong style={{ color: "#0f172a" }}>{totalF}g</strong></span>
            </div>
          </div>
          
          {/* CIRCULAR PROGRESS RING */}
          <div style={{ position: "relative", width: "80px", height: "80px", flexShrink: 0 }}>
            <svg width="80" height="80" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
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
                style={{ transition: "stroke-dashoffset 0.8s ease" }}
              />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 900, color: "var(--primary)" }}>
              {pct}%
            </div>
          </div>
        </div>

        {/* ACTIVE WORKOUT BURN SUMMARY INSIDE HERO */}
        {(appData?.todayBurnedCal || 0) > 0 && (
          <div style={{ background: "#f0fdf4", padding: "10px 14px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "8px", border: "1px solid #bbf7d0" }}>
            <div style={{ color: "#16a34a", fontSize: "14px" }}><i className="fa-solid fa-fire-flame-curved"></i></div>
            <div style={{ fontSize: "11px", fontWeight: 800, color: "#16a34a" }}>
              Active Burn Today: {appData.todayBurnedCal} kcal
            </div>
          </div>
        )}
      </div>

      {/* QUICK ACTION PILLS (Glance & Go) */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
        <button 
          onClick={() => {
            if (typeof setLogPanelCategory === "function") setLogPanelCategory("food");
            if (typeof setActiveTab === "function") setActiveTab("log");
          }}
          style={{ flex: 1, padding: "12px 8px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", cursor: "pointer", color: "#334155", fontWeight: 800, fontSize: "11px" }}
        >
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", color: "#f59e0b", fontSize: "14px", boxShadow: "0 2px 6px rgba(0,0,0,0.06)" }}>
            <i className="fa-solid fa-apple-whole"></i>
          </div>
          Log Meal
        </button>
        <button 
          onClick={() => {
            const timerElem = document.getElementById("workout-timer-section");
            if (timerElem) {
              timerElem.scrollIntoView({ behavior: "smooth" });
            }
          }}
          style={{ flex: 1, padding: "12px 8px", background: "var(--primary)", border: "none", borderRadius: "16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", cursor: "pointer", color: "white", fontWeight: 800, fontSize: "11px", boxShadow: "0 4px 12px rgba(79,70,229,0.3)" }}
        >
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "14px" }}>
            <i className="fa-solid fa-dumbbell"></i>
          </div>
          Workout
        </button>
        <button 
          onClick={() => {
            if (typeof setLogPanelCategory === "function") setLogPanelCategory("water");
            if (typeof setActiveTab === "function") setActiveTab("log");
          }}
          style={{ flex: 1, padding: "12px 8px", background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", cursor: "pointer", color: "#0284c7", fontWeight: 800, fontSize: "11px" }}
        >
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", color: "#0284c7", fontSize: "14px", boxShadow: "0 2px 6px rgba(0,0,0,0.06)" }}>
            <i className="fa-solid fa-droplet"></i>
          </div>
          Water
        </button>
      </div>

      {/* GPS MAP TRACKER */}
      <MapTracker
        activeTab={activeTab}
        appData={appData}
        saveToCloud={saveToCloud}
        showToast={showToast}
      />

      {/* COMPACT WORKOUT COUNTDOWN TIMER */}
      <div id="workout-timer-section" className="card" style={{ padding: "20px", borderRadius: "24px", background: "linear-gradient(135deg, #0f172a, #1e293b)", color: "white", marginBottom: "16px", boxShadow: "0 8px 24px rgba(15,23,42,0.4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(56, 189, 248, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#38bdf8" }}>
            <i className="fa-solid fa-stopwatch"></i>
          </div>
          <h4 style={{ fontSize: "15px", fontWeight: 800, margin: 0 }}>Workout Timer</h4>
        </div>

        <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
          <div style={{ flex: 2 }}>
            <select 
              value={selectedActivity} 
              onChange={e => setSelectedActivity(e.target.value)}
              style={{ width: "100%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "white", borderRadius: "12px", padding: "10px", fontSize: "11px", fontWeight: 700, outline: "none" }}
            >
              {WORKOUT_ACTIVITIES.map(a => (
                <option key={a.name} value={a.name} style={{ color: "black" }}>{a.name}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <input 
              type="number" 
              placeholder="Mins"
              value={workoutDuration} 
              onChange={e => handleSetWorkoutTarget(e.target.value)}
              style={{ width: "100%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "white", borderRadius: "12px", padding: "10px", fontSize: "12px", fontWeight: 800, outline: "none", textAlign: "center" }} 
            />
          </div>
        </div>

        <div style={{ background: "rgba(0,0,0,0.3)", padding: "18px", borderRadius: "16px", textAlign: "center", border: "1px solid rgba(255,255,255,0.05)", marginBottom: "14px" }}>
          <div style={{ fontSize: "36px", fontWeight: 900, letterSpacing: "3px", color: "#38bdf8", fontFamily: "monospace", lineHeight: 1 }}>
            {timerMinDisplay}:{timerSecDisplay}
          </div>
          <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 700, marginTop: "8px" }}>
            Est. Burn: <strong style={{ color: "#f59e0b" }}>{estimatedWorkoutBurn} kcal</strong>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          {!isTimerRunning ? (
            <button onClick={startTimer} style={{ flex: 1, background: "#10b981", color: "white", border: "none", padding: "12px", borderRadius: "12px", fontWeight: 800, fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              <i className="fa-solid fa-play"></i> Start
            </button>
          ) : (
            <button onClick={pauseTimer} style={{ flex: 1, background: "#f59e0b", color: "white", border: "none", padding: "12px", borderRadius: "12px", fontWeight: 800, fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              <i className="fa-solid fa-pause"></i> Pause
            </button>
          )}
          <button onClick={finishWorkoutSession} style={{ flex: 1, background: "rgba(255,255,255,0.12)", color: "white", border: "1px solid rgba(255,255,255,0.2)", padding: "12px", borderRadius: "12px", fontWeight: 800, fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
            <i className="fa-solid fa-check"></i> Finish
          </button>
        </div>
      </div>
    </div>
  );
}
