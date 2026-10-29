import React from "react";
import ExpandableText from "./ExpandableText";
import { db } from "../services/firebase";
import { collection, addDoc } from "firebase/firestore";

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

export default function CommunityTab({
  user,
  appData,
  avatarPreview = "",
  setShowSearchModal,
  setActivePanel,
  allUserNotifs = [],
  inboxChats = [],
  lastSeenMsgTime = 0,
  setLastSeenMsgTime,
  lastSeenNotifTime = 0,
  setLastSeenNotifTime,
  postVisibility,
  setPostVisibility,
  postText,
  setPostText,
  imagePreview,
  setImagePreview,
  handleImageChange,
  createPost,
  isPublishing,
  publicCommunityPosts = [],
  userList = [],
  setActiveTab,
  setSelectedVisitor,
  activeMenuPostId,
  setActiveMenuPostId,
  openEditModal,
  handleDeletePost,
  setSelectedPost,
  handleLike,
  setResonatePost,
  showToast,
  formatPostTime = defaultFormatTime
}) {
  const unreadChatsCount = (inboxChats || []).filter(c => c.lastSenderUid !== user?.uid && (c.updatedAt || 0) > (lastSeenMsgTime || 0)).length;
  const formatTime = formatPostTime || defaultFormatTime;

  return (
    <div className="screen active">
      {/* FROZEN STICKY SOCIAL HEADER */}
      <div style={{ 
        position: "sticky", 
        top: "-16px", 
        marginTop: "-16px",
        paddingTop: "24px",
        paddingBottom: "12px",
        paddingLeft: "16px",
        paddingRight: "16px",
        marginLeft: "-16px",
        marginRight: "-16px",
        zIndex: 900, 
        background: "#f8fafc", 
        boxShadow: "0 4px 12px rgba(15, 23, 42, 0.05)",
        marginBottom: "12px", 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        borderBottom: "1px solid #e2e8f0"
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
            onClick={() => { 
              setActivePanel("notif"); 
              const nowT = Date.now(); 
              if (typeof setLastSeenNotifTime === "function") setLastSeenNotifTime(nowT); 
            }} 
            style={{ position: "relative", background: "#ffffff", border: "1px solid #e2e8f0", width: "36px", height: "36px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#334155", fontSize: "15px", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}
          >
            <i className="fa-regular fa-bell"></i>
            {allUserNotifs.filter(n => (n.timestamp || 0) > lastSeenNotifTime).length > 0 && (
              <span style={{ position: "absolute", top: "2px", right: "2px", background: "#ef4444", color: "white", fontSize: "9px", fontWeight: 800, width: "15px", height: "15px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {allUserNotifs.filter(n => (n.timestamp || 0) > lastSeenNotifTime).length}
              </span>
            )}
          </button>
          {/* INBOX / MESSAGES BUTTON */}
          <button 
            onClick={() => {
              if (typeof setLastSeenMsgTime === "function") setLastSeenMsgTime(Date.now());
              setActivePanel("inbox");
            }} 
            style={{ position: "relative", background: "#ffffff", border: "1px solid #e2e8f0", width: "36px", height: "36px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#334155", fontSize: "15px", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}
            title="Messages"
          >
            <i className="fa-regular fa-envelope"></i>
            {unreadChatsCount > 0 && (
              <span style={{ position: "absolute", top: "-4px", right: "-4px", background: "#0284c7", color: "white", fontSize: "10px", fontWeight: 900, minWidth: "18px", height: "18px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px", boxShadow: "0 2px 6px rgba(2, 132, 199, 0.4)", border: "2px solid #ffffff" }}>
                {unreadChatsCount > 9 ? "9+" : unreadChatsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* CREATE POST CARD */}
      <div className="card" style={{ padding: "12px", borderRadius: "18px", boxShadow: "0 4px 16px rgba(0,0,0,0.04)", marginBottom: "14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#4f46e5", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "12px", overflow: "hidden", flexShrink: 0 }}>
              {appData?.avatarUrl ? (
                <img src={appData.avatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                (appData?.userName || "A").charAt(0).toUpperCase()
              )}
            </div>
            <span style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a" }}>{appData?.userName || "Athlete"}</span>
          </div>

          <div style={{ display: "flex", gap: "3px", background: "#f1f5f9", padding: "2px", borderRadius: "8px" }}>
            <button 
              onClick={() => setPostVisibility("public")} 
              style={{ background: postVisibility === "public" ? "#ffffff" : "transparent", border: "none", padding: "3px 7px", borderRadius: "6px", fontSize: "9px", fontWeight: 800, color: postVisibility === "public" ? "var(--primary)" : "#64748b", cursor: "pointer" }}
            >
               Public
            </button>
            <button 
              onClick={() => setPostVisibility("boosters")} 
              style={{ background: postVisibility === "boosters" ? "#ffffff" : "transparent", border: "none", padding: "3px 7px", borderRadius: "6px", fontSize: "9px", fontWeight: 800, color: postVisibility === "boosters" ? "var(--primary)" : "#64748b", cursor: "pointer" }}
            >
               Boosters
            </button>
            <button 
              onClick={() => setPostVisibility("private")} 
              style={{ background: postVisibility === "private" ? "#ffffff" : "transparent", border: "none", padding: "3px 7px", borderRadius: "6px", fontSize: "9px", fontWeight: 800, color: postVisibility === "private" ? "var(--primary)" : "#64748b", cursor: "pointer" }}
            >
               Private
            </button>
          </div>
        </div>

        <textarea 
          className="form-input" 
          style={{ height: "48px", borderRadius: "12px", padding: "8px 10px", fontSize: "11px", border: "1px solid #e2e8f0", resize: "none", marginBottom: "8px" }} 
          placeholder="Share a milestone or fitness update..."
          value={postText}
          onChange={e => setPostText(e.target.value)}
        />

        {imagePreview && (
          <div style={{ position: "relative", marginBottom: "8px" }}>
            <img src={imagePreview} alt="Preview" style={{ width: "100%", maxHeight: "140px", objectFit: "cover", borderRadius: "12px" }} />
            <button 
              onClick={() => setImagePreview(null)}
              style={{ position: "absolute", top: "6px", right: "6px", background: "rgba(0,0,0,0.6)", color: "white", border: "none", borderRadius: "50%", width: "22px", height: "22px", fontSize: "10px", cursor: "pointer" }}
            >
              X
            </button>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: 700, color: "var(--primary)", cursor: "pointer", background: "#f0fdf4", padding: "6px 10px", borderRadius: "10px", border: "1px solid #bbf7d0" }}>
            <i className="fa-solid fa-image" style={{ fontSize: "12px" }}></i> Photo
            <input type="file" accept="image/*" onChange={e => handleImageChange(e, false)} style={{ display: "none" }} />
          </label>

          <button 
            onClick={() => createPost(false)} 
            disabled={isPublishing}
            style={{ background: isPublishing ? "#94a3b8" : "var(--primary)", color: "white", border: "none", padding: "6px 14px", borderRadius: "10px", fontWeight: 800, fontSize: "11px", cursor: "pointer" }}
          >
            {isPublishing ? "Publishing..." : "Publish Post"}
          </button>
        </div>
      </div>

      {/* COMMUNITY POSTS FEED */}
      <div>
        {publicCommunityPosts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)" }}>
            <i className="fa-regular fa-newspaper" style={{ fontSize: "32px", marginBottom: "8px", opacity: 0.5 }}></i>
            <p style={{ fontSize: "12px", fontWeight: 600 }}>No public or booster posts in the feed yet.<br />Be the first to share your progress!</p>
          </div>
        ) : (
          publicCommunityPosts.map(p => {
            const isLiked = p.likedBy && p.likedBy.includes(user?.uid);
            const isOwner = p.userId === user?.uid;
            const postAuthorObj = userList.find(u => u.uid === p.userId);

            const handleOpenAuthorProfile = (e) => {
              e.stopPropagation();
              if (p.userId === user?.uid) {
                setActiveTab("profile");
              } else {
                setSelectedVisitor(postAuthorObj || { 
                  uid: p.userId, 
                  userName: p.userName, 
                  userTitle: p.userTitle, 
                  avatarUrl: p.userAvatar 
                });
                setActivePanel("visitor_profile");
              }
            };

            return (
              <div key={p.id} className="card" style={{ padding: "14px", borderRadius: "18px", marginBottom: "14px", boxShadow: "0 4px 15px rgba(0,0,0,0.03)", position: "relative" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <div 
                    onClick={handleOpenAuthorProfile}
                    style={{ display: "flex", gap: "8px", alignItems: "center", cursor: "pointer" }}
                  >
                    <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#4f46e5", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "13px", overflow: "hidden", flexShrink: 0 }}>
                      {p.userAvatar ? (
                        <img src={p.userAvatar} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        (p.userName || "A").charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a" }}>{p.userName}</div>
                      <div style={{ fontSize: "9px", color: "var(--text-muted)" }}>
                        {p.userTitle || "Athlete"} • {formatTime(p.createdAt)}
                      </div>
                    </div>
                  </div>

                  {isOwner && (
                    <div style={{ position: "relative" }}>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setActiveMenuPostId(activeMenuPostId === p.id ? null : p.id); 
                        }} 
                        style={{ background: "transparent", border: "none", color: "#64748b", fontSize: "15px", cursor: "pointer", padding: "4px 8px" }}
                      >
                        <i className="fa-solid fa-ellipsis-vertical"></i>
                      </button>

                      {activeMenuPostId === p.id && (
                        <div style={{ position: "absolute", right: 0, top: "24px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", boxShadow: "0 8px 20px -4px rgba(0,0,0,0.1)", zIndex: 100, minWidth: "120px", overflow: "hidden" }}>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setActiveMenuPostId(null); openEditModal(p); }} 
                            style={{ width: "100%", padding: "8px 10px", background: "transparent", border: "none", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#334155", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                          >
                            <i className="fa-solid fa-pen" style={{ color: "var(--primary)" }}></i> Edit
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setActiveMenuPostId(null); handleDeletePost(p.id); }} 
                            style={{ width: "100%", padding: "8px 10px", background: "transparent", border: "none", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", borderTop: "1px solid #f1f5f9" }}
                          >
                            <i className="fa-solid fa-trash"></i> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div onClick={() => { setSelectedPost(p); setActivePanel("post_detail"); }} style={{ cursor: "pointer" }}>
                  <ExpandableText text={p.text} />
                </div>

                {p.imageUrl && (
            <div style={{ marginTop: "10px", marginBottom: "12px", width: "100%", borderRadius: "14px", overflow: "hidden", background: "#f8fafc" }}>
              <img 
                src={p.imageUrl} 
                alt="Post content" 
                style={{ 
                  width: "100%", 
                  height: "auto", 
                  maxHeight: "550px", 
                  objectFit: "contain", 
                  display: "block",
                  borderRadius: "14px",
                  margin: "0 auto"
                }} 
              />
            </div>
          )}

                <div style={{ display: "flex", alignItems: "center", gap: "10px", borderTop: "1px solid #f1f5f9", paddingTop: "8px", marginTop: "4px" }}>
                  <button 
                    onClick={() => handleLike(p.id, p.likes || 0, p.likedBy || [])} 
                    style={{ 
                      background: isLiked ? "#fef2f2" : "transparent", 
                      border: "none", 
                      color: isLiked ? "#ef4444" : "#64748b", 
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
                    <i className={isLiked ? "fa-solid fa-heart" : "fa-regular fa-heart"} style={{ fontSize: "13px", color: isLiked ? "#ef4444" : "#64748b" }}></i>
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
                            senderUid: user?.uid || "",
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
