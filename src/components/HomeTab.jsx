import React, { useState, useEffect, useMemo } from "react";

export default function HomeTab({
  user,
  appData,
  saveToCloud,
  showToast,
  setShowAboutModal
}) {
  // ─── 1. DYNAMIC LOCAL DATE & MIDNIGHT HEARTBEAT ───
  const getTodayISO = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
  const [currentDateStr, setCurrentDateStr] = useState(getTodayISO());

  useEffect(() => {
    const interval = setInterval(() => {
      const nowStr = getTodayISO();
      if (nowStr !== currentDateStr) {
        setCurrentDateStr(nowStr);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [currentDateStr]);

  const formattedToday = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric"
    });
  }, [currentDateStr]);

  // ─── 2. DYNAMIC FUNCTIONAL STREAK ENGINE ───
  const dynamicStreak = useMemo(() => {
    const activeDates = new Set();
    (appData?.meals || []).forEach((m) => {
      const d = m.dateLogged || m.date;
      if (d) activeDates.add(String(d).slice(0, 10));
    });
    (appData?.workoutLogs || []).forEach((w) => {
      const d = w.dateLogged || w.date;
      if (d) activeDates.add(String(d).slice(0, 10));
    });
    (appData?.waterLogs || []).forEach((wt) => {
      const d = wt.dateLogged || wt.date;
      if (d) activeDates.add(String(d).slice(0, 10));
    });
    (appData?.weightHistory || []).forEach((wh) => {
      const d = wh.dateLogged || wh.date;
      if (d) activeDates.add(String(d).slice(0, 10));
    });

    const storedStreak = Number(appData?.streakDays) || 0;
    if (activeDates.size === 0) return storedStreak || 1;

    let streak = 0;
    const today = new Date();
    const todayISO = today.toLocaleDateString("en-CA");
    
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const yesterdayISO = yesterday.toLocaleDateString("en-CA");

    // Kung nakapag-log ngayong araw o kahapon, tuloy ang streak
    let checkDate = activeDates.has(todayISO) 
      ? new Date() 
      : activeDates.has(yesterdayISO) 
        ? yesterday 
        : null;

    if (!checkDate) return storedStreak > 0 ? storedStreak : 0;

    while (checkDate) {
      const iso = checkDate.toLocaleDateString("en-CA");
      if (activeDates.has(iso)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return Math.max(streak, storedStreak);
  }, [appData, currentDateStr]);

  // ─── 3. DATA CONSISTENCY WITH OTHER TABS (PROGRESS & PROFILE) ───
  const currentWeight = Number(appData?.currentWeight || appData?.weight || 68.2);
  const calorieGoal = Number(appData?.dailyCalorieTarget || appData?.baseGoal || 2200);
  const burnTarget = Number(appData?.dailyBurnTarget || 400);
  // EFSA water standard: 35ml bawat kg ng timbang (e.g. 68.2kg * 35 ≈ 2,400 - 2,500 ml)
  const waterTarget = Number(appData?.dailyWaterTarget || Math.round((currentWeight * 35) / 100) * 100 || 2400);
  const stepGoal = Number(appData?.dailyStepsTarget || 10000);

  // Filtered Today's Metrics
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

  const consumedCalories = useMemo(() => {
    return todayMeals.reduce((acc, m) => acc + (Number(m.calories || m.cal) || 0), 0);
  }, [todayMeals]);

  const burnedCalories = useMemo(() => {
    return todayWorkouts.reduce((acc, w) => acc + (Number(w.burnedCal || w.calories) || 0), 0);
  }, [todayWorkouts]);

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

  // Hydration Calculation
  const todayWaterMl = useMemo(() => {
    const logs = (appData?.waterLogs || []).filter(
      (w) => (w.dateLogged || w.date) === currentDateStr
    );
    if (logs.length > 0) {
      return logs.reduce((acc, w) => acc + (Number(w.amountMl || w.amount) || 0), 0);
    }
    if (appData?.lastWaterDate === currentDateStr) {
      return Number(appData?.todayWaterMl) || 0;
    }
    return 0;
  }, [appData?.waterLogs, appData?.todayWaterMl, appData?.lastWaterDate, currentDateStr]);

  // Steps & Waypoint Calculation
  const todaySteps = useMemo(() => {
    const logs = (appData?.stepLogs || []).filter(
      (s) => (s.dateLogged || s.date) === currentDateStr
    );
    if (logs.length > 0) {
      return logs.reduce((acc, s) => acc + (Number(s.steps || s.amount) || 0), 0);
    }
    if (appData?.lastStepDate === currentDateStr && appData?.todaySteps) {
      return Number(appData.todaySteps);
    }
    return 6420; // Baseline initial demo activity
  }, [appData?.stepLogs, appData?.todaySteps, appData?.lastStepDate, currentDateStr]);

  // Waypoint Distance: 1 step ≈ 0.00075 km (75cm average stride length)
  const waypointKm = (todaySteps * 0.00075).toFixed(2);
  const waypointTargetKm = (stepGoal * 0.00075).toFixed(2);
  const stepsBurnedCal = Math.round(todaySteps * 0.04); // ~0.04 kcal kada hakbang

  // Percentages & Remainders
  const caloriesRemaining = Math.max(calorieGoal - consumedCalories + burnedCalories, 0);
  const intakePercent = Math.min(Math.round((consumedCalories / calorieGoal) * 100), 100);
  const burnPercent = Math.min(Math.round((burnedCalories / burnTarget) * 100), 100);
  const waterPercent = Math.min(Math.round((todayWaterMl / waterTarget) * 100), 100);
  const stepPercent = Math.min(Math.round((todaySteps / stepGoal) * 100), 100);

  // Macro Targets (Scientific 30% P / 45% C / 25% F distribution)
  const targetProtein = Math.round((calorieGoal * 0.3) / 4);
  const targetCarbs = Math.round((calorieGoal * 0.45) / 4);
  const targetFat = Math.round((calorieGoal * 0.25) / 9);

  // Quick Action Handlers
  const handleQuickAddWater = (amount) => {
    const newRecord = {
      id: Date.now(),
      amountMl: amount,
      dateLogged: currentDateStr,
      timestamp: Date.now()
    };
    const updated = [...(appData?.waterLogs || []), newRecord];
    if (saveToCloud) {
      saveToCloud({
        ...appData,
        waterLogs: updated,
        todayWaterMl: todayWaterMl + amount,
        lastWaterDate: currentDateStr
      });
    }
    if (showToast) showToast(`💧 Added ${amount} ml of water!`);
  };

  const handleQuickAddSteps = (added) => {
    const newRecord = {
      id: Date.now(),
      steps: added,
      dateLogged: currentDateStr,
      timestamp: Date.now()
    };
    const updated = [...(appData?.stepLogs || []), newRecord];
    const newTotal = todaySteps + added;
    if (saveToCloud) {
      saveToCloud({
        ...appData,
        stepLogs: updated,
        todaySteps: newTotal,
        lastStepDate: currentDateStr
      });
    }
    if (showToast) showToast(`👟 Added +${added.toLocaleString()} steps!`);
  };

  // Slide-over modals
  const [activeSheet, setActiveSheet] = useState(null);
  const [foodName, setFoodName] = useState("");
  const [foodCal, setFoodCal] = useState("");
  const [workoutType, setWorkoutType] = useState("Running");
  const [workoutDuration, setWorkoutDuration] = useState("30");

  const handleSaveMeal = (e) => {
    e.preventDefault();
    const calNum = parseInt(foodCal, 10);
    if (!foodName.trim() || isNaN(calNum) || calNum <= 0) {
      if (showToast) showToast("Please enter valid food details!");
      return;
    }
    const newMeal = {
      id: Date.now(),
      name: foodName.trim(),
      calories: calNum,
      dateLogged: currentDateStr,
      timestamp: Date.now()
    };
    if (saveToCloud) {
      saveToCloud({ ...appData, meals: [...(appData?.meals || []), newMeal] });
    }
    if (showToast) showToast(`🍽️ Logged: ${foodName} (${calNum} kcal)`);
    setFoodName("");
    setFoodCal("");
    setActiveSheet(null);
  };

  const handleSaveWorkout = (e) => {
    e.preventDefault();
    const dur = parseInt(workoutDuration, 10) || 30;
    const estBurn = dur * 8;
    const newWorkout = {
      id: Date.now(),
      type: workoutType,
      durationMin: dur,
      burnedCal: estBurn,
      dateLogged: currentDateStr,
      timestamp: Date.now()
    };
    if (saveToCloud) {
      saveToCloud({ ...appData, workoutLogs: [...(appData?.workoutLogs || []), newWorkout] });
    }
    if (showToast) showToast(`🔥 Workout logged: +${estBurn} kcal!`);
    setActiveSheet(null);
  };

  return (
    <div className="screen active" style={{ maxWidth: "420px", margin: "0 auto", padding: "0 10px 24px 10px" }}>
      
      {/* ─── 1. TOP BRAND HEADER & DYNAMIC STREAK ─── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", paddingTop: "4px" }}>
        {/* NutriPulse Authentic Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "30px", height: "30px", borderRadius: "10px", background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", boxShadow: "0 4px 10px rgba(99, 102, 241, 0.3)" }}>
            <i className="fa-solid fa-heart-pulse" style={{ fontSize: "14px" }}></i>
          </div>
          <div>
            <span style={{ fontSize: "14.5px", fontWeight: 900, color: "#0f172a", letterSpacing: "1.2px", lineHeight: 1, display: "block" }}>
              NUTRIPULSE
            </span>
            <span style={{ fontSize: "8px", fontWeight: 800, color: "#64748b", letterSpacing: "0.8px", textTransform: "uppercase" }}>
              METABOLIC INTELLIGENCE
            </span>
          </div>
        </div>

        {/* Dynamic Functional Streak Pill */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ background: "#fff7ed", border: "1px solid #ffedd5", padding: "4px 10px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "5px" }}>
            <i className="fa-solid fa-fire" style={{ color: "#ea580c", fontSize: "12px" }}></i>
            <span style={{ fontSize: "12px", fontWeight: 800, color: "#ea580c" }}>
              {dynamicStreak} {dynamicStreak === 1 ? "Day" : "Days"}
            </span>
          </div>

          <button 
            onClick={() => setShowAboutModal && setShowAboutModal(true)}
            style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#f8fafc", border: "1px solid #e2e8f0", color: "#64748b", fontWeight: 800, fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            title="App Information"
          >
            ?
          </button>
        </div>
      </div>

      {/* ─── 2. COMPACT MASTER ENERGY OVERVIEW CARD ─── */}
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "20px", padding: "14px", marginBottom: "10px", boxShadow: "0 6px 20px rgba(15, 23, 42, 0.04)" }}>
        
        {/* Card Header & Live Date */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <span style={{ fontSize: "9.5px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.6px" }}>
            ENERGY & METABOLIC BALANCE
          </span>
          <span style={{ fontSize: "9.5px", fontWeight: 800, color: "#6366f1", background: "#eef2ff", padding: "2px 7px", borderRadius: "6px" }}>
            {formattedToday}
          </span>
        </div>

        {/* 3-Column Compact Energy HUD */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
          
          {/* Intake */}
          <div>
            <span style={{ fontSize: "9.5px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Intake</span>
            <div style={{ fontSize: "18px", fontWeight: 900, color: "#0f172a", lineHeight: 1.1, marginTop: "1px" }}>
              {consumedCalories.toLocaleString()}
            </div>
            <span style={{ fontSize: "9.5px", color: "#94a3b8", fontWeight: 700 }}>of {calorieGoal} kcal</span>
          </div>

          {/* Compact 76px Circular Ring */}
          <div style={{ position: "relative", width: "76px", height: "76px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#f1f5f9"
                strokeWidth="3.6"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="url(#calGradCompact)"
                strokeWidth="3.6"
                strokeDasharray={`${intakePercent}, 100`}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="calGradCompact" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <div style={{ position: "absolute", textAlign: "center" }}>
              <div style={{ fontSize: "13.5px", fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>
                {caloriesRemaining.toLocaleString()}
              </div>
              <span style={{ fontSize: "7.5px", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>Left</span>
            </div>
          </div>

          {/* Active Burn (400 kcal Goal) */}
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "9.5px", fontWeight: 700, color: "#ea580c", textTransform: "uppercase" }}>Active Burn</span>
            <div style={{ fontSize: "18px", fontWeight: 900, color: "#ea580c", lineHeight: 1.1, marginTop: "1px" }}>
              {burnedCalories}
            </div>
            <span style={{ fontSize: "9.5px", color: "#94a3b8", fontWeight: 700 }}>Target: {burnTarget} kcal</span>
          </div>
        </div>

        {/* Compact Burn Progress Line */}
        <div style={{ background: "#fff7ed", padding: "6px 10px", borderRadius: "10px", border: "1px solid #ffedd5", marginBottom: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
            <span style={{ fontSize: "9.5px", fontWeight: 800, color: "#ea580c" }}>
              <i className="fa-solid fa-fire" style={{ marginRight: "3px" }}></i> Burn Goal: {burnPercent}%
            </span>
            <span style={{ fontSize: "9.5px", fontWeight: 700, color: "#9a3412" }}>{burnedCalories} / {burnTarget} kcal</span>
          </div>
          <div style={{ height: "4px", background: "#fed7aa", borderRadius: "999px", overflow: "hidden" }}>
            <div style={{ width: `${burnPercent}%`, height: "100%", background: "#ea580c", borderRadius: "999px" }}></div>
          </div>
        </div>

        {/* Compact Macronutrients */}
        <div style={{ marginBottom: "12px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9.5px", fontWeight: 800, marginBottom: "2px" }}>
                <span style={{ color: "#0f172a" }}>Protein</span>
                <span style={{ color: "#6366f1" }}>{proteinG}/{targetProtein}g</span>
              </div>
              <div style={{ height: "4px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
                <div style={{ width: `${Math.min(Math.round((proteinG / targetProtein) * 100), 100)}%`, height: "100%", background: "#6366f1", borderRadius: "999px" }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9.5px", fontWeight: 800, marginBottom: "2px" }}>
                <span style={{ color: "#0f172a" }}>Carbs</span>
                <span style={{ color: "#0ea5e9" }}>{carbsG}/{targetCarbs}g</span>
              </div>
              <div style={{ height: "4px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
                <div style={{ width: `${Math.min(Math.round((carbsG / targetCarbs) * 100), 100)}%`, height: "100%", background: "#0ea5e9", borderRadius: "999px" }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9.5px", fontWeight: 800, marginBottom: "2px" }}>
                <span style={{ color: "#0f172a" }}>Fats</span>
                <span style={{ color: "#f59e0b" }}>{fatG}/{targetFat}g</span>
              </div>
              <div style={{ height: "4px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
                <div style={{ width: `${Math.min(Math.round((fatG / targetFat) * 100), 100)}%`, height: "100%", background: "#f59e0b", borderRadius: "999px" }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Integrated Hydration Tracker */}
        <div style={{ background: "#f8fafc", padding: "8px 10px", borderRadius: "12px", border: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <i className="fa-solid fa-droplet" style={{ color: "#0ea5e9", fontSize: "11px" }}></i>
              <span style={{ fontSize: "10px", fontWeight: 800, color: "#0f172a" }}>Hydration</span>
            </div>
            <span style={{ fontSize: "10px", fontWeight: 800, color: "#0ea5e9" }}>
              {todayWaterMl.toLocaleString()} / {waterTarget.toLocaleString()} ml ({waterPercent}%)
            </span>
          </div>

          <div style={{ height: "5px", background: "#e0f2fe", borderRadius: "999px", overflow: "hidden", marginBottom: "8px" }}>
            <div style={{ width: `${waterPercent}%`, height: "100%", background: "linear-gradient(90deg, #38bdf8 0%, #0284c7 100%)", borderRadius: "999px" }}></div>
          </div>

          <div style={{ display: "flex", gap: "6px" }}>
            <button
              onClick={() => handleQuickAddWater(250)}
              style={{ flex: 1, background: "#ffffff", border: "1px solid #bae6fd", color: "#0284c7", padding: "5px 0", borderRadius: "8px", fontSize: "10px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
            >
              <i className="fa-solid fa-plus" style={{ fontSize: "8px" }}></i> 250 ml
            </button>
            <button
              onClick={() => handleQuickAddWater(500)}
              style={{ flex: 1, background: "#ffffff", border: "1px solid #bae6fd", color: "#0284c7", padding: "5px 0", borderRadius: "8px", fontSize: "10px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
            >
              <i className="fa-solid fa-plus" style={{ fontSize: "8px" }}></i> 500 ml
            </button>
          </div>
        </div>

      </div>

      {/* ─── 3. NEW COMPACT STEPS & WAYPOINT CARD (IPINALIT SA LOGGED MEALS) ─── */}
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "20px", padding: "14px", marginBottom: "10px", boxShadow: "0 6px 20px rgba(15, 23, 42, 0.04)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <i className="fa-solid fa-person-walking" style={{ color: "#10b981", fontSize: "13px" }}></i>
            <span style={{ fontSize: "9.5px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.6px" }}>
              DAILY MOVEMENT & WAYPOINT
            </span>
          </div>
          <span style={{ fontSize: "9.5px", fontWeight: 800, color: "#10b981", background: "#ecfdf5", padding: "2px 7px", borderRadius: "6px" }}>
            Goal: {stepGoal.toLocaleString()}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "10px", alignItems: "center" }}>
          {/* Column A: Steps */}
          <div>
            <div style={{ fontSize: "22px", fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>
              {todaySteps.toLocaleString()} <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 700 }}>steps</span>
            </div>
            <div style={{ height: "5px", background: "#e2e8f0", borderRadius: "999px", overflow: "hidden", margin: "6px 0 4px 0" }}>
              <div style={{ width: `${stepPercent}%`, height: "100%", background: "linear-gradient(90deg, #10b981 0%, #059669 100%)", borderRadius: "999px" }}></div>
            </div>
            <span style={{ fontSize: "9.5px", color: "#64748b", fontWeight: 700 }}>
              {stepPercent}% completed (~{stepsBurnedCal} kcal)
            </span>
          </div>

          {/* Column B: Waypoint Distance */}
          <div style={{ background: "#f8fafc", padding: "8px 10px", borderRadius: "12px", border: "1px solid #f1f5f9", textAlign: "right" }}>
            <span style={{ fontSize: "9px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", display: "block" }}>
              Waypoint Covered
            </span>
            <div style={{ fontSize: "17px", fontWeight: 900, color: "#059669", marginTop: "1px" }}>
              {waypointKm} <span style={{ fontSize: "10px", color: "#64748b", fontWeight: 700 }}>km</span>
            </div>
            <span style={{ fontSize: "9px", color: "#94a3b8", fontWeight: 700 }}>Target: {waypointTargetKm} km</span>
          </div>
        </div>

        {/* Quick Add Step Pills */}
        <div style={{ display: "flex", gap: "6px", marginTop: "10px" }}>
          <button
            onClick={() => handleQuickAddSteps(500)}
            style={{ flex: 1, background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", padding: "5px 0", borderRadius: "8px", fontSize: "10px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
          >
            <i className="fa-solid fa-plus" style={{ fontSize: "8px" }}></i> 500 Steps
          </button>
          <button
            onClick={() => handleQuickAddSteps(1000)}
            style={{ flex: 1, background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", padding: "5px 0", borderRadius: "8px", fontSize: "10px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
          >
            <i className="fa-solid fa-plus" style={{ fontSize: "8px" }}></i> 1,000 Steps
          </button>
        </div>
      </div>

      {/* ─── 4. QUICK ACTION LOG BUTTONS ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        <button
          onClick={() => setActiveSheet("food")}
          style={{
            background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
            color: "white",
            border: "none",
            borderRadius: "14px",
            padding: "11px",
            fontWeight: 800,
            fontSize: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(99, 102, 241, 0.22)"
          }}
        >
          <i className="fa-solid fa-utensils" style={{ fontSize: "11px" }}></i>
          <span>Log Food</span>
        </button>

        <button
          onClick={() => setActiveSheet("workout")}
          style={{
            background: "#ffffff",
            color: "#0f172a",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "11px",
            fontWeight: 800,
            fontSize: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            cursor: "pointer"
          }}
        >
          <i className="fa-solid fa-dumbbell" style={{ color: "#ea580c", fontSize: "11px" }}></i>
          <span>Log Workout</span>
        </button>
      </div>

      {/* ─── 5. SLIDE-OVER LOG FOOD MODAL ─── */}
      {activeSheet === "food" && (
        <div onClick={() => setActiveSheet(null)} style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.45)", backdropFilter: "blur(3px)", zIndex: 9999, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "420px", background: "#ffffff", borderTopLeftRadius: "22px", borderTopRightRadius: "22px", padding: "18px", boxShadow: "0 -10px 30px rgba(0,0,0,0.15)", animation: "slideUp 0.2s ease-out" }}>
            <div style={{ width: "36px", height: "4px", background: "#cbd5e1", borderRadius: "2px", margin: "0 auto 12px auto" }}></div>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "26px", height: "26px", borderRadius: "8px", background: "#e0e7ff", color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px" }}>
                  <i className="fa-solid fa-utensils"></i>
                </div>
                <h3 style={{ fontSize: "14px", fontWeight: 800, margin: 0, color: "#0f172a" }}>Quick Log Food</h3>
              </div>
              <button onClick={() => setActiveSheet(null)} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "16px", cursor: "pointer" }}>✕</button>
            </div>

            <form onSubmit={handleSaveMeal}>
              <div style={{ marginBottom: "10px" }}>
                <label style={{ fontSize: "10.5px", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "3px" }}>Food or Meal Name</label>
                <input
                  type="text"
                  placeholder="e.g., Grilled Chicken Breast (150g)"
                  required
                  autoFocus
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px", fontWeight: 700, outline: "none", background: "#f8fafc" }}
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "10.5px", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "3px" }}>Estimated Calories (kcal)</label>
                <input
                  type="number"
                  placeholder="e.g., 247"
                  required
                  value={foodCal}
                  onChange={(e) => setFoodCal(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px", fontWeight: 700, outline: "none", background: "#f8fafc" }}
                />
              </div>

              <button type="submit" style={{ width: "100%", background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)", color: "white", border: "none", padding: "11px", borderRadius: "10px", fontWeight: 800, fontSize: "12px", cursor: "pointer" }}>
                Confirm & Log Meal
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── 6. SLIDE-OVER LOG WORKOUT MODAL ─── */}
      {activeSheet === "workout" && (
        <div onClick={() => setActiveSheet(null)} style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.45)", backdropFilter: "blur(3px)", zIndex: 9999, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "420px", background: "#ffffff", borderTopLeftRadius: "22px", borderTopRightRadius: "22px", padding: "18px", boxShadow: "0 -10px 30px rgba(0,0,0,0.15)", animation: "slideUp 0.2s ease-out" }}>
            <div style={{ width: "36px", height: "4px", background: "#cbd5e1", borderRadius: "2px", margin: "0 auto 12px auto" }}></div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "26px", height: "26px", borderRadius: "8px", background: "#fff7ed", color: "#ea580c", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px" }}>
                  <i className="fa-solid fa-dumbbell"></i>
                </div>
                <h3 style={{ fontSize: "14px", fontWeight: 800, margin: 0, color: "#0f172a" }}>Log Workout</h3>
              </div>
              <button onClick={() => setActiveSheet(null)} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "16px", cursor: "pointer" }}>✕</button>
            </div>

            <form onSubmit={handleSaveWorkout}>
              <div style={{ marginBottom: "10px" }}>
                <label style={{ fontSize: "10.5px", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "3px" }}>Activity</label>
                <select
                  value={workoutType}
                  onChange={(e) => setWorkoutType(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px", fontWeight: 700, outline: "none", background: "#f8fafc" }}
                >
                  <option value="Running">Running / Jogging (~8 kcal/min)</option>
                  <option value="Cycling">Cycling / Bike (~7 kcal/min)</option>
                  <option value="Gym / Weights">Weightlifting & Gym (~6 kcal/min)</option>
                  <option value="Walking">Brisk Walking (~4 kcal/min)</option>
                  <option value="HIIT">HIIT & Boxing (~10 kcal/min)</option>
                </select>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "10.5px", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "3px" }}>Duration (Minutes)</label>
                <input
                  type="number"
                  placeholder="30"
                  required
                  value={workoutDuration}
                  onChange={(e) => setWorkoutDuration(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px", fontWeight: 700, outline: "none", background: "#f8fafc" }}
                />
              </div>

              <button type="submit" style={{ width: "100%", background: "linear-gradient(135deg, #ea580c 0%, #f97316 100%)", color: "white", border: "none", padding: "11px", borderRadius: "10px", fontWeight: 800, fontSize: "12px", cursor: "pointer" }}>
                Log Workout & Burn
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
