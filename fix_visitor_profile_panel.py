with open("src/App.jsx", "r") as f:
    code = f.read()

# Bagong ganap na Visitor Profile Panel JSX
old_visitor_panel = """            {/* VISITOR PROFILE PANEL */}
            {activePanel === 'visitor_profile' && selectedVisitor && (
              <div style={{ textAlign: "center" }}>
                <img src={selectedVisitor.avatarUrl || "https://via.placeholder.com/80"} alt="" style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", margin: "0 auto 10px auto" }} />
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 900, color: "#0f172a" }}>{selectedVisitor.userName || "Athlete"}</h3>
                <p style={{ margin: "2px 0 12px 0", fontSize: "12px", color: "#64748b" }}>{selectedVisitor.userTitle || "Fitness Enthusiast"}</p>
                <button onClick={() => toggleBoostAthlete(selectedVisitor.uid, selectedVisitor.isPrivateAccount)} style={{ width: "100%", padding: "10px", background: "var(--primary)", color: "white", border: "none", borderRadius: "10px", fontWeight: 800, cursor: "pointer" }}>
                  {(appData?.boosting || []).includes(selectedVisitor.uid) ? " Unboost Athlete" : " Boost Athlete"}
                </button>
              </div>
            )}"""

new_visitor_panel = """            {/* UPGRADED MODERN VISITOR PROFILE PANEL */}
            {activePanel === 'visitor_profile' && selectedVisitor && (() => {
              const visitorPosts = posts.filter(p => {
                if (p.userId !== selectedVisitor.uid || p.isHidden) return false;
                if (p.visibility === "private") return false;
                const isBoostingVisitor = (appData?.boosting || []).includes(selectedVisitor.uid);
                if (p.visibility === "boosters" && !isBoostingVisitor) return false;
                return true;
              });

              const visitorBoostersCount = userList.filter(u => (u.boosting || []).includes(selectedVisitor.uid)).length;
              const visitorBoostingCount = (selectedVisitor.boosting || []).length;
              const visitorPulses = posts.filter(p => p.userId === selectedVisitor.uid && !p.isHidden).reduce((acc, curr) => acc + (curr.likes || 0), 0);
              const isBoostingThisVisitor = (appData?.boosting || []).includes(selectedVisitor.uid);

              return (
                <div>
                  <div className="card" style={{ padding: "16px", borderRadius: "20px", textAlign: "center", marginBottom: "14px", border: "1px solid #e2e8f0" }}>
                    <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "#4f46e5", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "26px", margin: "0 auto 10px auto", overflow: "hidden" }}>
                      {selectedVisitor.avatarUrl ? (
                        <img src={selectedVisitor.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        (selectedVisitor.userName || "A").charAt(0).toUpperCase()
                      )}
                    </div>
                    
                    <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 900, color: "#0f172a" }}>{selectedVisitor.userName || "Athlete"}</h3>
                    <p style={{ margin: "2px 0 12px 0", fontSize: "11px", color: "#64748b", fontWeight: 600 }}>{selectedVisitor.userTitle || "Fitness Enthusiast"}</p>

                    <button 
                      onClick={() => toggleBoostAthlete(selectedVisitor.uid, selectedVisitor.isPrivateAccount)} 
                      style={{ 
                        width: "100%", 
                        padding: "10px", 
                        background: isBoostingThisVisitor ? "#f1f5f9" : "var(--primary)", 
                        color: isBoostingThisVisitor ? "#334155" : "#ffffff", 
                        border: isBoostingThisVisitor ? "1px solid #cbd5e1" : "none", 
                        borderRadius: "12px", 
                        fontWeight: 800, 
                        fontSize: "12px",
                        cursor: "pointer",
                        marginBottom: "14px"
                      }}
                    >
                      {isBoostingThisVisitor ? "Unboost Athlete" : "Boost Athlete"}
                    </button>

                    {/* ATHLETIC STATS GRID */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "4px", background: "#f8fafc", padding: "10px", borderRadius: "14px", border: "1px solid #f1f5f9" }}>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 900, color: "var(--primary)" }}>{visitorBoostingCount}</div>
                        <div style={{ fontSize: "8px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Boosting</div>
                      </div>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 900, color: "#10b981" }}>{visitorBoostersCount}</div>
                        <div style={{ fontSize: "8px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Boosters</div>
                      </div>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 900, color: "#f59e0b" }}>{selectedVisitor.streakDays || 1}</div>
                        <div style={{ fontSize: "8px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Streak</div>
                      </div>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 900, color: "#ef4444" }}>{visitorPulses}</div>
                        <div style={{ fontSize: "8px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Pulses</div>
                      </div>
                    </div>
                  </div>

                  {/* VISITOR POSTS FEED */}
                  <div style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a", marginBottom: "10px", paddingLeft: "4px" }}>Athlete Feed</div>

                  {visitorPosts.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "30px 16px", background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", color: "#94a3b8", fontSize: "12px" }}>
                      <i className="fa-regular fa-folder-open" style={{ fontSize: "24px", marginBottom: "8px", display: "block" }}></i>
                      No visible posts from this athlete.
                    </div>
                  ) : (
                    visitorPosts.map(p => {
                      const isLiked = (p.likedBy || []).includes(user?.uid);
                      return (
                        <div key={p.id} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "12px", marginBottom: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#4f46e5", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "12px", overflow: "hidden" }}>
                                {p.userAvatar ? <img src={p.userAvatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (p.userName || "A").charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a" }}>{p.userName}</div>
                                <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>{formatPostTime(p.createdAt)}</span>
                              </div>
                            </div>
                          </div>

                          <div onClick={() => { setSelectedPost(p); setActivePanel("post_detail"); }} style={{ cursor: "pointer" }}>
                            <ExpandableText text={p.text} />
                          </div>

                          {p.imageUrl && (
                            <div onClick={() => { setSelectedPost(p); setActivePanel("post_detail"); }} style={{ borderRadius: "10px", overflow: "hidden", border: "1px solid #f1f5f9", marginBottom: "6px", background: "#f8fafc", aspectRatio: "4/3", cursor: "pointer" }}>
                              <img src={p.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            </div>
                          )}

                          <div style={{ display: "flex", alignItems: "center", gap: "10px", borderTop: "1px solid #f1f5f9", paddingTop: "8px", marginTop: "4px" }}>
                            <button onClick={() => handleLike(p.id, p.likes || 0, p.likedBy || [])} style={{ background: isLiked ? "#fef2f2" : "transparent", border: "none", color: isLiked ? "#ef4444" : "#64748b", padding: "4px 8px", fontSize: "11px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", borderRadius: "10px" }}>
                              <i className={isLiked ? "fa-solid fa-heart" : "fa-regular fa-heart"}></i> {p.likes || 0} Pulses
                            </button>
                            <button onClick={() => { setSelectedPost(p); setActivePanel("post_detail"); }} style={{ background: "transparent", border: "none", color: "#64748b", padding: "4px 8px", fontSize: "11px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
                              <i className="fa-regular fa-comment"></i> {p.commentsCount || 0}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })()}"""

code = code.replace(old_visitor_panel, new_visitor_panel)

with open("src/App.jsx", "w") as f:
    f.write(code)

print("✅ Upgraded Visitor Profile Panel with Stats Grid and Public Feed!")
