import React, { useState, useEffect } from "react";
import ExpandableText from "./ExpandableText";

const ONLINE_THRESHOLD = 75000; // 75 seconds (ang presence heartbeat ay 30s)

function parseMs(ts) {
  if (!ts) return null;
  if (typeof ts === "number") return ts < 1e11 ? ts * 1000 : ts;
  if (ts && typeof ts.toDate === "function") return ts.toDate().getTime();
  if (ts && typeof ts.seconds === "number") return ts.seconds * 1000;
  if (typeof ts === "string") return Date.parse(ts);
  if (ts instanceof Date) return ts.getTime();
  return null;
}

function formatAdminCreated(ts) {
  const ms = parseMs(ts);
  if (!ms || isNaN(ms)) return "N/A";
  const d = new Date(ms);
  const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  return `${dateStr}, ${timeStr}`;
}

function formatAdminLastOnline(ts, now) {
  if (!ts || ts === 1) return "Never";
  const ms = parseMs(ts);
  if (!ms || isNaN(ms)) return "Never";
  const diff = (now || Date.now()) - ms;
  const d = new Date(ms);
  const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

  if (diff < ONLINE_THRESHOLD) return "Active Now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago (${timeStr})`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago (${timeStr})`;
  const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${dateStr}, ${timeStr}`;
}

export default function AdminTab({
  posts = [],
  userList = [],
  adminSubTab,
  setAdminSubTab,
  isRefreshing,
  setIsRefreshing,
  fetchPosts,
  fetchUsers,
  toggleHidePost,
  toggleBlockUser,
  setSelectedPost,
  setActivePanel,
  showToast
}) {
  // Live ticker na nag-uupdate bawat 5 segundo para realtime ang online/offline
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  const handleRefreshClick = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      if (typeof fetchPosts === "function") fetchPosts();
      if (typeof fetchUsers === "function") fetchUsers();
      // 700ms animation delay para kitang-kita ang spinning feedback
      await new Promise(r => setTimeout(r, 700));
      if (typeof showToast === "function") {
        showToast("Admin data successfully refreshed! 🔄");
      }
    } catch (e) {
      console.error("Refresh error:", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const onlineCount = userList.filter(u => {
    const ms = parseMs(u.lastSeen);
    return ms && (now - ms < ONLINE_THRESHOLD);
  }).length;

  return (
    <div className="screen active">
      <div style={{ marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ fontSize: "18px", fontWeight: 900, color: "#dc2626", margin: 0 }}>Admin Panel</h3>
          <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 600 }}>Moderation & Evidence Vault</span>
        </div>
        <button 
          onClick={handleRefreshClick} 
          disabled={isRefreshing} 
          style={{ 
            background: isRefreshing ? "#e0f2fe" : "#ffffff", 
            border: isRefreshing ? "1px solid #38bdf8" : "1px solid #cbd5e1", 
            color: isRefreshing ? "#0284c7" : "#334155",
            padding: "5px 12px", 
            borderRadius: "10px", 
            fontSize: "10px", 
            fontWeight: 800, 
            cursor: isRefreshing ? "wait" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            transition: "all 0.2s ease"
          }}
        >
          <i className={"fa-solid fa-rotate-right " + (isRefreshing ? "fa-spin" : "")} style={{ color: isRefreshing ? "#0284c7" : "#64748b" }}></i> 
          <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>

      <div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
        <button 
          onClick={() => setAdminSubTab("posts")}
          style={{ flex: 1, padding: "6px", borderRadius: "10px", border: "none", fontWeight: 800, fontSize: "11px", background: adminSubTab === "posts" ? "#dc2626" : "#e2e8f0", color: adminSubTab === "posts" ? "white" : "#475569", cursor: "pointer" }}
        >
          Posts ({posts.length})
        </button>
        <button 
          onClick={() => setAdminSubTab("users")}
          style={{ flex: 1, padding: "6px", borderRadius: "10px", border: "none", fontWeight: 800, fontSize: "11px", background: adminSubTab === "users" ? "#dc2626" : "#e2e8f0", color: adminSubTab === "users" ? "white" : "#475569", cursor: "pointer" }}
        >
          Users ({userList.length})
        </button>
      </div>

      {adminSubTab === "users" && (
        <div style={{ background: "#0f172a", color: "white", padding: "8px 12px", borderRadius: "12px", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", fontWeight: 700 }}>
          <span>🟢 Online: <strong style={{ color: "#10b981", fontSize: "12px" }}>{onlineCount}</strong></span>
          <span>👥 Accounts: <strong style={{ color: "#38bdf8", fontSize: "12px" }}>{userList.length}</strong></span>
        </div>
      )}

      {adminSubTab === "posts" ? (
        <div>
          {posts.length === 0 ? (
            <p style={{ textAlign: "center", padding: "16px", color: "var(--text-muted)", fontSize: "11px" }}>No posts found in database.</p>
          ) : (
            posts.map(p => {
              const postAuthorObj = userList.find(u => u.uid === p.userId);
              const isAuthorBlocked = postAuthorObj?.isBlocked;

              return (
                <div key={p.id} className="card" style={{ padding: "10px 12px", borderRadius: "14px", marginBottom: "8px", border: p.isHidden ? "1px solid #f59e0b" : "1px solid #e2e8f0", background: p.isHidden ? "#fffbeb" : "#ffffff" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0, flex: 1 }}>
                      <span style={{ fontSize: "11px", fontWeight: 800, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.userName}</span>
                      <span style={{ fontSize: "8px", background: "#f1f5f9", padding: "1px 5px", borderRadius: "4px", fontWeight: 700, color: "#64748b", flexShrink: 0 }}>
                        {p.visibility || "public"}
                      </span>
                      {p.isHidden && (
                        <span style={{ fontSize: "8px", background: "#d97706", color: "white", padding: "1px 5px", borderRadius: "4px", fontWeight: 800, flexShrink: 0 }}>
                          HIDDEN
                        </span>
                      )}
                      {isAuthorBlocked && (
                        <span style={{ fontSize: "8px", background: "#dc2626", color: "white", padding: "1px 5px", borderRadius: "4px", fontWeight: 800, flexShrink: 0 }}>
                          BLOCKED USER
                        </span>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                      <button 
                        onClick={() => toggleHidePost(p.id, p.isHidden)}
                        style={{ background: p.isHidden ? "#10b981" : "#f59e0b", color: "white", border: "none", borderRadius: "6px", padding: "2px 6px", fontSize: "9px", fontWeight: 800, cursor: "pointer" }}
                      >
                        {p.isHidden ? "Unhide" : "Hide"}
                      </button>
                      <button 
                        onClick={() => toggleBlockUser(p.userId, isAuthorBlocked)}
                        style={{ background: isAuthorBlocked ? "#10b981" : "#dc2626", color: "white", border: "none", borderRadius: "6px", padding: "2px 6px", fontSize: "9px", fontWeight: 800, cursor: "pointer" }}
                      >
                        {isAuthorBlocked ? "Unblock User" : "Block User"}
                      </button>
                    </div>
                  </div>

                  <ExpandableText text={p.text} maxChars={80} />

                  {p.imageUrl && (
                    <div 
                      onClick={(e) => { e.stopPropagation(); setSelectedPost(p); setActivePanel("post_detail"); }} 
                      style={{ borderRadius: "8px", overflow: "hidden", marginBottom: "6px", height: "60px", background: "#f8fafc", cursor: "pointer", position: "relative" }}
                    >
                      <img src={p.imageUrl} alt="Uploaded Media" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  )}

                  <div style={{ fontSize: "8px", color: "var(--text-muted)", fontWeight: 600 }}>
                    User ID: {p.userId} • Created: {formatAdminCreated(p.createdAt)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div>
          {userList.length === 0 ? (
            <p style={{ textAlign: "center", padding: "16px", color: "var(--text-muted)", fontSize: "11px" }}>No registered user profiles found.</p>
          ) : (
            userList.map(u => {
              const lastSeenMs = parseMs(u.lastSeen);
              const isOnline = lastSeenMs && (now - lastSeenMs < ONLINE_THRESHOLD);

              return (
                <div key={u.uid} className="card" style={{ padding: "10px 12px", borderRadius: "14px", marginBottom: "8px", border: u.isBlocked ? "1px solid #dc2626" : "1px solid #e2e8f0", background: u.isBlocked ? "#fef2f2" : "#ffffff", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0, flex: 1 }}>
                      <span style={{ fontSize: "12px", fontWeight: 900, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.userName || "Athlete"}</span>
                      {isOnline ? (
                        <span style={{ fontSize: "8px", background: "#10b981", color: "white", padding: "2px 6px", borderRadius: "6px", fontWeight: 800, flexShrink: 0, boxShadow: "0 1px 4px rgba(16,185,129,0.3)" }}>🟢 ONLINE</span>
                      ) : (
                        <span style={{ fontSize: "8px", background: "#94a3b8", color: "white", padding: "2px 6px", borderRadius: "6px", fontWeight: 800, flexShrink: 0 }}>OFFLINE</span>
                      )}
                      {u.isBlocked && <span style={{ fontSize: "8px", background: "#dc2626", color: "white", padding: "2px 6px", borderRadius: "6px", fontWeight: 800, flexShrink: 0 }}>BLOCKED</span>}
                    </div>

                    <button 
                      onClick={() => toggleBlockUser(u.uid, u.isBlocked)}
                      style={{ background: u.isBlocked ? "#10b981" : "#dc2626", color: "white", border: "none", borderRadius: "6px", padding: "3px 8px", fontSize: "9px", fontWeight: 800, cursor: "pointer", flexShrink: 0 }}
                    >
                      {u.isBlocked ? "Unblock User" : "Block User"}
                    </button>
                  </div>

                  <div style={{ fontSize: "10px", color: "#64748b", lineHeight: 1.4, wordBreak: "break-all" }}>
                    <div><strong>Email:</strong> {u.userEmail || "N/A"}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "4px", marginTop: "3px", color: "#475569" }}>
                      <span><strong>Created:</strong> {formatAdminCreated(u.createdAt)}</span>
                      <span><strong>Last Online:</strong> <strong style={{ color: isOnline ? "#10b981" : "#475569" }}>{isOnline ? "Active Now" : (u.lastLoggedOutAt ? formatAdminLastOnline(u.lastLoggedOutAt, now) : formatAdminLastOnline(u.lastSeen, now))}</strong></span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
