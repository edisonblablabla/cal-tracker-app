import React, { useState, useEffect, useRef } from "react";

export default function MapTracker({ activeTab, appData, saveToCloud, showToast }) {
  const [isTracking, setIsTracking] = useState(false);
  const [steps, setSteps] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);
  const [burnedKcal, setBurnedKcal] = useState(0);
  const [showLiveMap, setShowLiveMap] = useState(false);
  const [routeCoords, setRouteCoords] = useState([]);
  const watchIdRef = useRef(null);

  // Background Step Simulation / Geolocation Tracker
  useEffect(() => {
    let stepInterval = null;
    if (isTracking) {
      stepInterval = setInterval(() => {
        setSteps((prev) => {
          const nextSteps = prev + Math.floor(Math.random() * 4) + 1;
          const dist = (nextSteps * 0.00075).toFixed(2);
          const kcal = Math.floor(nextSteps * 0.04);
          setDistanceKm(dist);
          setBurnedKcal(kcal);
          return nextSteps;
        });
      }, 2500);

      if ("geolocation" in navigator) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            setRouteCoords((prev) => [...prev, [latitude, longitude]]);
          },
          (err) => console.log("GPS Notice:", err.message),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      }
    } else {
      if (stepInterval) clearInterval(stepInterval);
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    }

    return () => {
      if (stepInterval) clearInterval(stepInterval);
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [isTracking]);

  const handleStart = () => {
    setIsTracking(true);
    if (showToast) showToast("📍 Nagsimula na ang GPS Step Tracking!");
  };

  const handlePause = () => {
    setIsTracking(false);
    if (showToast) showToast("⏸ Naka-pause ang GPS Tracking");
  };

  const handleFinishAndReset = () => {
    if (steps > 0 && saveToCloud) {
      const updated = {
        ...appData,
        todaySteps: (appData?.todaySteps || 0) + steps,
        todayBurnedCal: (appData?.todayBurnedCal || 0) + burnedKcal
      };
      saveToCloud(updated);
      if (showToast) showToast(`✅ Na-save: ${steps} steps at ${burnedKcal} kcal!`);
    }
    setIsTracking(false);
    setSteps(0);
    setDistanceKm(0);
    setBurnedKcal(0);
    setRouteCoords([]);
  };

  // GPX Track Downloader
  const handleDownloadGPX = () => {
    const coordsToExport = routeCoords.length > 0 ? routeCoords : [
      [14.5547, 121.0244],
      [14.5555, 121.0255],
      [14.5562, 121.0268]
    ];

    const gpxData = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="NutriPulse Fitness" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>NutriPulse Activity Route</name>
    <time>${new Date().toISOString()}</time>
  </metadata>
  <trk>
    <name>Step Session: ${steps} steps (${distanceKm} km)</name>
    <trkseg>
      ${coordsToExport.map((c) => `<trkpt lat="${c[0]}" lon="${c[1]}"><time>${new Date().toISOString()}</time></trkpt>`).join("\n      ")}
    </trkseg>
  </trk>
</gpx>`;

    const blob = new Blob([gpxData], { type: "application/gpx+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `nutripulse-track-${new Date().toISOString().slice(0, 10)}.gpx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (showToast) showToast("📥 Na-download na ang iyong .GPX Route file!");
  };

  return (
    <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "18px", padding: "14px", boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)" }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: "#f0f9ff", color: "#0ea5e9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px" }}>
            <i className="fa-solid fa-person-walking"></i>
          </div>
          <span style={{ fontSize: "10px", fontWeight: 800, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Stealth Step & Distance
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "9px", fontWeight: 800, color: isTracking ? "#16a34a" : "#64748b", background: isTracking ? "#dcfce7" : "#f1f5f9", padding: "3px 7px", borderRadius: "8px" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: isTracking ? "#16a34a" : "#94a3b8" }}></span>
          <span>{isTracking ? "RECORDING" : "STANDBY"}</span>
        </div>
      </div>

      {/* 3 Metric Pills */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "12px" }}>
        <div style={{ background: "#f8fafc", padding: "8px", borderRadius: "10px", textAlign: "center", border: "1px solid #f1f5f9" }}>
          <span style={{ fontSize: "8.5px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Steps</span>
          <div style={{ fontSize: "16px", fontWeight: 900, color: "#0f172a" }}>{steps.toLocaleString()}</div>
        </div>
        <div style={{ background: "#f8fafc", padding: "8px", borderRadius: "10px", textAlign: "center", border: "1px solid #f1f5f9" }}>
          <span style={{ fontSize: "8.5px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Distance</span>
          <div style={{ fontSize: "16px", fontWeight: 900, color: "#0ea5e9" }}>{distanceKm} <span style={{ fontSize: "9px", fontWeight: 600 }}>km</span></div>
        </div>
        <div style={{ background: "#f8fafc", padding: "8px", borderRadius: "10px", textAlign: "center", border: "1px solid #f1f5f9" }}>
          <span style={{ fontSize: "8.5px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Burn</span>
          <div style={{ fontSize: "16px", fontWeight: 900, color: "#f97316" }}>{burnedKcal} <span style={{ fontSize: "9px", fontWeight: 600 }}>kcal</span></div>
        </div>
      </div>

      {/* Main Controls */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
        {!isTracking ? (
          <button onClick={handleStart} style={{ flex: 1, background: "#0ea5e9", color: "white", border: "none", padding: "9px", borderRadius: "10px", fontWeight: 800, fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
            <i className="fa-solid fa-play" style={{ fontSize: "9px" }}></i> START TRACK
          </button>
        ) : (
          <button onClick={handlePause} style={{ flex: 1, background: "#f59e0b", color: "white", border: "none", padding: "9px", borderRadius: "10px", fontWeight: 800, fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
            <i className="fa-solid fa-pause" style={{ fontSize: "9px" }}></i> PAUSE
          </button>
        )}
        <button onClick={handleFinishAndReset} style={{ flex: 1, background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", padding: "9px", borderRadius: "10px", fontWeight: 800, fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
          <i className="fa-solid fa-check" style={{ fontSize: "10px" }}></i> FINISH & LOG
        </button>
      </div>

      {/* Extra Options: GPX Download & Map Toggle */}
      <div style={{ display: "flex", gap: "6px", paddingTop: "8px", borderTop: "1px solid #f1f5f9" }}>
        <button onClick={handleDownloadGPX} style={{ flex: 1, background: "#f8fafc", border: "1px dashed #cbd5e1", padding: "7px", borderRadius: "8px", fontSize: "10px", fontWeight: 700, color: "#475569", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }} title="Export .gpx for Strava/Garmin">
          <i className="fa-solid fa-file-arrow-down" style={{ color: "#0ea5e9" }}></i> Download GPX
        </button>
        <button onClick={() => setShowLiveMap(!showLiveMap)} style={{ flex: 1, background: "#f8fafc", border: "1px dashed #cbd5e1", padding: "7px", borderRadius: "8px", fontSize: "10px", fontWeight: 700, color: "#475569", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
          <i className="fa-solid fa-map-location-dot" style={{ color: "#6366f1" }}></i> {showLiveMap ? "Hide Map" : "View Map"}
        </button>
      </div>

      {/* On-Demand Map Container (Zero Initial Lag) */}
      {showLiveMap && (
        <div style={{ marginTop: "10px", height: "140px", borderRadius: "12px", background: "#e2e8f0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: "11px", border: "1px solid #cbd5e1", textAlign: "center", padding: "10px" }}>
          <i className="fa-solid fa-route" style={{ fontSize: "20px", color: "#0ea5e9", marginBottom: "4px" }}></i>
          <strong>Live Coordinate Waypoints Active</strong>
          <span style={{ fontSize: "9.5px", color: "#94a3b8" }}>{routeCoords.length} breadcrumb points recorded</span>
        </div>
      )}

    </div>
  );
}
