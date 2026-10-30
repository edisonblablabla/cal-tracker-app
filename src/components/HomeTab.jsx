import React, { useState } from "react";
import MapTracker from "./MapTracker";
import { WORKOUT_ACTIVITIES } from "../constants/data";

export default function HomeTab({
  appData,
  activeTab,
  setActiveTab,
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
  const [activeActivityMode, setActiveActivityMode] = useState("timer");

  return (
    <div className="screen active" style={{ maxWidth: "460px", margin: "0 auto" }}>
      {/* 1. TOP HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <div>
          <span style={{ fontSize: "10px", fontWeight: 800, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            NutriPulse Dashboard
          </span>
          <h2 style={{ fontSize: "18px", fontWeight: 900, color: "#0f172a", margin: "2px 0 0 0" }}>
            Hey, {appData?.userName || "Athlete"}! 👋
          </h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ background: "#ffffff", border: "1px solid #fed7aa", padding: "4px 10px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 800, color: "#ea580c", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <i className="fa-solid fa-fire"></i>
            <span>{appData?.streakDays || 1}d</span>
          </div>
          <button 
            onClick={() => setShowAboutModal(true)} 
            style={{ width: "28px", height: "28px", borderRadius: "10px", background: "#f1f5f9", border: "none", color: "#64748b", fontWeight: 900, fontSize: "12px", cursor: "pointer" }}
            title="App Info"
          >
            ?
          </button>
        </div>
      </div>

      {/* 2. SUBTLE MOTIVATION TICKER */}
      <div 
        onClick={shuffleQuote}
        style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", background: "#f8fafc", border: "1px solid #e2e8f0", padding: "6px 12px", borderRadius: "10px", marginBottom: "14px" }}
        title="Tap to shuffle quote"
      >
        <i className="fa-solid fa-sparkles" style={{ fontSize: "11px", color: "var(--primary)" }}></i>
        <span style={{ fontSize: "11px", color: "#475569", fontWeight: 600, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontStyle: "italic" }}>
          "{quote}"
        </span>
        <i className="fa-solid fa-rotate" style={{ fontSize: "9px", color: "#94a3b8" }}></i>
      </div>

      {/* 3. HERO NUTRITION & ENERGY CARD */}
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "20px", padding: "18px", marginBottom: "14px", boxShadow: "0 4px 16px -2px rgba(15, 23, 42, 0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <div>
            <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Daily Calorie Target
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginTop: "2px" }}>
              <span style={{ fontSize: "28px", fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>{totalCal}</span>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#64748b" }}>/ {activeGoal} kcal</span>
            </div>
            {(appData?.todayBurnedCal || 0) > 0 && (
              <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: 700, display: "inline-block", marginTop: "4px" }}>
                🔥 {appData.todayBurnedCal} kcal burned today
              </span>
            )}
          </div>

          {/* CIRCULAR PROGRESS */}
          <div style={{ position: "relative", width: "70px", height: "70px", flexShrink: 0 }}>
            <svg width="70" height="70" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="50" cy="50" r="42" stroke="#f1f5f9" strokeWidth="10" fill="transparent" />
              <circle 
                cx="50" 
                cy="50" 
                r="42" 
                stroke="var(--primary)" 
                strokeWidth="10" 
                strokeDasharray="264" 
                strokeDashoffset={strokeOffset} 
                strokeLinecap="round" 
                fill="transparent" 
                style={{ transition: "stroke-dashoffset 0.8s ease" }}
              />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 900, color: "var(--primary)" }}>
              {pct}%
            </div>
          </div>
        </div>

        {/* MACROS PILLS */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", paddingTop: "12px", borderTop: "1px solid #f1f5f9", marginBottom: "12px" }}>
          <div style={{ background: "#f8fafc", padding: "8px", borderRadius: "10px", textAlign: "center" }}>
            <span style={{ fontSize: "9px", fontWeight: 700, color: "#64748b", display: "block" }}>Protein</span>
            <strong style={{ fontSize: "13px", color: "#0f172a" }}>{totalP}g</strong>
          </div>
          <div style={{ background: "#f8fafc", padding: "8px", borderRadius: "10px", textAlign: "center" }}>
            <span style={{ fontSize: "9px", fontWeight: 700, color: "#64748b", display: "block" }}>Carbs</span>
            <strong style={{ fontSize: "13px", color: "#0f172a" }}>{totalC}g</strong>
          </div>
          <div style={{ background: "#f8fafc", padding: "8px", borderRadius: "10px", textAlign: "center" }}>
            <span style={{ fontSize: "9px", fontWeight: 700, color: "#64748b", display: "block" }}>Fats</span>
            <strong style={{ fontSize: "13px", color: "#0f172a" }}>{totalF}g</strong>
          </div>
        </div>

        {/* LOG FOOD ACTION BUTTON */}
        <button 
          onClick={() => {
            if (typeof setActiveTab === "function") setActiveTab("log");
          }}
          style={{ width: "100%", padding: "10px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", color: "#334155", fontWeight: 800, fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
        >
          <i className="fa-solid fa-plus" style={{ color: "var(--primary)" }}></i>
          <span>Log Food & Meals in Log Tab</span>
        </button>
      </div>

      {/* 4. ACTIVITY & MOVEMENT HUB (SEGMENTED TABS) */}
      <div style={{ marginBottom: "14px" }}>
        <div style={{ display: "flex", background: "#e2e8f0", padding: "3px", borderRadius: "14px", marginBottom: "10px" }}>
          <button 
            onClick={() => setActiveActivityMode("timer")}
            style={{ 
              flex: 1, 
              padding: "8px 12px", 
              borderRadius: "11px", 
              border: "none", 
              background: activeActivityMode === "timer" ? "#ffffff" : "transparent", 
              color: activeActivityMode === "timer" ? "#0f172a" : "#64748b", 
              fontWeight: 800, 
              fontSize: "12px", 
              cursor: "pointer",
              boxShadow: activeActivityMode === "timer" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px"
            }}
          >
            <i className="fa-solid fa-stopwatch" style={{ color: activeActivityMode === "timer" ? "#38bdf8" : "#94a3b8" }}></i>
            Workout Timer
          </button>
          <button 
            onClick={() => setActiveActivityMode("gps")}
            style={{ 
              flex: 1, 
              padding: "8px 12px", 
              borderRadius: "11px", 
              border: "none", 
              background: activeActivityMode === "gps" ? "#ffffff" : "transparent", 
              color: activeActivityMode === "gps" ? "#0f172a" : "#64748b", 
              fontWeight: 800, 
              fontSize: "12px", 
              cursor: "pointer",
              boxShadow: activeActivityMode === "gps" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px"
            }}
          >
            <i className="fa-solid fa-location-dot" style={{ color: activeActivityMode === "gps" ? "#0ea5e9" : "#94a3b8" }}></i>
            GPS Run & Steps
          </button>
        </div>

        {/* WORKOUT TIMER VIEW (Lightweight & Instant) */}
        {activeActivityMode === "timer" && (
          <div style={{ background: "linear-gradient(135deg, #0f172a, #1e293b)", borderRadius: "20px", padding: "18px", color: "white", boxShadow: "0 6px 20px rgba(15, 23, 42, 0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Session Timer
              </span>
              <span style={{ fontSize: "10px", color: "#94a3b8" }}>
                Est: <strong style={{ color: "#f59e0b" }}>{estimatedWorkoutBurn} kcal</strong>
              </span>
            </div>

            <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
              <div style={{ flex: 2 }}>
                <select 
                  value={selectedActivity} 
                  onChange={e => setSelectedActivity(e.target.value)}
                  style={{ width: "100%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "white", borderRadius: "10px", padding: "8px 10px", fontSize: "11px", fontWeight: 700, outline: "none" }}
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
                  style={{ width: "100%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "white", borderRadius: "10px", padding: "8px", fontSize: "11px", fontWeight: 800, outline: "none", textAlign: "center" }} 
                />
              </div>
            </div>

            {/* DIGITS DISPLAY */}
            <div style={{ background: "rgba(0,0,0,0.35)", padding: "16px", borderRadius: "14px", textAlign: "center", border: "1px solid rgba(255,255,255,0.06)", marginBottom: "12px" }}>
              <div style={{ fontSize: "36px", fontWeight: 900, letterSpacing: "2px", color: "#38bdf8", fontFamily: "monospace", lineHeight: 1 }}>
                {timerMinDisplay}:{timerSecDisplay}
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              {!isTimerRunning ? (
                <button onClick={startTimer} style={{ flex: 1, background: "#10b981", color: "white", border: "none", padding: "10px", borderRadius: "10px", fontWeight: 800, fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                  <i className="fa-solid fa-play"></i> Start
                </button>
              ) : (
                <button onClick={pauseTimer} style={{ flex: 1, background: "#f59e0b", color: "white", border: "none", padding: "10px", borderRadius: "10px", fontWeight: 800, fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                  <i className="fa-solid fa-pause"></i> Pause
                </button>
              )}
              <button onClick={finishWorkoutSession} style={{ flex: 1, background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.2)", padding: "10px", borderRadius: "10px", fontWeight: 800, fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                <i className="fa-solid fa-check"></i> Finish
              </button>
            </div>
          </div>
        )}

        {/* GPS VIEW (Tinatago habang nasa Timer para hindi mag-lag ang mobile) */}
        <div style={{ display: activeActivityMode === "gps" ? "block" : "none" }}>
          <MapTracker
            activeTab={activeTab}
            appData={appData}
            saveToCloud={saveToCloud}
            showToast={showToast}
          />
        </div>
      </div>
    </div>
  );
}
