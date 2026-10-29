import React, { useState, useEffect } from "react";
import ExpandableText from "./ExpandableText";

function defaultFormatTime(ts) {
  if (!ts) return "Just now";
  const d = Date.now() - ts;
  if (d < 60000) return "Just now";
  if (d < 3600000) return Math.floor(d / 60000) + "m ago";
  if (d < 86400000) return Math.floor(d / 3600000) + "h ago";
  return new Date(ts).toLocaleDateString();
}

export default function CommunityTab({
  user,
  appData,
  avatarPreview,
  setShowSearchModal,
  setActivePanel,
  allUserNotifs = [],
  inboxChats = [],
  lastSeenNotifTime = 0,
  lastSeenMsgTime = 0,
  setLastSeenNotifTime,
  setLastSeenMsgTime,
  postVisibility = "public",
  setPostVisibility,
  postText = "",
  setPostText,
  imagePreview = null,
  setImagePreview,
  handleImageChange,
  createPost,
  isPublishing = false,
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
  const formatTime = formatPostTime || defaultFormatTime;

  // Ligtas na unread counters laban sa undefined/null
  const unseenNotifsCount = (allUserNotifs || []).filter(n => (n.timestamp || 0) > (lastSeenNotifTime || 0)).length;
  const unreadChatsCount = (inboxChats || []).filter(c => c.lastSenderUid !== user?.uid && (c.updatedAt || 0) > (lastSeenMsgTime || 0)).length;

  // Twitter-style New Posts pill state
  const [displayedPosts, setDisplayedPosts] = useState(() => publicCommunityPosts || []);
  const [newPostsCount, setNewPostsCount] = useState(0);

  useEffect(() => {
    const incoming = publicCommunityPosts || [];
    if (incoming.length > 0) {
      if (!displayedPosts || displayedPosts.length === 0) {
        setDisplayedPosts(incoming);
      } else {
        const currentTopId = displayedPosts[0]?.id;
        const newTopIndex = incoming.findIndex(p => p.id === currentTopId);

        if (newTopIndex > 0) {
          const hasMyNewPost = incoming.slice(0, newTopIndex).some(p => p.userId === user?.uid);
          if (hasMyNewPost) {
            setDisplayedPosts(incoming);
            setNewPostsCount(0);
            window.scrollTo({ top: 0, behavior: "smooth" });
          } else {
            setNewPostsCount(newTopIndex);
            setDisplayedPosts(incoming.slice(newTopIndex, newTopIndex + displayedPosts.length));
          }
        } else if (newTopIndex === -1 || incoming.length < displayedPosts.length) {
          setDisplayedPosts(incoming);
          setNewPostsCount(0);
        } else {
          setDisplayedPosts(incoming.slice(0, displayedPosts.length));
        }
      }
    } else {
      setDisplayedPosts([]);
    }
  }, [publicCommunityPosts]);

  const handleShowNewPosts = () => {
    setDisplayedPosts(publicCommunityPosts || []);
    setNewPostsCount(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div>
      {/* SOCIAL STICKY HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 900, color: "#0f172a", margin: 0 }}>Community Pulse</h2>
          <span style={{ fontSize: "11px", color: "#64748b" }}>Connect, share and inspire athletes</span>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {/* SEARCH BUTTON */}
          <button 
            onClick={() => setShowSearchModal(true)} 
            style={{ background: "#ffffff", border: "1px solid #e2e8f0", width: "36px", height: "36px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#334155", fontSize: "14px", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}
            title="Search Athletes"
          >
            <i className="fa-solid fa-magnifying-glass"></i>
          </button>

          {/* NOTIFICATIONS BUTTON */}
          <button 
            onClick={() => {
              if (typeof setLastSeenNotifTime === "function") setLastSeenNotifTime(Date.now());
              setActivePanel("notif");
            }} 
            style={{ position: "relative", background: "#ffffff", border: "1px solid #e2e8f0", width: "36px", height: "36px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#334155", fontSize: "15px", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}
            title="Notifications"
          >
            <i className="fa-regular fa-bell"></i>
            {unseenNotifsCount > 0 && (
              <span style={{ position: "absolute", top: "-4px", right: "-4px", background: "#ef4444", color: "white", fontSize: "10px", fontWeight: 900, minWidth: "18px", height: "18px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px", boxShadow: "0 2px 6px rgba(239, 68, 68, 0.4)", border: "2px solid #ffffff" }}>
                {unseenNotifsCount > 9 ? "9+" : unseenNotifsCount}
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
      <div className="card" style={{ padding: "16px", borderRadius: "20px", marginBottom: "16px", background: "#ffffff", border: "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
          <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "var(--primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "14px", overflow: "hidden", flexShrink: 0 }}>
            {avatarPreview || appData?.avatarUrl ? (
              <img src={avatarPreview || appData?.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              (appData?.userName || user?.displayName || "A").charAt(0).toUpperCase()
            )}
          </div>
          <textarea
            placeholder="Share your athletic pulse, run, or meal..."
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            style={{ flex: 1, border: "none", resize: "none", outline: "none", fontSize: "13px", color: "#0f172a", minHeight: "60px", fontFamily: "inherit" }}
          />
        </div>

        {imagePreview && (
          <div style={{ position: "relative", marginBottom: "10px" }}>
            <img src={imagePreview} alt="Preview" style={{ width: "100%", maxHeight: "250px", objectFit: "cover", borderRadius: "14px" }} />
            <button
              onClick={() => setImagePreview(null)}
              style={{ position: "absolute", top: "8px", right: "8px", background: "rgba(15,23,42,0.7)", color: "white", border: "none", borderRadius: "50%", width: "26px", height: "26px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "10px", borderTop: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <label style={{ cursor: "pointer", color: "#64748b", fontSize: "16px" }} title="Attach Photo">
              <i className="fa-regular fa-image"></i>
              <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, false)} style={{ display: "none" }} />
            </label>

            <select
              value={postVisibility}
              onChange={(e) => setPostVisibility(e.target.value)}
              style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "4px 8px", outline: "none" }}
            >
              <option value="public">🌍 Public</option>
              <option value="boosters">👥 Boosters Only</option>
              <option value="private">🔒 Only Me</option>
            </select>
          </div>

          <button
            onClick={() => createPost(false)}
            disabled={isPublishing || (!postText.trim() && !imagePreview)}
            style={{ background: "var(--primary)", color: "white", border: "none", padding: "8px 18px", borderRadius: "12px", fontWeight: 800, fontSize: "12px", cursor: "pointer", opacity: (isPublishing || (!postText.trim() && !imagePreview)) ? 0.6 : 1 }}
          >
            {isPublishing ? "Publishing..." : "Pulse"}
          </button>
        </div>
      </div>

      {/* FLOATING PILL FOR NEW POSTS */}
      {newPostsCount > 0 && (
        <div style={{ position: "sticky", top: "70px", zIndex: 800, display: "flex", justifyContent: "center", marginBottom: "14px", pointerEvents: "none" }}>
          <button 
            onClick={handleShowNewPosts}
            style={{ 
              pointerEvents: "auto",
              background: "#0ea5e9", 
              color: "white", 
              border: "none", 
              padding: "8px 18px", 
              borderRadius: "20px", 
              fontSize: "11px", 
              fontWeight: 900, 
              boxShadow: "0 6px 16px rgba(14, 165, 233, 0.4)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              animation: "slideDownBadge 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards"
            }}
          >
            <i className="fa-solid fa-arrow-up"></i>
            ✨ {newPostsCount} New Post{newPostsCount > 1 ? "s" : ""}
          </button>
        </div>
      )}
      <style>{`
        @keyframes slideDownBadge {
          from { transform: translateY(-30px) scale(0.9); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>

      {/* COMMUNITY POSTS FEED */}
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {(displayedPosts || []).length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
            <i className="fa-solid fa-users" style={{ fontSize: "36px", marginBottom: "10px", display: "block" }}></i>
            <p style={{ fontSize: "14px", fontWeight: 700, margin: 0 }}>No pulses yet</p>
            <span style={{ fontSize: "12px" }}>Be the first athlete to share your workout or nutrition!</span>
          </div>
        ) : (
          (displayedPosts || []).map((p) => {
            const isMine = p.userId === user?.uid;
            const isLiked = (p.likedBy || []).includes(user?.uid);

            return (
              <div
                key={p.id}
                className="card"
                style={{ padding: "14px", borderRadius: "18px", background: "#ffffff", border: "1px solid #e2e8f0", position: "relative" }}
              >
                {/* POST AUTHOR HEADER */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <div
                    onClick={() => {
                      if (!isMine) {
                        const targetUser = (userList || []).find((u) => u.uid === p.userId);
                        setSelectedVisitor(targetUser || { uid: p.userId, userName: p.userName, avatarUrl: p.userAvatar, userTitle: p.userTitle });
                        setActivePanel("visitor_profile");
                      }
                    }}
                    style={{ display: "flex", alignItems: "center", gap: "10px", cursor: isMine ? "default" : "pointer" }}
                  >
                    <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#4f46e5", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "13px", overflow: "hidden", flexShrink: 0 }}>
                      {p.userAvatar ? (
                        <img src={p.userAvatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        (p.userName || "A").charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <strong style={{ fontSize: "13px", color: "#0f172a", display: "block" }}>{p.userName || "Athlete"}</strong>
                      <span style={{ fontSize: "10px", color: "#94a3b8" }}>{formatTime(p.createdAt)}</span>
                    </div>
                  </div>

                  {/* 3-DOTS MENU IF MINE */}
                  {isMine && (
                    <div style={{ position: "relative" }}>
                      <button
                        onClick={() => setActiveMenuPostId(activeMenuPostId === p.id ? null : p.id)}
                        style={{ background: "none", border: "none", color: "#64748b", fontSize: "14px", cursor: "pointer", padding: "4px" }}
                      >
                        <i className="fa-solid fa-ellipsis-vertical"></i>
                      </button>

                      {activeMenuPostId === p.id && (
                        <div style={{ position: "absolute", right: 0, top: "24px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", boxShadow: "0 8px 20px rgba(0,0,0,0.08)", zIndex: 100, minWidth: "110px", padding: "4px" }}>
                          <button
                            onClick={() => openEditModal(p)}
                            style={{ width: "100%", padding: "8px 10px", background: "none", border: "none", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#334155", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                          >
                            <i className="fa-solid fa-pen" style={{ color: "#0284c7" }}></i> Edit
                          </button>
                          <button
                            onClick={() => handleDeletePost(p.id)}
                            style={{ width: "100%", padding: "8px 10px", background: "none", border: "none", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                          >
                            <i className="fa-solid fa-trash"></i> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* POST TEXT CONTENT */}
                {p.text && (
                  <div style={{ fontSize: "13px", color: "#334155", lineHeight: "1.5", marginBottom: "10px", wordBreak: "break-word" }}>
                    <ExpandableText text={p.text} maxLength={180} />
                  </div>
                )}

                {/* POST IMAGE */}
                {p.imageUrl && (
                  <img
                    src={p.imageUrl}
                    alt=""
                    style={{ width: "100%", maxHeight: "350px", objectFit: "cover", borderRadius: "12px", marginBottom: "10px" }}
                  />
                )}

                {/* POST ACTION BUTTONS */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px", borderTop: "1px solid #f1f5f9" }}>
                  <div style={{ display: "flex", gap: "16px" }}>
                    <button
                      onClick={() => handleLike(p.id, p.likes || 0, p.likedBy || [])}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 700, color: isLiked ? "#ef4444" : "#64748b", display: "flex", alignItems: "center", gap: "4px" }}
                    >
                      <i className={isLiked ? "fa-solid fa-heart" : "fa-regular fa-heart"}></i>
                      <span>{p.likes || 0}</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedPost(p);
                        setActivePanel("post_detail");
                      }}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 700, color: "#64748b", display: "flex", alignItems: "center", gap: "4px" }}
                    >
                      <i className="fa-regular fa-comment"></i>
                      <span>{p.commentsCount || 0}</span>
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      if (typeof setResonatePost === "function") setResonatePost(p);
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(window.location.href);
                        if (typeof showToast === "function") showToast("Post link copied!");
                      }
                    }}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 700, color: "#64748b", display: "flex", alignItems: "center", gap: "4px" }}
                  >
                    <i className="fa-solid fa-share-nodes"></i>
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
