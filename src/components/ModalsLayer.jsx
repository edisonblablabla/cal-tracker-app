import React from "react";
import ExpandableText from "./ExpandableText";

function defaultFormatTime(ts) {
  if (!ts) return "Just now";
  let ms = null;
  if (typeof ts === "number") ms = ts < 1e11 ? ts * 1000 : ts;
  else if (ts && typeof ts.toDate === "function") ms = ts.toDate().getTime();
  else if (ts && typeof ts.seconds === "number") ms = ts.seconds * 1000;
  else if (typeof ts === "string") ms = Date.parse(ts);
  else if (ts instanceof Date) ms = ts.getTime();

  if (!ms || isNaN(ms)) return "Just now";
  const d = Date.now() - ms;
  if (d < 60000) return "Just now";
  if (d < 3600000) return Math.floor(d / 60000) + "m ago";
  if (d < 86400000) return Math.floor(d / 3600000) + "h ago";
  return new Date(ms).toLocaleDateString();
}


// Helper para sa tumpak na online/offline presence calculation
function calculatePresence(partner, userList = []) {
  if (!partner) return { isOnline: false, text: "Offline", color: "#94a3b8" };
  
  // Hanapin ang pinakasariwang data mula sa realtime userList
  const freshData = userList.find(u => u.uid === partner.uid) || partner;
  const lastSeen = freshData.lastSeen;

  // Kung walang record o naka-logout (lastSeen === 1)
  if (!lastSeen || lastSeen === 1) {
    return { isOnline: false, text: "Offline", color: "#94a3b8" };
  }

  const diffMs = Date.now() - lastSeen;

  // Online kung may heartbeat sa loob ng huling 75 segundo (1.25 mins)
  if (diffMs < 75000) {
    return { isOnline: true, text: "Active now", color: "#10b981" };
  }

  // Huling aktibidad sa minuto
  if (diffMs < 3600000) {
    const mins = Math.floor(diffMs / 60000);
    return { isOnline: false, text: `Active ${mins}m ago`, color: "#64748b" };
  }

  // Huling aktibidad sa oras
  if (diffMs < 86400000) {
    const hours = Math.floor(diffMs / 3600000);
    return { isOnline: false, text: `Active ${hours}h ago`, color: "#64748b" };
  }

  // Higit sa isang araw
  return { isOnline: false, text: "Offline", color: "#94a3b8" };
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
  selectedPost,
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
  formatPostTime = defaultFormatTime,
  activeChatPartner = null,
  setActiveChatPartner,
  chatMessages = [],
  inboxChats = [],
  newChatMessage = "",
  setNewChatMessage,
  handleSendChatMessage,
  isSendingMessage = false
}) {
  const formatTime = formatPostTime || defaultFormatTime;
  const activePost = liveSelectedPost || selectedPost || posts.find(p => p.id === (selectedPost?.id || liveSelectedPost?.id));

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
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <i className="fa-solid fa-magnifying-glass" style={{ color: "var(--primary)", fontSize: "16px" }}></i>
                <h4 style={{ fontSize: "16px", fontWeight: 900, color: "#0f172a", margin: 0 }}>Find Athletes</h4>
              </div>
              <button onClick={() => { setShowSearchModal(false); setSearchQuery(""); }} style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", fontWeight: 800, fontSize: "12px", color: "#64748b" }}>X</button>
            </div>

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

            <div style={{ flex: 1, overflowY: activePanel === 'chat' ? "hidden" : "auto", padding: activePanel === 'chat' ? "0" : "16px", display: "flex", flexDirection: "column", position: "relative" }}>
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

      {/* UNIFORM SLIDE-OVER PANEL ENGINE (CLEAN & ARROW-FREE) */}
      {activePanel && (
        <div style={{
          position: "fixed",
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          width: "100%",
          maxWidth: "480px",
          margin: "0 auto",
          height: "100dvh",
          background: "#ffffff",
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden"
        }}>
          {/* UNIFIED 54px HEADER NA WALANG ARROW BACK AT MAY BILOG NA ✕ SA KANAN */}
          <div style={{
            height: "54px",
            padding: "0 16px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#ffffff",
            flexShrink: 0
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
              {activePanel === "chat" ? (
                /* TOTOONG AVATAR NG KA-CHAT (SUPPORTED ANG UPLOADED AT BASE64) */
                (() => {
                  const partnerPhoto = activeChatPartner?.avatarUrl || activeChatPartner?.photoURL || activeChatPartner?.photo || "";
                  const partnerName = activeChatPartner?.userName || activeChatPartner?.displayName || activeChatPartner?.name || "Athlete";
                  const hasPhoto = partnerPhoto && (partnerPhoto.startsWith("http://") || partnerPhoto.startsWith("https://") || partnerPhoto.startsWith("data:image/") || partnerPhoto.startsWith("blob:")) && !partnerPhoto.includes("pravatar");

                  if (hasPhoto) {
                    return (
                      <img
                        src={partnerPhoto}
                        alt={partnerName}
                        style={{ width: "34px", height: "34px", borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "1.5px solid #e2e8f0" }}
                      />
                    );
                  }

                  const initial = partnerName.trim().charAt(0).toUpperCase();
                  return (
                    <div style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #4f46e5 0%, #38bdf8 100%)",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 900,
                      fontSize: "14px",
                      flexShrink: 0,
                      textTransform: "uppercase"
                    }}>
                      {initial}
                    </div>
                  );
                })()
              ) : (
                <div style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "8px",
                  background: "rgba(56, 189, 248, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}>
                  <i className="fa-regular fa-user" style={{ color: "#0284c7", fontSize: "14px" }}></i>
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 900, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {activePanel === "chat" && (activeChatPartner?.userName || "Athlete Conversation")}
                  {activePanel === "visitor_profile" && (selectedVisitor?.userName || "Athlete Passport")}
                  {activePanel === "inbox" && "Huddle Messages"}
                  {activePanel === "notif" && "Notifications"}
                  {activePanel === "post_detail" && "Activity Huddle"}
                  {activePanel === "settings" && "Profile Settings"}
                  {activePanel === "boosters" && "Boosters"}
                  {activePanel === "boosting" && "Boosting"}
                </h3>
                {activePanel === "chat" && (() => {
                  const presence = calculatePresence(activeChatPartner, userList);
                  return (
                    <span style={{ fontSize: "10px", color: presence.color, fontWeight: 700, display: "block" }}>
                      ● {presence.text}
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* IISANG BILOG NA ✕ BUTTON SA KANANG ITAAS */}
            <button
              type="button"
              onClick={() => {
                if (typeof setActiveChatPartner === "function") setActiveChatPartner(null);
                if (typeof setActivePanel === "function") setActivePanel(null);
                if (typeof setSelectedVisitor === "function") setSelectedVisitor(null);
              }}
              style={{
                background: "#f1f5f9",
                border: "none",
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#64748b",
                fontSize: "14px",
                fontWeight: 800
              }}
              title="Close Panel"
            >
              ✕
            </button>
          </div>

          {/* PANEL BODY CONTENT */}
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", minHeight: 0, WebkitOverflowScrolling: "touch" }}>
            
            {/* 1. VISITOR PROFILE PANEL */}
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
                <div style={{ padding: "16px", paddingBottom: "100px" }}>
                  <div className="card" style={{ padding: "18px 16px", borderRadius: "20px", textAlign: "center", marginBottom: "14px", border: "1px solid #e2e8f0", background: "#ffffff" }}>
                    <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "linear-gradient(135deg, #4f46e5 0%, #38bdf8 100%)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "26px", margin: "0 auto 10px auto", overflow: "hidden" }}>
                      {selectedVisitor.avatarUrl ? (
                        <img src={selectedVisitor.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        (selectedVisitor.userName || "A").charAt(0).toUpperCase()
                      )}
                    </div>
                    
                    <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 900, color: "#0f172a" }}>{selectedVisitor.userName || "Athlete"}</h3>
                    <p style={{ margin: "2px 0 14px 0", fontSize: "11px", color: "#64748b", fontWeight: 600 }}>{selectedVisitor.userTitle || "Fitness Enthusiast"}</p>

                    <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
                      <button 
                        onClick={() => toggleBoostAthlete(selectedVisitor.uid, selectedVisitor.isPrivateAccount)} 
                        style={{ 
                          flex: 1, padding: "10px", 
                          background: isBoostingThisVisitor ? "#f1f5f9" : "var(--primary)", 
                          color: isBoostingThisVisitor ? "#334155" : "#ffffff", 
                          border: isBoostingThisVisitor ? "1px solid #cbd5e1" : "none", 
                          borderRadius: "12px", fontWeight: 800, fontSize: "12px", cursor: "pointer" 
                        }}
                      >
                        {isBoostingThisVisitor ? "Unboost Athlete" : "Boost Athlete"}
                      </button>
                      <button 
                        onClick={() => {
                          if (typeof setActiveChatPartner === "function") setActiveChatPartner(selectedVisitor);
                          if (typeof setActivePanel === "function") setActivePanel("chat");
                        }} 
                        style={{ 
                          padding: "10px 16px", background: "#e0e7ff", color: "var(--primary)", border: "none", 
                          borderRadius: "12px", fontWeight: 800, fontSize: "12px", cursor: "pointer", 
                          display: "flex", alignItems: "center", gap: "6px" 
                        }}
                      >
                        <i className="fa-solid fa-message"></i> Message
                      </button>
                    </div>

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
                          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
                            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#4f46e5", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "12px", overflow: "hidden" }}>
                              {p.userAvatar ? <img src={p.userAvatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (p.userName || "A").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a" }}>{p.userName}</div>
                              <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>{formatTime(p.createdAt)}</span>
                            </div>
                          </div>

                          {p.text && <p style={{ fontSize: "13px", color: "#334155", lineHeight: "1.5", margin: "0 0 10px 0", whiteSpace: "pre-wrap" }}>{p.text}</p>}

                          {p.imageUrl && (
                            <div style={{ borderRadius: "10px", overflow: "hidden", border: "1px solid #f1f5f9", marginBottom: "10px", background: "#0b0f19" }}>
                              <img src={p.imageUrl} alt="" style={{ width: "100%", maxHeight: "380px", objectFit: "contain", display: "block", margin: "0 auto" }} />
                            </div>
                          )}

                          <div style={{ display: "flex", alignItems: "center", gap: "10px", borderTop: "1px solid #f1f5f9", paddingTop: "8px" }}>
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

            {/* 2. CHAT PANEL (CLEAN & WALANG DUPLICATE INNER HEADER) */}
            {activePanel === 'chat' && (
              <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#f8fafc" }}>
                <div
                  ref={(el) => { if (el) el.scrollTop = el.scrollHeight; }}
                  style={{ flex: 1, overflowY: "auto", padding: "14px 12px", display: "flex", flexDirection: "column", gap: "10px", minHeight: 0 }}
                >
                  {chatMessages.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8", fontSize: "12px" }}>
                      Say hello to start the conversation! 👋
                    </div>
                  ) : (
                    chatMessages.map((msg) => {
                      const isMe = msg.senderUid === user?.uid;
                      return (
                        <div
                          key={msg.id}
                          style={{
                            alignSelf: isMe ? "flex-end" : "flex-start",
                            maxWidth: "80%",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: isMe ? "flex-end" : "flex-start"
                          }}
                        >
                          <div
                            style={{
                              background: isMe ? "linear-gradient(135deg, #4f46e5 0%, #38bdf8 100%)" : "#ffffff",
                              color: isMe ? "#ffffff" : "#0f172a",
                              padding: "9px 13px",
                              borderRadius: isMe ? "14px 14px 3px 14px" : "14px 14px 14px 3px",
                              fontSize: "13px",
                              lineHeight: 1.4,
                              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                              border: isMe ? "none" : "1px solid #e2e8f0",
                              wordBreak: "break-word"
                            }}
                          >
                            {msg.text}
                          </div>
                          <span style={{ fontSize: "9px", color: "#94a3b8", marginTop: "2px", padding: "0 2px" }}>
                            {formatTime(msg.createdAt)}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                <form
                  onSubmit={(e) => { e.preventDefault(); handleSendChatMessage(); }}
                  style={{
                    padding: "10px 12px 14px 12px",
                    background: "#ffffff",
                    borderTop: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    flexShrink: 0
                  }}
                >
                  <input
                    type="text"
                    placeholder={"Message " + (activeChatPartner?.userName || "Athlete") + "..."}
                    value={newChatMessage}
                    onChange={(e) => setNewChatMessage(e.target.value)}
                    style={{
                      flex: 1,
                      padding: "10px 14px",
                      borderRadius: "20px",
                      border: "1px solid #cbd5e1",
                      fontSize: "13.5px",
                      outline: "none",
                      backgroundColor: "#f8fafc",
                      color: "#0f172a",
                      fontFamily: "inherit",
                      boxSizing: "border-box"
                    }}
                  />
                  <button
                    type="submit"
                    disabled={isSendingMessage || !newChatMessage.trim()}
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "50%",
                      border: "none",
                      background: newChatMessage.trim() ? "linear-gradient(135deg, #4f46e5 0%, #38bdf8 100%)" : "#e2e8f0",
                      color: "white",
                      cursor: newChatMessage.trim() ? "pointer" : "default",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      boxShadow: newChatMessage.trim() ? "0 2px 6px rgba(79, 70, 229, 0.3)" : "none"
                    }}
                  >
                    <i className="fa-solid fa-paper-plane" style={{ fontSize: "13px" }}></i>
                  </button>
                </form>
              </div>
            )}

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
