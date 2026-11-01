import React, { useState, useEffect, useMemo, useRef } from "react";

export default function HomeTab({
  user,
  appData,
  saveToCloud,
  showToast,
  setShowAboutModal,
  setActiveTab
}) {
  // ─── 1. DYNAMIC LOCAL DATE & MIDNIGHT HEARTBEAT ───
  const getTodayISO = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD sa local timezone
  const [currentDateStr, setCurrentDateStr] = useState(getTodayISO());

  useEffect(() => {
    // Tinitingnan bawat 30 segundo kung lumipat na sa bagong araw (12:00 AM reset)
    const interval = setInterval(() => {
      const nowStr = getTodayISO();
      if (nowStr !== currentDateStr) {
        setCurrentDateStr(nowStr);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [currentDateStr]);

  // Formatted date para sa card header (e.g. "Sunday, Nov 1")
  const formattedToday = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric"
    });
  }, [currentDateStr]);

  // ─── 2. DYNAMIC DATE-FILTERED METRICS (ZERO-LAG MIDNIGHT AUTO-RESET) ───
  const todayMeals = useMemo(() => {
    return (appData?.meals || []).filter(
      (m) => (m.dateLogged || m.date) === currentDateStr
    );
  }, [appData?.meals, currentDateStr]);

  const todayWorkouts = useMemo(() => {
    return (appData?.workoutLogs || []).filter(
      (w) => (w.dateLogged || w.date) === currentDateStr
    );
  }, [appData?.workoutLogs, currentDateStr]);

  const todayWaterEntries = useMemo(() => {
    return (appData?.waterLogs || []).filter(
      (w) => (w.dateLogged || w.date) === currentDateStr
    );
  }, [appData?.waterLogs, currentDateStr]);

  // Total Calories Consumed
  const consumedCalories = useMemo(() => {
    return todayMeals.reduce((acc, m) => acc + (Number(m.calories || m.cal) || 0), 0);
  }, [todayMeals]);

  // Macronutrients
  const { proteinG, carbsG, fatG } = useMemo(() => {
    return todayMeals.reduce(
      (acc, m) => ({
        proteinG: acc.proteinG + (Number(m.protein) || 0),
        carbsG: acc.carbsG + (Number(m.carbs) || 0),
        fatG: acc.fatG + (Number(m.fats || m.fat) || 0)
      }),
      { proteinG: 0, carbsG: 0, fatG: 0 }
    );
  }, [todayMeals]);

  // Active Calories Burned
  const burnedCalories = useMemo(() => {
    return todayWorkouts.reduce((acc, w) => acc + (Number(w.burnedCal || w.calories) || 0), 0);
  }, [todayWorkouts]);

  // Water Intake (ml)
  const todayWaterMl = useMemo(() => {
    if (todayWaterEntries.length > 0) {
      return todayWaterEntries.reduce((acc, w) => acc + (Number(w.amountMl || w.amount) || 0), 0);
    }
    // Fallback sa appData kung pareho pa ang date
    if (appData?.lastWaterDate === currentDateStr) {
      return Number(appData?.todayWaterMl) || 0;
    }
    return 0;
  }, [todayWaterEntries, appData, currentDateStr]);

  // ─── 3. TARGETS & GOALS ───
  const calorieGoal = Number(appData?.dailyCalorieTarget || appData?.baseGoal || 2200);
  const burnTarget = Number(appData?.dailyBurnTarget || 400); // 400 kcal standard active burn goal
  const waterTarget = Number(appData?.dailyWaterTarget || 2500); // 2500 ml target

  const caloriesRemaining = Math.max(calorieGoal - consumedCalories + burnedCalories, 0);
  const intakePercent = Math.min(Math.round((consumedCalories / calorieGoal) * 100), 100);
  const burnPercent = Math.min(Math.round((burnedCalories / burnTarget) * 100), 100);
  const waterPercent = Math.min(Math.round((todayWaterMl / waterTarget) * 100), 100);

  // Targets for macros (Batay sa karaniwang 30% P / 45% C / 25% F distribution)
  const targetProtein = Math.round((calorieGoal * 0.3) / 4);
  const targetCarbs = Math.round((calorieGoal * 0.45) / 4);
  const targetFat = Math.round((calorieGoal * 0.25) / 9);

  // ─── 4. QUICK ACTIONS HANDLERS ───
  const handleQuickAddWater = (amount) => {
    const newRecord = {
      id: Date.now(),
      amountMl: amount,
      dateLogged: currentDateStr,
      timestamp: Date.now()
    };

    const updatedLogs = [...(appData?.waterLogs || []), newRecord];
    const newTotal = todayWaterMl + amount;

    if (saveToCloud) {
      saveToCloud({
        ...appData,
        waterLogs: updatedLogs,
        todayWaterMl: newTotal,
        lastWaterDate: currentDateStr
      });
    }

    if (showToast) showToast(`💧 Added ${amount} ml of water!`);
  };

  // State para sa Log Food at Log Workout sheets
  const [activeSheet, setActiveSheet] = useState(null);
  const [foodName, setFoodName] = useState("");
  const [foodCal, setFoodCal] = useState("");
  const [workoutType, setWorkoutType] = useState("Running");
  const [workoutDuration, setWorkoutDuration] = useState("30");

  const handleSaveMeal = (e) => {
    e.preventDefault();
    const calNum = parseInt(foodCal, 10);
    if (!foodName.trim() || isNaN(calNum) || calNum <= 0) {
      if (showToast) showToast("Please enter a valid meal and calorie amount!");
      return;
    }

    const newMeal = {
      id: Date.now(),
      name: foodName.trim(),
      calories: calNum,
      dateLogged: currentDateStr,
      timestamp: Date.now()
    };

    const updatedMeals = [...(appData?.meals || []), newMeal];
    if (saveToCloud) {
      saveToCloud({ ...appData, meals: updatedMeals });
    }

    if (showToast) showToast(`🍽️ Logged: ${foodName} (${calNum} kcal)`);
    setFoodName("");
    setFoodCal("");
    setActiveSheet(null);
  };

  const handleSaveWorkout = (e) => {
    e.preventDefault();
    const duration = parseInt(workoutDuration, 10) || 30;
    // Standard estimation: ~8 kcal per minute for active cardio
    const estBurn = duration * 8;

    const newWorkout = {
      id: Date.now(),
      type: workoutType,
      durationMin: duration,
      burnedCal: estBurn,
      dateLogged: currentDateStr,
      timestamp: Date.now()
    };

    const updatedWorkouts = [...(appData?.workoutLogs || []), newWorkout];
    if (saveToCloud) {
      saveToCloud({ ...appData, workoutLogs: updatedWorkouts });
    }

    if (showToast) showToast(`🔥 Workout logged: +${estBurn} kcal burned!`);
    setActiveSheet(null);
  };

  return (
    <div className="screen active" style={{ maxWidth: "440px", margin: "0 auto", paddingBottom: "28px" }}>
      
      {/* ─── 1. TOP BRAND HEADER ─── */}
      <div style={{ textAlign: "center", marginBottom: "4px" }}>
        <span style={{ fontSize: "11px", fontWeight: 900, color: "#0f172a", textTransform: "uppercase", letterSpacing: "2.5px" }}>
          NUTRIPULSE
        </span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Daily Summary
          </span>
          <h2 style={{ fontSize: "24px", fontWeight: 900, color: "#0f172a", margin: 0, letterSpacing: "-0.5px" }}>
            Dashboard
          </h2>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ background: "#fff7ed", border: "1px solid #ffedd5", padding: "5px 12px", borderRadius: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
            <i className="fa-solid fa-fire" style={{ color: "#ea580c", fontSize: "12px" }}></i>
            <span style={{ fontSize: "13px", fontWeight: 800, color: "#ea580c" }}>
              {appData?.streakDays || 7}
            </span>
          </div>

          <button 
            onClick={() => setShowAboutModal && setShowAboutModal(true)}
            style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#f8fafc", border: "1px solid #e2e8f0", color: "#64748b", fontWeight: 800, fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            title="App Information"
          >
            ?
          </button>
        </div>
      </div>

      {/* ─── 2. MASTER ENERGY OVERVIEW CARD (CONCEPT C GLOBAL STANDARD) ─── */}
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "24px", padding: "20px", marginBottom: "18px", boxShadow: "0 8px 25px rgba(15, 23, 42, 0.04)" }}>
        
        {/* Card Header with Live Date Badge */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.8px" }}>
            ENERGY & METABOLIC BALANCE
          </span>
          <span style={{ fontSize: "10.5px", fontWeight: 800, color: "#6366f1", background: "#eef2ff", padding: "3px 9px", borderRadius: "8px" }}>
            {formattedToday}
          </span>
        </div>

        {/* 3-Column Energy HUD: Intake | Calorie Ring/Remaining | Active Burn */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          
          {/* Column A: Calorie Intake */}
          <div style={{ textAlign: "left" }}>
            <span style={{ fontSize: "10.5px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
              Intake
            </span>
            <div style={{ fontSize: "20px", fontWeight: 900, color: "#0f172a", marginTop: "2px", lineHeight: 1.1 }}>
              {consumedCalories.toLocaleString()}
            </div>
            <span style={{ fontSize: "10.5px", color: "#94a3b8", fontWeight: 700 }}>
              of {calorieGoal.toLocaleString()} kcal
            </span>
          </div>

          {/* Column B: Ring Gauge / Calories Remaining */}
          <div style={{ textAlign: "center", position: "relative", width: "94px", height: "94px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
              {/* Background Ring */}
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#f1f5f9"
                strokeWidth="3.4"
              />
              {/* Progress Ring */}
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="url(#calorieGradient)"
                strokeWidth="3.4"
                strokeDasharray={`${intakePercent}, 100`}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="calorieGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <div style={{ position: "absolute", textAlign: "center" }}>
              <div style={{ fontSize: "15px", fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>
                {caloriesRemaining.toLocaleString()}
              </div>
              <span style={{ fontSize: "8.5px", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                Left
              </span>
            </div>
          </div>

          {/* Column C: Active Burn Target (With 400 kcal Goal) */}
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "10.5px", fontWeight: 700, color: "#ea580c", textTransform: "uppercase" }}>
              Active Burn
            </span>
            <div style={{ fontSize: "20px", fontWeight: 900, color: "#ea580c", marginTop: "2px", lineHeight: 1.1 }}>
              {burnedCalories}
            </div>
            <span style={{ fontSize: "10.5px", color: "#94a3b8", fontWeight: 700 }}>
              Target: {burnTarget} kcal
            </span>
          </div>
        </div>

        {/* Burn Target Progress Bar */}
        <div style={{ marginBottom: "18px", background: "#fff7ed", padding: "8px 12px", borderRadius: "12px", border: "1px solid #ffedd5" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
            <span style={{ fontSize: "10.5px", fontWeight: 800, color: "#ea580c" }}>
              <i className="fa-solid fa-fire" style={{ marginRight: "4px" }}></i> Daily Burn Goal: {burnPercent}%
            </span>
            <span style={{ fontSize: "10.5px", fontWeight: 700, color: "#9a3412" }}>
              {burnedCalories} / {burnTarget} kcal
            </span>
          </div>
          <div style={{ height: "6px", background: "#fed7aa", borderRadius: "999px", overflow: "hidden" }}>
            <div style={{ width: `${burnPercent}%`, height: "100%", background: "#ea580c", borderRadius: "999px", transition: "width 0.4s ease" }}></div>
          </div>
        </div>

        <div style={{ height: "1px", background: "#f1f5f9", margin: "16px 0" }}></div>

        {/* ─── MACRONUTRIENT BARS ─── */}
        <div style={{ marginBottom: "18px" }}>
          <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.6px", display: "block", marginBottom: "10px" }}>
            DAILY MACRONUTRIENTS
          </span>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
            {/* Protein */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10.5px", fontWeight: 800, marginBottom: "4px" }}>
                <span style={{ color: "#0f172a" }}>Protein</span>
                <span style={{ color: "#6366f1" }}>{proteinG}g</span>
              </div>
              <div style={{ height: "5px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
                <div style={{ width: `${Math.min(Math.round((proteinG / targetProtein) * 100), 100)}%`, height: "100%", background: "#6366f1", borderRadius: "999px" }}></div>
              </div>
              <span style={{ fontSize: "9px", color: "#94a3b8", fontWeight: 700 }}>Goal: {targetProtein}g</span>
            </div>

            {/* Carbs */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10.5px", fontWeight: 800, marginBottom: "4px" }}>
                <span style={{ color: "#0f172a" }}>Carbs</span>
                <span style={{ color: "#0ea5e9" }}>{carbsG}g</span>
              </div>
              <div style={{ height: "5px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
                <div style={{ width: `${Math.min(Math.round((carbsG / targetCarbs) * 100), 100)}%`, height: "100%", background: "#0ea5e9", borderRadius: "999px" }}></div>
              </div>
              <span style={{ fontSize: "9px", color: "#94a3b8", fontWeight: 700 }}>Goal: {targetCarbs}g</span>
            </div>

            {/* Fats */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10.5px", fontWeight: 800, marginBottom: "4px" }}>
                <span style={{ color: "#0f172a" }}>Fats</span>
                <span style={{ color: "#f59e0b" }}>{fatG}g</span>
              </div>
              <div style={{ height: "5px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
                <div style={{ width: `${Math.min(Math.round((fatG / targetFat) * 100), 100)}%`, height: "100%", background: "#f59e0b", borderRadius: "999px" }}></div>
              </div>
              <span style={{ fontSize: "9px", color: "#94a3b8", fontWeight: 700 }}>Goal: {targetFat}g</span>
            </div>
          </div>
        </div>

        <div style={{ height: "1px", background: "#f1f5f9", margin: "16px 0" }}></div>

        {/* ─── RE-INTEGRATED HYDRATION TRACKER WITH QUICK-ADD PILLS ─── */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <i className="fa-solid fa-droplet" style={{ color: "#0ea5e9", fontSize: "12px" }}></i>
              <span style={{ fontSize: "11px", fontWeight: 800, color: "#0f172a" }}>
                Hydration Tracker
              </span>
            </div>
            <span style={{ fontSize: "11px", fontWeight: 800, color: "#0ea5e9" }}>
              {todayWaterMl.toLocaleString()} / {waterTarget.toLocaleString()} ml ({waterPercent}%)
            </span>
          </div>

          {/* Water Progress Bar */}
          <div style={{ height: "8px", background: "#e0f2fe", borderRadius: "999px", overflow: "hidden", marginBottom: "10px" }}>
            <div style={{ width: `${waterPercent}%`, height: "100%", background: "linear-gradient(90deg, #38bdf8 0%, #0284c7 100%)", borderRadius: "999px", transition: "width 0.3s ease" }}></div>
          </div>

          {/* Quick-Add Water Buttons */}
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => handleQuickAddWater(250)}
              style={{ flex: 1, background: "#f0f9ff", border: "1px solid #bae6fd", color: "#0284c7", padding: "6px 0", borderRadius: "10px", fontSize: "11px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}
            >
              <i className="fa-solid fa-plus" style={{ fontSize: "9px" }}></i> 250 ml (Glass)
            </button>
            <button
              onClick={() => handleQuickAddWater(500)}
              style={{ flex: 1, background: "#f0f9ff", border: "1px solid #bae6fd", color: "#0284c7", padding: "6px 0", borderRadius: "10px", fontSize: "11px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}
            >
              <i className="fa-solid fa-plus" style={{ fontSize: "9px" }}></i> 500 ml (Bottle)
            </button>
          </div>
        </div>

      </div>

      {/* ─── 3. QUICK LOG ACTION BUTTONS ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
        
        {/* Button A: Log Food */}
        <button
          onClick={() => setActiveSheet("food")}
          style={{
            background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
            color: "white",
            border: "none",
            borderRadius: "16px",
            padding: "14px",
            fontWeight: 800,
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            cursor: "pointer",
            boxShadow: "0 6px 18px rgba(99, 102, 241, 0.25)"
          }}
        >
          <i className="fa-solid fa-utensils"></i>
          <span>Log Food</span>
        </button>

        {/* Button B: Log Workout */}
        <button
          onClick={() => setActiveSheet("workout")}
          style={{
            background: "#ffffff",
            color: "#0f172a",
            border: "1px solid #e2e8f0",
            borderRadius: "16px",
            padding: "14px",
            fontWeight: 800,
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.03)"
          }}
        >
          <i className="fa-solid fa-dumbbell" style={{ color: "#ea580c" }}></i>
          <span>Log Workout</span>
        </button>
      </div>

      {/* ─── 4. TODAY'S RECENT LOGS LIST ─── */}
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "20px", padding: "18px", boxShadow: "0 4px 15px rgba(0,0,0,0.02)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <span style={{ fontSize: "10.5px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            TODAY'S LOGGED MEALS ({todayMeals.length})
          </span>
        </div>

        {todayMeals.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px 0", color: "#94a3b8" }}>
            <i className="fa-solid fa-bowl-food" style={{ fontSize: "24px", marginBottom: "6px", display: "block", color: "#cbd5e1" }}></i>
            <span style={{ fontSize: "12px", fontWeight: 700 }}>No meals logged yet today.</span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {todayMeals.slice(-5).reverse().map((meal) => (
              <div key={meal.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #f1f5f9" }}>
                <div>
                  <strong style={{ fontSize: "13px", color: "#0f172a", display: "block" }}>{meal.name}</strong>
                  <span style={{ fontSize: "10.5px", color: "#64748b", fontWeight: 600 }}>Meal Entry</span>
                </div>
                <span style={{ fontSize: "13px", fontWeight: 800, color: "#6366f1" }}>
                  +{meal.calories} kcal
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── 5. SLIDE-OVER LOG FOOD MODAL ─── */}
      {activeSheet === "food" && (
        <div onClick={() => setActiveSheet(null)} style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.45)", backdropFilter: "blur(3px)", zIndex: 9999, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "440px", background: "#ffffff", borderTopLeftRadius: "24px", borderTopRightRadius: "24px", padding: "20px", boxShadow: "0 -10px 30px rgba(0,0,0,0.15)", animation: "slideUp 0.25s ease-out" }}>
            <div style={{ width: "40px", height: "4px", background: "#cbd5e1", borderRadius: "2px", margin: "0 auto 16px auto" }}></div>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "#e0e7ff", color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px" }}>
                  <i className="fa-solid fa-utensils"></i>
                </div>
                <h3 style={{ fontSize: "16px", fontWeight: 900, margin: 0, color: "#0f172a" }}>Log Food & Meal</h3>
              </div>
              <button onClick={() => setActiveSheet(null)} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "18px", cursor: "pointer" }}>✕</button>
            </div>

            <form onSubmit={handleSaveMeal}>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "4px" }}>Food / Meal Name</label>
                <input
                  type="text"
                  placeholder="e.g., Grilled Chicken Breast with Rice"
                  required
                  autoFocus
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #cbd5e1", fontSize: "14px", fontWeight: 700, outline: "none", background: "#f8fafc" }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "4px" }}>Estimated Calories (kcal)</label>
                <input
                  type="number"
                  placeholder="e.g., 450"
                  required
                  value={foodCal}
                  onChange={(e) => setFoodCal(e.target.value)}
                  style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #cbd5e1", fontSize: "14px", fontWeight: 700, outline: "none", background: "#f8fafc" }}
                />
              </div>

              <button type="submit" style={{ width: "100%", background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)", color: "white", border: "none", padding: "13px", borderRadius: "12px", fontWeight: 800, fontSize: "13px", cursor: "pointer", boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)" }}>
                Confirm & Log Meal
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── 6. SLIDE-OVER LOG WORKOUT MODAL ─── */}
      {activeSheet === "workout" && (
        <div onClick={() => setActiveSheet(null)} style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.45)", backdropFilter: "blur(3px)", zIndex: 9999, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "440px", background: "#ffffff", borderTopLeftRadius: "24px", borderTopRightRadius: "24px", padding: "20px", boxShadow: "0 -10px 30px rgba(0,0,0,0.15)", animation: "slideUp 0.25s ease-out" }}>
            <div style={{ width: "40px", height: "4px", background: "#cbd5e1", borderRadius: "2px", margin: "0 auto 16px auto" }}></div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "#fff7ed", color: "#ea580c", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px" }}>
                  <i className="fa-solid fa-dumbbell"></i>
                </div>
                <h3 style={{ fontSize: "16px", fontWeight: 900, margin: 0, color: "#0f172a" }}>Log Workout Session</h3>
              </div>
              <button onClick={() => setActiveSheet(null)} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "18px", cursor: "pointer" }}>✕</button>
            </div>

            <form onSubmit={handleSaveWorkout}>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "4px" }}>Activity Type</label>
                <select
                  value={workoutType}
                  onChange={(e) => setWorkoutType(e.target.value)}
                  style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #cbd5e1", fontSize: "14px", fontWeight: 700, outline: "none", background: "#f8fafc" }}
                >
                  <option value="Running">Running / Jogging (~8 kcal/min)</option>
                  <option value="Cycling">Cycling / Bike (~7 kcal/min)</option>
                  <option value="Gym / Weights">Weightlifting & Gym (~6 kcal/min)</option>
                  <option value="Walking">Brisk Walking (~4 kcal/min)</option>
                  <option value="HIIT">HIIT / Boxing (~10 kcal/min)</option>
                </select>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "4px" }}>Duration (Minutes)</label>
                <input
                  type="number"
                  placeholder="30"
                  required
                  value={workoutDuration}
                  onChange={(e) => setWorkoutDuration(e.target.value)}
                  style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #cbd5e1", fontSize: "14px", fontWeight: 700, outline: "none", background: "#f8fafc" }}
                />
              </div>

              <button type="submit" style={{ width: "100%", background: "linear-gradient(135deg, #ea580c 0%, #f97316 100%)", color: "white", border: "none", padding: "13px", borderRadius: "12px", fontWeight: 800, fontSize: "13px", cursor: "pointer", boxShadow: "0 4px 12px rgba(234, 88, 12, 0.3)" }}>
                Log Workout & Burn
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
