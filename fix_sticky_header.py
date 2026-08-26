with open("src/App.jsx", "r") as f:
    code = f.read()

# Palitan ang lumang header ng Sticky/Frozen Header na may background at blur effect
old_social_header = """            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "linear-gradient(135deg, #4f46e5, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "13px", boxShadow: "0 2px 8px rgba(79,70,229,0.3)" }}>
                  <i className="fa-solid fa-heart-pulse"></i>
                </div>
                <h2 style={{ fontSize: "20px", fontWeight: 900, color: "var(--primary)", letterSpacing: "-0.5px", margin: 0 }}>NutriPulse</h2>
              </div>
              
              <div style={{ display: "flex", gap: "8px" }}>
                <button 
                  onClick={() => setShowSearchModal(true)} 
                  style={{ background: "#f1f5f9", border: "none", width: "36px", height: "36px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#334155", fontSize: "15px" }}
                >
                  <i className="fa-solid fa-magnifying-glass"></i>
                </button>

                <button 
                  onClick={() => { setActivePanel("notif"); const nowT = Date.now(); setLastSeenNotifTime(nowT); localStorage.setItem("np_last_seen_notif", nowT.toString()); }} 
                  style={{ position: "relative", background: "#f1f5f9", border: "none", width: "36px", height: "36px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#334155", fontSize: "15px" }}
                >
                  <i className="fa-regular fa-bell"></i>
                  {allUserNotifs.filter(n => (n.timestamp || 0) > lastSeenNotifTime).length > 0 && (
                    <span style={{ position: "absolute", top: "2px", right: "2px", background: "#ef4444", color: "white", fontSize: "9px", fontWeight: 800, width: "15px", height: "15px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {allUserNotifs.filter(n => (n.timestamp || 0) > lastSeenNotifTime).length}
                    </span>
                  )}
                </button>
              </div>
            </div>"""

new_social_header = """            {/* FROZEN STICKY SOCIAL HEADER */}
            <div style={{ 
              position: "sticky", 
              top: 0, 
              zIndex: 900, 
              background: "rgba(248, 250, 252, 0.92)", 
              backdropFilter: "blur(10px)", 
              WebkitBackdropFilter: "blur(10px)", 
              padding: "10px 0 12px 0", 
              marginBottom: "12px", 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              borderBottom: "1px solid rgba(226, 232, 240, 0.6)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "linear-gradient(135deg, #4f46e5, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "13px", boxShadow: "0 2px 8px rgba(79,70,229,0.3)" }}>
                  <i className="fa-solid fa-heart-pulse"></i>
                </div>
                <h2 style={{ fontSize: "20px", fontWeight: 900, color: "var(--primary)", letterSpacing: "-0.5px", margin: 0 }}>NutriPulse</h2>
              </div>
              
              <div style={{ display: "flex", gap: "8px" }}>
                <button 
                  onClick={() => setShowSearchModal(true)} 
                  style={{ background: "#ffffff", border: "1px solid #e2e8f0", width: "36px", height: "36px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#334155", fontSize: "15px", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}
                >
                  <i className="fa-solid fa-magnifying-glass"></i>
                </button>

                <button 
                  onClick={() => { setActivePanel("notif"); const nowT = Date.now(); setLastSeenNotifTime(nowT); localStorage.setItem("np_last_seen_notif", nowT.toString()); }} 
                  style={{ position: "relative", background: "#ffffff", border: "1px solid #e2e8f0", width: "36px", height: "36px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#334155", fontSize: "15px", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}
                >
                  <i className="fa-regular fa-bell"></i>
                  {allUserNotifs.filter(n => (n.timestamp || 0) > lastSeenNotifTime).length > 0 && (
                    <span style={{ position: "absolute", top: "2px", right: "2px", background: "#ef4444", color: "white", fontSize: "9px", fontWeight: 800, width: "15px", height: "15px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {allUserNotifs.filter(n => (n.timestamp || 0) > lastSeenNotifTime).length}
                    </span>
                  )}
                </button>
              </div>
            </div>"""

code = code.replace(old_social_header, new_social_header)

with open("src/App.jsx", "w") as f:
    f.write(code)

print("✅ Frozen Sticky Social Header applied!")
