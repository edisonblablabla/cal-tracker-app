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
  formatPostTime = defaultFormatTime
}) {
  const formatTime = formatPostTime || defaultFormatTime;

  return (
    <div className="screen active">
      <div style={{ marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ fontSize: "18px", fontWeight: 900, color: "#dc2626", margin: 0 }}>Admin Panel</h3>
          <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 600 }}>Moderation & Evidence Vault</span>
        </div>
        <button 
          onClick={async () => { setIsRefreshing(true); await fetchPosts(); await fetchUsers(); setIsRefreshing(false); }} 
          disabled={isRefreshing} 
          style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", padding: "4px 10px", borderRadius: "10px", fontSize: "10px", fontWeight: 700, cursor: "pointer" }}
        >
          <i className={"fa-solid fa-rotate-right " + (isRefreshing ? "fa-spin" : "")} style={{ marginRight: "4px" }}></i> Refresh
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
        <div style={{ background: "#0f172a", color: "white", padding: "6px 10px", borderRadius: "10px", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", fontWeight: 700 }}>
          <span>🟢 Online: <strong style={{ color: "#10b981" }}>{userList.filter(u => u.lastSeen && (Date.now() - u.lastSeen < 300000)).length}</strong></span>
          <span> Accounts: <strong style={{ color: "#38bdf8" }}>{userList.length}</strong></span>
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

                  <div style={{ fontSize: "8px", color: "var(--text-muted)", fontWeight: 600 }}>User ID: {p.userId} • {formatTime(p.createdAt)}</div>
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
              const isOnline = u.lastSeen && (Date.now() - u.lastSeen < 120000);
              return (
                <div key={u.uid} className="card" style={{ padding: "8px 10px", borderRadius: "12px", marginBottom: "6px", border: u.isBlocked ? "1px solid #dc2626" : "1px solid #e2e8f0", background: u.isBlocked ? "#fef2f2" : "#ffffff" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0, flex: 1 }}>
                      <span style={{ fontSize: "12px", fontWeight: 900, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.userName || "Athlete"}</span>
                      {isOnline ? (
                        <span style={{ fontSize: "8px", background: "#10b981", color: "white", padding: "1px 4px", borderRadius: "4px", fontWeight: 800, flexShrink: 0 }}>🟢 ON</span>
                      ) : (
                        <span style={{ fontSize: "8px", background: "#94a3b8", color: "white", padding: "1px 4px", borderRadius: "4px", fontWeight: 800, flexShrink: 0 }}>OFF</span>
                      )}
                      {u.isBlocked && <span style={{ fontSize: "8px", background: "#dc2626", color: "white", padding: "1px 4px", borderRadius: "4px", fontWeight: 800, flexShrink: 0 }}>BLOCKED (SAVED)</span>}
                    </div>

                    <button 
                      onClick={() => toggleBlockUser(u.uid, u.isBlocked)}
                      style={{ background: u.isBlocked ? "#10b981" : "#dc2626", color: "white", border: "none", borderRadius: "6px", padding: "3px 8px", fontSize: "9px", fontWeight: 800, cursor: "pointer", flexShrink: 0 }}
                    >
                      {u.isBlocked ? "Unblock User" : "Block User"}
                    </button>
                  </div>

                  <div style={{ fontSize: "9px", color: "#64748b", lineHeight: 1.3, wordBreak: "break-all" }}>
                    <div><strong>Email:</strong> {u.userEmail || "N/A"}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "2px", color: "#475569" }}>
                      <span><strong>Created:</strong> {formatTime(u.createdAt)}</span>
                      <span><strong>Last Online:</strong> <strong style={{ color: isOnline ? "#10b981" : "#475569" }}>{isOnline ? "Active Now" : (u.lastLoggedOutAt ? formatTime(u.lastLoggedOutAt) : ((u.lastSeen && u.lastSeen > 1) ? formatTime(u.lastSeen) : "Never"))}</strong></span>
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
