import React, { useState, useEffect, useMemo } from "react";
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
  const [activeSheet, setActiveSheet] = useState(null); // 'food' | 'workout' | 'water' | 'weight' | null

  // Sheet Form States
  const [quickFoodName, setQuickFoodName] = useState("");
  const [quickCal, setQuickCal] = useState("");
  const [quickP, setQuickP] = useState("");
  const [quickC, setQuickC] = useState("");
  const [quickF, setQuickF] = useState("");

  const [customWorkoutName, setCustomWorkoutName] = useState("Strength Training");
  const [customWorkoutMins, setCustomWorkoutMins] = useState(30);
  const [customWorkoutKcal, setCustomWorkoutKcal] = useState(180);

  const [quickWeightKg, setQuickWeightKg] = useState(appData?.currentWeight || "");

  // Quests
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

  // Lock body scroll kapag bukas ang sheet para hindi maalog ang layout
  useEffect(() => {
    if (activeSheet) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [activeSheet]);

  // LIVE WORKOUT BURN CALCULATION (Real-time update habang nagta-type ng minutes)
  const liveBurnRate = useMemo(() => {
    const act = (WORKOUT_ACTIVITIES || []).find((a) => a.name === selectedActivity);
    return act?.calPerMinute || act?.calPerMin || act?.caloriesPerMinute || act?.burnRate || act?.rate || 8;
  }, [selectedActivity]);

  const activeDurationMins = Number(workoutDuration) || 30;
  const dynamicEstimatedBurn = Math.round(activeDurationMins * liveBurnRate);

  // 1. SAVE FOOD (Eksaktong cal, p, c, f para sa App.jsx at DiaryTab.jsx)
  const handleSaveFoodSheet = (e) => {
    e.preventDefault();
    const cVal = Number(quickCal) || 0;
    if (cVal <= 0) {
      if (showToast) showToast("Maglagay ng wastong calories!");
      return;
    }
    const pVal = Number(quickP) || 0;
    const cCarbVal = Number(quickC) || 0;
    const fVal = Number(quickF) || 0;
    const mealTitle = quickFoodName.trim() || "Quick Meal";
    const todayISO = new Date().toISOString().slice(0, 10);

    // Schema na eksaktong tumutugma sa: totalCal += m.cal; totalP += m.p; totalC += m.c; totalF += m.f;
    const newEntry = {
      id: Date.now(),
      name: mealTitle,
      cal: cVal,
      p: pVal,
      c: cCarbVal,
      f: fVal,
      dateLogged: todayISO,
      // Compatibility keys
      calories: cVal,
      protein: pVal,
      carbs: cCarbVal,
      fats: fVal,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      date: todayISO
    };

    if (saveToCloud) {
      const updated = {
        ...appData,
        meals: [newEntry, ...(appData?.meals || [])],
        foodLogs: [newEntry, ...(appData?.foodLogs || [])]
      };
      saveToCloud(updated);
    }

    if (showToast) showToast(`✅ Na-save: ${mealTitle} (${cVal} kcal)!`);
    setQuickFoodName("");
    setQuickCal("");
    setQuickP("");
    setQuickC("");
    setQuickF("");
    setActiveSheet(null);
  };

  // 2. SAVE WATER
  const handleSaveWaterSheet = (amount) => {
    const todayISO = new Date().toISOString().slice(0, 10);
    const newEntry = {
      id: Date.now(),
      amountMl: amount,
      amount: amount,
      date: todayISO,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    if (saveToCloud) {
      const updated = {
        ...appData,
        todayWaterMl: (appData?.todayWaterMl || 0) + amount,
        waterIntake: (appData?.waterIntake || 0) + amount,
        waterLogs: [newEntry, ...(appData?.waterLogs || [])]
      };
      saveToCloud(updated);
    }

    if (showToast) showToast(`💧 +${amount} ml na-record sa daily intake!`);
    setActiveSheet(null);
  };

  // 3. SAVE WORKOUT
  const handleSaveWorkout = (name, mins, kcal) => {
    const kVal = Number(kcal) || 0;
    const mVal = Number(mins) || 0;
    const todayISO = new Date().toISOString().slice(0, 10);

    const newEntry = {
      id: Date.now(),
      activity: name,
      name: name,
      duration: mVal,
      durationMins: mVal,
      calories: kVal,
      burnedKcal: kVal,
      date: todayISO,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    if (saveToCloud) {
      const updated = {
        ...appData,
        todayBurnedCal: (appData?.todayBurnedCal || 0) + kVal,
        burnedCal: (appData?.burnedCal || 0) + kVal,
        workoutLogs: [newEntry, ...(appData?.workoutLogs || [])],
        workouts: [newEntry, ...(appData?.workouts || [])]
      };
      saveToCloud(updated);
    }

    if (showToast) showToast(`🔥 Na-record: ${name} (${mVal}m • ${kVal} kcal)!`);
    setActiveSheet(null);
  };

  // 4. SAVE WEIGHT (Eksaktong val at date para sa ProgressTab.jsx)
  const handleSaveWeightSheet = (e) => {
    e.preventDefault();
    const w = parseFloat(quickWeightKg);
    if (!w || w <= 0) {
      if (showToast) showToast("Maglagay ng wastong timbang (kg)!");
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

    if (showToast) showToast(`⚖️ Na-record ang timbang: ${w} kg!`);
    setActiveSheet(null);
  };

  const calNum = Number(totalCal) || 0;
  const goalCal = Number(activeGoal) || 2200;
  const pNum = Number(totalP) || 0;
  const cNum = Number(totalC) || 0;
  const fNum = Number(totalF) || 0;

  // 100% MATHEMATICAL ACCURACY: r = 45 -> Circumference = 282.743 ~ 283
  const accuratePct = Math.min(Math.round((calNum / goalCal) * 100), 100);
  const accurateOffset = 283 - (283 * (accuratePct / 100));

  const currentWater = Number(appData?.todayWaterMl || appData?.waterIntake || 0);

  return (
    <div className="screen active" style={{ maxWidth: "440px", margin: "0 auto", paddingBottom: "24px" }}>
      
      {/* 1. BRAND HEADER */}
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

      {/* 2. DAILY QUEST BANNER (Concept C Soft Gradient) */}
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

      {/* 3. ENERGY OVERVIEW (Concept C Clean White Card) */}
      <div style={{ background: "#ffffff", border: "1px solid #f1f5f9", borderRadius: "20px", padding: "18px 20px", marginBottom: "12px", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.04)" }}>
        
        {/* Top: Calories on Left, Ring on Right */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <div>
            <span style={{ fontSize: "9.5px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.6px" }}>
              ENERGY OVERVIEW
            </span>
            <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px", fontWeight: 500 }}>
              Calorie tracking with active burn calculations
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginTop: "6px" }}>
              <span style={{ fontSize: "30px", fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>
                {calNum.toLocaleString()}
              </span>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748b" }}>
                kcal of {goalCal.toLocaleString()}
              </span>
            </div>
            {(appData?.todayBurnedCal || 0) > 0 && (
              <div style={{ fontSize: "10.5px", color: "#16a34a", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                <i className="fa-solid fa-fire-flame-curved" style={{ fontSize: "10px" }}></i>
                <span>{appData.todayBurnedCal} kcal burned today</span>
              </div>
            )}
          </div>

          {/* 100% ACCURATE PROGRESS RING (r=45, Circumference=283) */}
          <div style={{ position: "relative", width: "70px", height: "70px", flexShrink: 0 }}>
            <svg width="70" height="70" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
              <defs>
                <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#db2777" />
                  <stop offset="50%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#2563eb" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="45" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
              <circle 
                cx="50" 
                cy="50" 
                r="45" 
                stroke="url(#ringGrad)" 
                strokeWidth="8" 
                strokeDasharray="283" 
                strokeDashoffset={accurateOffset} 
                strokeLinecap="round" 
                fill="transparent" 
                style={{ transition: "stroke-dashoffset 0.6s ease" }}
              />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 900, color: "#0f172a" }}>
              {accuratePct}%
            </div>
          </div>
        </div>

        {/* Bottom: Concept C Macronutrient Balance Horizontal Bars */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingTop: "12px", borderTop: "1px solid #f8fafc" }}>
          <span style={{ fontSize: "9px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.6px" }}>
            MACRONUTRIENT BALANCE
          </span>

          {/* Proteins */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "50px", fontSize: "11px", fontWeight: 700, color: "#475569" }}>Proteins</span>
            <div style={{ flex: 1, height: "7px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
              <div style={{ width: `${Math.max(Math.min((pNum / 120) * 100, 100), pNum > 0 ? 5 : 2)}%`, height: "100%", background: "linear-gradient(90deg, #4ade80, #22c55e)", borderRadius: "999px", transition: "width 0.4s ease" }}></div>
            </div>
            <span style={{ width: "40px", textAlign: "right", fontSize: "11px", fontWeight: 800, color: "#0f172a" }}>{pNum}gm</span>
          </div>

          {/* Carbs */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "50px", fontSize: "11px", fontWeight: 700, color: "#475569" }}>Carbs</span>
            <div style={{ flex: 1, height: "7px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
              <div style={{ width: `${Math.max(Math.min((cNum / 260) * 100, 100), cNum > 0 ? 5 : 2)}%`, height: "100%", background: "linear-gradient(90deg, #fbbf24, #f97316)", borderRadius: "999px", transition: "width 0.4s ease" }}></div>
            </div>
            <span style={{ width: "40px", textAlign: "right", fontSize: "11px", fontWeight: 800, color: "#0f172a" }}>{cNum}gm</span>
          </div>

          {/* Fats */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "50px", fontSize: "11px", fontWeight: 700, color: "#475569" }}>Fats</span>
            <div style={{ flex: 1, height: "7px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
              <div style={{ width: `${Math.max(Math.min((fNum / 70) * 100, 100), fNum > 0 ? 5 : 2)}%`, height: "100%", background: "linear-gradient(90deg, #60a5fa, #0284c7)", borderRadius: "999px", transition: "width 0.4s ease" }}></div>
            </div>
            <span style={{ width: "40px", textAlign: "right", fontSize: "11px", fontWeight: 800, color: "#0f172a" }}>{fNum}gm</span>
          </div>
        </div>

      </div>

      {/* 4. QUICK CAPTURE ACTIONS */}
      <div style={{ marginBottom: "14px" }}>
        <span style={{ fontSize: "9px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.6px", display: "block", marginBottom: "6px" }}>
          QUICK CAPTURE
        </span>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px" }}>
          
          {/* Log Food */}
          <button 
            onClick={() => setActiveSheet("food")}
            style={{ padding: "10px 4px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", display: "flex", flexDirection: "column", alignItems: "center", gap: "5px", cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}
          >
            <div style={{ width: "26px", height: "26px", borderRadius: "7px", background: "#ecfdf5", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>
              <i className="fa-solid fa-utensils"></i>
            </div>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "#1e293b" }}>Log Food</span>
          </button>

          {/* Workout */}
          <button 
            onClick={() => setActiveSheet("workout")}
            style={{ padding: "10px 4px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", display: "flex", flexDirection: "column", alignItems: "center", gap: "5px", cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}
          >
            <div style={{ width: "26px", height: "26px", borderRadius: "7px", background: "#eef2ff", color: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>
              <i className="fa-solid fa-dumbbell"></i>
            </div>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "#1e293b" }}>Workout</span>
          </button>

          {/* Water Intake (May live ml badge) */}
          <button 
            onClick={() => setActiveSheet("water")}
            style={{ padding: "10px 4px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", display: "flex", flexDirection: "column", alignItems: "center", gap: "5px", cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}
          >
            <div style={{ width: "26px", height: "26px", borderRadius: "7px", background: "#f0f9ff", color: "#0ea5e9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>
              <i className="fa-solid fa-droplet"></i>
            </div>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "#1e293b" }}>
              {currentWater > 0 ? `${currentWater}ml` : "Water"}
            </span>
          </button>

          {/* Log Weight */}
          <button 
            onClick={() => {
              setQuickWeightKg(appData?.currentWeight || appData?.weight || "");
              setActiveSheet("weight");
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

      {/* 5. ACTIVE HUD */}
      <div id="active-hud-section">
        <span style={{ fontSize: "9px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.6px", display: "block", marginBottom: "6px" }}>
          ACTIVE HUD
        </span>
        
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
            Stealth Steps & GPX
          </button>
        </div>

        {/* WORKOUT TIMER CARD (MAY LIVE ESTIMATED BURN RECALCULATION) */}
        {activeHUD === "timer" && (
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "18px", padding: "14px", boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)" }}>
            <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
              <div style={{ flex: 2 }}>
                <label style={{ fontSize: "8.5px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "3px" }}>Activity</label>
                <select 
                  value={selectedActivity} 
                  onChange={(e) => {
                    if (setSelectedActivity) setSelectedActivity(e.target.value);
                  }}
                  style={{ width: "100%", background: "#f8fafc", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "8px", padding: "6px 8px", fontSize: "11px", fontWeight: 700, outline: "none" }}
                >
                  {(WORKOUT_ACTIVITIES || []).map((a) => (
                    <option key={a.name} value={a.name}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "8.5px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "3px" }}>Target (Mins)</label>
                <input 
                  type="number" 
                  value={workoutDuration} 
                  onChange={(e) => {
                    if (handleSetWorkoutTarget) handleSetWorkoutTarget(e.target.value);
                  }}
                  style={{ width: "100%", background: "#f8fafc", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "8px", padding: "6px 8px", fontSize: "11px", fontWeight: 800, outline: "none", textAlign: "center" }} 
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "10px 0 14px 0" }}>
              <div style={{ fontSize: "32px", fontWeight: 900, color: "#0f172a", fontFamily: "monospace", letterSpacing: "-0.5px", lineHeight: 1 }}>
                {timerMinDisplay || "30"}:{timerSecDisplay || "00"}
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "8.5px", fontWeight: 700, color: "#94a3b8", display: "block", textTransform: "uppercase" }}>Est. Burn</span>
                <span style={{ fontSize: "13px", fontWeight: 800, color: "#ea580c" }}>
                  {dynamicEstimatedBurn} kcal
                </span>
              </div>
            </div>

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

        {/* STEALTH GPS VIEW */}
        <div style={{ display: activeHUD === "gps" ? "block" : "none" }}>
          <MapTracker
            activeTab={activeTab}
            appData={appData}
            saveToCloud={saveToCloud}
            showToast={showToast}
          />
        </div>
      </div>

      {/* 6. SLIDE-OVER PANELS */}
      {activeSheet && (
        <div 
          onClick={() => setActiveSheet(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.45)", backdropFilter: "blur(3px)", zIndex: 9999, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: "460px", background: "#ffffff", borderTopLeftRadius: "24px", borderTopRightRadius: "24px", padding: "20px", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 -10px 30px rgba(0,0,0,0.15)" }}
          >
            <div style={{ width: "40px", height: "4px", background: "#cbd5e1", borderRadius: "2px", margin: "0 auto 16px auto" }}></div>

            {/* A. QUICK FOOD SHEET */}
            {activeSheet === "food" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "#ecfdf5", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <i className="fa-solid fa-utensils"></i>
                    </div>
                    <h3 style={{ fontSize: "15px", fontWeight: 800, margin: 0, color: "#0f172a" }}>Quick Log Meal</h3>
                  </div>
                  <button onClick={() => setActiveSheet(null)} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "18px", cursor: "pointer" }}>✕</button>
                </div>

                <form onSubmit={handleSaveFoodSheet}>
                  <div style={{ marginBottom: "10px" }}>
                    <label style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "3px" }}>Food / Meal Name</label>
                    <input 
                      type="text" 
                      placeholder="Hal. Chicken Breast & Rice" 
                      value={quickFoodName} 
                      onChange={(e) => setQuickFoodName(e.target.value)} 
                      style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "12px", outline: "none" }} 
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px" }}>
                    <div>
                      <label style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "3px" }}>Calories (kcal) *</label>
                      <input 
                        type="number" 
                        placeholder="350" 
                        required 
                        value={quickCal} 
                        onChange={(e) => setQuickCal(e.target.value)} 
                        style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px", fontWeight: 800, outline: "none" }} 
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "3px" }}>Protein (g)</label>
                      <input 
                        type="number" 
                        placeholder="25" 
                        value={quickP} 
                        onChange={(e) => setQuickP(e.target.value)} 
                        style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none" }} 
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "14px" }}>
                    <div>
                      <label style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "3px" }}>Carbs (g)</label>
                      <input 
                        type="number" 
                        placeholder="45" 
                        value={quickC} 
                        onChange={(e) => setQuickC(e.target.value)} 
                        style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none" }} 
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "3px" }}>Fats (g)</label>
                      <input 
                        type="number" 
                        placeholder="10" 
                        value={quickF} 
                        onChange={(e) => setQuickF(e.target.value)} 
                        style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none" }} 
                      />
                    </div>
                  </div>

                  <button type="submit" style={{ width: "100%", background: "#10b981", color: "white", border: "none", padding: "12px", borderRadius: "12px", fontWeight: 800, fontSize: "12px", cursor: "pointer" }}>
                    Save & Record to Meals
                  </button>
                </form>
              </div>
            )}

            {/* B. WORKOUT SLIDE-OVER SHEET */}
            {activeSheet === "workout" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "#eef2ff", color: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <i className="fa-solid fa-dumbbell"></i>
                    </div>
                    <h3 style={{ fontSize: "15px", fontWeight: 800, margin: 0, color: "#0f172a" }}>Log Workout Session</h3>
                  </div>
                  <button onClick={() => setActiveSheet(null)} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "18px", cursor: "pointer" }}>✕</button>
                </div>

                <div style={{ marginBottom: "14px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "6px" }}>QUICK 1-TAP PRESETS</span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <button 
                      onClick={() => handleSaveWorkout("Strength Training", 45, 240)}
                      style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "10px", borderRadius: "12px", textAlign: "left", cursor: "pointer" }}
                    >
                      <div style={{ fontSize: "11px", fontWeight: 800, color: "#0f172a" }}>Strength Training</div>
                      <div style={{ fontSize: "9.5px", color: "#64748b" }}>45 mins • <span style={{ color: "#ea580c", fontWeight: 700 }}>240 kcal</span></div>
                    </button>

                    <button 
                      onClick={() => handleSaveWorkout("HIIT Circuit", 25, 260)}
                      style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "10px", borderRadius: "12px", textAlign: "left", cursor: "pointer" }}
                    >
                      <div style={{ fontSize: "11px", fontWeight: 800, color: "#0f172a" }}>HIIT Circuit</div>
                      <div style={{ fontSize: "9.5px", color: "#64748b" }}>25 mins • <span style={{ color: "#ea580c", fontWeight: 700 }}>260 kcal</span></div>
                    </button>

                    <button 
                      onClick={() => handleSaveWorkout("Outdoor Cycling", 30, 210)}
                      style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "10px", borderRadius: "12px", textAlign: "left", cursor: "pointer" }}
                    >
                      <div style={{ fontSize: "11px", fontWeight: 800, color: "#0f172a" }}>Cycling / Bike</div>
                      <div style={{ fontSize: "9.5px", color: "#64748b" }}>30 mins • <span style={{ color: "#ea580c", fontWeight: 700 }}>210 kcal</span></div>
                    </button>

                    <button 
                      onClick={() => handleSaveWorkout("Yoga & Stretch", 30, 95)}
                      style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "10px", borderRadius: "12px", textAlign: "left", cursor: "pointer" }}
                    >
                      <div style={{ fontSize: "11px", fontWeight: 800, color: "#0f172a" }}>Yoga & Mobility</div>
                      <div style={{ fontSize: "9.5px", color: "#64748b" }}>30 mins • <span style={{ color: "#ea580c", fontWeight: 700 }}>95 kcal</span></div>
                    </button>
                  </div>
                </div>

                <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "14px", border: "1px solid #e2e8f0", marginBottom: "12px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 800, color: "#475569", display: "block", marginBottom: "8px" }}>CUSTOM WORKOUT LOG</span>
                  
                  <div style={{ marginBottom: "8px" }}>
                    <input 
                      type="text" 
                      placeholder="Workout Name" 
                      value={customWorkoutName} 
                      onChange={(e) => setCustomWorkoutName(e.target.value)} 
                      style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "11px", outline: "none" }} 
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px" }}>
                    <div>
                      <label style={{ fontSize: "9px", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "2px" }}>Duration (Mins)</label>
                      <input 
                        type="number" 
                        value={customWorkoutMins} 
                        onChange={(e) => {
                          const m = Number(e.target.value) || 0;
                          setCustomWorkoutMins(m);
                          setCustomWorkoutKcal(Math.round(m * 6));
                        }} 
                        style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px", fontWeight: 800, outline: "none" }} 
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "9px", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "2px" }}>Calories Burned</label>
                      <input 
                        type="number" 
                        value={customWorkoutKcal} 
                        onChange={(e) => setCustomWorkoutKcal(e.target.value)} 
                        style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px", fontWeight: 800, outline: "none" }} 
                      />
                    </div>
                  </div>

                  <button 
                    onClick={() => handleSaveWorkout(customWorkoutName, customWorkoutMins, customWorkoutKcal)}
                    style={{ width: "100%", background: "#6366f1", color: "white", border: "none", padding: "10px", borderRadius: "10px", fontWeight: 800, fontSize: "11px", cursor: "pointer" }}
                  >
                    Log Custom Session
                  </button>
                </div>

                <button 
                  onClick={() => {
                    setActiveSheet(null);
                    setActiveHUD("timer");
                  }}
                  style={{ width: "100%", background: "#f1f5f9", border: "1px dashed #94a3b8", color: "#334155", padding: "10px", borderRadius: "10px", fontWeight: 700, fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                >
                  <i className="fa-solid fa-stopwatch" style={{ color: "#6366f1" }}></i>
                  <span>Gamitin ang Live Stopwatch sa Ibaba</span>
                </button>
              </div>
            )}

            {/* C. QUICK WATER SHEET */}
            {activeSheet === "water" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "#f0f9ff", color: "#0ea5e9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <i className="fa-solid fa-droplet"></i>
                    </div>
                    <h3 style={{ fontSize: "15px", fontWeight: 800, margin: 0, color: "#0f172a" }}>Quick Log Water</h3>
                  </div>
                  <button onClick={() => setActiveSheet(null)} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "18px", cursor: "pointer" }}>✕</button>
                </div>

                <div style={{ background: "#f0f9ff", padding: "10px", borderRadius: "12px", border: "1px solid #bae6fd", marginBottom: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "11px", color: "#0369a1", fontWeight: 700 }}>Kasalukuyang Naiinom:</span>
                  <span style={{ fontSize: "13px", fontWeight: 900, color: "#0284c7" }}>{currentWater} ml</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "12px" }}>
                  <button onClick={() => handleSaveWaterSheet(250)} style={{ background: "#ffffff", border: "1px solid #bae6fd", padding: "12px 6px", borderRadius: "12px", cursor: "pointer", textAlign: "center" }}>
                    <div style={{ fontSize: "16px", color: "#0ea5e9" }}><i className="fa-solid fa-glass-water"></i></div>
                    <div style={{ fontSize: "12px", fontWeight: 800, color: "#0369a1", marginTop: "4px" }}>+250 ml</div>
                    <span style={{ fontSize: "9px", color: "#64748b" }}>1 Baso</span>
                  </button>

                  <button onClick={() => handleSaveWaterSheet(500)} style={{ background: "#ffffff", border: "1px solid #bae6fd", padding: "12px 6px", borderRadius: "12px", cursor: "pointer", textAlign: "center" }}>
                    <div style={{ fontSize: "16px", color: "#0ea5e9" }}><i className="fa-solid fa-bottle-water"></i></div>
                    <div style={{ fontSize: "12px", fontWeight: 800, color: "#0369a1", marginTop: "4px" }}>+500 ml</div>
                    <span style={{ fontSize: "9px", color: "#64748b" }}>1 Botelya</span>
                  </button>

                  <button onClick={() => handleSaveWaterSheet(1000)} style={{ background: "#ffffff", border: "1px solid #bae6fd", padding: "12px 6px", borderRadius: "12px", cursor: "pointer", textAlign: "center" }}>
                    <div style={{ fontSize: "16px", color: "#0ea5e9" }}><i className="fa-solid fa-flask"></i></div>
                    <div style={{ fontSize: "12px", fontWeight: 800, color: "#0369a1", marginTop: "4px" }}>+1,000 ml</div>
                    <span style={{ fontSize: "9px", color: "#64748b" }}>Jug / Flask</span>
                  </button>
                </div>
              </div>
            )}

            {/* D. QUICK WEIGHT SHEET */}
            {activeSheet === "weight" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "#f5f3ff", color: "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <i className="fa-solid fa-weight-scale"></i>
                    </div>
                    <h3 style={{ fontSize: "15px", fontWeight: 800, margin: 0, color: "#0f172a" }}>Update & Log Weight</h3>
                  </div>
                  <button onClick={() => setActiveSheet(null)} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "18px", cursor: "pointer" }}>✕</button>
                </div>

                <form onSubmit={handleSaveWeightSheet}>
                  <div style={{ marginBottom: "14px" }}>
                    <label style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "4px" }}>Kasalukuyang Timbang (kg)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      placeholder="e.g. 68.5" 
                      required 
                      value={quickWeightKg} 
                      onChange={(e) => setQuickWeightKg(e.target.value)} 
                      style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "16px", fontWeight: 800, outline: "none" }} 
                    />
                  </div>

                  <button type="submit" style={{ width: "100%", background: "#8b5cf6", color: "white", border: "none", padding: "12px", borderRadius: "12px", fontWeight: 800, fontSize: "12px", cursor: "pointer" }}>
                    Save & Record to History
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
