const fs = require("fs");

if (!fs.existsSync("src/App.jsx")) {
  console.error("❌ Hindi nahanap ang src/App.jsx");
  process.exit(1);
}

// 1. Gumawa ng panibagong backup
fs.copyFileSync("src/App.jsx", "src/App.backup4.jsx");

// 2. Isulat ang src/components/MapTracker.jsx
const mapTrackerCode = `import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getDistanceFromLatLonInKm } from "../utils/geo";

export default function MapTracker({ activeTab, appData, saveToCloud, showToast }) {
  const [gpsStatus, setGpsStatus] = useState("GPS Tracker Inactive");
  const [isGpsTracking, setIsGpsTracking] = useState(false);
  const [waypoints, setWaypoints] = useState([]);
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const polylineRef = useRef(null);
  const markerRef = useRef(null);
  const [totalGpsDistanceKm, setTotalGpsDistanceKm] = useState(0);
  const lastPosRef = useRef(null);

  useEffect(() => {
    let watchId = null;
    if (activeTab === "home" && isGpsTracking && "geolocation" in navigator) {
      setGpsStatus("Searching GPS Signal...");
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          setGpsStatus("GPS Tracking Active");
          const { latitude, longitude } = position.coords;
          const newCoord = [latitude, longitude];

          setWaypoints(prev => [...prev, newCoord]);

          if (lastPosRef.current) {
            const dist = getDistanceFromLatLonInKm(
              lastPosRef.current.latitude,
              lastPosRef.current.longitude,
              latitude,
              longitude
            );
            if (dist > 0.002 && dist < 0.2) {
              setTotalGpsDistanceKm(prev => prev + dist);
            }
          }
          lastPosRef.current = { latitude, longitude };
        },
        (error) => {
          setGpsStatus("Location Permission Required");
          setIsGpsTracking(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 }
      );
    } else if (!isGpsTracking) {
      setGpsStatus(waypoints.length > 0 ? "Tracking Paused" : "Tracker Inactive");
      lastPosRef.current = null;
    }
    return () => { if (watchId !== null) navigator.geolocation.clearWatch(watchId); };
  }, [activeTab, isGpsTracking]);

  // Leaflet Map Initialization & Realtime Polyline Drawing
  useEffect(() => {
    if (activeTab === "home" && mapContainerRef.current) {
      if (!mapRef.current) {
        const initialCenter = waypoints.length > 0 ? waypoints[waypoints.length - 1] : [14.5995, 120.9842];
        const map = L.map(mapContainerRef.current, { zoomControl: false }).setView(initialCenter, 16);
        
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; OpenStreetMap'
        }).addTo(map);

        mapRef.current = map;
        polylineRef.current = L.polyline([], { color: "#38bdf8", weight: 5, opacity: 0.9 }).addTo(map);
      }

      if (waypoints.length > 0 && mapRef.current) {
        const latestPoint = waypoints[waypoints.length - 1];
        polylineRef.current.setLatLngs(waypoints);
        mapRef.current.panTo(latestPoint);

        if (!markerRef.current) {
          const pulseIcon = L.divIcon({
            className: "gps-pulse-marker",
            html: '<div style="width:14px;height:14px;background:#0284c7;border:2px solid white;border-radius:50%;box-shadow:0 0 8px rgba(2,132,199,0.8);"></div>',
            iconSize: [14, 14],
            iconAnchor: [7, 7]
          });
          markerRef.current = L.marker(latestPoint, { icon: pulseIcon }).addTo(mapRef.current);
        } else {
          markerRef.current.setLatLng(latestPoint);
        }
      }
    }

    return () => {
      if (activeTab !== "home" && mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        polylineRef.current = null;
        markerRef.current = null;
      }
    };
  }, [activeTab, waypoints]);

  const gpsCalculatedSteps = Math.round(totalGpsDistanceKm * 1350);
  const gpsCalBurned = Math.round(gpsCalculatedSteps * 0.04);

  return (
    <div className="card" style={{ padding: "16px", borderRadius: "20px", background: "linear-gradient(135deg, #0284c7, #0369a1)", color: "white", marginBottom: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <i className="fa-solid fa-location-dot" style={{ fontSize: "18px", color: "#38bdf8" }}></i>
          <h4 style={{ fontSize: "14px", fontWeight: 800 }}>GPS Step & Distance Tracker</h4>
        </div>
        <span style={{ fontSize: "9px", background: isGpsTracking ? "#10b981" : "rgba(255,255,255,0.2)", padding: "3px 8px", borderRadius: "8px", fontWeight: 800 }}>
          {gpsStatus}
        </span>
      </div>

      <div style={{ borderRadius: "14px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.2)", marginBottom: "12px", height: "150px", position: "relative", background: "#0f172a" }}>
        <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }}></div>
        {waypoints.length === 0 && !isGpsTracking && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.65)", backdropFilter: "blur(2px)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "11px", fontWeight: 700, pointerEvents: "none" }}>
            <i className="fa-solid fa-map-location-dot" style={{ marginRight: "6px", color: "#38bdf8" }}></i> Click "Start GPS" to display live route
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
        <div style={{ background: "rgba(255,255,255,0.1)", padding: "10px", borderRadius: "12px", textAlign: "center" }}>
          <div style={{ fontSize: "10px", opacity: 0.8, fontWeight: 700 }}>Estimated Steps</div>
          <div style={{ fontSize: "18px", fontWeight: 900, marginTop: "2px" }}>{gpsCalculatedSteps.toLocaleString()}</div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.1)", padding: "10px", borderRadius: "12px", textAlign: "center" }}>
          <div style={{ fontSize: "10px", opacity: 0.8, fontWeight: 700 }}>Distance Walked</div>
          <div style={{ fontSize: "18px", fontWeight: 900, marginTop: "2px" }}>{totalGpsDistanceKm.toFixed(2)} km</div>
        </div>
      </div>

      <div style={{ fontSize: "11px", opacity: 0.9, textAlign: "center", fontWeight: 700, marginBottom: "12px" }}>
        Active Calorie Burn: <span style={{ color: "#f59e0b", fontWeight: 900 }}>{gpsCalBurned} kcal</span>
      </div>

      <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
        {!isGpsTracking ? (
          <button 
            onClick={() => setIsGpsTracking(true)} 
            style={{ flex: 1, padding: "8px", background: "#10b981", color: "white", border: "none", borderRadius: "10px", fontWeight: 800, fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}
          >
            <i className="fa-solid fa-play"></i> Start GPS
          </button>
        ) : (
          <button 
            onClick={() => setIsGpsTracking(false)} 
            style={{ flex: 1, padding: "8px", background: "#f59e0b", color: "white", border: "none", borderRadius: "10px", fontWeight: 800, fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}
          >
            <i className="fa-solid fa-pause"></i> Pause
          </button>
        )}

        <button 
          onClick={async () => {
            if (gpsCalBurned > 0) {
              const currentBurned = appData?.todayBurnedCal || 0;
              await saveToCloud({ ...appData, todayBurnedCal: currentBurned + gpsCalBurned });
              showToast(`GPS Walk Logged! (+${gpsCalBurned} kcal burned)`);
            }
            setTotalGpsDistanceKm(0);
            setWaypoints([]);
            setIsGpsTracking(false);
          }} 
          style={{ flex: 1, padding: "8px", background: "#ffffff", color: "#0f172a", border: "none", borderRadius: "10px", fontWeight: 800, fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}
        >
          <i className="fa-solid fa-check"></i> Finish & Reset
        </button>
      </div>
    </div>
  );
}
`;

fs.writeFileSync("src/components/MapTracker.jsx", mapTrackerCode);

// 3. I-update ang App.jsx
let appCode = fs.readFileSync("src/App.jsx", "utf8");

// Alisin ang lumang Leaflet at Geo imports sa App.jsx
appCode = appCode.replace(/import\s*\{\s*getDistanceFromLatLonInKm\s*\}\s*from\s*["\x27]\.\/utils\/geo["\x27];?\s*/g, "");
appCode = appCode.replace(/import\s+L\s+from\s+["\x27]leaflet["\x27];?\s*/g, "");
appCode = appCode.replace(/import\s+["\x27]leaflet\/dist\/leaflet\.css["\x27];?\s*/g, "");

// Idagdag ang MapTracker import
if (!appCode.includes("import MapTracker")) {
  appCode = appCode.replace(
    /import\s+AuthScreen\s+from\s+["\x27]\.\/components\/AuthScreen["\x27];?/,
    'import AuthScreen from "./components/AuthScreen";\nimport MapTracker from "./components/MapTracker";'
  );
}

// Alisin ang GPS states
appCode = appCode.replace(/\s*const\s+\[gpsStatus[\s\S]*?lastPosRef\s*=\s*useRef\(null\);\s*/, "\n\n");

// Alisin ang watchPosition useEffect
appCode = appCode.replace(/\s*useEffect\(\(\)\s*=>\s*\{[\s\S]*?geolocation\.watchPosition[\s\S]*?\},\s*\[activeTab,\s*isGpsTracking\]\);\s*/, "\n\n");

// Alisin ang Leaflet Map Initialization useEffect
appCode = appCode.replace(/\s*\/\/\s*Leaflet Map Initialization[\s\S]*?\},\s*\[activeTab,\s*waypoints\]\);\s*/, "\n\n");

// Alisin ang GPS calculation lines
appCode = appCode.replace(/\s*const\s+gpsCalculatedSteps\s*=\s*Math\.round\(totalGpsDistanceKm\s*\*\s*1350\);\s*/, "\n");
appCode = appCode.replace(/\s*const\s+gpsCalBurned\s*=\s*Math\.round\(gpsCalculatedSteps\s*\*\s*0\.04\);\s*/, "\n");

// Palitan ang card JSX ng bagong <MapTracker />
const cardRegex = /<div className="card"[^>]*?>\s*<div[^>]*?>[\s\S]*?GPS Step & Distance Tracker[\s\S]*?Finish & Reset\s*<\/button>\s*<\/div>\s*<\/div>/;

const mapReplacement = `<MapTracker
              activeTab={activeTab}
              appData={appData}
              saveToCloud={saveToCloud}
              showToast={showToast}
            />`;

appCode = appCode.replace(cardRegex, mapReplacement);

fs.writeFileSync("src/App.jsx", appCode);
console.log("✅ Matagumpay! Naihiwalay na ang MapTracker.jsx at nalinis ang App.jsx.");
