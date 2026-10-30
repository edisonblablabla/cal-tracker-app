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

  // Dynamic Daily Quests na nagbabago sa bawat tap
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
    if (typeof showToast === "function") showToast("✨ Bagong Daily Quest na-unlock!");
  };

  const pNum = Number(totalP) || 0;
  const cNum = Number(totalC) || 0;
  const fNum = Number(totalF) || 0;
  const goalCal = Number(activeGoal) || 2184;
  const calNum = Number(totalCal) || 0;

  return (
    <div className="screen active" style={{ maxWidth: "460px", margin: "0 auto", paddingBottom: "24px" }}>
      
      {/* 1. BRAND HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <div>
          <span style={{ fontSize: "10px", fontWeight: 800, color: "#1e1b4b", textTransform: "uppercase", letterSpacing: "1px" }}>
            NUTRIPULSE
          </span>
          <h2 style={{ fontSize: "20px", fontWeight: 900, color: "#0f172a", margin: "2px 0 0 0", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>👋</span> Hello, {appData?.userName || "Athlete"}!
          </h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ background: "#fff7ed", border: "1px solid #ffedd5", padding: "6px 12px", borderRadius: "14px", display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", fontWeight: 800, color: "#ea580c", boxShadow: "0 2px 4px rgba(234,88,12,0.06)" }}>
            <span>{appData?.streakDays || 7}</span>
            <span>🔥</span>
          </div>
          <button 
            onClick={() => setShowAboutModal && setShowAboutModal(true)} 
            style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#f8fafc", border: "1px solid #e2e8f0", color: "#64748b", fontWeight: 900, fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            title="App Info"
          >
            ?
          </button>
        </div>
      </div>

      {/* 2. DAILY QUEST BANNER (Soft Violet/Magenta Gradient) */}
      <div 
        onClick={handleNextQuest}
        style={{ 
          background: "linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)", 
          borderRadius: "20px", 
          padding: "14px 18px", 
          color: "white", 
          marginBottom: "16px", 
          boxShadow: "0 8px 20px rgba(99, 102, 241, 0.25)",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          transition: "transform 0.15s ease"
        }}
        title="Tap to view next quest"
      >
        <div>
          <span style={{ fontSize: "9px", textTransform: "uppercase", fontWeight: 800, opacity: 0.85, letterSpacing: "0.8px", display: "block" }}>
            DAILY QUEST
          </span>
          <div style={{ fontSize: "13px", fontWeight: 800, marginTop: "2px", letterSpacing: "-0.2px" }}>
            {quests[questIndex]}
          </div>
        </div>
        <span style={{ fontSize: "14px", opacity: 0.8, fontWeight: 900 }}>›</span>
      </div>

      {/* 3. ENERGY OVERVIEW CARD (Clean White with Soft Shadow) */}
      <div style={{ background: "#ffffff", border: "1px solid #f1f5f9", borderRadius: "24px", padding: "20px", marginBottom: "16px", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.04)" }}>
        
        {/* Top Part: Calories & Gradient Ring */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div>
            <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.6px" }}>
              ENERGY OVERVIEW
            </span>
            <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px", fontWeight: 600 }}>
              Calorie tracking with active burn calculations
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginTop: "8px" }}>
              <span style={{ fontSize: "36px", fontWeight: 900, color: "#0f172a", letterSpacing: "-1px", lineHeight: 1 }}>
                {calNum.toLocaleString()}
              </span>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#64748b" }}>
                kcal of {goalCal.toLocaleString()}
              </span>
            </div>
          </div>

          {/* CIRCULAR PROGRESS RING */}
          <div style={{ position: "relative", width: "80px", height: "80px", flexShrink: 0 }}>
            <svg width="80" height="80" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
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
                style={{ transition: "stroke-dashoffset 0.8s ease" }}
              />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", fontWeight: 900, color: "#1e1b4b" }}>
              {pct ?? 0}%
            </div>
          </div>
        </div>

        {/* Bottom Part: MACRONUTRIENT BALANCE (Pill Tracks) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", paddingTop: "14px", borderTop: "1px solid #f8fafc" }}>
          <span style={{ fontSize: "9px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.6px" }}>
            MACRONUTRIENT BALANCE
          </span>

          {/* Proteins */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ width: "55px", fontSize: "12px", fontWeight: 700, color: "#475569" }}>Proteins</span>
            <div style={{ flex: 1, height: "10px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden", position: "relative" }}>
              <div style={{ width: `${Math.max(Math.min((pNum / 120) * 100, 100), pNum > 0 ? 5 : 2)}%`, height: "100%", background: "linear-gradient(90deg, #4ade80, #22c55e)", borderRadius: "999px", transition: "width 0.4s ease" }}></div>
            </div>
            <span style={{ width: "42px", textAlign: "right", fontSize: "12px", fontWeight: 800, color: "#0f172a" }}>{pNum}gm</span>
          </div>

          {/* Carbs */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ width: "55px", fontSize: "12px", fontWeight: 700, color: "#475569" }}>Carbs</span>
            <div style={{ flex: 1, height: "10px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden", position: "relative" }}>
              <div style={{ width: `${Math.max(Math.min((cNum / 260) * 100, 100), cNum > 0 ? 5 : 2)}%`, height: "100%", background: "linear-gradient(90deg, #fbbf24, #f97316)", borderRadius: "999px", transition: "width 0.4s ease" }}></div>
            </div>
            <span style={{ width: "42px", textAlign: "right", fontSize: "12px", fontWeight: 800, color: "#0f172a" }}>{cNum}gm</span>
          </div>

          {/* Fats */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ width: "55px", fontSize: "12px", fontWeight: 700, color: "#475569" }}>Fats</span>
            <div style={{ flex: 1, height: "10px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden", position: "relative" }}>
              <div style={{ width: `${Math.max(Math.min((fNum / 70) * 100, 100), fNum > 0 ? 5 : 2)}%`, height: "100%", background: "linear-gradient(90deg, #60a5fa, #0ea5e9)", borderRadius: "999px", transition: "width 0.4s ease" }}></div>
            </div>
            <span style={{ width: "42px", textAlign: "right", fontSize: "12px", fontWeight: 800, color: "#0f172a" }}>{fNum}gm</span>
          </div>
        </div>
      </div>

      {/* 4. QUICK CAPTURE PILLS (Soft Pastel Cards with Real Actions) */}
      <div style={{ marginBottom: "18px" }}>
        <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.6px", display: "block", marginBottom: "8px" }}>
          QUICK CAPTURE
        </span>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "10px" }}>
          
          {/* Log Food */}
          <button 
            onClick={() => {
              if (typeof setActiveTab === "function") setActiveTab("log");
            }}
            style={{ padding: "14px 6px", background: "#ebfbf2", border: "1px solid #d1fae5", borderRadius: "18px", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", cursor: "pointer", boxShadow: "0 2px 6px rgba(16,185,129,0.06)" }}
          >
            <span style={{ fontSize: "20px" }}>🥗</span>
            <span style={{ fontSize: "11px", fontWeight: 800, color: "#065f46" }}>Log Food</span>
          </button>

          {/* Workout (Switches to Workout Timer HUD) */}
          <button 
            onClick={() => {
              setActiveHUD("timer");
              const timerCard = document.getElementById("active-hud-section");
              if (timerCard) timerCard.scrollIntoView({ behavior: "smooth" });
            }}
            style={{ padding: "14px 6px", background: "#fff4eb", border: "1px solid #fed7aa", borderRadius: "18px", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", cursor: "pointer", boxShadow: "0 2px 6px rgba(249,115,22,0.06)" }}
          >
            <span style={{ fontSize: "20px" }}>🏋️</span>
            <span style={{ fontSize: "11px", fontWeight: 800, color: "#9a3412" }}>Workout</span>
          </button>

          {/* Water Intake */}
          <button 
            onClick={() => {
              if (typeof setActiveTab === "function") setActiveTab("log");
            }}
            style={{ padding: "14px 6px", background: "#edf7ff", border: "1px solid #bae6fd", borderRadius: "18px", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", cursor: "pointer", boxShadow: "0 2px 6px rgba(14,165,233,0.06)" }}
          >
            <span style={{ fontSize: "20px" }}>💧</span>
            <span style={{ fontSize: "11px", fontWeight: 800, color: "#075985" }}>Water</span>
          </button>

          {/* Inspiration / Quick Quest */}
          <button 
            onClick={handleNextQuest}
            style={{ padding: "14px 6px", background: "#f8f0ff", border: "1px solid #e9d5ff", borderRadius: "18px", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", cursor: "pointer", boxShadow: "0 2px 6px rgba(168,85,247,0.06)" }}
          >
            <span style={{ fontSize: "20px" }}>✨</span>
            <span style={{ fontSize: "11px", fontWeight: 800, color: "#6b21a8" }}>Inspiration</span>
          </button>

        </div>
      </div>

      {/* 5. ACTIVE HUD (Clean White Segmented Cards) */}
      <div id="active-hud-section" style={{ marginBottom: "16px" }}>
        <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.6px", display: "block", marginBottom: "8px" }}>
          ACTIVE HUD
        </span>
        
        {/* Toggle Switcher */}
        <div style={{ display: "flex", background: "#f1f5f9", padding: "4px", borderRadius: "16px", marginBottom: "12px" }}>
          <button 
            onClick={() => setActiveHUD("timer")}
            style={{ 
              flex: 1, 
              padding: "10px", 
              borderRadius: "12px", 
              border: "none", 
              background: activeHUD === "timer" ? "#ffffff" : "transparent", 
              color: activeHUD === "timer" ? "#0f172a" : "#64748b", 
              fontWeight: 800, 
              fontSize: "12px", 
              cursor: "pointer",
              boxShadow: activeHUD === "timer" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px"
            }}
          >
            ⏱️ Workout Timer
          </button>
          <button 
            onClick={() => setActiveHUD("gps")}
            style={{ 
              flex: 1, 
              padding: "10px", 
              borderRadius: "12px", 
              border: "none", 
              background: activeHUD === "gps" ? "#ffffff" : "transparent", 
              color: activeHUD === "gps" ? "#0f172a" : "#64748b", 
              fontWeight: 800, 
              fontSize: "12px", 
              cursor: "pointer",
              boxShadow: activeHUD === "gps" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px"
            }}
          >
            📍 GPS Run & Steps
          </button>
        </div>

        {/* VIEW A: CONCEPT C WORKOUT TIMER CARD */}
        {activeHUD === "timer" && (
          <div style={{ background: "#ffffff", border: "1px solid #f1f5f9", borderRadius: "24px", padding: "20px", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.6px" }}>
                WORKOUT TIMER
              </span>
              <div style={{ width: "160px" }}>
                <select 
                  value={selectedActivity} 
                  onChange={e => setSelectedActivity && setSelectedActivity(e.target.value)}
                  style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", color: "#0f172a", borderRadius: "10px", padding: "6px 10px", fontSize: "11px", fontWeight: 700, outline: "none" }}
                >
                  {(WORKOUT_ACTIVITIES || []).map(a => (
                    <option key={a.name} value={a.name}>{a.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Big Digital Clock Display */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "14px 0" }}>
              <div style={{ fontSize: "40px", fontWeight: 900, color: "#0f172a", fontFamily: "monospace", letterSpacing: "-1px", lineHeight: 1 }}>
                {timerMinDisplay || "30"}:{timerSecDisplay || "00"}
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "#94a3b8", display: "block" }}>EST. BURN</span>
                <span style={{ fontSize: "14px", fontWeight: 800, color: "#f97316" }}>{estimatedWorkoutBurn ?? 0} kcal</span>
              </div>
            </div>

            {/* Action Buttons: START & FINISH */}
            <div style={{ display: "flex", gap: "10px" }}>
              {!isTimerRunning ? (
                <button onClick={startTimer} style={{ flex: 1, background: "#1e1b4b", color: "white", border: "none", padding: "12px", borderRadius: "14px", fontWeight: 800, fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", boxShadow: "0 4px 12px rgba(30,27,75,0.2)" }}>
                  START
                </button>
              ) : (
                <button onClick={pauseTimer} style={{ flex: 1, background: "#f59e0b", color: "white", border: "none", padding: "12px", borderRadius: "14px", fontWeight: 800, fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                  PAUSE
                </button>
              )}
              <button onClick={finishWorkoutSession} style={{ flex: 1, background: "#fb7185", color: "white", border: "none", padding: "12px", borderRadius: "14px", fontWeight: 800, fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", boxShadow: "0 4px 12px rgba(251,113,133,0.2)" }}>
                FINISH
              </button>
            </div>
          </div>
        )}

        {/* VIEW B: GPS RUN & STEPS VIEW (Only active when toggled) */}
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
