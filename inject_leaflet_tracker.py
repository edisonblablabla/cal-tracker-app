with open("src/App.jsx", "r") as f:
    code = f.read()

# 1. Import Leaflet & Leaflet CSS at the top
leaflet_imports = """import L from "leaflet";
import "leaflet/dist/leaflet.css";"""

if 'import L from "leaflet";' not in code:
    code = code.replace('import React, { useState, useEffect, useRef } from "react";', 'import React, { useState, useEffect, useRef } from "react";\n' + leaflet_imports)

# 2. Add Waypoint tracking states
waypoint_states = """  const [gpsStatus, setGpsStatus] = useState("GPS Tracker Inactive");
  const [isGpsTracking, setIsGpsTracking] = useState(false);
  const [waypoints, setWaypoints] = useState([]);
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const polylineRef = useRef(null);
  const markerRef = useRef(null);"""

if "const [waypoints, setWaypoints] = useState([]);" not in code:
    code = code.replace('const [gpsStatus, setGpsStatus] = useState("GPS Tracker Inactive");\n  const [isGpsTracking, setIsGpsTracking] = useState(false);', waypoint_states)

# 3. Update useEffect for GPS Watcher to save Waypoints
old_gps_effect = """  useEffect(() => {
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

new_gps_effect = """  useEffect(() => {
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
  }, [activeTab, waypoints]);"""

code = code.replace(old_gps_effect, new_gps_effect)

# 4. Inject Map container into GPS Tracker Card
old_gps_card = """              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                <div style={{ background: "rgba(255,255,255,0.1)", padding: "10px", borderRadius: "12px", textAlign: "center" }}>
                  <div style={{ fontSize: "10px", opacity: 0.8, fontWeight: 700 }}>Estimated Steps</div>
                  <div style={{ fontSize: "18px", fontWeight: 900, marginTop: "2px" }}>{gpsCalculatedSteps.toLocaleString()}</div>
                </div>

                <div style={{ background: "rgba(255,255,255,0.1)", padding: "10px", borderRadius: "12px", textAlign: "center" }}>
                  <div style={{ fontSize: "10px", opacity: 0.8, fontWeight: 700 }}>Distance Walked</div>
                  <div style={{ fontSize: "18px", fontWeight: 900, marginTop: "2px" }}>{totalGpsDistanceKm.toFixed(2)} km</div>
                </div>
              </div>"""

new_gps_card = """              {/* LEAFLET INTERACTIVE ROUTE MAP CONTAINER */}
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
              </div>"""

code = code.replace(old_gps_card, new_gps_card)

# 5. Clear waypoints on Reset
code = code.replace("setTotalGpsDistanceKm(0);", "setTotalGpsDistanceKm(0);\n                    setWaypoints([]);")

with open("src/App.jsx", "w") as f:
    f.write(code)

print("✅ Successfully injected Leaflet Live Route Map Tracker into App.jsx!")
