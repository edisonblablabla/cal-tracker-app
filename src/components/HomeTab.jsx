import React, { useState, useEffect, useMemo, useRef } from "react";

// Default 5 Verified Quick Staples (Kinuha batay sa common staples)
const DEFAULT_STAPLES = [
  { id: "def_rice", name: "White Rice (Cooked)", cal: 205, serving: "1.0 cup", p: 4, c: 45, f: 0.4 },
  { id: "def_boiled_egg", name: "Boiled egg", cal: 72, serving: "1.0 egg", p: 6, c: 0.6, f: 5 },
  { id: "def_fried_egg", name: "Fried egg", cal: 83, serving: "1.0 large", p: 6, c: 0.4, f: 7 },
  { id: "def_chicken", name: "Chicken Breast", cal: 165, serving: "100.0 gram", p: 31, c: 0, f: 3.6 },
  { id: "def_banana", name: "Banana", cal: 105, serving: "1.0 medium", p: 1.3, c: 27, f: 0.3 }
];

export default function HomeTab({
  user,
  appData,
  saveToCloud,
  showToast,
  setShowAboutModal,
  totalCal = 0,
  activeGoal = 2416,
  totalP = 0,
  totalC = 0,
  totalF = 0,
  todayMeals = []
}) {
  const getTodayISO = () => new Date().toLocaleDateString("en-CA");
  const [currentDateStr, setCurrentDateStr] = useState(getTodayISO());

  useEffect(() => {
    const interval = setInterval(() => {
      const nowStr = getTodayISO();
      if (nowStr !== currentDateStr) setCurrentDateStr(nowStr);
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

  // Dynamic Functional Streak Engine
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

  const calorieGoal = Number(activeGoal || appData?.dailyCalorieTarget || appData?.baseGoal || 2416);

  // Today Workouts & Burn
  const todayWorkouts = useMemo(() => {
    return (appData?.workoutLogs || []).filter((w) => {
      const d = w.dateLogged || w.date;
      if (!d) return false;
      const str = String(d).trim();
      return str === currentDateStr || str.startsWith(currentDateStr);
    });
  }, [appData?.workoutLogs, currentDateStr]);

  const burnedCalories = useMemo(() => {
    return todayWorkouts.reduce((acc, w) => acc + (Number(w.burnedCal || w.calories) || 0), 0);
  }, [todayWorkouts]);

  // Consumed Calories (Ngayong Araw Lamang)
  const consumedCalories = useMemo(() => {
    if (Array.isArray(todayMeals) && todayMeals.length > 0) {
      return todayMeals.reduce((acc, m) => acc + (Number(m.cal ?? m.calories) || 0), 0);
    }
    const filtered = (appData?.meals || []).filter((m) => {
      const d = m.dateLogged || m.date;
      if (!d) return false;
      const str = String(d).trim();
      return str === currentDateStr || str.startsWith(currentDateStr);
    });
    return filtered.reduce((acc, m) => acc + (Number(m.cal ?? m.calories) || 0), 0);
  }, [todayMeals, appData?.meals, currentDateStr]);

  // Macronutrients
  const { proteinG, carbsG, fatG } = useMemo(() => {
    const list = (Array.isArray(todayMeals) && todayMeals.length > 0) 
      ? todayMeals 
      : (appData?.meals || []).filter((m) => {
          const d = m.dateLogged || m.date;
          if (!d) return false;
          const str = String(d).trim();
          return str === currentDateStr || str.startsWith(currentDateStr);
        });

    return list.reduce(
      (acc, m) => ({
        proteinG: acc.proteinG + (Number(m.p ?? m.protein) || 0),
        carbsG: acc.carbsG + (Number(m.c ?? m.carbs) || 0),
        fatG: acc.fatG + (Number(m.f ?? m.fats ?? m.fat) || 0)
      }),
      { proteinG: 0, carbsG: 0, fatG: 0 }
    );
  }, [todayMeals, appData?.meals, currentDateStr]);

  const burnTarget = Number(appData?.dailyBurnTarget || 400);
  const waterTarget = Number(appData?.dailyWaterTarget || 2400);
  const stepGoal = Number(appData?.dailyStepsTarget || 10000);

  // Hydration
  const todayWaterMl = useMemo(() => {
    const logs = (appData?.waterLogs || []).filter((w) => {
      const d = w.dateLogged || w.date;
      if (!d) return false;
      const str = String(d).trim();
      return str === currentDateStr || str.startsWith(currentDateStr);
    });
    if (logs.length > 0) {
      return logs.reduce((acc, w) => acc + (Number(w.amountMl || w.amount) || 0), 0);
    }
    if (appData?.lastWaterDate === currentDateStr) {
      return Number(appData?.todayWaterMl) || 0;
    }
    return 0;
  }, [appData?.waterLogs, appData?.todayWaterMl, appData?.lastWaterDate, currentDateStr]);

  const caloriesRemaining = Math.max(calorieGoal - consumedCalories + burnedCalories, 0);
  const intakePercent = Math.min(Math.round((consumedCalories / calorieGoal) * 100), 100);
  const burnPercent = Math.min(Math.round((burnedCalories / burnTarget) * 100), 100);
  const waterPercent = Math.min(Math.round((todayWaterMl / waterTarget) * 100), 100);

  const targetProtein = Math.round((calorieGoal * 0.3) / 4);
  const targetCarbs = Math.round((calorieGoal * 0.45) / 4);
  const targetFat = Math.round((calorieGoal * 0.25) / 9);

  // Satellite GPS Tracking Engine
  const [isGpsActive, setIsGpsActive] = useState(false);
  const [gpsDistanceKm, setGpsDistanceKm] = useState(0);
  const [gpsDurationSec, setGpsDurationSec] = useState(0);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);

  const watchIdRef = useRef(null);
  const lastCoordsRef = useRef(null);
  const timerRef = useRef(null);

  const calcHaversine = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const startGpsSession = () => {
    if (!navigator.geolocation) {
      if (showToast) showToast("❌ GPS is not supported on this device.");
      return;
    }
    setGpsDistanceKm(0);
    setGpsDurationSec(0);
    lastCoordsRef.current = null;
    setIsGpsActive(true);

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setGpsAccuracy(Math.round(accuracy));

        if (lastCoordsRef.current) {
          const deltaKm = calcHaversine(
            lastCoordsRef.current.lat,
            lastCoordsRef.current.lon,
            latitude,
            longitude
          );
          if (deltaKm > 0.003 && deltaKm < 0.2) {
            setGpsDistanceKm((prev) => Number((prev + deltaKm).toFixed(3)));
          }
        }
        lastCoordsRef.current = { lat: latitude, lon: longitude };
      },
      (err) => {
        console.error("GPS Error:", err);
        if (showToast) showToast("⚠️ Turn on Location / Allow GPS.");
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
    );

    watchIdRef.current = id;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setGpsDurationSec((sec) => sec + 1);
    }, 1000);

    if (showToast) showToast("🛰️ Connected to Satellite GPS! Tracking walk...");
  };

  const stopAndSaveGpsSession = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const stepsAdded = Math.round(gpsDistanceKm * 1333);
    const calBurned = Math.round(gpsDistanceKm * 60);

    if (gpsDistanceKm > 0.01) {
      const newWorkout = {
        id: Date.now(),
        type: "GPS Outdoor Walk",
        distanceKm: gpsDistanceKm,
        durationMin: Math.max(1, Math.round(gpsDurationSec / 60)),
        burnedCal: calBurned,
        steps: stepsAdded,
        dateLogged: currentDateStr,
        timestamp: Date.now()
      };
      const newStepRecord = {
        id: Date.now(),
        steps: stepsAdded,
        distanceKm: gpsDistanceKm,
        dateLogged: currentDateStr,
        timestamp: Date.now()
      };

      if (saveToCloud) {
        saveToCloud({
          ...appData,
          todaySteps: (Number(appData?.todaySteps) || 0) + stepsAdded,
          lastStepDate: currentDateStr,
          stepLogs: [...(appData?.stepLogs || []), newStepRecord],
          workoutLogs: [...(appData?.workoutLogs || []), newWorkout]
        });
      }
      if (showToast) showToast(`🎉 GPS Saved: +${gpsDistanceKm.toFixed(2)} km (+${stepsAdded} steps)!`);
    } else {
      if (showToast) showToast("GPS walk stopped (Too short to log).");
    }
    setIsGpsActive(false);
    setGpsDistanceKm(0);
    setGpsDurationSec(0);
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const todaySteps = useMemo(() => {
    const logs = (appData?.stepLogs || []).filter((s) => {
      const d = s.dateLogged || s.date;
      if (!d) return false;
      const str = String(d).trim();
      return str === currentDateStr || str.startsWith(currentDateStr);
    });
    if (logs.length > 0) {
      return logs.reduce((acc, s) => acc + (Number(s.steps || s.amount) || 0), 0);
    }
    if (appData?.lastStepDate === currentDateStr && appData?.todaySteps) {
      return Number(appData.todaySteps);
    }
    return 0;
  }, [appData?.stepLogs, appData?.todaySteps, appData?.lastStepDate, currentDateStr]);

  const todayWaypointKm = (todaySteps * 0.00075).toFixed(2);
  const waypointTargetKm = (stepGoal * 0.00075).toFixed(2);
  const stepPercent = Math.min(Math.round((todaySteps / stepGoal) * 100), 100);

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

  const handleManualAddSteps = (added) => {
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

  // ─── STAGE 2: QUICK FOOD MODAL STATE & LOGIC ───
  const [activeSheet, setActiveSheet] = useState(null);
  const [foodSearchQuery, setFoodSearchQuery] = useState("");
  const [isAddingCustomPreset, setIsAddingCustomPreset] = useState(false);
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);

  // Form states for creating Custom Preset
  const [newPresetName, setNewPresetName] = useState("");
  const [newPresetCal, setNewPresetCal] = useState("");
  const [newPresetServing, setNewPresetServing] = useState("");
  const [newPresetP, setNewPresetP] = useState("");
  const [newPresetC, setNewPresetC] = useState("");
  const [newPresetF, setNewPresetF] = useState("");

  // Form states for Manual One-Time Food Entry
  const [manualFoodName, setManualFoodName] = useState("");
  const [manualFoodCal, setManualFoodCal] = useState("");

  // Form states for Workout Log
  const [workoutType, setWorkoutType] = useState("Running");
  const [workoutDuration, setWorkoutDuration] = useState("30");

  // Pagsamahin ang default staples at ang custom quick staples ng user
  const combinedStaples = useMemo(() => {
    const customList = appData?.customQuickStaples || [];
    return [...DEFAULT_STAPLES, ...customList];
  }, [appData?.customQuickStaples]);

  // Real-time filter kapag nag-type sa quick search box
  const filteredStaples = useMemo(() => {
    if (!foodSearchQuery.trim()) return combinedStaples;
    const q = foodSearchQuery.toLowerCase().trim();
    return combinedStaples.filter((item) =>
      item.name.toLowerCase().includes(q) || (item.serving && item.serving.toLowerCase().includes(q))
    );
  }, [combinedStaples, foodSearchQuery]);

  // 1-TAP QUICK LOG FUNCTION PARA SA ANUMANG STAPLE
  const handleQuickLogItem = (item) => {
    const newMeal = {
      id: Date.now(),
      name: item.name,
      cal: Number(item.cal),
      calories: Number(item.cal),
      p: Number(item.p || 0),
      c: Number(item.c || 0),
      f: Number(item.f || 0),
      serving: item.serving || "1 serving",
      dateLogged: currentDateStr,
      timestamp: Date.now()
    };
    if (saveToCloud) {
      saveToCloud({
        ...appData,
        meals: [...(appData?.meals || []), newMeal]
      });
    }
    if (showToast) showToast(`🍽️ Logged: ${item.name} (+${item.cal} kcal)!`);
    setActiveSheet(null);
    setFoodSearchQuery("");
  };

  // MAG-SAVE NG BAGONG CUSTOM QUICK STAPLE SA PRESETS
  const handleSaveCustomPreset = (e) => {
    e.preventDefault();
    const calNum = parseInt(newPresetCal, 10);
    if (!newPresetName.trim() || isNaN(calNum) || calNum <= 0) {
      if (showToast) showToast("Pakilagay ang wastong pangalan at calories!");
      return;
    }
    const newPreset = {
      id: "cust_" + Date.now(),
      name: newPresetName.trim(),
      cal: calNum,
      serving: newPresetServing.trim() || "1 serving",
      p: Number(newPresetP) || 0,
      c: Number(newPresetC) || 0,
      f: Number(newPresetF) || 0,
      isCustom: true
    };
    const updated = [...(appData?.customQuickStaples || []), newPreset];
    if (saveToCloud) {
      saveToCloud({
        ...appData,
        customQuickStaples: updated
      });
    }
    if (showToast) showToast(`⭐ Nai-save si "${newPreset.name}" sa Quick Staples!`);
    setNewPresetName("");
    setNewPresetCal("");
    setNewPresetServing("");
    setNewPresetP("");
    setNewPresetC("");
    setNewPresetF("");
    setIsAddingCustomPreset(false);
  };

  // BURAHIN ANG ISANG CUSTOM PRESET
  const handleDeleteCustomPreset = (idToDelete) => {
    const updated = (appData?.customQuickStaples || []).filter((p) => p.id !== idToDelete);
    if (saveToCloud) {
      saveToCloud({
        ...appData,
        customQuickStaples: updated
      });
    }
    if (showToast) showToast("Natanggal ang custom quick item.");
  };

  // MANUAL ONE-TIME MEAL SAVE
  const handleManualSaveMeal = (e) => {
    e.preventDefault();
    const calNum = parseInt(manualFoodCal, 10);
    if (!manualFoodName.trim() || isNaN(calNum) || calNum <= 0) {
      if (showToast) showToast("Please enter valid food details!");
      return;
    }
    const newMeal = {
      id: Date.now(),
      name: manualFoodName.trim(),
      cal: calNum,
      calories: calNum,
      p: 0,
      c: 0,
      f: 0,
      dateLogged: currentDateStr,
      timestamp: Date.now()
    };
    if (saveToCloud) {
      saveToCloud({ ...appData, meals: [...(appData?.meals || []), newMeal] });
    }
    if (showToast) showToast(`🍽️ Logged: ${manualFoodName} (${calNum} kcal)`);
    setManualFoodName("");
    setManualFoodCal("");
    setActiveSheet(null);
  };

  // WORKOUT SAVE
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
      
      {/* ─── 1. TOP BRAND HEADER ─── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", paddingTop: "4px" }}>
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

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {/* Dynamic Streak Badge */}
          <div style={{ background: "#fff7ed", border: "1px solid #ffedd5", padding: "4px 9px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "5px" }}>
            <i className="fa-solid fa-fire" style={{ color: "#ea580c", fontSize: "11px" }}></i>
            <span style={{ fontSize: "11.5px", fontWeight: 800, color: "#ea580c" }}>
              {dynamicStreak} {dynamicStreak === 1 ? "Day" : "Days"}
            </span>
          </div>

          {/* About Modal (?) */}
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
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <span style={{ fontSize: "9.5px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.6px" }}>
            ENERGY & METABOLIC BALANCE
          </span>
          <span style={{ fontSize: "9.5px", fontWeight: 800, color: "#6366f1", background: "#eef2ff", padding: "2px 7px", borderRadius: "6px" }}>
            {formattedToday}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
          <div>
            <span style={{ fontSize: "9.5px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Intake</span>
            <div style={{ fontSize: "18px", fontWeight: 900, color: "#0f172a", lineHeight: 1.1, marginTop: "1px" }}>
              {consumedCalories.toLocaleString()}
            </div>
            <span style={{ fontSize: "9.5px", color: "#94a3b8", fontWeight: 700 }}>of {calorieGoal.toLocaleString()} kcal</span>
          </div>

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
                stroke="url(#calGradCleaned)"
                strokeWidth="3.6"
                strokeDasharray={`${intakePercent}, 100`}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="calGradCleaned" x1="0%" y1="0%" x2="100%" y2="100%">
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

          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "9.5px", fontWeight: 700, color: "#ea580c", textTransform: "uppercase" }}>Active Burn</span>
            <div style={{ fontSize: "18px", fontWeight: 900, color: "#ea580c", lineHeight: 1.1, marginTop: "1px" }}>
              {burnedCalories}
            </div>
            <span style={{ fontSize: "9.5px", color: "#94a3b8", fontWeight: 700 }}>Target: {burnTarget} kcal</span>
          </div>
        </div>

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

      {/* ─── 3. SATELLITE GPS MOVEMENT & WAYPOINT ─── */}
      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "20px", padding: "14px", marginBottom: "10px", boxShadow: "0 6px 20px rgba(15, 23, 42, 0.04)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <i className="fa-solid fa-satellite" style={{ color: isGpsActive ? "#10b981" : "#64748b", fontSize: "13px" }}></i>
            <span style={{ fontSize: "9.5px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.6px" }}>
              SATELLITE GPS MOVEMENT & WAYPOINT
            </span>
          </div>

          {isGpsActive ? (
            <span style={{ fontSize: "9.5px", fontWeight: 800, color: "#10b981", background: "#ecfdf5", padding: "2px 8px", borderRadius: "6px" }}>
              ● GPS ACTIVE {gpsAccuracy ? `(±${gpsAccuracy}m)` : ""}
            </span>
          ) : (
            <span style={{ fontSize: "9.5px", fontWeight: 800, color: "#64748b", background: "#f1f5f9", padding: "2px 7px", borderRadius: "6px" }}>
              Target: {stepGoal.toLocaleString()} Steps
            </span>
          )}
        </div>

        {isGpsActive ? (
          <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "white", borderRadius: "14px", padding: "14px", marginBottom: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
              <div>
                <span style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>GPS Distance</span>
                <div style={{ fontSize: "28px", fontWeight: 900, color: "#38bdf8", lineHeight: 1, marginTop: "2px" }}>
                  {gpsDistanceKm.toFixed(2)} <span style={{ fontSize: "14px", color: "#94a3b8" }}>km</span>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>Time</span>
                <div style={{ fontSize: "20px", fontWeight: 900, color: "#ffffff", marginTop: "2px" }}>
                  {formatTime(gpsDurationSec)}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", background: "rgba(255,255,255,0.06)", padding: "8px", borderRadius: "10px", marginBottom: "10px" }}>
              <div>
                <span style={{ fontSize: "9px", color: "#94a3b8", display: "block" }}>Steps:</span>
                <strong style={{ fontSize: "14px", color: "#4ade80" }}>~{Math.round(gpsDistanceKm * 1333)} steps</strong>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "9px", color: "#94a3b8", display: "block" }}>Active Burn:</span>
                <strong style={{ fontSize: "14px", color: "#fb923c" }}>+{Math.round(gpsDistanceKm * 60)} kcal</strong>
              </div>
            </div>

            <button
              onClick={stopAndSaveGpsSession}
              style={{ width: "100%", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "white", border: "none", padding: "10px", borderRadius: "10px", fontWeight: 800, fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
            >
              <i className="fa-solid fa-circle-check"></i>
              <span>Finish & Save Walk</span>
            </button>
          </div>
        ) : (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "10px", alignItems: "center", marginBottom: "10px" }}>
              <div>
                <div style={{ fontSize: "22px", fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>
                  {todaySteps.toLocaleString()} <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 700 }}>steps</span>
                </div>
                <div style={{ height: "5px", background: "#e2e8f0", borderRadius: "999px", overflow: "hidden", margin: "6px 0 4px 0" }}>
                  <div style={{ width: `${stepPercent}%`, height: "100%", background: "linear-gradient(90deg, #10b981 0%, #059669 100%)", borderRadius: "999px" }}></div>
                </div>
                <span style={{ fontSize: "9.5px", color: "#64748b", fontWeight: 700 }}>
                  {stepPercent}% of 10k goal
                </span>
              </div>

              <div style={{ background: "#f8fafc", padding: "8px 10px", borderRadius: "12px", border: "1px solid #f1f5f9", textAlign: "right" }}>
                <span style={{ fontSize: "9px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", display: "block" }}>
                  Waypoint Covered
                </span>
                <div style={{ fontSize: "17px", fontWeight: 900, color: "#059669", marginTop: "1px" }}>
                  {todayWaypointKm} <span style={{ fontSize: "10px", color: "#64748b", fontWeight: 700 }}>km</span>
                </div>
                <span style={{ fontSize: "9px", color: "#94a3b8", fontWeight: 700 }}>Target: {waypointTargetKm} km</span>
              </div>
            </div>

            <button
              onClick={startGpsSession}
              style={{
                width: "100%",
                background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                color: "white",
                border: "none",
                borderRadius: "12px",
                padding: "10px",
                fontWeight: 800,
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "7px",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.25)",
                marginBottom: "8px"
              }}
            >
              <i className="fa-solid fa-location-crosshairs"></i>
              <span>Start Live GPS Outdoor Tracking</span>
            </button>

            <div style={{ display: "flex", gap: "6px" }}>
              <button
                onClick={() => handleManualAddSteps(500)}
                style={{ flex: 1, background: "#f8fafc", border: "1px solid #e2e8f0", color: "#475569", padding: "5px 0", borderRadius: "8px", fontSize: "10px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
              >
                <i className="fa-solid fa-plus" style={{ fontSize: "8px" }}></i> 500 Steps (Indoor)
              </button>
              <button
                onClick={() => handleManualAddSteps(1000)}
                style={{ flex: 1, background: "#f8fafc", border: "1px solid #e2e8f0", color: "#475569", padding: "5px 0", borderRadius: "8px", fontSize: "10px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
              >
                <i className="fa-solid fa-plus" style={{ fontSize: "8px" }}></i> 1,000 Steps (Indoor)
              </button>
            </div>
          </div>
        )}
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

      {/* ─── 5. STAGE 2: QUICK ONE-TAP FOOD & SUGGESTIONS MODAL ─── */}
      {activeSheet === "food" && (
        <div 
          onClick={() => {
            setActiveSheet(null);
            setIsAddingCustomPreset(false);
            setIsManualEntryOpen(false);
            setFoodSearchQuery("");
          }} 
          style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.45)", backdropFilter: "blur(3px)", zIndex: 9999, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            style={{ width: "100%", maxWidth: "420px", maxHeight: "85vh", display: "flex", flexDirection: "column", background: "#ffffff", borderTopLeftRadius: "22px", borderTopRightRadius: "22px", padding: "16px 16px 20px 16px", boxShadow: "0 -10px 30px rgba(0,0,0,0.15)", animation: "slideUp 0.2s ease-out" }}
          >
            {/* Modal Handle */}
            <div style={{ width: "36px", height: "4px", background: "#cbd5e1", borderRadius: "2px", margin: "0 auto 12px auto" }}></div>
            
            {/* Header Title */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "26px", height: "26px", borderRadius: "8px", background: "#e0e7ff", color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px" }}>
                  <i className="fa-solid fa-bolt-lightning"></i>
                </div>
                <h3 style={{ fontSize: "14px", fontWeight: 800, margin: 0, color: "#0f172a" }}>
                  Quick Log Food
                </h3>
              </div>
              <button 
                onClick={() => {
                  setActiveSheet(null);
                  setIsAddingCustomPreset(false);
                  setIsManualEntryOpen(false);
                  setFoodSearchQuery("");
                }} 
                style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "16px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {/* Quick Search Bar */}
            <div style={{ position: "relative", marginBottom: "12px" }}>
              <i className="fa-solid fa-magnifying-glass" style={{ position: "absolute", left: "12px", top: "11px", color: "#94a3b8", fontSize: "12px" }}></i>
              <input
                type="text"
                placeholder="Search staples (e.g. rice, egg, chicken)..."
                value={foodSearchQuery}
                onChange={(e) => setFoodSearchQuery(e.target.value)}
                style={{ width: "100%", padding: "9px 12px 9px 34px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "12.5px", fontWeight: 700, outline: "none", background: "#f8fafc" }}
              />
              {foodSearchQuery && (
                <button
                  onClick={() => setFoodSearchQuery("")}
                  style={{ position: "absolute", right: "10px", top: "9px", background: "none", border: "none", color: "#94a3b8", fontSize: "12px", cursor: "pointer" }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sub-header with "+ Custom Staple" button */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Suggestions & Quick Staples
              </span>
              <button
                onClick={() => {
                  setIsAddingCustomPreset(!isAddingCustomPreset);
                  setIsManualEntryOpen(false);
                }}
                style={{ background: isAddingCustomPreset ? "#e0e7ff" : "#f1f5f9", border: "none", color: "#4f46e5", padding: "3px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
              >
                <i className={`fa-solid ${isAddingCustomPreset ? "fa-minus" : "fa-plus"}`} style={{ fontSize: "8px" }}></i>
                {isAddingCustomPreset ? "Cancel" : "Add Custom Staple"}
              </button>
            </div>

            {/* FORM: ADD CUSTOM PRESET ACCORDION */}
            {isAddingCustomPreset && (
              <form onSubmit={handleSaveCustomPreset} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "10px", marginBottom: "10px" }}>
                <span style={{ fontSize: "10.5px", fontWeight: 800, color: "#4f46e5", display: "block", marginBottom: "6px" }}>
                  ⭐ Save New Custom Quick Staple
                </span>
                
                <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "6px", marginBottom: "6px" }}>
                  <input
                    type="text"
                    placeholder="Food Name (e.g. Oatmeal)"
                    required
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    style={{ padding: "7px 9px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "11px", fontWeight: 700 }}
                  />
                  <input
                    type="text"
                    placeholder="Serving (e.g. 1 bowl)"
                    value={newPresetServing}
                    onChange={(e) => setNewPresetServing(e.target.value)}
                    style={{ padding: "7px 9px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "11px", fontWeight: 700 }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "6px", marginBottom: "8px" }}>
                  <input
                    type="number"
                    placeholder="Calories*"
                    required
                    value={newPresetCal}
                    onChange={(e) => setNewPresetCal(e.target.value)}
                    style={{ padding: "7px 6px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "11px", fontWeight: 700 }}
                  />
                  <input
                    type="number"
                    placeholder="Protein (g)"
                    value={newPresetP}
                    onChange={(e) => setNewPresetP(e.target.value)}
                    style={{ padding: "7px 6px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "11px", fontWeight: 700 }}
                  />
                  <input
                    type="number"
                    placeholder="Carbs (g)"
                    value={newPresetC}
                    onChange={(e) => setNewPresetC(e.target.value)}
                    style={{ padding: "7px 6px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "11px", fontWeight: 700 }}
                  />
                  <input
                    type="number"
                    placeholder="Fat (g)"
                    value={newPresetF}
                    onChange={(e) => setNewPresetF(e.target.value)}
                    style={{ padding: "7px 6px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "11px", fontWeight: 700 }}
                  />
                </div>

                <button
                  type="submit"
                  style={{ width: "100%", background: "#4f46e5", color: "white", border: "none", padding: "8px", borderRadius: "8px", fontSize: "11px", fontWeight: 800, cursor: "pointer" }}
                >
                  Save to Quick Staples List
                </button>
              </form>
            )}

            {/* SCROLLABLE STAPLES LIST (DARK CARDS LOOK ALIGNED WITH SCREENSHOT) */}
            <div style={{ flex: 1, overflowY: "auto", maxHeight: "260px", display: "flex", flexDirection: "column", gap: "6px", paddingRight: "2px" }}>
              {filteredStaples.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 10px", color: "#94a3b8", fontSize: "11.5px" }}>
                  Walang tumugmang staple para sa "{foodSearchQuery}".
                </div>
              ) : (
                filteredStaples.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      background: "#1e293b",
                      borderRadius: "12px",
                      padding: "10px 12px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      color: "#ffffff",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "12.5px", fontWeight: 800, color: "#f8fafc" }}>
                          {item.name}
                        </span>
                        {/* Verified Badge */}
                        <i className="fa-solid fa-circle-check" style={{ color: "#10b981", fontSize: "11px" }}></i>
                        {item.isCustom && (
                          <span style={{ fontSize: "8px", fontWeight: 900, background: "#334155", color: "#93c5fd", padding: "1px 5px", borderRadius: "4px" }}>
                            MY PRESET
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px", fontWeight: 600 }}>
                        {item.cal} cal, {item.serving}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {/* Delete Custom Preset button if user-created */}
                      {item.isCustom && (
                        <button
                          onClick={() => handleDeleteCustomPreset(item.id)}
                          style={{ width: "26px", height: "26px", borderRadius: "50%", background: "rgba(239, 68, 68, 0.15)", border: "none", color: "#ef4444", fontSize: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                          title="Delete from presets"
                        >
                          ✕
                        </button>
                      )}

                      {/* 1-TAP QUICK ADD BUTTON */}
                      <button
                        onClick={() => handleQuickLogItem(item)}
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          background: "#334155",
                          border: "1px solid rgba(255,255,255,0.12)",
                          color: "#38bdf8",
                          fontSize: "14px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
                        }}
                        title={`Quick Log ${item.name}`}
                      >
                        <i className="fa-solid fa-plus"></i>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* MANUAL ONE-TIME ENTRY TOGGLE */}
            <div style={{ marginTop: "10px", borderTop: "1px solid #f1f5f9", paddingTop: "8px" }}>
              <button
                onClick={() => {
                  setIsManualEntryOpen(!isManualEntryOpen);
                  setIsAddingCustomPreset(false);
                }}
                style={{ width: "100%", background: "transparent", border: "none", color: "#64748b", fontSize: "11px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}
              >
                <span>{isManualEntryOpen ? "Hide Manual Entry" : "Iba ang kinain mo? Click for Manual Log"}</span>
                <i className={`fa-solid ${isManualEntryOpen ? "fa-chevron-up" : "fa-chevron-down"}`} style={{ fontSize: "9px" }}></i>
              </button>

              {isManualEntryOpen && (
                <form onSubmit={handleManualSaveMeal} style={{ marginTop: "8px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "6px", marginBottom: "8px" }}>
                    <input
                      type="text"
                      placeholder="Food Name (e.g. Adobo)"
                      required
                      value={manualFoodName}
                      onChange={(e) => setManualFoodName(e.target.value)}
                      style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "11px", fontWeight: 700 }}
                    />
                    <input
                      type="number"
                      placeholder="Calories"
                      required
                      value={manualFoodCal}
                      onChange={(e) => setManualFoodCal(e.target.value)}
                      style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "11px", fontWeight: 700 }}
                    />
                  </div>
                  <button
                    type="submit"
                    style={{ width: "100%", background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)", color: "white", border: "none", padding: "9px", borderRadius: "8px", fontWeight: 800, fontSize: "11px", cursor: "pointer" }}
                  >
                    Confirm & Log Once
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ─── 6. SLIDE-OVER QUICK LOG WORKOUT MODAL ─── */}
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
