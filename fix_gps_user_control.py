with open("src/App.jsx", "r") as f:
    code = f.read()

# 1. Dagdag ng tracking state controls
if "const [isGpsTracking, setIsGpsTracking] = useState(false);" not in code:
    code = code.replace(
        "const [gpsStatus, setGpsStatus] = useState(\"Searching GPS...\");",
        "const [gpsStatus, setGpsStatus] = useState(\"GPS Tracker Inactive\");\n  const [isGpsTracking, setIsGpsTracking] = useState(false);"
    )

# 2. Palitan ang lumang automatic useEffect ng manual GPS tracking useEffect
old_gps_effect = """  useEffect(() => {
    if (activeTab === "home" && "geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setGpsStatus("GPS Active");
          const { latitude, longitude } = position.coords;

          if (lastPosRef.current) {
            const dist = getDistanceFromLatLonInKm(
              lastPosRef.current.latitude,
              lastPosRef.current.longitude,
              latitude,
              longitude
            );
            if (dist > 0.003 && dist < 0.1) {
              setTotalGpsDistanceKm(prev => prev + dist);
            }
          }
          lastPosRef.current = { latitude, longitude };
        },
        (error) => {
          setGpsStatus("Allow Location Permission for Steps");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [activeTab]);"""

new_gps_effect = """  useEffect(() => {
    let watchId = null;
    if (activeTab === "home" && isGpsTracking && "geolocation" in navigator) {
      setGpsStatus("Searching GPS...");
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          setGpsStatus("GPS Tracking Active");
          const { latitude, longitude } = position.coords;

          if (lastPosRef.current) {
            const dist = getDistanceFromLatLonInKm(
              lastPosRef.current.latitude,
              lastPosRef.current.longitude,
              latitude,
              longitude
            );
            if (dist > 0.003 && dist < 0.1) {
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
      setGpsStatus("Tracker Inactive");
      lastPosRef.current = null;
    }
    return () => { if (watchId !== null) navigator.geolocation.clearWatch(watchId); };
  }, [activeTab, isGpsTracking]);"""

code = code.replace(old_gps_effect, new_gps_effect)

# 3. Palitan ang JSX Card ng GPS Tracker para may buttons (Start, Pause, Reset, Log)
old_gps_card = """            <div className="card" style={{ padding: "16px", borderRadius: "20px", background: "linear-gradient(135deg, #0284c7, #0369a1)", color: "white", marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <i className="fa-solid fa-location-dot" style={{ fontSize: "18px", color: "#38bdf8" }}></i>
                  <h4 style={{ fontSize: "14px", fontWeight: 800 }}>GPS Step & Distance Tracker</h4>
                </div>
                <span style={{ fontSize: "9px", background: "rgba(255,255,255,0.2)", padding: "3px 8px", borderRadius: "8px", fontWeight: 800 }}>
                  {gpsStatus}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "8px" }}>
                <div style={{ background: "rgba(255,255,255,0.1)", padding: "10px", borderRadius: "12px", textAlign: "center" }}>
                  <div style={{ fontSize: "10px", opacity: 0.8, fontWeight: 700 }}>Estimated Steps</div>
                  <div style={{ fontSize: "18px", fontWeight: 900, marginTop: "2px" }}>{gpsCalculatedSteps.toLocaleString()}</div>
                </div>

                <div style={{ background: "rgba(255,255,255,0.1)", padding: "10px", borderRadius: "12px", textAlign: "center" }}>
                  <div style={{ fontSize: "10px", opacity: 0.8, fontWeight: 700 }}>Distance Walked</div>
                  <div style={{ fontSize: "18px", fontWeight: 900, marginTop: "2px" }}>{totalGpsDistanceKm.toFixed(2)} km</div>
                </div>
              </div>

              <div style={{ fontSize: "10px", opacity: 0.9, textAlign: "center", fontWeight: 700 }}>
                Active GPS Calorie Burn: <span style={{ color: "#f59e0b", fontWeight: 900 }}>{gpsCalBurned} kcal</span>
              </div>
            </div>"""

new_gps_card = """            <div className="card" style={{ padding: "16px", borderRadius: "20px", background: "linear-gradient(135deg, #0284c7, #0369a1)", color: "white", marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <i className="fa-solid fa-location-dot" style={{ fontSize: "18px", color: "#38bdf8" }}></i>
                  <h4 style={{ fontSize: "14px", fontWeight: 800 }}>GPS Step & Distance Tracker</h4>
                </div>
                <span style={{ fontSize: "9px", background: isGpsTracking ? "#10b981" : "rgba(255,255,255,0.2)", padding: "3px 8px", borderRadius: "8px", fontWeight: 800 }}>
                  {gpsStatus}
                </span>
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

              {/* GPS USER CONTROL BUTTONS */}
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
                    setIsGpsTracking(false);
                  }} 
                  style={{ flex: 1, padding: "8px", background: "#ffffff", color: "#0f172a", border: "none", borderRadius: "10px", fontWeight: 800, fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}
                >
                  <i className="fa-solid fa-check"></i> Finish & Reset
                </button>
              </div>
            </div>"""

code = code.replace(old_gps_card, new_gps_card)

with open("src/App.jsx", "w") as f:
    f.write(code)

print("✅ Added manual Start/Pause/Reset user controls to GPS Step Tracker!")
