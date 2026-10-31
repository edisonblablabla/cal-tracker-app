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
  const [activeHUD, setActiveHUD] = useState("timer");

  const [questIndex, setQuestIndex] = useState(0);
  const quests = [
    "Workout 30m to maintain your streak!",
    "Hit your protein goal to speed up recovery!",
    "Drink at least 2.5L of water today!",
    "Take 5,000 steps before sundown!"
  ];

  const handleNextQuest = () => {
    setQuestIndex((prev) => (prev + 1) % quests.length);
    if (typeof shuffleQuote === "function") shuffleQuote();
  };

  const pNum = Number(totalP) || 0;
  const cNum = Number(totalC) || 0;
  const fNum = Number(totalF) || 0;
  const goalCal = Number(activeGoal) || 2184;
  const calNum = Number(totalCal) || 0;

  return (
    <div className="screen active" style={{ maxWidth: "440px", margin: "0 auto", paddingBottom: "16px" }}>
      
      {/* 1. BRAND HEADER MAY LOGO */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Logo icon */}
          <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "linear-gradient(135deg, #4f46e5, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "12px", boxShadow: "0 2px 6px rgba(79,70,229,0.25)", flexShrink: 0 }}>
            <i className="fa-solid fa-heart-pulse"></i>
          </div>
          <div>
            <span style={{ fontSize: "8.5px", fontWeight: 800, color: "#4f46e5", textTransform: "uppercase", letterSpacing: "0.8px", display: "block", lineHeight: 1 }}>
              NUTRIPULSE
            </span>
            <h2 style={{ fontSize: "15px", fontWeight: 900, color: "#0f172a", margin: "2px 0 0 0", lineHeight: 1.1 }}>
              Hey, {appData?.userName || "Athlete"}!
            </h2>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ background: "#fff7ed", border: "1px solid #ffedd5", padding: "3px 8px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 800, color: "#ea580c" }}>
            <span>🔥 {appData?.streakDays || 1}d</span>
          </div>
          <button 
            onClick={() => setShowAboutModal && setShowAboutModal(true)} 
            style={{ width: "26px", height: "26px", borderRadius: "8px", background: "#f1f5f9", border: "none", color: "#64748b", fontWeight: 900, fontSize: "11px", cursor: "pointer" }}
            title="App Info"
          >
            ?
          </button>
        </div>
      </div>

      {/* 2. DAILY QUEST BANNER (Sleek Compact Size) */}
      <div 
        onClick={handleNextQuest}
        style={{ 
          background: "linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)", 
          borderRadius: "14px", 
          padding: "9px 12px", 
          color: "white", 
          marginBottom: "12px", 
          boxShadow: "0 4px 12px rgba(99, 102, 241, 0.15)",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
        title="Tap to change quest"
      >
        <div style={{ minWidth: 0, flex: 1, paddingRight: "8px" }}>
          <span style={{ fontSize: "8px", textTransform: "uppercase", fontWeight: 800, opacity: 0.85, letterSpacing: "0.5px", display: "block" }}>
            DAILY QUEST
          </span>
          <div style={{ fontSize: "11px", fontWeight: 700, marginTop: "1px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {quests[questIndex]}
          </div>
        </div>
        <span style={{ fontSize: "12px", opacity: 0.8, fontWeight: 900 }}>›</span>
      </div>

      {/* 3. ENERGY OVERVIEW CARD (Compact & Proportional) */}
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "18px", padding: "14px", marginBottom: "12px", boxShadow: "0 4px 12px rgba(15, 23, 42, 0.03)" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <div>
            <span style={{ fontSize: "9px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              ENERGY OVERVIEW
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "5px", marginTop: "3px" }}>
              <span style={{ fontSize: "24px", fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>
                {calNum.toLocaleString()}
              </span>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b" }}>
                / {goalCal.toLocaleString()} kcal
              </span>
            </div>
            {(appData?.todayBurnedCal || 0) > 0 && (
              <span style={{ fontSize: "10px", color: "#16a34a", fontWeight: 700, display: "inline-block", marginTop: "3px" }}>
                🔥 {appData.todayBurnedCal} kcal burned today
              </span>
            )}
          </div>

          {/* COMPACT CIRCULAR RING */}
          <div style={{ position: "relative", width: "64px", height: "64px", flexShrink: 0 }}>
            <svg width="64" height="64" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
              <defs>
                <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ec4899" />
                  <stop offset="50%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="10" fill="transparent" />
              <circle 
                cx="50" 
                cy="50" 
                r="40" 
                stroke="url(#ringGradient)" 
                strokeWidth="10" 
                strokeDasharray="251" 
                strokeDashoffset={strokeOffset ?? 0} 
                strokeLinecap="round" 
                fill="transparent" 
                style={{ transition: "stroke-dashoffset 0.6s ease" }}
              />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 900, color: "#1e1b4b" }}>
              {pct ?? 0}%
            </div>
          </div>
        </div>

        {/* MACRONUTRIENT BALANCE (Compact Capsule Tracks) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingTop: "10px", borderTop: "1px solid #f1f5f9" }}>
          
          {/* Proteins */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "48px", fontSize: "10px", fontWeight: 700, color: "#475569" }}>Protein</span>
            <div style={{ flex: 1, height: "6px", background: "#e2e8f0", borderRadius: "999px", overflow: "hidden" }}>
              <div style={{ width: `${Math.max(Math.min((pNum / 120) * 100, 100), pNum > 0 ? 5 : 2)}%`, height: "100%", background: "#22c55e", borderRadius: "999px" }}></div>
            </div>
            <span style={{ width: "36px", textAlign: "right", fontSize: "10px", fontWeight: 800, color: "#0f172a" }}>{pNum}g</span>
          </div>

          {/* Carbs */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "48px", fontSize: "10px", fontWeight: 700, color: "#475569" }}>Carbs</span>
            <div style={{ flex: 1, height: "6px", background: "#e2e8f0", borderRadius: "999px", overflow: "hidden" }}>
              <div style={{ width: `${Math.max(Math.min((cNum / 260) * 100, 100), cNum > 0 ? 5 : 2)}%`, height: "100%", background: "#f97316", borderRadius: "999px" }}></div>
            </div>
            <span style={{ width: "36px", textAlign: "right", fontSize: "10px", fontWeight: 800, color: "#0f172a" }}>{cNum}g</span>
          </div>

          {/* Fats */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "48px", fontSize: "10px", fontWeight: 700, color: "#475569" }}>Fats</span>
            <div style={{ flex: 1, height: "6px", background: "#e2e8f0", borderRadius: "999px", overflow: "hidden" }}>
              <div style={{ width: `${Math.max(Math.min((fNum / 70) * 100, 100), fNum > 0 ? 5 : 2)}%`, height: "100%", background: "#0ea5e9", borderRadius: "999px" }}></div>
            </div>
            <span style={{ width: "36px", textAlign: "right", fontSize: "10px", fontWeight: 800, color: "#0f172a" }}>{fNum}g</span>
          </div>
        </div>
      </div>

      {/* 4. QUICK CAPTURE PILLS (Useful, Compact, at may 'Log Weight') */}
      <div style={{ marginBottom: "14px" }}>
        <span style={{ fontSize: "9px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "6px" }}>
          QUICK ACTIONS
        </span>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px" }}>
          
          {/* 1. Log Food */}
          <button 
            onClick={() => {
              if (typeof setActiveTab === "function") setActiveTab("log");
            }}
            style={{ padding: "8px 4px", background: "#ebfbf2", border: "1px solid #d1fae5", borderRadius: "12px", display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", cursor: "pointer" }}
          >
            <span style={{ fontSize: "16px" }}>🥗</span>
            <span style={{ fontSize: "10px", fontWeight: 800, color: "#065f46" }}>Log Food</span>
          </button>

          {/* 2. Workout Action */}
          <button 
            onClick={() => {
              setActiveHUD("timer");
              const el = document.getElementById("active-hud-section");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            style={{ padding: "8px 4px", background: "#fff4eb", border: "1px solid #fed7aa", borderRadius: "12px", display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", cursor: "pointer" }}
          >
            <span style={{ fontSize: "16px" }}>🏋️</span>
            <span style={{ fontSize: "10px", fontWeight: 800, color: "#9a3412" }}>Workout</span>
          </button>

          {/* 3. Water Intake */}
          <button 
            onClick={() => {
              if (typeof setActiveTab === "function") setActiveTab("log");
            }}
            style={{ padding: "8px 4px", background: "#edf7ff", border: "1px solid #bae6fd", borderRadius: "12px", display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", cursor: "pointer" }}
          >
            <span style={{ fontSize: "16px" }}>💧</span>
            <span style={{ fontSize: "10px", fontWeight: 800, color: "#075985" }}>Water</span>
          </button>

          {/* 4. Log Weight / Progress (Kapaki-pakinabang kaysa quote!) */}
          <button 
            onClick={() => {
              if (typeof setActiveTab === "function") setActiveTab("progress");
            }}
            style={{ padding: "8px 4px", background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: "12px", display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", cursor: "pointer" }}
          >
            <span style={{ fontSize: "16px" }}>⚖️</span>
            <span style={{ fontSize: "10px", fontWeight: 800, color: "#5b21b6" }}>Weight</span>
          </button>

        </div>
      </div>

      {/* 5. ACTIVE HUD (Compact White Timer / GPS Segment) */}
      <div id="active-hud-section">
        <span style={{ fontSize: "9px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "6px" }}>
          ACTIVE HUD
        </span>
        
        {/* Toggle Switcher */}
        <div style={{ display: "flex", background: "#f1f5f9", padding: "3px", borderRadius: "12px", marginBottom: "10px" }}>
          <button 
            onClick={() => setActiveHUD("timer")}
            style={{ 
              flex: 1, 
              padding: "7px 10px", 
              borderRadius: "9px", 
              border: "none", 
              background: activeHUD === "timer" ? "#ffffff" : "transparent", 
              color: activeHUD === "timer" ? "#0f172a" : "#64748b", 
              fontWeight: 800, 
              fontSize: "11px", 
              cursor: "pointer",
              boxShadow: activeHUD === "timer" ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px"
            }}
          >
            ⏱️ Workout Timer
          </button>
          <button 
            onClick={() => setActiveHUD("gps")}
            style={{ 
              flex: 1, 
              padding: "7px 10px", 
              borderRadius: "9px", 
              border: "none", 
              background: activeHUD === "gps" ? "#ffffff" : "transparent", 
              color: activeHUD === "gps" ? "#0f172a" : "#64748b", 
              fontWeight: 800, 
              fontSize: "11px", 
              cursor: "pointer",
              boxShadow: activeHUD === "gps" ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px"
            }}
          >
            📍 GPS Run & Steps
          </button>
        </div>

        {/* WORKOUT TIMER CARD (Compact Concept C White Card) */}
        {activeHUD === "timer" && (
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "18px", padding: "14px", boxShadow: "0 4px 12px rgba(15, 23, 42, 0.03)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "9px", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                TIMER CONTROLS
              </span>
              <div style={{ width: "140px" }}>
                <select 
                  value={selectedActivity} 
                  onChange={e => setSelectedActivity && setSelectedActivity(e.target.value)}
                  style={{ width: "100%", background: "#f8fafc", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "8px", padding: "4px 8px", fontSize: "10.5px", fontWeight: 700, outline: "none" }}
                >
                  {(WORKOUT_ACTIVITIES || []).map(a => (
                    <option key={a.name} value={a.name}>{a.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Compact Digital Display */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "8px 0 12px 0" }}>
              <div style={{ fontSize: "30px", fontWeight: 900, color: "#0f172a", fontFamily: "monospace", letterSpacing: "-0.5px", lineHeight: 1 }}>
                {timerMinDisplay || "30"}:{timerSecDisplay || "00"}
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "9px", fontWeight: 700, color: "#94a3b8", display: "block" }}>EST. BURN</span>
                <span style={{ fontSize: "13px", fontWeight: 800, color: "#ea580c" }}>{estimatedWorkoutBurn ?? 0} kcal</span>
              </div>
            </div>

            {/* Start & Finish Buttons */}
            <div style={{ display: "flex", gap: "8px" }}>
              {!isTimerRunning ? (
                <button onClick={startTimer} style={{ flex: 1, background: "#1e1b4b", color: "white", border: "none", padding: "9px", borderRadius: "10px", fontWeight: 800, fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                  START
                </button>
              ) : (
                <button onClick={pauseTimer} style={{ flex: 1, background: "#f59e0b", color: "white", border: "none", padding: "9px", borderRadius: "10px", fontWeight: 800, fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                  PAUSE
                </button>
              )}
              <button onClick={finishWorkoutSession} style={{ flex: 1, background: "#f43f5e", color: "white", border: "none", padding: "9px", borderRadius: "10px", fontWeight: 800, fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                FINISH
              </button>
            </div>
          </div>
        )}

        {/* GPS VIEW */}
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
