import React from "react";
import ExpandableText from "./ExpandableText";

function defaultFormatTime(ts) {
  if (!ts) return "Just now";
  const d = Date.now() - ts;
  if (d < 60000) return "Just now";
  if (d < 3600000) return Math.floor(d / 60000) + "m ago";
  if (d < 86400000) return Math.floor(d / 3600000) + "h ago";
  return new Date(ts).toLocaleDateString();
}

export default function ModalsLayer({
  showAboutModal,
  setShowAboutModal,
  showSearchModal,
  setShowSearchModal,
  searchQuery,
  setSearchQuery,
  filteredSearchUsers = [],
  setSelectedVisitor,
  setActivePanel,
  toggleBoostAthlete,
  user,
  activePanel,
  allUserNotifs = [],
  lastSeenNotifTime = 0,
  posts = [],
  liveSelectedPost,
  setSelectedPost,
  handleLike,
  showToast,
  postComments = [],
  newCommentText,
  setNewCommentText,
  handleAddComment,
  activeCommentMenuId,
  setActiveCommentMenuId,
  setCommentToEdit,
  setCommentEditText,
  setCommentToDelete,
  profName,
  setProfName,
  profTitle,
  setProfTitle,
  profHeight,
  setProfHeight,
  profWeight,
  setProfWeight,
  saveUserProfile,
  isSavingProfile,
  handleLogout,
  myRealtimeBoostersList = [],
  myRealtimeBoostingList = [],
  appData,
  userList = [],
  selectedVisitor,
  editingPost,
  setEditingPost,
  editText,
  setEditText,
  editVisibility,
  setEditVisibility,
  saveEditedPost,
  isSavingEditPost,
  commentToEdit,
  commentEditText,
  saveEditedComment,
  commentToDelete,
  confirmDeleteComment,
  isAdmin = false,
  formatPostTime = defaultFormatTime
}) {
  const formatTime = formatPostTime || defaultFormatTime;

  return (
    <>
      {/* ABOUT MODAL */}
      {showAboutModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(6px)", zIndex: 2900, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div className="card" style={{ width: "100%", maxWidth: "380px", padding: "22px", borderRadius: "24px", background: "#ffffff", textAlign: "center" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "linear-gradient(135deg, #4f46e5, #06b6d4)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", margin: "0 auto 12px auto", boxShadow: "0 4px 16px rgba(79,70,229,0.35)" }}>
              <i className="fa-solid fa-heart-pulse"></i>
            </div>
            <h3 style={{ fontSize: "18px", fontWeight: 900, color: "#0f172a", margin: 0 }}>NutriPulse Web App</h3>
            <span style={{ fontSize: "10px", color: "var(--primary)", fontWeight: 800, background: "#e0e7ff", padding: "2px 8px", borderRadius: "6px", display: "inline-block", marginTop: "4px" }}>
              Version 1.0.0 (Official Build)
            </span>

            <div style={{ margin: "16px 0", textAlign: "left", fontSize: "11px", color: "#475569", lineHeight: 1.6, background: "#f8fafc", padding: "12px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
              <div style={{ marginBottom: "6px" }}><strong>Architecture:</strong> Athletic Nutrition, Live GPS Step Calculations, Workout Countdowns, and Social Boosting Feed.</div>
              <div><strong>Official System Creator:</strong> <span style={{ color: "#0f172a", fontWeight: 800 }}>Edison Valerio</span></div>
            </div>

            <p style={{ fontSize: "9px", color: "#94a3b8", fontWeight: 700, marginBottom: "16px" }}>
              Protected by Git Cryptographic Signatures & Firebase Ownership. Copyright © 2026 Edison Valerio. All rights reserved.
            </p>

            <button onClick={() => setShowAboutModal(false)} className="btn-block" style={{ height: "40px", fontSize: "12px" }}>
              Close Information
            </button>
          </div>
        </div>
      )}

      {/* UPGRADED MODERN SEARCH ATHLETES OVERLAY MODAL */}
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
      )}

      {/* UNIFORM SLIDE-OVER PANEL ENGINE */}
      {activePanel && (
        <div style={{
          position: "fixed",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          maxWidth: "480px",
          width: "100%",
          height: "100vh",
          background: "#ffffff",
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
        }}>
          {/* Header */}
          <div style={{
            padding: "16px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#ffffff"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button onClick={() => setActivePanel(null)} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#334155" }}>
                <i className="fa-solid fa-arrow-left"></i>
              </button>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
                {activePanel === 'notif' && 'Notifications'}
                {activePanel === 'post_detail' && 'Post Detail'}
                {activePanel === 'boosters' && 'Boosters'}
                {activePanel === 'boosting' && 'Boosting'}
                {activePanel === 'settings' && 'Profile Settings'}
                {activePanel === 'visitor_profile' && (selectedVisitor?.userName || 'Athlete Profile')}
              </h3>
            </div>
            {activePanel === 'notif' && (
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#0284c7", background: "#e0f2fe", padding: "4px 10px", borderRadius: "12px" }}>
                {allUserNotifs.filter(n => (n.timestamp || 0) > lastSeenNotifTime).length} New
              </span>
            )}
          </div>

          {/* Panel Body */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px", paddingBottom: "140px", WebkitOverflowScrolling: "touch" }}>
            {/* NOTIFICATION PANEL */}
            {activePanel === 'notif' && (
              allUserNotifs.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8", fontSize: "13px" }}>
                  <i className="fa-regular fa-bell-slash" style={{ fontSize: "32px", marginBottom: "10px", display: "block" }}></i>
                  No notifications yet.
                </div>
              ) : (
                allUserNotifs.map(notif => (
                  <div key={notif.id} onClick={() => {
                    if (notif.postId) {
                      const found = posts.find(p => p.id === notif.postId);
                      if (found) { setSelectedPost(found); setActivePanel('post_detail'); }
                    } else if (notif.uid) {
                      const foundU = userList.find(u => u.uid === notif.uid);
                      if (foundU) { setSelectedVisitor(foundU); setActivePanel('visitor_profile'); }
                    }
                  }} style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px",
                    borderRadius: "12px",
                    background: "#f8fafc",
                    marginBottom: "8px",
                    border: "1px solid #f1f5f9",
                    cursor: "pointer"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                      {notif.avatar || notif.senderAvatar ? (
                        <img src={notif.avatar || notif.senderAvatar} alt="" style={{ width: "38px", height: "38px", borderRadius: "50%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#0284c7", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "14px" }}>
                          {(notif.title || notif.senderName || "N").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "12px", color: "#0f172a" }}>
                          <strong>{notif.title || notif.senderName}</strong> {notif.text}
                        </div>
                        <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "3px", fontWeight: 600 }}>
                          {formatTime(notif.timestamp)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )
            )}

            {/* REAL-TIME POST DETAIL PANEL */}
            {activePanel === 'post_detail' && liveSelectedPost && (
              <div style={{ background: "#ffffff", borderRadius: "16px", padding: "14px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                  {liveSelectedPost.userAvatar ? (
                    <img src={liveSelectedPost.userAvatar} alt="" style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#0284c7", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "14px" }}>
                      {(liveSelectedPost.userName || "A").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <strong style={{ fontSize: "14px", color: "#0f172a", display: "block" }}>{liveSelectedPost.userName || "Athlete"}</strong>
                    <span style={{ fontSize: "10px", color: "#94a3b8" }}>{formatTime(liveSelectedPost.createdAt)}</span>
                  </div>
                </div>
                {liveSelectedPost.text && <p style={{ fontSize: "13px", color: "#334155", lineHeight: "1.5", marginBottom: "12px", wordBreak: "break-word" }}>{liveSelectedPost.text}</p>}
                {liveSelectedPost.imageUrl && <img src={liveSelectedPost.imageUrl} alt="" style={{ width: "100%", borderRadius: "12px", marginBottom: "12px", objectFit: "cover" }} />}
                
                <div style={{ display: "flex", gap: "16px", padding: "10px 0", borderTop: "1px solid #f1f5f9", borderBottom: "1px solid #f1f5f9" }}>
                  <button onClick={() => handleLike(liveSelectedPost.id, liveSelectedPost.likes || 0, liveSelectedPost.likedBy || [])} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 700, color: (liveSelectedPost.likedBy || []).includes(user?.uid) ? "#ef4444" : "#64748b" }}>
                    <i className="fa-solid fa-heart" style={{ marginRight: "4px" }}></i> Pulse ({liveSelectedPost.likes || 0})
                  </button>
                  <button onClick={() => { navigator.clipboard.writeText(window.location.href); showToast("Link copied to clipboard!"); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 700, color: "#64748b" }}>
                    <i className="fa-solid fa-share-nodes" style={{ marginRight: "4px" }}></i> Resonate
                  </button>
                </div>

                {/* REAL-TIME COMMENTS LIST */}
                <div style={{ marginTop: "14px" }}>
                  <h4 style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>Comments ({postComments.length})</h4>
                  
                  <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                    <input 
                      type="text" 
                      placeholder="Write a comment..." 
                      value={newCommentText} 
                      onChange={(e) => setNewCommentText(e.target.value)} 
                      style={{ flex: 1, padding: "8px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "11px", outline: "none" }} 
                    />
                    <button onClick={() => handleAddComment(liveSelectedPost.id)} style={{ padding: "8px 14px", background: "#0284c7", color: "white", border: "none", borderRadius: "10px", fontWeight: 800, fontSize: "11px", cursor: "pointer" }}>Post</button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {postComments.length === 0 ? (
                      <p style={{ fontSize: "11px", color: "#94a3b8", textAlign: "center", padding: "10px 0" }}>No comments yet. Be the first to comment!</p>
                    ) : (
                      postComments.map(c => {
                        const isCommentOwner = (c.userId && c.userId === user?.uid) || 
                                                (c.userName && c.userName.toLowerCase() === (appData?.userName || user?.displayName || "").toLowerCase()) || 
                                                isAdmin;
                        return (
                          <div key={c.id} style={{ background: "#f8fafc", padding: "8px 10px", borderRadius: "10px", border: "1px solid #f1f5f9", position: "relative" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <strong style={{ fontSize: "11px", color: "#0f172a" }}>{c.userName}</strong>
                                {c.isEdited && <span style={{ fontSize: "8px", color: "#94a3b8", fontStyle: "italic" }}>(edited)</span>}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ fontSize: "9px", color: "#94a3b8" }}>{formatTime(c.createdAt)}</span>
                                {isCommentOwner && (
                                  <div style={{ position: "relative" }}>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); setActiveCommentMenuId(activeCommentMenuId === c.id ? null : c.id); }} 
                                      style={{ background: "none", border: "none", color: "#64748b", fontSize: "12px", cursor: "pointer", padding: "2px 4px" }}
                                    >
                                      <i className="fa-solid fa-ellipsis-vertical"></i>
                                    </button>

                                    {activeCommentMenuId === c.id && (
                                      <div style={{ 
                                        position: "absolute", 
                                        right: 0, 
                                        top: "22px", 
                                        background: "#ffffff", 
                                        border: "1px solid rgba(226, 232, 240, 0.8)", 
                                        borderRadius: "12px", 
                                        boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.04)", 
                                        zIndex: 999, 
                                        minWidth: "110px", 
                                        padding: "4px",
                                        backdropFilter: "blur(8px)"
                                      }}>
                                        <button 
                                          onClick={() => { setActiveCommentMenuId(null); setCommentToEdit({ commentId: c.id, postId: liveSelectedPost.id }); setCommentEditText(c.text); }} 
                                          style={{ width: "100%", padding: "7px 10px", background: "transparent", border: "none", borderRadius: "8px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#334155", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                                        >
                                          <i className="fa-solid fa-pen" style={{ color: "#0284c7", fontSize: "11px" }}></i> Edit
                                        </button>
                                        <button 
                                          onClick={() => { setActiveCommentMenuId(null); setCommentToDelete({ commentId: c.id, postId: liveSelectedPost.id }); }} 
                                          style={{ width: "100%", padding: "7px 10px", background: "transparent", border: "none", borderRadius: "8px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                                        >
                                          <i className="fa-solid fa-trash" style={{ fontSize: "11px" }}></i> Delete
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            <p style={{ fontSize: "11px", color: "#334155", margin: 0, wordBreak: "break-word" }}>{c.text}</p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* PROFILE SETTINGS PANEL */}
            {activePanel === 'settings' && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>Display Name</label>
                  <input type="text" value={profName} onChange={e => setProfName(e.target.value)} className="form-input" />
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>Bio Title</label>
                  <input type="text" value={profTitle} onChange={e => setProfTitle(e.target.value)} className="form-input" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>Height (cm)</label>
                    <input type="number" value={profHeight} onChange={e => setProfHeight(e.target.value)} className="form-input" />
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>Weight (kg)</label>
                    <input type="number" value={profWeight} onChange={e => setProfWeight(e.target.value)} className="form-input" />
                  </div>
                </div>
                <button onClick={saveUserProfile} disabled={isSavingProfile} style={{ padding: "12px", background: "#0284c7", color: "white", border: "none", borderRadius: "10px", fontWeight: 800, cursor: "pointer", marginTop: "10px" }}>
                  {isSavingProfile ? "Saving..." : "Save Profile Settings"}
                </button>
                <button onClick={handleLogout} style={{ padding: "12px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "10px", fontWeight: 800, cursor: "pointer" }}>
                  Sign Out Account
                </button>
              </div>
            )}

            {/* BOOSTERS LIST PANEL */}
            {activePanel === 'boosters' && (
              <div>
                <h4 style={{ margin: "0 0 12px 0", fontSize: "12px", color: "#64748b", fontWeight: 800 }}>Athletes boosting you</h4>
                {myRealtimeBoostersList.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "30px", color: "#94a3b8", fontSize: "12px" }}>No boosters yet.</div>
                ) : (
                  myRealtimeBoostersList.map(b => (
                    <div key={b.uid} onClick={() => { setSelectedVisitor(b); setActivePanel('visitor_profile'); }} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "12px", background: "#ffffff", border: "1px solid #e2e8f0", marginBottom: "8px", cursor: "pointer" }}>
                      {b.avatarUrl ? (
                        <img src={b.avatarUrl} alt="" style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#0284c7", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "13px" }}>
                          {(b.userName || "A").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a" }}>{b.userName || "Athlete"}</div>
                        <div style={{ fontSize: "9px", color: "#64748b" }}>{b.userTitle || "Fitness Enthusiast"}</div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); toggleBoostAthlete(b.uid, b.isPrivateAccount); }} style={{
                        padding: "5px 12px",
                        borderRadius: "20px",
                        border: (appData?.boosting || []).includes(b.uid) ? "1px solid #cbd5e1" : "none",
                        fontSize: "10px",
                        fontWeight: 700,
                        cursor: "pointer",
                        background: (appData?.boosting || []).includes(b.uid) ? "#f1f5f9" : "#0284c7",
                        color: (appData?.boosting || []).includes(b.uid) ? "#334155" : "#ffffff"
                      }}>
                        {(appData?.boosting || []).includes(b.uid) ? "Boosting" : "Boost Back"}
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* BOOSTING LIST PANEL */}
            {activePanel === 'boosting' && (
              <div>
                <h4 style={{ margin: "0 0 12px 0", fontSize: "12px", color: "#64748b", fontWeight: 800 }}>Athletes you are boosting</h4>
                {myRealtimeBoostingList.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "30px", color: "#94a3b8", fontSize: "12px" }}>Not boosting any athletes yet.</div>
                ) : (
                  myRealtimeBoostingList.map(b => (
                    <div key={b.uid} onClick={() => { setSelectedVisitor(b); setActivePanel('visitor_profile'); }} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "12px", background: "#ffffff", border: "1px solid #e2e8f0", marginBottom: "8px", cursor: "pointer" }}>
                      {b.avatarUrl ? (
                        <img src={b.avatarUrl} alt="" style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#0284c7", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "13px" }}>
                          {(b.userName || "A").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a" }}>{b.userName || "Athlete"}</div>
                        <div style={{ fontSize: "9px", color: "#64748b" }}>{b.userTitle || "Fitness Enthusiast"}</div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); toggleBoostAthlete(b.uid, b.isPrivateAccount); }} style={{ padding: "5px 12px", borderRadius: "20px", background: "#f1f5f9", border: "1px solid #cbd5e1", color: "#334155", fontSize: "10px", fontWeight: 700, cursor: "pointer" }}>
                        Unboost
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* VISITOR PROFILE PANEL */}
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
                                <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>{formatTime(p.createdAt)}</span>
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
            })()}
          </div>
        </div>
      )}

      {/* EDIT POST OVERLAY MODAL */}
      {editingPost && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(6px)", zIndex: 999999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div className="card" style={{ width: "100%", maxWidth: "380px", padding: "20px", borderRadius: "20px", background: "#ffffff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h4 style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a", margin: 0 }}>Edit Post</h4>
              <button onClick={() => setEditingPost(null)} style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: "26px", height: "26px", cursor: "pointer", fontWeight: 800, fontSize: "11px" }}>X</button>
            </div>
            
            <textarea 
              className="form-input" 
              style={{ width: "100%", height: "80px", borderRadius: "10px", padding: "10px", fontSize: "12px", border: "1px solid #cbd5e1", resize: "none", marginBottom: "12px", boxSizing: "border-box" }}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
            />

            <div style={{ display: "flex", gap: "6px", marginBottom: "14px" }}>
              <button onClick={() => setEditVisibility("public")} style={{ flex: 1, padding: "6px", borderRadius: "8px", border: "none", fontSize: "10px", fontWeight: 800, cursor: "pointer", background: editVisibility === "public" ? "#0284c7" : "#f1f5f9", color: editVisibility === "public" ? "white" : "#64748b" }}>Public</button>
              <button onClick={() => setEditVisibility("boosters")} style={{ flex: 1, padding: "6px", borderRadius: "8px", border: "none", fontSize: "10px", fontWeight: 800, cursor: "pointer", background: editVisibility === "boosters" ? "#0284c7" : "#f1f5f9", color: editVisibility === "boosters" ? "white" : "#64748b" }}>Boosters</button>
              <button onClick={() => setEditVisibility("private")} style={{ flex: 1, padding: "6px", borderRadius: "8px", border: "none", fontSize: "10px", fontWeight: 800, cursor: "pointer", background: editVisibility === "private" ? "#0284c7" : "#f1f5f9", color: editVisibility === "private" ? "white" : "#64748b" }}>Private</button>
            </div>

            <button onClick={saveEditedPost} disabled={isSavingEditPost} style={{ width: "100%", padding: "10px", background: "#0284c7", color: "white", border: "none", borderRadius: "10px", fontWeight: 800, fontSize: "12px", cursor: "pointer" }}>
              {isSavingEditPost ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* CUSTOM MODERN EDIT COMMENT MODAL */}
      {commentToEdit && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(6px)", zIndex: 999999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div className="card" style={{ width: "100%", maxWidth: "360px", padding: "20px", borderRadius: "20px", background: "#ffffff", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h4 style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a", margin: 0 }}>Edit Comment</h4>
              <button onClick={() => setCommentToEdit(null)} style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: "26px", height: "26px", cursor: "pointer", fontWeight: 800, fontSize: "11px" }}>X</button>
            </div>
            <textarea 
              className="form-input" 
              style={{ width: "100%", height: "70px", borderRadius: "10px", padding: "10px", fontSize: "12px", border: "1px solid #cbd5e1", resize: "none", marginBottom: "12px", boxSizing: "border-box" }}
              value={commentEditText}
              onChange={(e) => setCommentEditText(e.target.value)}
            />
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => setCommentToEdit(null)} style={{ flex: 1, padding: "10px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "10px", fontWeight: 800, fontSize: "11px", cursor: "pointer" }}>Cancel</button>
              <button onClick={saveEditedComment} style={{ flex: 1, padding: "10px", background: "#0284c7", color: "white", border: "none", borderRadius: "10px", fontWeight: 800, fontSize: "11px", cursor: "pointer" }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM MODERN DELETE COMMENT CONFIRM MODAL */}
      {commentToDelete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(6px)", zIndex: 999999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div className="card" style={{ width: "100%", maxWidth: "340px", padding: "20px", borderRadius: "20px", background: "#ffffff", textAlign: "center", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#fef2f2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", margin: "0 auto 12px auto" }}>
              <i className="fa-solid fa-trash"></i>
            </div>
            <h4 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", margin: "0 0 6px 0" }}>Delete Comment?</h4>
            <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 16px 0" }}>Are you sure you want to delete this comment? This action cannot be undone.</p>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => setCommentToDelete(null)} style={{ flex: 1, padding: "10px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "10px", fontWeight: 800, fontSize: "11px", cursor: "pointer" }}>Cancel</button>
              <button onClick={confirmDeleteComment} style={{ flex: 1, padding: "10px", background: "#dc2626", color: "white", border: "none", borderRadius: "10px", fontWeight: 800, fontSize: "11px", cursor: "pointer" }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
