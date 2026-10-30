import React, { useState } from "react";
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
  const [activeHUD, setActiveHUD] = useState("timer"); // 'timer' | 'gps'
  
  // Custom Dynamic Quest lines batay sa visual design map
  const [questIndex, setQuestIndex] = useState(0);
  const quests = [
    "🔥 Burn 300 kcal today to maintain your streak!",
    "🥗 Eat enough Protein today to rebuild muscle!",
    "💧 Drink 8 glasses of water to stay hydrated!",
    "🧘 Record a 15-minute cool down session!"
  ];

  return (
    <div className="screen active" style={{ maxWidth: "460px", margin: "0 auto", paddingBottom: "32px" }}>
      
      {/* 1. BRAND HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div>
          <span style={{ fontSize: "9px", fontWeight: 800, color: "#4f46e5", textTransform: "uppercase", letterSpacing: "0.8px" }}>
            NUTRIPULSE
          </span>
          <h2 style={{ fontSize: "18px", fontWeight: 900, color: "#0f172a", margin: "1px 0 0 0" }}>
            Hello, {appData?.userName || "Athlete"}!
          </h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {/* Flame streak badge */}
          <div style={{ background: "#fff5eb", border: "1px solid #ffedd5", padding: "4px 10px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 800, color: "#ea580c" }}>
            <span>🔥 {appData?.streakDays || 1}</span>
          </div>
          {/* About / Help Button */}
          <button 
            onClick={() => setShowAboutModal(true)} 
            style={{ width: "28px", height: "28px", borderRadius: "10px", background: "#f1f5f9", border: "none", color: "#64748b", fontWeight: 900, fontSize: "12px", cursor: "pointer" }}
          >
            ?
          </button>
        </div>
      </div>

      {/* 2. DALY QUEST (Soft Gradient Banner) */}
      <div 
        onClick={() => setQuestIndex((prev) => (prev + 1) % quests.length)}
        style={{ 
          background: "linear-gradient(135deg, #4f46e5, #ec4899)", 
          borderRadius: "16px", 
          padding: "12px 14px", 
          color: "white", 
          marginBottom: "16px", 
          boxShadow: "0 4px 12px rgba(79,70,229,0.15)",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <div>
          <span style={{ fontSize: "9px", textTransform: "uppercase", fontWeight: 800, opacity: 0.8, letterSpacing: "0.5px" }}>
            DAILY QUEST
          </span>
          <div style={{ fontSize: "12px", fontWeight: 700, marginTop: "2px" }}>
            {quests[questIndex]}
          </div>
        </div>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: "10px", opacity: 0.8 }}></i>
      </div>

      {/* 3. ENERGY & NUTRITION OVERVIEW CARD (White & Subtle Border Shadow) */}
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "24px", padding: "18px", marginBottom: "16px", boxShadow: "0 6px 18px rgba(15, 23, 42, 0.04)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <div>
            <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              ENERGY OVERVIEW
            </span>
            <div style={{ fontSize: "11px", color: "#475569", marginTop: "2px", fontWeight: 500 }}>
              Calorie tracking with active burn calculations
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginTop: "6px" }}>
              <span style={{ fontSize: "32px", fontWeight: 900, color: "#0f172a" }}>{totalCal}</span>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#64748b" }}>kcal of {activeGoal}</span>
            </div>
          </div>

          {/* CIRCULAR PROGRESS */}
          <div style={{ position: "relative", width: "76px", height: "76px", flexShrink: 0 }}>
            <svg width="76" height="76" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="50" cy="50" r="42" stroke="#f1f5f9" strokeWidth="10" fill="transparent" />
              <circle 
                cx="50" 
                cy="50" 
                r="42" 
                stroke="#6366f1" 
                strokeWidth="10" 
                strokeDasharray="264" 
                strokeDashoffset={strokeOffset} 
                strokeLinecap="round" 
                fill="transparent" 
                style={{ transition: "stroke-dashoffset 0.8s ease" }}
              />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 900, color: "#4f46e5" }}>
              {pct}%
            </div>
          </div>
        </div>

        {/* HORIZONTAL MACRONUTRIENT BALANCE METERS */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
          <span style={{ fontSize: "9px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            MACRONUTRIENT BALANCE
          </span>
          
          {/* Protein */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "2px" }}>
              <span>Proteins</span>
              <span>{totalP}g</span>
            </div>
            <div style={{ height: "6px", background: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
              <div style={{ width: `${Math.min((totalP / 120) * 100, 100)}%`, height: "100%", background: "#f97316", borderRadius: "3px" }}></div>
            </div>
          </div>

          {/* Carbs */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "2px" }}>
              <span>Carbs</span>
              <span>{totalC}g</span>
            </div>
            <div style={{ height: "6px", background: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
              <div style={{ width: `${Math.min((totalC / 260) * 100, 100)}%`, height: "100%", background: "#3b82f6", borderRadius: "3px" }}></div>
            </div>
          </div>

          {/* Fats */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "2px" }}>
              <span>Fats</span>
              <span>{totalF}g</span>
            </div>
            <div style={{ height: "6px", background: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
              <div style={{ width: `${Math.min((totalF / 70) * 100, 100)}%`, height: "100%", background: "#10b981", borderRadius: "3px" }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. QUICK CAPTURE PILLS (Grid Action Launcher) */}
      <div style={{ marginBottom: "16px" }}>
        <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "8px" }}>
          QUICK CAPTURE
        </span>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px" }}>
          
          {/* Log Food */}
          <button 
            onClick={() => {
              if (typeof setLogPanelCategory === "function") setLogPanelCategory("food");
              if (typeof setActiveTab === "function") setActiveTab("log");
            }}
            style={{ padding: "10px 4px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "14px", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", cursor: "pointer" }}
          >
            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a", fontSize: "12px" }}>
              🍎
            </div>
            <span style={{ fontSize: "10px", fontWeight: 800, color: "#14532d" }}>Log Food</span>
          </button>

          {/* Workout Section Scroll */}
          <button 
            onClick={() => {
              const element = document.getElementById("active-hud-section");
              if (element) element.scrollIntoView({ behavior: "smooth" });
            }}
            style={{ padding: "10px 4px", background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: "14px", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", cursor: "pointer" }}
          >
            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", color: "#4f46e5", fontSize: "12px" }}>
              🏋️‍♂️
            </div>
            <span style={{ fontSize: "10px", fontWeight: 800, color: "#1e1b4b" }}>Workout</span>
          </button>

          {/* Log Water */}
          <button 
            onClick={() => {
              if (typeof setLogPanelCategory === "function") setLogPanelCategory("water");
              if (typeof setActiveTab === "function") setActiveTab("log");
            }}
            style={{ padding: "10px 4px", background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "14px", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", cursor: "pointer" }}
          >
            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", color: "#0ea5e9", fontSize: "12px" }}>
              💧
            </div>
            <span style={{ fontSize: "10px", fontWeight: 800, color: "#0369a1" }}>Water</span>
          </button>

          {/* Quick Note / Motivational shuffle */}
          <button 
            onClick={shuffleQuote}
            style={{ padding: "10px 4px", background: "#faf5ff", border: "1px solid #f3e8ff", borderRadius: "14px", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", cursor: "pointer" }}
          >
            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", color: "#8b5cf6", fontSize: "12px" }}>
              ✨
            </div>
            <span style={{ fontSize: "10px", fontWeight: 800, color: "#581c87" }}>Inspiration</span>
          </button>

        </div>
      </div>

      {/* 5. ACTIVE HUD (Flexible Timer & Maps Segment) */}
      <div id="active-hud-section" style={{ marginBottom: "16px" }}>
        <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "8px" }}>
          ACTIVE HUD
        </span>
        
        {/* Toggle Switcher */}
        <div style={{ display: "flex", background: "#f1f5f9", padding: "4px", borderRadius: "14px", marginBottom: "12px" }}>
          <button 
            onClick={() => setActiveHUD("timer")}
            style={{ 
              flex: 1, 
              padding: "10px 14px", 
              borderRadius: "10px", 
              border: "none", 
              background: activeHUD === "timer" ? "#ffffff" : "transparent", 
              color: activeHUD === "timer" ? "#0f172a" : "#64748b", 
              fontWeight: 800, 
              fontSize: "12px", 
              cursor: "pointer",
              boxShadow: activeHUD === "timer" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              transition: "all 0.2s"
            }}
          >
            ⏱️ Workout Timer
          </button>
          <button 
            onClick={() => setActiveHUD("gps")}
            style={{ 
              flex: 1, 
              padding: "10px 14px", 
              borderRadius: "10px", 
              border: "none", 
              background: activeHUD === "gps" ? "#ffffff" : "transparent", 
              color: activeHUD === "gps" ? "#0f172a" : "#64748b", 
              fontWeight: 800, 
              fontSize: "12px", 
              cursor: "pointer",
              boxShadow: activeHUD === "gps" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              transition: "all 0.2s"
            }}
          >
            📍 GPS Run & Steps
          </button>
        </div>

        {/* VIEW A: WORKOUT TIMER VIEW (Lightweight & Safe) */}
        {activeHUD === "timer" && (
          <div style={{ background: "linear-gradient(135deg, #0f172a, #1e293b)", borderRadius: "20px", padding: "18px", color: "white", boxShadow: "0 6px 20px rgba(15, 23, 42, 0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, color: "#38bdf8", textTransform: "uppercase" }}>
                Session Timer
              </span>
              <span style={{ fontSize: "11px", color: "#f59e0b", fontWeight: 800 }}>
                Est: {estimatedWorkoutBurn} kcal
              </span>
            </div>

            <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
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
                  placeholder="Minutes"
                  value={workoutDuration} 
                  onChange={e => handleSetWorkoutTarget(e.target.value)}
                  style={{ width: "100%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "white", borderRadius: "12px", padding: "10px", fontSize: "12px", fontWeight: 800, outline: "none", textAlign: "center" }} 
                />
              </div>
            </div>

            {/* DIGITS */}
            <div style={{ background: "rgba(0,0,0,0.35)", padding: "16px", borderRadius: "14px", textAlign: "center", border: "1px solid rgba(255,255,255,0.06)", marginBottom: "14px" }}>
              <div style={{ fontSize: "36px", fontWeight: 900, letterSpacing: "2px", color: "#38bdf8", fontFamily: "monospace", lineHeight: 1 }}>
                {timerMinDisplay}:{timerSecDisplay}
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              {!isTimerRunning ? (
                <button onClick={startTimer} style={{ flex: 1, background: "#10b981", color: "white", border: "none", padding: "12px", borderRadius: "12px", fontWeight: 800, fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyBox: "center", gap: "6px", justifyContent: "center" }}>
                  <i className="fa-solid fa-play"></i> Start
                </button>
              ) : (
                <button onClick={pauseTimer} style={{ flex: 1, background: "#f59e0b", color: "white", border: "none", padding: "12px", borderRadius: "12px", fontWeight: 800, fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyBox: "center", gap: "6px", justifyContent: "center" }}>
                  <i className="fa-solid fa-pause"></i> Pause
                </button>
              )}
              <button onClick={finishWorkoutSession} style={{ flex: 1, background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.2)", padding: "12px", borderRadius: "12px", fontWeight: 800, fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyBox: "center", gap: "6px", justifyContent: "center" }}>
                <i className="fa-solid fa-check"></i> Finish
              </button>
            </div>
          </div>
        )}

        {/* VIEW B: GPS RUN & STEPS VIEW */}
        <div style={{ display: activeHUD === "gps" ? "block" : "none" }}>
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
