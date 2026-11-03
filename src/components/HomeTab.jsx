import React, { useState, useEffect, useMemo, useRef } from "react";
import { db } from "../services/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// Default 5 Verified Quick Staples
const DEFAULT_STAPLES = [
  { id: "def_rice", name: "White Rice (Cooked)", cal: 205, serving: "1.0 cup", p: 4, c: 45, f: 0.4 },
  { id: "def_boiled_egg", name: "Boiled egg", cal: 72, serving: "1.0 egg", p: 6, c: 0.6, f: 5 },
  { id: "def_fried_egg", name: "Fried egg", cal: 83, serving: "1.0 large", p: 6, c: 0.4, f: 7 },
  { id: "def_chicken", name: "Chicken Breast", cal: 165, serving: "100.0 gram", p: 31, c: 0, f: 3.6 },
  { id: "def_banana", name: "Banana", cal: 105, serving: "1.0 medium", p: 1.3, c: 27, f: 0.3 }
];

export default function HomeTab({
  setActiveTab,
  setPostText,
  setImagePreview,
  setDraftSocialPost,
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

  // Consumed Calories
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
        fatG: Number((acc.fatG + (Number(m.f ?? m.fats ?? m.fat) || 0)).toFixed(1))
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
  const intakePercent = Math.min(Math.round((consumedCalories / Math.max(calorieGoal, 1)) * 100), 100);
  const burnPercent = Math.min(Math.round((burnedCalories / Math.max(burnTarget, 1)) * 100), 100);
  const waterPercent = Math.min(Math.round((todayWaterMl / Math.max(waterTarget, 1)) * 100), 100);

  const targetProtein = Number(appData?.pGoal || appData?.proteinGoal) || Math.round((calorieGoal * 0.3) / 4);
  const targetCarbs = Number(appData?.cGoal || appData?.carbsGoal) || Math.round((calorieGoal * 0.45) / 4);
  const targetFat = Number(appData?.fGoal || appData?.fatGoal) || Math.round((calorieGoal * 0.25) / 9);

  // ─── SATELLITE GPS & ATHLETE ENGINE ───
  const [showPreRunModal, setShowPreRunModal] = useState(false);
  const [isGpsActive, setIsGpsActive] = useState(false);
  const [isPocketMode, setIsPocketMode] = useState(false);
  const [gpsDistanceKm, setGpsDistanceKm] = useState(0);
  const [gpsDurationSec, setGpsDurationSec] = useState(0);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [selectedViewingActivity, setSelectedViewingActivity] = useState(null);

  // Preview & Social Sharing State
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const [isSharingToSocial, setIsSharingToSocial] = useState(false);

  const watchIdRef = useRef(null);
  const lastCoordsRef = useRef(null);
  const timerRef = useRef(null);
  const wakeLockRef = useRef(null);
  const lastTapRef = useRef(0);

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

  const requestWakeLock = async () => {
    if ("wakeLock" in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
      } catch (err) {
        console.warn("Screen Wake Lock not permitted:", err);
      }
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      try {
        wakeLockRef.current.release();
      } catch (e) {}
      wakeLockRef.current = null;
    }
  };

  const executeStartGps = (startWithPocketLock = false) => {
    if (!navigator.geolocation) {
      if (showToast) showToast("❌ GPS is not supported on this device.");
      return;
    }

    setGpsDistanceKm(0);
    setGpsDurationSec(0);
    setRouteCoordinates([]);
    lastCoordsRef.current = null;
    setIsGpsActive(true);
    setShowPreRunModal(false);

    if (startWithPocketLock) {
      setIsPocketMode(true);
    }

    requestWakeLock();

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setGpsAccuracy(Math.round(accuracy));

        if (accuracy > 75) return;

        const newPoint = {
          lat: latitude,
          lon: longitude,
          time: new Date().toISOString()
        };

        if (lastCoordsRef.current) {
          const deltaKm = calcHaversine(
            lastCoordsRef.current.lat,
            lastCoordsRef.current.lon,
            latitude,
            longitude
          );

          if (deltaKm > 0.002 && deltaKm < 0.3) {
            setGpsDistanceKm((prev) => Number((prev + deltaKm).toFixed(3)));
            setRouteCoordinates((prev) => [...prev, newPoint]);
            lastCoordsRef.current = { lat: latitude, lon: longitude };
          }
        } else {
          lastCoordsRef.current = { lat: latitude, lon: longitude };
          setRouteCoordinates([newPoint]);
        }
      },
      (err) => {
        console.error("GPS Error:", err);
        if (showToast) showToast("⚠️ Turn on Location / Enable High Accuracy GPS.");
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
    releaseWakeLock();
    setIsPocketMode(false);

    const dist = Number(gpsDistanceKm) || 0;
    const durSec = Number(gpsDurationSec) || 0;
    const stepsAdded = Math.round(dist * 1333) || (durSec > 10 ? Math.round(durSec * 1.8) : 0);
    const calBurned = Math.round(dist * 60) || (durSec > 5 ? Math.max(1, Math.round(durSec * 0.12)) : 1);
    const avgPace = dist > 0.02 ? ((durSec / 60) / dist).toFixed(2) : "0.00";

    const completedActivity = {
      id: Date.now(),
      type: "Outdoor Run & Walk",
      distanceKm: dist,
      durationMin: Math.max(1, Math.round(durSec / 60)),
      durationSec: durSec,
      burnedCal: calBurned,
      steps: stepsAdded,
      avgPaceMinKm: avgPace,
      route: routeCoordinates.length > 0 ? routeCoordinates : (lastCoordsRef.current ? [lastCoordsRef.current] : []),
      dateLogged: currentDateStr,
      timestamp: Date.now()
    };

    if (saveToCloud) {
      const existingWorkouts = appData?.workoutLogs || [];
      const updatedWorkouts = [completedActivity, ...existingWorkouts];
      const updatedSteps = (Number(appData?.todaySteps) || 0) + stepsAdded;
      const existingStepLogs = appData?.stepLogs || [];
      const newStepRecord = {
        id: Date.now(),
        steps: stepsAdded,
        distanceKm: dist,
        dateLogged: currentDateStr,
        timestamp: Date.now()
      };

      saveToCloud({
        ...appData,
        todaySteps: updatedSteps,
        lastStepDate: currentDateStr,
        stepLogs: stepsAdded > 0 ? [newStepRecord, ...existingStepLogs] : existingStepLogs,
        workoutLogs: updatedWorkouts
      });
    }

    setSelectedViewingActivity(completedActivity);
    setIsGpsActive(false);

    if (showToast) {
      showToast(`🎉 Activity Saved: ${dist.toFixed(2)} km (+${calBurned} kcal)!`);
    }
  };

  const handlePocketTouch = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 400) {
      setIsPocketMode(false);
      if (showToast) showToast("🔓 Pocket Lock Disengaged");
    }
    lastTapRef.current = now;
  };

  const downloadGpxFile = (activity) => {
    const coords = activity?.route || [];
    if (coords.length === 0) {
      if (showToast) showToast("Need GPS coordinate points to download GPX track.");
      return;
    }

    const trkpts = coords
      .map(
        (pt) =>
          `      <trkpt lat="${pt.lat}" lon="${pt.lon}">\n        <time>${pt.time || new Date().toISOString()}</time>\n      </trkpt>`
      )
      .join("\n");

    const gpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="NutriPulse Activity Tracker - https://edisonblablabla.github.io/cal-tracker-app/" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>NutriPulse ${activity.type}</name>
    <time>${new Date(activity.timestamp).toISOString()}</time>
  </metadata>
  <trk>
    <name>NutriPulse ${activity.distanceKm}km Run</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>`;

    const blob = new Blob([gpxContent], { type: "application/gpx+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `NutriPulse-Track-${activity.dateLogged}-${activity.distanceKm}km.gpx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (showToast) showToast("💾 GPX File downloaded successfully!");
  };

  
  const drawSafeRoundedRect = (ctx, x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  const renderActivityToCanvas = (activity) => {
    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 1100;
    const ctx = canvas.getContext("2d");

    // Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, "#090d16");
    bgGrad.addColorStop(1, "#111827");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Glow
    try {
      const radial = ctx.createRadialGradient(canvas.width / 2, 400, 50, canvas.width / 2, 400, 450);
      radial.addColorStop(0, "rgba(56, 189, 248, 0.08)");
      radial.addColorStop(1, "transparent");
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } catch (e) {}

    // Brand Header
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 36px sans-serif";
    ctx.fillText("NUTRIPULSE", 60, 80);

    ctx.fillStyle = "#38bdf8";
    ctx.font = "800 16px sans-serif";
    ctx.fillText("METABOLIC INTELLIGENCE • GPS OUTDOOR TRACK", 60, 110);

    ctx.fillStyle = "#64748b";
    ctx.font = "700 16px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(activity.dateLogged || new Date().toLocaleDateString("en-US"), canvas.width - 60, 85);
    ctx.textAlign = "left";

    // Map Box gamit ang drawSafeRoundedRect
    const boxX = 60;
    const boxY = 140;
    const boxW = canvas.width - 120;
    const boxH = 500;

    ctx.fillStyle = "#030712";
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2;
    drawSafeRoundedRect(ctx, boxX, boxY, boxW, boxH, 20);
    ctx.fill();
    ctx.stroke();

    const coords = activity.route || [];

    if (coords.length >= 2) {
      const lats = coords.map((c) => c.lat);
      const lons = coords.map((c) => c.lon);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLon = Math.min(...lons);
      const maxLon = Math.max(...lons);

      const latSpan = maxLat - minLat || 0.0001;
      const lonSpan = maxLon - minLon || 0.0001;
      const pad = 60;

      const mapX = (lon) => boxX + pad + ((lon - minLon) / lonSpan) * (boxW - pad * 2);
      const mapY = (lat) => boxY + boxH - pad - ((lat - minLat) / latSpan) * (boxH - pad * 2);

      ctx.save();
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 7;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = "#0284c7";
      ctx.shadowBlur = 20;

      ctx.beginPath();
      ctx.moveTo(mapX(coords[0].lon), mapY(coords[0].lat));
      for (let i = 1; i < coords.length; i++) {
        ctx.lineTo(mapX(coords[i].lon), mapY(coords[i].lat));
      }
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = "#10b981";
      ctx.beginPath();
      ctx.arc(mapX(coords[0].lon), mapY(coords[0].lat), 9, 0, Math.PI * 2);
      ctx.fill();

      const lastPt = coords[coords.length - 1];
      ctx.fillStyle = "#f43f5e";
      ctx.beginPath();
      ctx.arc(mapX(lastPt.lon), mapY(lastPt.lat), 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = "#94a3b8";
      ctx.font = "800 13px sans-serif";
      ctx.fillText("● START", mapX(coords[0].lon) + 14, mapY(coords[0].lat) + 5);
      ctx.fillText("■ FINISH", mapX(lastPt.lon) + 14, mapY(lastPt.lat) + 5);
    } else {
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.arc(boxX + boxW / 2, boxY + boxH / 2, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.fillStyle = "#94a3b8";
      ctx.font = "800 18px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("📍 Stationary Activity / Indoor GPS Point Recorded", boxX + boxW / 2, boxY + boxH / 2 + 55);
      ctx.textAlign = "left";
    }

    // Stats Grid
    const statsY = 690;
    ctx.fillStyle = "#64748b";
    ctx.font = "800 15px sans-serif";
    ctx.fillText("DISTANCE", 60, statsY);
    
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 64px sans-serif";
    const distStr = (activity.distanceKm || 0).toFixed(2);
    ctx.fillText(distStr, 60, statsY + 65);
    
    const distMetrics = ctx.measureText(distStr);
    ctx.fillStyle = "#38bdf8";
    ctx.font = "900 24px sans-serif";
    ctx.fillText("KM", 60 + distMetrics.width + 12, statsY + 60);

    ctx.fillStyle = "#64748b";
    ctx.font = "800 15px sans-serif";
    ctx.fillText("ACTIVE TIME", 520, statsY);
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 64px sans-serif";
    ctx.fillText(formatTime(activity.durationSec || activity.durationMin * 60), 520, statsY + 65);

    const row2Y = statsY + 140;
    ctx.fillStyle = "#64748b";
    ctx.font = "800 15px sans-serif";
    ctx.fillText("AVG PACE", 60, row2Y);
    ctx.fillStyle = "#4ade80";
    ctx.font = "900 48px sans-serif";
    ctx.fillText(`${activity.avgPaceMinKm || "0.00"} /km`, 60, row2Y + 52);

    ctx.fillStyle = "#64748b";
    ctx.font = "800 15px sans-serif";
    ctx.fillText("CALORIES BURNED", 520, row2Y);
    ctx.fillStyle = "#ea580c";
    ctx.font = "900 48px sans-serif";
    ctx.fillText(`+${activity.burnedCal || 0} kcal`, 520, row2Y + 52);

    ctx.fillStyle = "#334155";
    ctx.font = "800 14px sans-serif";
    ctx.fillText("⚡ TRACKED LIVE WITH NUTRIPULSE ATHLETICS ENGINE", 60, canvas.height - 45);

    return canvas;
  };

  // 📥 DIRECT REAL PNG DOWNLOAD
  const handleDirectDownloadImage = (activity) => {
    if (!activity) return;
    try {
      const canvas = renderActivityToCanvas(activity);
      const dataUrl = canvas.toDataURL("image/png");
      const fileName = `NutriPulse-${activity.dateLogged || "track"}-${(activity.distanceKm || 0).toFixed(2)}km.png`;

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => document.body.removeChild(link), 1500);

      if (showToast) showToast("📥 Download started! Saved as PNG.");
    } catch (err) {
      console.error("Direct download error:", err);
      if (showToast) showToast("⚠️ Error generating PNG file.");
    }
  };

  // 👁️ BUKSAN ANG IMAGE PREVIEW MODAL
  const handleOpenImagePreview = (activity) => {
    if (!activity) return;
    try {
      const canvas = renderActivityToCanvas(activity);
      const dataUrl = canvas.toDataURL("image/png");
      setPreviewImageUrl(dataUrl);
    } catch (err) {
      console.error("Preview render error:", err);
      if (showToast) showToast("⚠️ Preview error: " + err.message);
    }
  };

  // 🚀 REDIRECT SA PULSE FEED NA MAY KASAMANG DRAFT POST AT LITRATO
  const handleShareToPulseFeed = (activity) => {
    if (!activity) return;
    try {
      const canvas = renderActivityToCanvas(activity);
      const dataUrl = canvas.toDataURL("image/png");
      const dist = (activity.distanceKm || 0).toFixed(2);
      const dur = formatTime(activity.durationSec || activity.durationMin * 60);
      const pace = activity.avgPaceMinKm || "0.00";
      const burn = activity.burnedCal || 0;

      const prefilledCaption = `🏃 Outdoor Activity: ${dist} km in ${dur}! Pace: ${pace}/km • Burned +${burn} kcal. Tracked with NutriPulse GPS ⚡`;

      // 1. Isara ang summary modal
      setSelectedViewingActivity(null);

      // 2. I-populate ang composer sa Pulse Feed
      if (typeof setPostText === "function") {
        setPostText(prefilledCaption);
      }
      if (typeof setImagePreview === "function") {
        setImagePreview(dataUrl);
      }

      // 3. Lumipat sa Community / Pulse Feed tab
      if (typeof setActiveTab === "function") {
        setActiveTab("community");
      }

      window.scrollTo({ top: 0, behavior: "smooth" });

      if (showToast) {
        showToast("✨ Opening Pulse Feed... Edit your caption before posting!");
      }
    } catch (err) {
      console.error("Share redirect error:", err);
      if (showToast) showToast("⚠️ Error preparing post: " + err.message);
    }
  };


  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      releaseWakeLock();
    };
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const currentPaceStr = useMemo(() => {
    if (gpsDistanceKm <= 0.02 || gpsDurationSec < 5) return "--'--\"";
    const paceTotalSec = gpsDurationSec / gpsDistanceKm;
    const pMin = Math.floor(paceTotalSec / 60);
    const pSec = Math.floor(paceTotalSec % 60);
    return `${pMin}'${pSec < 10 ? "0" : ""}${pSec}"`;
  }, [gpsDistanceKm, gpsDurationSec]);

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



  // Quick Food & Workout Modal States
  const [activeSheet, setActiveSheet] = useState(null);
  const [foodSearchQuery, setFoodSearchQuery] = useState("");
  const [isAddingCustomPreset, setIsAddingCustomPreset] = useState(false);
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);

  const [newPresetName, setNewPresetName] = useState("");
  const [newPresetCal, setNewPresetCal] = useState("");
  const [newPresetServing, setNewPresetServing] = useState("");
  const [newPresetP, setNewPresetP] = useState("");
  const [newPresetC, setNewPresetC] = useState("");
  const [newPresetF, setNewPresetF] = useState("");

  const [manualFoodName, setManualFoodName] = useState("");
  const [manualFoodCal, setManualFoodCal] = useState("");

  const [workoutType, setWorkoutType] = useState("Running");
  const [workoutDuration, setWorkoutDuration] = useState("30");

  const combinedStaples = useMemo(() => {
    const customList = appData?.customQuickStaples || [];
    return [...DEFAULT_STAPLES, ...customList];
  }, [appData?.customQuickStaples]);

  const filteredStaples = useMemo(() => {
    if (!foodSearchQuery.trim()) return combinedStaples;
    const q = foodSearchQuery.toLowerCase().trim();
    return combinedStaples.filter((item) =>
      item.name.toLowerCase().includes(q) || (item.serving && item.serving.toLowerCase().includes(q))
    );
  }, [combinedStaples, foodSearchQuery]);

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
      saveToCloud({ ...appData, meals: [...(appData?.meals || []), newMeal] });
    }
    if (showToast) showToast(`🍽️ Logged: ${item.name} (+${item.cal} kcal)!`);
    setActiveSheet(null);
    setFoodSearchQuery("");
  };

  const handleSaveCustomPreset = (e) => {
    e.preventDefault();
    const calNum = parseInt(newPresetCal, 10);
    if (!newPresetName.trim() || isNaN(calNum) || calNum <= 0) {
      if (showToast) showToast("Please enter a valid staple name and calorie count!");
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
      saveToCloud({ ...appData, customQuickStaples: updated });
    }
    if (showToast) showToast(`⭐ Saved "${newPreset.name}" to Quick Staples!`);
    setNewPresetName("");
    setNewPresetCal("");
    setNewPresetServing("");
    setNewPresetP("");
    setNewPresetC("");
    setNewPresetF("");
    setIsAddingCustomPreset(false);
  };

  const handleDeleteCustomPreset = (idToDelete) => {
    const updated = (appData?.customQuickStaples || []).filter((p) => p.id !== idToDelete);
    if (saveToCloud) {
      saveToCloud({ ...appData, customQuickStaples: updated });
    }
    if (showToast) showToast("Removed custom quick staple.");
  };

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

  const renderRouteSvg = (coords) => {
    if (!coords || coords.length === 0) {
      return (
        <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: "11px", gap: "4px" }}>
          <i className="fa-solid fa-location-dot" style={{ color: "#38bdf8", fontSize: "18px" }}></i>
          <span>Stationary GPS Point Logged</span>
        </div>
      );
    }

    if (coords.length === 1) {
      return (
        <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#38bdf8", fontSize: "11px", gap: "4px" }}>
          <i className="fa-solid fa-crosshairs" style={{ fontSize: "20px" }}></i>
          <span style={{ fontWeight: 800 }}>GPS Point: {coords[0].lat.toFixed(4)}, {coords[0].lon.toFixed(4)}</span>
        </div>
      );
    }

    const lats = coords.map((c) => c.lat);
    const lons = coords.map((c) => c.lon);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);

    const latSpan = maxLat - minLat || 0.0001;
    const lonSpan = maxLon - minLon || 0.0001;

    const width = 320;
    const height = 120;
    const padding = 15;

    const points = coords.map((c) => {
      const x = padding + ((c.lon - minLon) / lonSpan) * (width - padding * 2);
      const y = height - padding - ((c.lat - minLat) / latSpan) * (height - padding * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const pathData = `M ${points.join(" L ")}`;
    const [startPoint] = points[0].split(",");
    const [endPointX, endPointY] = points[points.length - 1].split(",");

    return (
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "100%", overflow: "visible" }}>
        <path d={pathData} fill="none" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={points[0].split(",")[0]} cy={points[0].split(",")[1]} r="4.5" fill="#10b981" />
        <circle cx={endPointX} cy={endPointY} r="5" fill="#f43f5e" />
        <circle cx={endPointX} cy={endPointY} r="9" fill="none" stroke="#f43f5e" strokeWidth="1.5" opacity="0.6" />
      </svg>
    );
  };

  const recordedGpsActivities = useMemo(() => {
    return (todayWorkouts || []).filter((w) => w.type?.includes("Outdoor") || (w.route && Array.isArray(w.route)));
  }, [todayWorkouts]);

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
          <div style={{ background: "#fff7ed", border: "1px solid #ffedd5", padding: "4px 9px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "5px" }}>
            <i className="fa-solid fa-fire" style={{ color: "#ea580c", fontSize: "11px" }}></i>
            <span style={{ fontSize: "11.5px", fontWeight: 800, color: "#ea580c" }}>
              {dynamicStreak} {dynamicStreak === 1 ? "Day" : "Days"}
            </span>
          </div>

          <button type="button" 
            onClick={() => setShowAboutModal && setShowAboutModal(true)}
            style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#f8fafc", border: "1px solid #e2e8f0", color: "#64748b", fontWeight: 800, fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            title="App Information"
          >
            ?
          </button>
        </div>
      </div>

      {/* ─── 2. ENERGY & METABOLIC BALANCE CARD ─── */}
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
                <span style={{ color: "#6366f1" }}>{Math.round(proteinG)}/{Math.round(targetProtein)}g</span>
              </div>
              <div style={{ height: "4px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
                <div style={{ width: `${Math.min(Math.round((proteinG / targetProtein) * 100), 100)}%`, height: "100%", background: "#6366f1", borderRadius: "999px" }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9.5px", fontWeight: 800, marginBottom: "2px" }}>
                <span style={{ color: "#0f172a" }}>Carbs</span>
                <span style={{ color: "#0ea5e9" }}>{Math.round(carbsG)}/{Math.round(targetCarbs)}g</span>
              </div>
              <div style={{ height: "4px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
                <div style={{ width: `${Math.min(Math.round((carbsG / targetCarbs) * 100), 100)}%`, height: "100%", background: "#0ea5e9", borderRadius: "999px" }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9.5px", fontWeight: 800, marginBottom: "2px" }}>
                <span style={{ color: "#0f172a" }}>Fats</span>
                <span style={{ color: "#f59e0b" }}>{Math.round(fatG)}/{Math.round(targetFat)}g</span>
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

          

            {/* COMPLETED GPS SESSIONS LIST */}
            {recordedGpsActivities.length > 0 && (
              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "8px" }}>
                <span style={{ fontSize: "9.5px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "5px" }}>
                  Today's Recorded GPS Routes ({recordedGpsActivities.length})
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  {recordedGpsActivities.map((act) => (
                    <div
                      key={act.id}
                      onClick={() => setSelectedViewingActivity(act)}
                      style={{
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "10px",
                        padding: "7px 10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer"
                      }}
                      title="Tap to view route map and export"
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <i className="fa-solid fa-map-location-dot" style={{ color: "#0ea5e9", fontSize: "12px" }}></i>
                        <div>
                          <span style={{ fontSize: "11px", fontWeight: 800, color: "#0f172a" }}>
                            {act.distanceKm.toFixed(2)} km Walk & Run
                          </span>
                          <span style={{ fontSize: "9.5px", color: "#64748b", display: "block" }}>
                            {formatTime(act.durationSec || act.durationMin * 60)} • {act.avgPaceMinKm || "0.00"}/km • +{act.burnedCal} kcal
                          </span>
                        </div>
                      </div>

                      <span style={{ fontSize: "10px", fontWeight: 800, color: "#0284c7", background: "#e0f2fe", padding: "3px 7px", borderRadius: "6px" }}>
                        View Map →
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* ─── 4. QUICK ACTION LOG BUTTONS ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        <button type="button"
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

        <button type="button"
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

      {/* ─── 5. PRE-RUN ACTION MODAL ─── */}
      {showPreRunModal && (
        <div
          onClick={() => setShowPreRunModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "380px",
              background: "#ffffff",
              borderRadius: "20px",
              padding: "20px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.25)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>
                <i className="fa-solid fa-person-running"></i>
              </div>
              <div>
                <h3 style={{ fontSize: "15px", fontWeight: 900, margin: 0, color: "#0f172a" }}>
                  Start Outdoor Activity
                </h3>
                <span style={{ fontSize: "10px", color: "#64748b", fontWeight: 700 }}>
                  High-Precision GPS Route Tracking
                </span>
              </div>
            </div>

            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "10px 12px", marginBottom: "14px" }}>
              <span style={{ fontSize: "11px", color: "#475569", lineHeight: 1.4, display: "block" }}>
                💡 <strong>Notice:</strong> Keep screen awake or engage <strong>Pocket Lock</strong> before putting your phone into your running shorts or pouch.
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <button
                type="button"
                onClick={() => executeStartGps(true)}
                style={{
                  width: "100%",
                  background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  padding: "12px",
                  fontWeight: 800,
                  fontSize: "12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                  boxShadow: "0 4px 12px rgba(15, 23, 42, 0.2)"
                }}
              >
                <i className="fa-solid fa-lock" style={{ color: "#38bdf8" }}></i>
                <span>Start with Pocket Lock (For Pocket)</span>
              </button>

              <button
                type="button"
                onClick={() => executeStartGps(false)}
                style={{
                  width: "100%",
                  background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  padding: "12px",
                  fontWeight: 800,
                  fontSize: "12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                  boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)"
                }}
              >
                <i className="fa-solid fa-map-location-dot"></i>
                <span>Start with Live Route Map View</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPreRunModal(false)}
                style={{
                  width: "100%",
                  background: "transparent",
                  color: "#94a3b8",
                  border: "none",
                  padding: "8px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 6. AMOLED PURE BLACK POCKET MODE OVERLAY ─── */}
      {isGpsActive && isPocketMode && (
        <div
          onClick={handlePocketTouch}
          style={{
            position: "fixed",
            inset: 0,
            background: "#000000",
            zIndex: 99999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "40px 20px",
            userSelect: "none",
            WebkitUserSelect: "none",
            touchAction: "manipulation"
          }}
        >
          <div style={{ textAlign: "center", opacity: 0.35 }}>
            <span style={{ fontSize: "10px", color: "#64748b", fontWeight: 800, letterSpacing: "1px", textTransform: "uppercase" }}>
              🔒 POCKET LOCK ENGAGED
            </span>
          </div>

          <div style={{ textAlign: "center", opacity: 0.7 }}>
            <div style={{ fontSize: "44px", fontWeight: 900, color: "#38bdf8", lineHeight: 1 }}>
              {gpsDistanceKm.toFixed(2)}
              <span style={{ fontSize: "16px", color: "#64748b", marginLeft: "4px" }}>KM</span>
            </div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#ffffff", marginTop: "8px" }}>
              {formatTime(gpsDurationSec)}
            </div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#4ade80", marginTop: "4px" }}>
              Pace: {currentPaceStr} /km
            </div>
          </div>

          <div style={{ textAlign: "center", opacity: 0.45 }}>
            <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 700, display: "block" }}>
              Double-tap anywhere to unlock
            </span>
            <span style={{ fontSize: "9px", color: "#64748b" }}>
              GPS and distance recording remain active in your pocket
            </span>
          </div>
        </div>
      )}

      {/* ─── 7. FULL ROUTE MAP & IMAGE CARD EXPORT MODAL ─── */}
      {selectedViewingActivity && (
        <div
          onClick={() => setSelectedViewingActivity(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(5px)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "380px",
              background: "#ffffff",
              borderRadius: "22px",
              padding: "18px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
              display: "flex",
              flexDirection: "column",
              gap: "10px"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <i className="fa-solid fa-map" style={{ color: "#0ea5e9", fontSize: "15px" }}></i>
                <h3 style={{ fontSize: "15px", fontWeight: 900, margin: 0, color: "#0f172a" }}>
                  Route & Activity Summary
                </h3>
              </div>
              <button type="button"
                onClick={() => setSelectedViewingActivity(null)}
                style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "18px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {/* Route Map Preview */}
            <div style={{ background: "#0f172a", borderRadius: "14px", height: "140px", padding: "10px", position: "relative" }}>
              <div style={{ position: "absolute", top: "6px", left: "8px", fontSize: "8px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase" }}>
                Recorded Route Vector ({selectedViewingActivity.route?.length || 0} pts)
              </div>
              {renderRouteSvg(selectedViewingActivity.route)}
            </div>

            {/* Metrics Breakdown */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", textAlign: "center" }}>
              <div style={{ background: "#f8fafc", padding: "8px 4px", borderRadius: "10px", border: "1px solid #f1f5f9" }}>
                <span style={{ fontSize: "9px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Distance</span>
                <div style={{ fontSize: "15px", fontWeight: 900, color: "#0284c7" }}>
                  {selectedViewingActivity.distanceKm.toFixed(2)} km
                </div>
              </div>

              <div style={{ background: "#f8fafc", padding: "8px 4px", borderRadius: "10px", border: "1px solid #f1f5f9" }}>
                <span style={{ fontSize: "9px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Time</span>
                <div style={{ fontSize: "15px", fontWeight: 900, color: "#0f172a" }}>
                  {formatTime(selectedViewingActivity.durationSec || selectedViewingActivity.durationMin * 60)}
                </div>
              </div>

              <div style={{ background: "#f8fafc", padding: "8px 4px", borderRadius: "10px", border: "1px solid #f1f5f9" }}>
                <span style={{ fontSize: "9px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Burn</span>
                <div style={{ fontSize: "15px", fontWeight: 900, color: "#ea580c" }}>
                  +{selectedViewingActivity.burnedCal} kcal
                </div>
              </div>
            </div>

            {/* Action Buttons: Social Share, Direct Download, Image Preview, GPX */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
              
              {/* 🚀 SHARE TO PULSE FEED BUTTON */}
              <button
                type="button"
                onClick={() => handleShareToPulseFeed(selectedViewingActivity)}
                style={{
                  width: "100%",
                  background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                  color: "white",
                  border: "none",
                  padding: "11px",
                  borderRadius: "10px",
                  fontWeight: 800,
                  fontSize: "12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                  boxShadow: "0 4px 12px rgba(99, 102, 241, 0.28)"
                }}
              >
                <i className="fa-solid fa-paper-plane"></i>
                <span>Share to Pulse Feed</span>
              </button>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                {/* 📥 DIRECT DOWNLOAD */}
                <button
                  type="button"
                  onClick={() => handleDirectDownloadImage(selectedViewingActivity)}
                  style={{
                    background: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
                    color: "white",
                    border: "none",
                    padding: "9px 6px",
                    borderRadius: "10px",
                    fontWeight: 800,
                    fontSize: "11px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "5px"
                  }}
                >
                  <i className="fa-solid fa-download"></i>
                  <span>Direct Download</span>
                </button>

                {/* 🖼️ PREVIEW & SAVE */}
                <button
                  type="button"
                  onClick={() => handleOpenImagePreview(selectedViewingActivity)}
                  style={{
                    background: "#f1f5f9",
                    color: "#0f172a",
                    border: "1px solid #cbd5e1",
                    padding: "9px 6px",
                    borderRadius: "10px",
                    fontWeight: 800,
                    fontSize: "11px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "5px"
                  }}
                >
                  <i className="fa-solid fa-eye"></i>
                  <span>Preview & Save</span>
                </button>
              </div>

              {/* 💾 DOWNLOAD GPX */}
              <button
                type="button"
                onClick={() => downloadGpxFile(selectedViewingActivity)}
                style={{
                  width: "100%",
                  background: "transparent",
                  color: "#64748b",
                  border: "1px solid #e2e8f0",
                  padding: "7px",
                  borderRadius: "8px",
                  fontWeight: 800,
                  fontSize: "10.5px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px"
                }}
              >
                <i className="fa-solid fa-file-arrow-down" style={{ color: "#0284c7" }}></i>
                <span>Download GPX File (Strava / Garmin)</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedViewingActivity(null)}
                style={{
                  width: "100%",
                  background: "transparent",
                  color: "#94a3b8",
                  border: "none",
                  padding: "5px",
                  borderRadius: "10px",
                  fontWeight: 700,
                  fontSize: "11px",
                  cursor: "pointer"
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 8. IMAGE PREVIEW & LONG-PRESS SAVE MODAL ─── */}
      {previewImageUrl && (
        <div
          onClick={() => setPreviewImageUrl(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.88)",
            backdropFilter: "blur(8px)",
            zIndex: 20000,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "12px", color: "#f8fafc" }}>
            <span style={{ fontSize: "13px", fontWeight: 800, display: "block" }}>
              📸 Tap and Hold (Long-Press) Image
            </span>
            <span style={{ fontSize: "11px", color: "#94a3b8" }}>
              Piliin ang "Save Image / Download" para direktang pumasok sa Photos/Gallery
            </span>
          </div>

          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "340px",
              width: "100%",
              borderRadius: "16px",
              overflow: "hidden",
              boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
              border: "1px solid rgba(255,255,255,0.2)"
            }}
          >
            <img
              src={previewImageUrl}
              alt="NutriPulse Route Card"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "14px", width: "100%", maxWidth: "340px" }}>
            <a
              href={previewImageUrl}
              download="NutriPulse-Track.png"
              style={{
                flex: 1,
                background: "#0284c7",
                color: "white",
                textAlign: "center",
                padding: "10px 0",
                borderRadius: "10px",
                fontSize: "12px",
                fontWeight: 800,
                textDecoration: "none"
              }}
            >
              <i className="fa-solid fa-download" style={{ marginRight: "6px" }}></i>
              Save File
            </a>

            <button type="button"
              onClick={() => setPreviewImageUrl(null)}
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.15)",
                color: "#ffffff",
                border: "none",
                padding: "10px 0",
                borderRadius: "10px",
                fontSize: "12px",
                fontWeight: 800,
                cursor: "pointer"
              }}
            >
              Close Preview
            </button>
          </div>
        </div>
      )}

      {/* ─── 9. QUICK LOG FOOD STAPLES MODAL ─── */}
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
            style={{ width: "100%", maxWidth: "420px", maxHeight: "90vh", display: "flex", flexDirection: "column", background: "#ffffff", borderTopLeftRadius: "22px", borderTopRightRadius: "22px", padding: "16px 16px calc(20px + max(40px, env(safe-area-inset-bottom))) 16px", boxShadow: "0 -10px 30px rgba(0,0,0,0.15)", animation: "slideUp 0.2s ease-out" }}
          >
            <div style={{ width: "36px", height: "4px", background: "#cbd5e1", borderRadius: "2px", margin: "0 auto 12px auto" }}></div>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "26px", height: "26px", borderRadius: "8px", background: "#e0e7ff", color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px" }}>
                  <i className="fa-solid fa-bolt-lightning"></i>
                </div>
                <h3 style={{ fontSize: "14px", fontWeight: 800, margin: 0, color: "#0f172a" }}>
                  Quick Log Food
                </h3>
              </div>
              <button type="button" 
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
                <button type="button"
                  onClick={() => setFoodSearchQuery("")}
                  style={{ position: "absolute", right: "10px", top: "9px", background: "none", border: "none", color: "#94a3b8", fontSize: "12px", cursor: "pointer" }}
                >
                  ✕
                </button>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Suggestions & Quick Staples
              </span>
              <button type="button"
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

            <div style={{ flex: 1, overflowY: "auto", maxHeight: "260px", display: "flex", flexDirection: "column", gap: "6px", paddingRight: "2px" }}>
              {filteredStaples.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 10px", color: "#94a3b8", fontSize: "11.5px" }}>
                  No staples found for "{foodSearchQuery}".
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
                      color: "#ffffff"
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "12.5px", fontWeight: 800, color: "#f8fafc" }}>
                          {item.name}
                        </span>
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
                      {item.isCustom && (
                        <button type="button"
                          onClick={() => handleDeleteCustomPreset(item.id)}
                          style={{ width: "26px", height: "26px", borderRadius: "50%", background: "rgba(239, 68, 68, 0.15)", border: "none", color: "#ef4444", fontSize: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                          title="Delete from presets"
                        >
                          ✕
                        </button>
                      )}

                      <button type="button"
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

            <div style={{ marginTop: "10px", borderTop: "1px solid #f1f5f9", paddingTop: "8px" }}>
              <button type="button"
                onClick={() => {
                  setIsManualEntryOpen(!isManualEntryOpen);
                  setIsAddingCustomPreset(false);
                }}
                style={{ width: "100%", background: "transparent", border: "none", color: "#64748b", fontSize: "11px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}
              >
                <span>{isManualEntryOpen ? "Hide Manual Entry" : "Eating something else? Click for Manual Log"}</span>
                <i className={`fa-solid ${isManualEntryOpen ? "fa-chevron-up" : "fa-chevron-down"}`} style={{ fontSize: "9px" }}></i>
              </button>

              {isManualEntryOpen && (
                <form onSubmit={handleManualSaveMeal} style={{ marginTop: "8px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "6px", marginBottom: "8px" }}>
                    <input
                      type="text"
                      placeholder="Food Name (e.g. Rice & Salmon)"
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

      {/* ─── 10. LOG WORKOUT MODAL ─── */}
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
              <button type="button" onClick={() => setActiveSheet(null)} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "16px", cursor: "pointer" }}>✕</button>
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
                  <option value="Cycling">Cycling / Road Bike (~7 kcal/min)</option>
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
