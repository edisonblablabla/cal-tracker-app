with open("src/App.jsx", "r") as f:
    code = f.read()

# Palitan ang lumang Search Modal ng modern at functional Search UI
old_search_jsx = """      {/* SEARCH ATHLETES OVERLAY MODAL */}
      {showSearchModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(6px)", zIndex: 2800, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "16px", paddingTop: "40px" }}>
          <div className="card" style={{ width: "100%", maxWidth: "380px", padding: "18px", borderRadius: "20px", background: "#ffffff", maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h4 style={{ fontSize: "15px", fontWeight: 900, color: "#0f172a" }}>Search Athletes</h4>
              <button onClick={() => { setShowSearchModal(false); setSearchQuery(""); }} style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: "26px", height: "26px", cursor: "pointer", fontWeight: 800, fontSize: "11px" }}>X</button>
            </div>

            <input 
              type="text" 
              className="form-input" 
              placeholder="Search by name or email..." 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              style={{ marginBottom: "12px", borderRadius: "12px", padding: "10px" }}
            />

            <div>
              {searchQuery.trim() === "" ? (
                <p style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "center", padding: "20px 0" }}>
                  Type a name or email to search athletes...
                </p>
              ) : filteredSearchUsers.length === 0 ? (
                <p style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "center", padding: "16px 0" }}>No athletes found matching "{searchQuery}".</p>
              ) : (
                filteredSearchUsers.map(u => (
                  <div key={u.uid} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", background: "#f8fafc", borderRadius: "12px", marginBottom: "6px", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, flex: 1 }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#4f46e5", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "12px", overflow: "hidden", flexShrink: 0 }}>
                        {u.avatarUrl ? <img src={u.avatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (u.userName || "A").charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: "11px", fontWeight: 800, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.userName || "Athlete"}</div>
                        <div style={{ fontSize: "9px", color: "var(--text-muted)" }}>{u.userTitle || "Fitness Enthusiast"}</div>
                      </div>
                    </div>

                    <button 
                      onClick={() => { setSelectedVisitor(u); setActivePanel("visitor_profile"); setShowSearchModal(false); setSearchQuery(""); }}
                      style={{ background: "var(--primary)", color: "white", border: "none", padding: "4px 10px", borderRadius: "8px", fontSize: "9px", fontWeight: 800, cursor: "pointer", flexShrink: 0 }}
                    >
                      View
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}"""

new_search_jsx = """      {/* UPGRADED MODERN SEARCH ATHLETES OVERLAY MODAL */}
      {showSearchModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(8px)", zIndex: 2800, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "16px", paddingTop: "30px" }}>
          <div className="card" style={{ width: "100%", maxWidth: "420px", padding: "20px", borderRadius: "24px", background: "#ffffff", maxHeight: "82vh", display: "flex", flexDirection: "column", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
            
            {/* Search Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <i className="fa-solid fa-magnifying-glass" style={{ color: "var(--primary)", fontSize: "16px" }}></i>
                <h4 style={{ fontSize: "16px", fontWeight: 900, color: "#0f172a", margin: 0 }}>Find Athletes</h4>
              </div>
              <button onClick={() => { setShowSearchModal(false); setSearchQuery(""); }} style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", fontWeight: 800, fontSize: "12px", color: "#64748b" }}>X</button>
            </div>

            {/* Input Box */}
            <div style={{ position: "relative", marginBottom: "14px" }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Search athlete by name or email..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                style={{ marginBottom: 0, borderRadius: "14px", padding: "12px 14px", fontSize: "12px", background: "#f8fafc", border: "1px solid #cbd5e1" }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "12px", fontWeight: 800 }}>Clear</button>
              )}
            </div>

            {/* Results List */}
            <div style={{ flex: 1, overflowY: "auto", paddingRight: "2px" }}>
              {searchQuery.trim() === "" ? (
                <div style={{ textAlign: "center", padding: "30px 10px", color: "#94a3b8" }}>
                  <i className="fa-solid fa-users-viewfinder" style={{ fontSize: "36px", marginBottom: "10px", opacity: 0.6, display: "block" }}></i>
                  <p style={{ fontSize: "12px", fontWeight: 700, margin: 0 }}>Search for friends and fellow athletes</p>
                  <span style={{ fontSize: "10px", opacity: 0.8 }}>Type a name or email address above</span>
                </div>
              ) : filteredSearchUsers.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px 10px", color: "#94a3b8" }}>
                  <i className="fa-regular fa-face-frown" style={{ fontSize: "32px", marginBottom: "8px", opacity: 0.6, display: "block" }}></i>
                  <p style={{ fontSize: "12px", fontWeight: 700, margin: 0 }}>No athletes found</p>
                  <span style={{ fontSize: "10px", opacity: 0.8 }}>Try searching with a different term</span>
                </div>
              ) : (
                filteredSearchUsers.map(u => {
                  const isBoosting = (appData?.boosting || []).includes(u.uid);
                  const isSelf = u.uid === user?.uid;
                  return (
                    <div key={u.uid} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "#f8fafc", borderRadius: "16px", marginBottom: "8px", border: "1px solid #f1f5f9" }}>
                      
                      {/* Avatar & Info */}
                      <div 
                        onClick={() => { setSelectedVisitor(u); setActivePanel("visitor_profile"); setShowSearchModal(false); setSearchQuery(""); }} 
                        style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1, cursor: "pointer" }}
                      >
                        <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#4f46e5", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "15px", overflow: "hidden", flexShrink: 0 }}>
                          {u.avatarUrl ? <img src={u.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (u.userName || "A").charAt(0).toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {u.userName || "Athlete"} {isSelf && <span style={{ fontSize: "8px", background: "#e0e7ff", color: "var(--primary)", padding: "1px 5px", borderRadius: "4px" }}>You</span>}
                          </div>
                          <div style={{ fontSize: "9px", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.userTitle || "Fitness Enthusiast"}</div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: "flex", gap: "6px", alignItems: "center", flexShrink: 0 }}>
                        {!isSelf && (
                          <button 
                            onClick={() => toggleBoostAthlete(u.uid, u.isPrivateAccount)}
                            style={{ 
                              background: isBoosting ? "#f1f5f9" : "var(--primary)", 
                              color: isBoosting ? "#334155" : "#ffffff", 
                              border: isBoosting ? "1px solid #cbd5e1" : "none", 
                              padding: "5px 10px", 
                              borderRadius: "10px", 
                              fontSize: "10px", 
                              fontWeight: 800, 
                              cursor: "pointer" 
                            }}
                          >
                            {isBoosting ? "Boosting" : "Boost"}
                          </button>
                        )}
                        <button 
                          onClick={() => { setSelectedVisitor(u); setActivePanel("visitor_profile"); setShowSearchModal(false); setSearchQuery(""); }}
                          style={{ background: "#e0f2fe", color: "#0284c7", border: "none", padding: "5px 10px", borderRadius: "10px", fontSize: "10px", fontWeight: 800, cursor: "pointer" }}
                        >
                          View
                        </button>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>
      )}"""

code = code.replace(old_search_jsx, new_search_jsx)

with open("src/App.jsx", "w") as f:
    f.write(code)

print("✅ Upgraded Search Athletes Modal to modern UI with live Boost controls!")
