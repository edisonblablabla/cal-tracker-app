import React from "react";
import ExpandableText from "./ExpandableText";
import { db } from "../services/firebase";
import { collection, addDoc } from "firebase/firestore";

function defaultFormatTime(ts) {
  if (!ts) return "Just now";
  const d = Date.now() - ts;
  if (d < 60000) return "Just now";
  if (d < 3600000) return Math.floor(d / 60000) + "m ago";
  if (d < 86400000) return Math.floor(d / 3600000) + "h ago";
  return new Date(ts).toLocaleDateString();
}

export default function ProfileTab({
  user,
  appData,
  avatarPreview,
  coverPreview,
  handleDirectCoverChange,
  handleDirectAvatarChange,
  setActivePanel,
  myRealtimeBoostersCount = 0,
  myTotalPulses = 0,
  profPostVisibility,
  setProfPostVisibility,
  profPostText,
  setProfPostText,
  profImagePreview,
  setProfImagePreview,
  handleImageChange,
  createPost,
  isPublishing,
  profileViewMode,
  setProfileViewMode,
  myPosts = [],
  setSelectedPost,
  openEditModal,
  setActiveMenuPostId,
  activeMenuPostId,
  handleDeletePost,
  handleLike,
  setResonatePost,
  showToast,
  formatPostTime = defaultFormatTime
}) {
  const formatTime = formatPostTime || defaultFormatTime;

  return (
    <div className="screen active">
      {/* PROFILE HEADER CARD */}
      <div className="card" style={{ padding: 0, overflow: "hidden", borderRadius: "20px", marginBottom: "12px", boxShadow: "0 6px 18px rgba(0,0,0,0.06)", position: "relative", border: "none" }}>
        <div style={{ 
          height: "85px", 
          background: (coverPreview || appData?.coverUrl) ? "url(" + (coverPreview || appData?.coverUrl) + ") center/cover" : "linear-gradient(135deg, #0284c7, #4f46e5)", 
          position: "relative" 
        }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(15,23,42,0.35))" }}></div>
          
          <label style={{ position: "absolute", bottom: "8px", right: "50px", background: "rgba(0,0,0,0.55)", color: "white", padding: "4px 8px", borderRadius: "8px", cursor: "pointer", fontSize: "10px", fontWeight: 700, backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.3)", zIndex: 10 }}>
            <i className="fa-solid fa-camera"></i> Cover
            <input type="file" accept="image/*" onChange={handleDirectCoverChange} style={{ display: "none" }} />
          </label>

          <button 
            onClick={() => setActivePanel("settings")} 
            style={{ position: "absolute", top: "10px", right: "10px", background: "rgba(255,255,255,0.25)", backdropFilter: "blur(6px)", color: "white", border: "1px solid rgba(255,255,255,0.3)", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}
          >
            <i className="fa-solid fa-gear"></i>
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 12px 12px 12px", textAlign: "center" }}>
          <div style={{ width: "66px", height: "68px", borderRadius: "50%", background: "#ffffff", padding: "2px", boxShadow: "0 4px 14px rgba(0,0,0,0.12)", overflow: "hidden", marginTop: "-34px", marginBottom: "6px", zIndex: 10, position: "relative" }}>
            {(avatarPreview || appData?.avatarUrl) ? (
              <img src={avatarPreview || appData?.avatarUrl} alt="Profile Avatar" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "linear-gradient(135deg, #4f46e5, #0284c7)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: 900 }}>
                {(appData?.userName || "A").charAt(0).toUpperCase()}
              </div>
            )}

            <label style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.35)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", cursor: "pointer", opacity: 0.8, fontSize: "14px" }}>
              <i className="fa-solid fa-camera"></i>
              <input type="file" accept="image/*" onChange={handleDirectAvatarChange} style={{ display: "none" }} />
            </label>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "center" }}>
            <h3 style={{ fontSize: "17px", fontWeight: 900, color: "#0f172a", margin: 0 }}>{appData?.userName || "Athlete"}</h3>
            <span style={{ fontSize: "8px", background: appData?.isPrivateAccount ? "#f1f5f9" : "#e0e7ff", color: appData?.isPrivateAccount ? "#64748b" : "var(--primary)", padding: "1px 6px", borderRadius: "5px", fontWeight: 800 }}>
              {appData?.isPrivateAccount ? " Private" : " Athlete"}
            </span>
          </div>
          <p style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 600, marginTop: "1px", marginBottom: "0" }}>{appData?.userTitle || "Fitness Enthusiast"}</p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "4px", background: "#f8fafc", padding: "8px", borderRadius: "14px", marginTop: "10px", width: "100%", border: "1px solid #f1f5f9" }}>
            <div onClick={() => setActivePanel("boosting")} style={{ cursor: "pointer" }}>
              <div style={{ fontSize: "12px", fontWeight: 900, color: "var(--primary)" }}>{(appData?.boosting || []).length}</div>
              <div style={{ fontSize: "8px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Boosting</div>
            </div>
            <div onClick={() => setActivePanel("boosters")} style={{ cursor: "pointer" }}>
              <div style={{ fontSize: "12px", fontWeight: 900, color: "#10b981" }}>{myRealtimeBoostersCount}</div>
              <div style={{ fontSize: "8px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Boosters</div>
            </div>
            <div>
              <div style={{ fontSize: "12px", fontWeight: 900, color: "#f59e0b" }}>{appData?.streakDays || 1}</div>
              <div style={{ fontSize: "8px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Streak</div>
            </div>
            <div>
              <div style={{ fontSize: "12px", fontWeight: 900, color: "#ef4444" }}>{myTotalPulses}</div>
              <div style={{ fontSize: "8px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Pulses</div>
            </div>
          </div>
        </div>
      </div>

      {/* CREATE PROFILE POST CARD */}
      <div className="card" style={{ padding: "12px", borderRadius: "18px", boxShadow: "0 4px 16px rgba(0,0,0,0.04)", marginBottom: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <span style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a" }}>Create Post</span>
          
          <div style={{ display: "flex", gap: "3px", background: "#f1f5f9", padding: "2px", borderRadius: "8px" }}>
            <button 
              onClick={() => setProfPostVisibility("public")} 
              style={{ background: profPostVisibility === "public" ? "#ffffff" : "transparent", border: "none", padding: "3px 7px", borderRadius: "6px", fontSize: "9px", fontWeight: 800, color: profPostVisibility === "public" ? "var(--primary)" : "#64748b", cursor: "pointer" }}
            >
               Public
            </button>
            <button 
              onClick={() => setProfPostVisibility("boosters")} 
              style={{ background: profPostVisibility === "boosters" ? "#ffffff" : "transparent", border: "none", padding: "3px 7px", borderRadius: "6px", fontSize: "9px", fontWeight: 800, color: profPostVisibility === "boosters" ? "var(--primary)" : "#64748b", cursor: "pointer" }}
            >
               Boosters
            </button>
            <button 
              onClick={() => setProfPostVisibility("private")} 
              style={{ background: profPostVisibility === "private" ? "#ffffff" : "transparent", border: "none", padding: "3px 7px", borderRadius: "6px", fontSize: "9px", fontWeight: 800, color: profPostVisibility === "private" ? "var(--primary)" : "#64748b", cursor: "pointer" }}
            >
               Private
            </button>
          </div>
        </div>

        <textarea 
          className="form-input" 
          style={{ height: "50px", borderRadius: "12px", padding: "8px 10px", fontSize: "11px", border: "1px solid #e2e8f0", resize: "none", marginBottom: "8px" }} 
          placeholder="Share a fitness update..."
          value={profPostText}
          onChange={e => setProfPostText(e.target.value)}
        />

        {profImagePreview && (
          <div style={{ position: "relative", marginBottom: "8px" }}>
            <img src={profImagePreview} alt="Preview" style={{ width: "100%", maxHeight: "140px", objectFit: "cover", borderRadius: "12px" }} />
            <button 
              onClick={() => setProfImagePreview(null)}
              style={{ position: "absolute", top: "6px", right: "6px", background: "rgba(0,0,0,0.6)", color: "white", border: "none", borderRadius: "50%", width: "22px", height: "22px", fontSize: "10px", cursor: "pointer" }}
            >
              X
            </button>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: 700, color: "var(--primary)", cursor: "pointer", background: "#f0fdf4", padding: "6px 10px", borderRadius: "10px", border: "1px solid #bbf7d0" }}>
            <i className="fa-solid fa-image" style={{ fontSize: "12px" }}></i> Photo
            <input type="file" accept="image/*" onChange={e => handleImageChange(e, true)} style={{ display: "none" }} />
          </label>

          <button 
            onClick={() => createPost(true)} 
            disabled={isPublishing}
            style={{ background: isPublishing ? "#94a3b8" : "var(--primary)", color: "white", border: "none", padding: "6px 14px", borderRadius: "10px", fontWeight: 800, fontSize: "11px", cursor: "pointer" }}
          >
            {isPublishing ? "Publishing..." : "Publish Post"}
          </button>
        </div>
      </div>

      {/* MY FITNESS FEED LIST / GRID */}
      <div className="card" style={{ padding: "14px", borderRadius: "18px", marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <span style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a" }}>My Fitness Feed</span>
          <div style={{ display: "flex", gap: "3px", background: "#f1f5f9", padding: "2px", borderRadius: "8px" }}>
            <button 
              onClick={() => setProfileViewMode("list")} 
              style={{ background: profileViewMode === "list" ? "#ffffff" : "transparent", border: "none", padding: "4px 10px", borderRadius: "6px", cursor: "pointer", color: profileViewMode === "list" ? "var(--primary)" : "#64748b", fontWeight: 800, fontSize: "10px" }}
            >
              <i className="fa-solid fa-list" style={{ marginRight: "4px" }}></i> Feed
            </button>
            <button 
              onClick={() => setProfileViewMode("grid")} 
              style={{ background: profileViewMode === "grid" ? "#ffffff" : "transparent", border: "none", padding: "4px 10px", borderRadius: "6px", cursor: "pointer", color: profileViewMode === "grid" ? "var(--primary)" : "#64748b", fontWeight: 800, fontSize: "10px" }}
            >
              <i className="fa-solid fa-border-all" style={{ marginRight: "4px" }}></i> Grid
            </button>
          </div>
        </div>

        {myPosts.length === 0 ? (
          <p style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "center", padding: "16px 0" }}>No posts created yet.</p>
        ) : profileViewMode === "grid" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
            {myPosts.map(p => {
              const vis = p?.visibility || "public";
              return (
                <div key={p.id} style={{ position: "relative", aspectRatio: "1/1", borderRadius: "10px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                  {p.imageUrl ? (
                    <img 
                      src={p.imageUrl} 
                      alt="Post" 
                      onClick={(e) => { e.stopPropagation(); setSelectedPost(p); setActivePanel("post_detail"); }}
                      style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "pointer" }} 
                    />
                  ) : (
                    <div style={{ width: "100%", height: "100%", padding: "8px", background: "linear-gradient(135deg, #4f46e5, #3b82f6)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontSize: "9px", fontWeight: 700, lineHeight: 1.2 }}>
                      {p.text}
                    </div>
                  )}
                  
                  <span style={{ position: "absolute", bottom: "3px", left: "3px", background: "rgba(15, 23, 42, 0.8)", color: "white", borderRadius: "4px", padding: "1px 4px", fontSize: "7px", fontWeight: 800 }}>
                    {vis === "private" ? " Private" : vis === "boosters" ? " Boosters" : " Public"}
                  </span>

                  <button 
                    onClick={() => openEditModal(p)} 
                    style={{ position: "absolute", top: "3px", right: "3px", background: "rgba(255, 255, 255, 0.9)", color: "#0f172a", border: "none", borderRadius: "50%", width: "20px", height: "20px", fontSize: "9px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <i className="fa-solid fa-pen"></i>
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          myPosts.map(p => {
            const vis = p?.visibility || "public";
            return (
              <div key={p.id} style={{ background: "#ffffff", border: "1px solid #f1f5f9", borderRadius: "14px", padding: "12px", marginBottom: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.02)", position: "relative" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#4f46e5", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "12px", overflow: "hidden" }}>
                      {appData?.avatarUrl ? (
                        <img src={appData.avatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        (appData?.userName || "A").charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a" }}>{appData?.userName || "Athlete"}</span>
                        <span style={{ fontSize: "8px", fontWeight: 800, color: vis === "private" ? "#64748b" : "var(--primary)", background: vis === "private" ? "#f1f5f9" : "#e0e7ff", padding: "1px 5px", borderRadius: "5px" }}>
                          {vis === "private" ? " Private" : vis === "boosters" ? " Boosters" : " Public"}
                        </span>
                      </div>
                      <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>{formatTime(p.createdAt)}</span>
                    </div>
                  </div>

                  <div style={{ position: "relative" }}>
                    <button 
                      onClick={() => setActiveMenuPostId(activeMenuPostId === p.id ? null : p.id)} 
                      style={{ background: "transparent", border: "none", color: "#64748b", fontSize: "14px", cursor: "pointer", padding: "4px 6px" }}
                    >
                      <i className="fa-solid fa-ellipsis-vertical"></i>
                    </button>

                    {activeMenuPostId === p.id && (
                      <div style={{ position: "absolute", right: 0, top: "22px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", boxShadow: "0 8px 20px -4px rgba(0,0,0,0.1)", zIndex: 100, minWidth: "110px", overflow: "hidden" }}>
                        <button 
                          onClick={() => openEditModal(p)} 
                          style={{ width: "100%", padding: "8px 10px", background: "transparent", border: "none", textAlign: "left", fontSize: "10px", fontWeight: 700, color: "#334155", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                        >
                          <i className="fa-solid fa-pen" style={{ color: "var(--primary)" }}></i> Edit
                        </button>
                        <button 
                          onClick={() => handleDeletePost(p.id)} 
                          style={{ width: "100%", padding: "8px 10px", background: "transparent", border: "none", textAlign: "left", fontSize: "10px", fontWeight: 700, color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", borderTop: "1px solid #f1f5f9" }}
                        >
                          <i className="fa-solid fa-trash"></i> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div onClick={() => { setSelectedPost(p); setActivePanel("post_detail"); }} style={{ cursor: "pointer" }}><ExpandableText text={p.text} /></div>

                {p.imageUrl && (
                  <div 
                    onClick={(e) => { e.stopPropagation(); setSelectedPost(p); setActivePanel("post_detail"); }} 
                    style={{ borderRadius: "10px", overflow: "hidden", border: "1px solid #f1f5f9", marginBottom: "6px", background: "#f8fafc", aspectRatio: "4/3", cursor: "pointer", position: "relative" }}
                  >
                    <img src={p.imageUrl} alt="Post" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: "10px", borderTop: "1px solid #f1f5f9", paddingTop: "8px", marginTop: "4px" }}>
                  <button 
                    onClick={() => handleLike(p.id, p.likes || 0, p.likedBy || [])} 
                    style={{ 
                      background: (p.likedBy || []).includes(user?.uid) ? "#fef2f2" : "transparent", 
                      border: "none", 
                      color: (p.likedBy || []).includes(user?.uid) ? "#ef4444" : "#64748b", 
                      padding: "4px 8px", 
                      fontSize: "11px", 
                      fontWeight: 800, 
                      cursor: "pointer", 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "5px", 
                      borderRadius: "10px" 
                    }}
                  >
                    <i className={(p.likedBy || []).includes(user?.uid) ? "fa-solid fa-heart" : "fa-regular fa-heart"} style={{ fontSize: "13px", color: (p.likedBy || []).includes(user?.uid) ? "#ef4444" : "#64748b" }}></i>
                    {p.likes || 0} {(p.likes === 1) ? "Pulse" : "Pulses"}
                  </button>

                  <button 
                    onClick={() => { setSelectedPost(p); setActivePanel("post_detail"); }}
                    style={{ background: "transparent", border: "none", color: "#64748b", padding: "4px 8px", fontSize: "11px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}
                  >
                    <i className="fa-regular fa-comment" style={{ fontSize: "12px" }}></i> {p.commentsCount || 0}
                  </button>

                  <button 
                    onClick={() => {
                      setResonatePost(p);
                      navigator.clipboard.writeText(window.location.href);
                      showToast("Link copied & post resonated!");
                      if (p.userId !== user?.uid) {
                        try {
                          addDoc(collection(db, "notifications"), {
                            recipientUid: p.userId,
                            senderName: appData?.userName || user?.displayName || "Athlete",
                            senderAvatar: appData?.avatarUrl || avatarPreview || "",
                            type: "resonate",
                            text: `resonated your post: "${(p.text || "photo post").slice(0, 20)}..."`,
                            postId: p.id,
                            timestamp: Date.now()
                          });
                        } catch (e) { console.error(e); }
                      }
                    }}
                    style={{ background: "transparent", border: "none", color: "#64748b", padding: "4px 8px", fontSize: "11px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}
                  >
                    <i className="fa-solid fa-share-nodes" style={{ fontSize: "12px" }}></i> Resonate
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
