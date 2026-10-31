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
    "Complete 30 mins workout to keep your streak active",
    "Hit your daily protein target for muscle recovery",
    "Drink at least 2.5L of water for optimal hydration",
    "Reach 5,000 steps before the day ends"
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
    <div className="screen active" style={{ maxWidth: "440px", margin: "0 auto", paddingBottom: "20px" }}>
      
      {/* 1. PROFESSIONAL BRAND HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "linear-gradient(135deg, #4f46e5, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "13px", boxShadow: "0 2px 8px rgba(79,70,229,0.2)", flexShrink: 0 }}>
            <i className="fa-solid fa-heart-pulse"></i>
          </div>
          <div>
            <span style={{ fontSize: "9px", fontWeight: 800, color: "#6366f1", textTransform: "uppercase", letterSpacing: "1px", display: "block", lineHeight: 1 }}>
              NUTRIPULSE
            </span>
            <h2 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", margin: "2px 0 0 0", letterSpacing: "-0.3px", lineHeight: 1.1 }}>
              Hello, {appData?.userName || "Athlete"}
            </h2>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ background: "#ffffff", border: "1px solid #fed7aa", padding: "4px 8px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: 800, color: "#ea580c", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
            <i className="fa-solid fa-fire" style={{ fontSize: "11px" }}></i>
            <span>{appData?.streakDays || 1}d</span>
          </div>
          <button 
            onClick={() => setShowAboutModal && setShowAboutModal(true)} 
            style={{ width: "26px", height: "26px", borderRadius: "8px", background: "#f1f5f9", border: "1px solid #e2e8f0", color: "#64748b", fontWeight: 800, fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            title="App Information"
          >
            <i className="fa-solid fa-circle-question" style={{ fontSize: "12px" }}></i>
          </button>
        </div>
      </div>

      {/* 2. SLEEK DAILY QUEST BANNER */}
      <div 
        onClick={handleNextQuest}
        style={{ 
          background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%)", 
          borderRadius: "14px", 
          padding: "10px 14px", 
          color: "white", 
          marginBottom: "12px", 
          boxShadow: "0 4px 14px rgba(79, 70, 229, 0.18)",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
        title="Tap to cycle daily quest"
      >
        <div style={{ minWidth: 0, flex: 1, paddingRight: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <i className="fa-solid fa-bullseye" style={{ fontSize: "9px", opacity: 0.9 }}></i>
            <span style={{ fontSize: "8.5px", textTransform: "uppercase", fontWeight: 800, opacity: 0.85, letterSpacing: "0.6px" }}>
              Daily Quest
            </span>
          </div>
          <div style={{ fontSize: "11px", fontWeight: 700, marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {quests[questIndex]}
          </div>
        </div>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: "10px", opacity: 0.75 }}></i>
      </div>

      {/* 3. ENERGY OVERVIEW (Clean White Card) */}
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "18px", padding: "14px", marginBottom: "12px", boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <div>
            <span style={{ fontSize: "9px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.6px" }}>
              Energy Overview
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "5px", marginTop: "4px" }}>
              <span style={{ fontSize: "24px", fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>
                {calNum.toLocaleString()}
              </span>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b" }}>
                / {goalCal.toLocaleString()} kcal
              </span>
            </div>
            {(appData?.todayBurnedCal || 0) > 0 && (
              <div style={{ fontSize: "10px", color: "#16a34a", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                <i className="fa-solid fa-fire-flame-curved" style={{ fontSize: "10px" }}></i>
                <span>{appData.todayBurnedCal} kcal active burn</span>
              </div>
            )}
          </div>

          {/* PROGRESS RING */}
          <div style={{ position: "relative", width: "62px", height: "62px", flexShrink: 0 }}>
            <svg width="62" height="62" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
              <defs>
                <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#db2777" />
                  <stop offset="50%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#2563eb" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="10" fill="transparent" />
              <circle 
                cx="50" 
                cy="50" 
                r="40" 
                stroke="url(#ringGrad)" 
                strokeWidth="10" 
                strokeDasharray="251" 
                strokeDashoffset={strokeOffset ?? 0} 
                strokeLinecap="round" 
                fill="transparent" 
                style={{ transition: "stroke-dashoffset 0.6s ease" }}
              />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 900, color: "#0f172a" }}>
              {pct ?? 0}%
            </div>
          </div>
        </div>

        {/* MACRONUTRIENT BARS */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingTop: "10px", borderTop: "1px solid #f1f5f9" }}>
          
          {/* Protein */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "48px", fontSize: "10.5px", fontWeight: 700, color: "#475569" }}>Protein</span>
            <div style={{ flex: 1, height: "6px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
              <div style={{ width: `${Math.max(Math.min((pNum / 120) * 100, 100), pNum > 0 ? 5 : 2)}%`, height: "100%", background: "#10b981", borderRadius: "999px" }}></div>
            </div>
            <span style={{ width: "38px", textAlign: "right", fontSize: "10.5px", fontWeight: 800, color: "#0f172a" }}>{pNum}g</span>
          </div>

          {/* Carbs */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "48px", fontSize: "10.5px", fontWeight: 700, color: "#475569" }}>Carbs</span>
            <div style={{ flex: 1, height: "6px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
              <div style={{ width: `${Math.max(Math.min((cNum / 260) * 100, 100), cNum > 0 ? 5 : 2)}%`, height: "100%", background: "#f59e0b", borderRadius: "999px" }}></div>
            </div>
            <span style={{ width: "38px", textAlign: "right", fontSize: "10.5px", fontWeight: 800, color: "#0f172a" }}>{cNum}g</span>
          </div>

          {/* Fats */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "48px", fontSize: "10.5px", fontWeight: 700, color: "#475569" }}>Fats</span>
            <div style={{ flex: 1, height: "6px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
              <div style={{ width: `${Math.max(Math.min((fNum / 70) * 100, 100), fNum > 0 ? 5 : 2)}%`, height: "100%", background: "#0ea5e9", borderRadius: "999px" }}></div>
            </div>
            <span style={{ width: "38px", textAlign: "right", fontSize: "10.5px", fontWeight: 800, color: "#0f172a" }}>{fNum}g</span>
          </div>
        </div>
      </div>

      {/* 4. PROFESSIONAL QUICK ACTIONS (VECTOR ICONS) */}
      <div style={{ marginBottom: "14px" }}>
        <span style={{ fontSize: "9px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.6px", display: "block", marginBottom: "6px" }}>
          Quick Actions
        </span>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px" }}>
          
          {/* 1. Log Food */}
          <button 
            onClick={() => {
              if (typeof setActiveTab === "function") setActiveTab("log");
            }}
            style={{ padding: "10px 4px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", display: "flex", flexDirection: "column", alignItems: "center", gap: "5px", cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}
          >
            <div style={{ width: "26px", height: "26px", borderRadius: "7px", background: "#ecfdf5", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>
              <i className="fa-solid fa-utensils"></i>
            </div>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "#1e293b" }}>Log Food</span>
          </button>

          {/* 2. Workout Action */}
          <button 
            onClick={() => {
              setActiveHUD("timer");
              const el = document.getElementById("active-hud-section");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            style={{ padding: "10px 4px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", display: "flex", flexDirection: "column", alignItems: "center", gap: "5px", cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}
          >
            <div style={{ width: "26px", height: "26px", borderRadius: "7px", background: "#eef2ff", color: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>
              <i className="fa-solid fa-dumbbell"></i>
            </div>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "#1e293b" }}>Workout</span>
          </button>

          {/* 3. Water Intake */}
          <button 
            onClick={() => {
              if (typeof setActiveTab === "function") setActiveTab("log");
            }}
            style={{ padding: "10px 4px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", display: "flex", flexDirection: "column", alignItems: "center", gap: "5px", cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}
          >
            <div style={{ width: "26px", height: "26px", borderRadius: "7px", background: "#f0f9ff", color: "#0ea5e9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>
              <i className="fa-solid fa-droplet"></i>
            </div>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "#1e293b" }}>Water</span>
          </button>

          {/* 4. Log Weight */}
          <button 
            onClick={() => {
              if (typeof setActiveTab === "function") setActiveTab("progress");
            }}
            style={{ padding: "10px 4px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", display: "flex", flexDirection: "column", alignItems: "center", gap: "5px", cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}
          >
            <div style={{ width: "26px", height: "26px", borderRadius: "7px", background: "#f5f3ff", color: "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>
              <i className="fa-solid fa-weight-scale"></i>
            </div>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "#1e293b" }}>Weight</span>
          </button>

        </div>
      </div>

      {/* 5. ACTIVE HUD (MODERN SEGMENTED CONTROLS) */}
      <div id="active-hud-section">
        <span style={{ fontSize: "9px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.6px", display: "block", marginBottom: "6px" }}>
          Active Session
        </span>
        
        {/* Toggle Switcher */}
        <div style={{ display: "flex", background: "#f1f5f9", padding: "3px", borderRadius: "10px", marginBottom: "10px" }}>
          <button 
            onClick={() => setActiveHUD("timer")}
            style={{ 
              flex: 1, 
              padding: "7px 10px", 
              borderRadius: "8px", 
              border: "none", 
              background: activeHUD === "timer" ? "#ffffff" : "transparent", 
              color: activeHUD === "timer" ? "#0f172a" : "#64748b", 
              fontWeight: 800, 
              fontSize: "11px", 
              cursor: "pointer",
              boxShadow: activeHUD === "timer" ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px"
            }}
          >
            <i className="fa-solid fa-stopwatch" style={{ fontSize: "11px", color: activeHUD === "timer" ? "#6366f1" : "inherit" }}></i>
            Workout Timer
          </button>
          <button 
            onClick={() => setActiveHUD("gps")}
            style={{ 
              flex: 1, 
              padding: "7px 10px", 
              borderRadius: "8px", 
              border: "none", 
              background: activeHUD === "gps" ? "#ffffff" : "transparent", 
              color: activeHUD === "gps" ? "#0f172a" : "#64748b", 
              fontWeight: 800, 
              fontSize: "11px", 
              cursor: "pointer",
              boxShadow: activeHUD === "gps" ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px"
            }}
          >
            <i className="fa-solid fa-route" style={{ fontSize: "11px", color: activeHUD === "gps" ? "#0ea5e9" : "inherit" }}></i>
            GPS Run & Steps
          </button>
        </div>

        {/* WORKOUT TIMER CARD */}
        {activeHUD === "timer" && (
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "18px", padding: "14px", boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "9px", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                Target Activity
              </span>
              <div style={{ width: "150px" }}>
                <select 
                  value={selectedActivity} 
                  onChange={e => setSelectedActivity && setSelectedActivity(e.target.value)}
                  style={{ width: "100%", background: "#f8fafc", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "8px", padding: "5px 8px", fontSize: "11px", fontWeight: 700, outline: "none" }}
                >
                  {(WORKOUT_ACTIVITIES || []).map(a => (
                    <option key={a.name} value={a.name}>{a.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Digits & Burn */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "10px 0 14px 0" }}>
              <div style={{ fontSize: "32px", fontWeight: 900, color: "#0f172a", fontFamily: "monospace", letterSpacing: "-0.5px", lineHeight: 1 }}>
                {timerMinDisplay || "30"}:{timerSecDisplay || "00"}
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "8.5px", fontWeight: 700, color: "#94a3b8", display: "block", textTransform: "uppercase" }}>Est. Burn</span>
                <span style={{ fontSize: "13px", fontWeight: 800, color: "#ea580c" }}>{estimatedWorkoutBurn ?? 0} kcal</span>
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: "flex", gap: "8px" }}>
              {!isTimerRunning ? (
                <button onClick={startTimer} style={{ flex: 1, background: "#0f172a", color: "white", border: "none", padding: "10px", borderRadius: "10px", fontWeight: 800, fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                  <i className="fa-solid fa-play" style={{ fontSize: "10px" }}></i>
                  START
                </button>
              ) : (
                <button onClick={pauseTimer} style={{ flex: 1, background: "#f59e0b", color: "white", border: "none", padding: "10px", borderRadius: "10px", fontWeight: 800, fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                  <i className="fa-solid fa-pause" style={{ fontSize: "10px" }}></i>
                  PAUSE
                </button>
              )}
              <button onClick={finishWorkoutSession} style={{ flex: 1, background: "#f43f5e", color: "white", border: "none", padding: "10px", borderRadius: "10px", fontWeight: 800, fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                <i className="fa-solid fa-check" style={{ fontSize: "11px" }}></i>
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
