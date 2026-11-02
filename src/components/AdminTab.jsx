import React, { useState, useEffect, useMemo, useRef } from "react";
import ExpandableText from "./ExpandableText";
import { db } from "../services/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc,
  doc, 
  orderBy, 
  deleteDoc 
} from "firebase/firestore";

const ONLINE_THRESHOLD = 75000; // 75 seconds presence window

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
  adminSubTab = "posts",
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
  const [now, setNow] = useState(Date.now());
  const [activeTab, setActiveTabInternal] = useState(adminSubTab || "posts");
  const [searchQuery, setSearchQuery] = useState("");
  const [userFilter, setUserFilter] = useState("all");

  // ─── INVESTIGATION & CHAT VAULT STATES ───
  const [investigatingUser, setInvestigatingUser] = useState(null);
  const [userChats, setUserChats] = useState([]);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [activeChatThread, setActiveChatThread] = useState(null);
  const [chatTranscript, setChatTranscript] = useState([]);
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);
  const [ruleHelpRequired, setRuleHelpRequired] = useState(false);

  // ─── IN-APP FLOATING NOTIFICATION (NO BROWSER ALERT) ───
  const [internalToast, setInternalToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  const notify = (msg, type = "info") => {
    if (typeof showToast === "function") {
      showToast(msg);
    }
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setInternalToast({ msg, type });
    toastTimeoutRef.current = setTimeout(() => {
      setInternalToast(null);
    }, 4000);
  };

  const handleSubTabChange = (t) => {
    setActiveTabInternal(t);
    if (setAdminSubTab) setAdminSubTab(t);
  };

  useEffect(() => {
    if (adminSubTab && adminSubTab !== activeTab) {
      setActiveTabInternal(adminSubTab);
    }
  }, [adminSubTab]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  const handleRefreshClick = async () => {
    if (isRefreshing) return;
    if (setIsRefreshing) setIsRefreshing(true);
    try {
      if (typeof fetchPosts === "function") await fetchPosts();
      if (typeof fetchUsers === "function") await fetchUsers();
      await new Promise(r => setTimeout(r, 600));
      notify("Admin metrics & databases refreshed! 🔄", "success");
    } catch (e) {
      console.error("Refresh error:", e);
    } finally {
      if (setIsRefreshing) setIsRefreshing(false);
    }
  };

  // ─── METRIC COMPUTATIONS ───
  const onlineUsers = useMemo(() => {
    return userList.filter(u => {
      const ms = parseMs(u.lastSeen);
      return ms && (now - ms < ONLINE_THRESHOLD);
    });
  }, [userList, now]);

  const blockedUsers = useMemo(() => {
    return userList.filter(u => u.isBlocked);
  }, [userList]);

  const hiddenPosts = useMemo(() => {
    return posts.filter(p => p.isHidden);
  }, [posts]);

  // ─── SEARCH & FILTER LOGIC ───
  const filteredUsers = useMemo(() => {
    return userList.filter(u => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        (u.userName && u.userName.toLowerCase().includes(q)) ||
        (u.userEmail && u.userEmail.toLowerCase().includes(q)) ||
        (u.uid && u.uid.toLowerCase().includes(q));

      if (!matchesSearch) return false;
      if (userFilter === "online") {
        const ms = parseMs(u.lastSeen);
        return ms && (now - ms < ONLINE_THRESHOLD);
      }
      if (userFilter === "blocked") return !!u.isBlocked;
      return true;
    });
  }, [userList, searchQuery, userFilter, now]);

  const filteredPosts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return posts;
    return posts.filter(p => 
      (p.userName && p.userName.toLowerCase().includes(q)) ||
      (p.text && p.text.toLowerCase().includes(q)) ||
      (p.userId && p.userId.toLowerCase().includes(q))
    );
  }, [posts, searchQuery]);

  // ─── FORENSIC INVESTIGATION: FETCH CHATS ───
  const startInvestigation = async (userObj) => {
    if (!userObj || !userObj.uid) return;
    setInvestigatingUser(userObj);
    handleSubTabChange("vault");
    setActiveChatThread(null);
    setChatTranscript([]);
    setIsLoadingChats(true);
    setRuleHelpRequired(false);

    try {
      const q = query(collection(db, "chats"), where("participants", "array-contains", userObj.uid));
      const snap = await getDocs(q);
      const threads = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      threads.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      setUserChats(threads);

      if (threads.length === 0) {
        notify("Walang nakitang aktibong chat logs para sa account na ito.", "info");
      } else {
        notify(`🕵️‍♂️ Natagpuan ang ${threads.length} chat threads!`, "success");
      }
    } catch (err) {
      console.warn("Array query failed, trying pairwise fallback scan...", err);
      try {
        const potentialPartnerUids = (userList || [])
          .map(u => u.uid)
          .filter(uid => uid && uid !== userObj.uid);

        const foundThreads = [];
        for (const partnerUid of potentialPartnerUids) {
          const directChatId = [userObj.uid, partnerUid].sort().join("_");
          try {
            const chatSnap = await getDoc(doc(db, "chats", directChatId));
            if (chatSnap.exists()) {
              foundThreads.push({ id: chatSnap.id, ...chatSnap.data() });
            }
          } catch (e) {
            // silent catch
          }
        }

        if (foundThreads.length > 0) {
          foundThreads.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
          setUserChats(foundThreads);
          notify(`🕵️‍♂️ Natagpuan ang ${foundThreads.length} chat threads gamit ang direct scan!`, "success");
        } else {
          setRuleHelpRequired(true);
          notify("Kinakailangan ng Admin Permission sa Firebase Rules.", "warning");
        }
      } catch (fallbackErr) {
        console.error("Forensic chat fetch failed:", fallbackErr);
        setRuleHelpRequired(true);
        notify("Kinakailangan ng Admin Permission sa Firebase Rules.", "error");
      }
    } finally {
      setIsLoadingChats(false);
    }
  };

  const loadChatTranscript = async (chat) => {
    setActiveChatThread(chat);
    setIsLoadingTranscript(true);
    try {
      const msgQuery = query(
        collection(db, "chats", chat.id, "messages"),
        orderBy("createdAt", "asc")
      );
      const snap = await getDocs(msgQuery);
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setChatTranscript(msgs);
    } catch (e) {
      console.error("Transcript read error:", e);
      notify("Hindi mabasa ang mga mensahe sa thread na ito.", "error");
    } finally {
      setIsLoadingTranscript(false);
    }
  };

  const handleDeletePostPermanently = async (postId) => {
    if (!window.confirm("Sigurado ka bang nais mong BURAHIN nang permanente ang post na ito sa database?")) return;
    try {
      await deleteDoc(doc(db, "posts", postId));
      notify("🗑️ Matagumpay na nabura ang post sa database!", "success");
      if (typeof fetchPosts === "function") fetchPosts();
    } catch (err) {
      console.error("Error deleting post:", err);
      notify("Nabigong burahin ang post.", "error");
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    notify(`📋 Na-copy ang ${label} sa clipboard!`, "success");
  };

  return (
    <div className="screen active" style={{ maxWidth: "780px", margin: "0 auto", paddingBottom: "40px" }}>
      
      {/* ─── IN-APP FLOATING NOTIFICATION ─── */}
      {internalToast && (
        <div style={{
          position: "fixed",
          top: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 99999,
          background: internalToast.type === "error" ? "#b91c1c" : internalToast.type === "warning" ? "#d97706" : internalToast.type === "success" ? "#059669" : "#1e293b",
          color: "#ffffff",
          padding: "10px 18px",
          borderRadius: "14px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
          fontSize: "12px",
          fontWeight: 800,
          border: "1px solid rgba(255,255,255,0.2)",
          animation: "fadeInDown 0.25s ease"
        }}>
          <i className={internalToast.type === "error" ? "fa-solid fa-triangle-exclamation" : internalToast.type === "warning" ? "fa-solid fa-shield-halved" : internalToast.type === "success" ? "fa-solid fa-circle-check" : "fa-solid fa-bell"}></i>
          <span>{internalToast.msg}</span>
          <button
            type="button"
            onClick={() => setInternalToast(null)}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.8)", cursor: "pointer", fontSize: "14px", marginLeft: "6px" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ─── 1. COMMAND CENTER EXECUTIVE HEADER ─── */}
      <div style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        padding: "16px 20px",
        borderRadius: "18px",
        color: "#ffffff",
        marginBottom: "16px",
        boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.4)",
        border: "1px solid rgba(255, 255, 255, 0.1)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #ef4444, #dc2626)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(239,68,68,0.5)"
              }}>
                <i className="fa-solid fa-shield-halved" style={{ fontSize: "14px", color: "#fff" }}></i>
              </div>
              <h2 style={{ fontSize: "18px", fontWeight: 900, margin: 0, letterSpacing: "-0.3px" }}>
                NutriPulse Command Center
              </h2>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
              <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>Super Admin Moderation & Security Console</span>
              <span style={{ fontSize: "9px", background: "rgba(16, 185, 129, 0.2)", color: "#34d399", padding: "1px 6px", borderRadius: "10px", fontWeight: 800, border: "1px solid rgba(52, 211, 153, 0.3)" }}>
                🟢 30s Heartbeat
              </span>
            </div>
          </div>

          <button
            onClick={handleRefreshClick}
            disabled={isRefreshing}
            style={{
              background: isRefreshing ? "#334155" : "rgba(255, 255, 255, 0.12)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "#ffffff",
              padding: "7px 14px",
              borderRadius: "10px",
              fontSize: "11px",
              fontWeight: 800,
              cursor: isRefreshing ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              backdropFilter: "blur(4px)",
              transition: "all 0.2s ease"
            }}
          >
            <i className={"fa-solid fa-arrows-rotate " + (isRefreshing ? "fa-spin" : "")}></i>
            <span>{isRefreshing ? "Syncing..." : "Refresh Cloud"}</span>
          </button>
        </div>

        {/* ─── 4 PRO KPI CARDS ─── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: "10px",
          marginTop: "16px"
        }}>
          <div style={{ background: "rgba(255,255,255,0.06)", padding: "10px 12px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>Registered</div>
            <div style={{ fontSize: "20px", fontWeight: 900, color: "#38bdf8", marginTop: "2px" }}>
              {userList.length} <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>Athletes</span>
            </div>
          </div>

          <div style={{ background: "rgba(16,185,129,0.08)", padding: "10px 12px", borderRadius: "12px", border: "1px solid rgba(16,185,129,0.2)" }}>
            <div style={{ fontSize: "10px", color: "#34d399", fontWeight: 700, textTransform: "uppercase" }}>Live Online</div>
            <div style={{ fontSize: "20px", fontWeight: 900, color: "#10b981", marginTop: "2px", display: "flex", alignItems: "center", gap: "6px" }}>
              <span>{onlineUsers.length}</span>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 10px #10b981" }}></span>
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.06)", padding: "10px 12px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>Community Feed</div>
            <div style={{ fontSize: "20px", fontWeight: 900, color: "#f8fafc", marginTop: "2px" }}>
              {posts.length} <span style={{ fontSize: "11px", color: hiddenPosts.length > 0 ? "#f59e0b" : "#94a3b8", fontWeight: 700 }}>({hiddenPosts.length} Hidden)</span>
            </div>
          </div>

          <div style={{ background: blockedUsers.length > 0 ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.06)", padding: "10px 12px", borderRadius: "12px", border: blockedUsers.length > 0 ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize: "10px", color: blockedUsers.length > 0 ? "#f87171" : "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>Security Flags</div>
            <div style={{ fontSize: "20px", fontWeight: 900, color: blockedUsers.length > 0 ? "#ef4444" : "#cbd5e1", marginTop: "2px" }}>
              {blockedUsers.length} <span style={{ fontSize: "11px", fontWeight: 700 }}>Blocked</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. MAIN SUB-TAB SWITCHER ─── */}
      <div style={{
        display: "flex",
        background: "#e2e8f0",
        padding: "4px",
        borderRadius: "14px",
        gap: "4px",
        marginBottom: "14px"
      }}>
        <button
          type="button"
          onClick={() => handleSubTabChange("posts")}
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: "10px",
            border: "none",
            fontWeight: 800,
            fontSize: "12px",
            background: activeTab === "posts" ? "#ffffff" : "transparent",
            color: activeTab === "posts" ? "#0f172a" : "#64748b",
            boxShadow: activeTab === "posts" ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px"
          }}
        >
          <i className="fa-solid fa-newspaper" style={{ color: activeTab === "posts" ? "#ef4444" : "inherit" }}></i>
          <span>Posts & Feed ({posts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => handleSubTabChange("users")}
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: "10px",
            border: "none",
            fontWeight: 800,
            fontSize: "12px",
            background: activeTab === "users" ? "#ffffff" : "transparent",
            color: activeTab === "users" ? "#0f172a" : "#64748b",
            boxShadow: activeTab === "users" ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px"
          }}
        >
          <i className="fa-solid fa-users" style={{ color: activeTab === "users" ? "#3b82f6" : "inherit" }}></i>
          <span>Athletes ({userList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => handleSubTabChange("vault")}
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: "10px",
            border: "none",
            fontWeight: 800,
            fontSize: "12px",
            background: activeTab === "vault" ? "#ffffff" : "transparent",
            color: activeTab === "vault" ? "#7c3aed" : "#64748b",
            boxShadow: activeTab === "vault" ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px"
          }}
        >
          <i className="fa-solid fa-user-secret" style={{ color: activeTab === "vault" ? "#7c3aed" : "inherit" }}></i>
          <span>Chat Vault 🕵️‍♂️</span>
        </button>
      </div>

      {/* ─── 3. TAB CONTENT: POSTS & FEED ─── */}
      {activeTab === "posts" && (
        <div>
          <div style={{ position: "relative", marginBottom: "12px" }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: "absolute", left: "14px", top: "12px", color: "#94a3b8", fontSize: "13px" }}></i>
            <input
              type="text"
              placeholder="Search posts by caption, author name, or UID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px 10px 38px",
                borderRadius: "12px",
                border: "1px solid #cbd5e1",
                fontSize: "12px",
                outline: "none",
                background: "#ffffff"
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{ position: "absolute", right: "12px", top: "8px", background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "14px" }}
              >
                ✕
              </button>
            )}
          </div>

          {filteredPosts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", background: "#ffffff", borderRadius: "16px", border: "1px dashed #cbd5e1", color: "#64748b" }}>
              <i className="fa-regular fa-folder-open" style={{ fontSize: "32px", color: "#cbd5e1", marginBottom: "8px" }}></i>
              <div style={{ fontSize: "13px", fontWeight: 700 }}>Walang posts na tumutugma sa filter.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {filteredPosts.map(p => {
                const author = userList.find(u => u.uid === p.userId);
                const isBlocked = author?.isBlocked;

                return (
                  <div
                    key={p.id}
                    style={{
                      background: p.isHidden ? "#fffbeb" : "#ffffff",
                      borderRadius: "16px",
                      padding: "14px 16px",
                      border: p.isHidden ? "1px solid #fcd34d" : "1px solid #e2e8f0",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          background: author?.avatarUrl ? "none" : "#e2e8f0",
                          overflow: "hidden",
                          flexShrink: 0,
                          border: "1px solid #cbd5e1",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 800,
                          color: "#475569",
                          fontSize: "12px"
                        }}>
                          {author?.avatarUrl ? (
                            <img src={author.avatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            (p.userName || "A").slice(0, 1).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a" }}>{p.userName || "Anonymous Athlete"}</span>
                            <span style={{ fontSize: "9px", background: "#f1f5f9", padding: "1px 6px", borderRadius: "6px", fontWeight: 700, color: "#475569" }}>
                              {p.visibility || "public"}
                            </span>
                            {p.isHidden && (
                              <span style={{ fontSize: "9px", background: "#f59e0b", color: "#fff", padding: "1px 6px", borderRadius: "6px", fontWeight: 800 }}>
                                🔒 HIDDEN
                              </span>
                            )}
                            {isBlocked && (
                              <span style={{ fontSize: "9px", background: "#ef4444", color: "#fff", padding: "1px 6px", borderRadius: "6px", fontWeight: 800 }}>
                                ⛔ BLOCKED AUTHOR
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "2px" }}>
                            {formatAdminCreated(p.createdAt)}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "5px" }}>
                        <button
                          type="button"
                          onClick={() => toggleHidePost(p.id, p.isHidden)}
                          style={{
                            background: p.isHidden ? "#10b981" : "#f59e0b",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "8px",
                            padding: "4px 8px",
                            fontSize: "10px",
                            fontWeight: 800,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                        >
                          <i className={p.isHidden ? "fa-solid fa-eye" : "fa-solid fa-eye-slash"}></i>
                          <span>{p.isHidden ? "Unhide" : "Hide"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeletePostPermanently(p.id)}
                          style={{
                            background: "#fee2e2",
                            color: "#dc2626",
                            border: "1px solid #fca5a5",
                            borderRadius: "8px",
                            padding: "4px 8px",
                            fontSize: "10px",
                            fontWeight: 800,
                            cursor: "pointer"
                          }}
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </div>

                    <div style={{ margin: "8px 0" }}>
                      <ExpandableText text={p.text} maxChars={120} />
                    </div>

                    {p.imageUrl && (
                      <div
                        onClick={() => {
                          if (setSelectedPost && setActivePanel) {
                            setSelectedPost(p);
                            setActivePanel("post_detail");
                          }
                        }}
                        style={{
                          borderRadius: "10px",
                          overflow: "hidden",
                          maxHeight: "140px",
                          marginBottom: "8px",
                          background: "#0f172a",
                          cursor: "pointer",
                          position: "relative"
                        }}
                      >
                        <img src={p.imageUrl} alt="Attached Media" style={{ width: "100%", height: "140px", objectFit: "cover" }} />
                        <span style={{ position: "absolute", bottom: "6px", right: "6px", background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: "9px", padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>
                          Click to inspect
                        </span>
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "6px", paddingTop: "8px", borderTop: "1px solid #f1f5f9", fontSize: "10px", color: "#64748b" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span>UID:</span>
                        <code style={{ background: "#f1f5f9", padding: "1px 4px", borderRadius: "4px", fontSize: "9px" }}>{p.userId?.slice(0, 10)}...</code>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(p.userId, "User ID")}
                          style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", padding: "0 2px" }}
                        >
                          <i className="fa-regular fa-copy"></i>
                        </button>
                      </div>

                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          type="button"
                          onClick={() => author && startInvestigation(author)}
                          style={{
                            background: "#ede9fe",
                            color: "#7c3aed",
                            border: "none",
                            borderRadius: "6px",
                            padding: "2px 8px",
                            fontSize: "10px",
                            fontWeight: 800,
                            cursor: "pointer"
                          }}
                        >
                          🕵️‍♂️ View Chats
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleBlockUser(p.userId, isBlocked)}
                          style={{
                            background: isBlocked ? "#10b981" : "#ef4444",
                            color: "#fff",
                            border: "none",
                            borderRadius: "6px",
                            padding: "2px 8px",
                            fontSize: "10px",
                            fontWeight: 800,
                            cursor: "pointer"
                          }}
                        >
                          {isBlocked ? "Unblock Author" : "Block Author"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── 4. TAB CONTENT: ATHLETES DIRECTORY ─── */}
      {activeTab === "users" && (
        <div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
            <div style={{ position: "relative", flex: 1, minWidth: "220px" }}>
              <i className="fa-solid fa-magnifying-glass" style={{ position: "absolute", left: "14px", top: "11px", color: "#94a3b8", fontSize: "13px" }}></i>
              <input
                type="text"
                placeholder="Search athletes by name, email, or UID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 14px 9px 36px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  fontSize: "12px",
                  outline: "none",
                  background: "#ffffff"
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "4px" }}>
              {["all", "online", "blocked"].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setUserFilter(f)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "8px",
                    border: "none",
                    fontWeight: 800,
                    fontSize: "11px",
                    background: userFilter === f ? "#0f172a" : "#e2e8f0",
                    color: userFilter === f ? "#ffffff" : "#475569",
                    cursor: "pointer"
                  }}
                >
                  {f === "all" ? "Lahat" : f === "online" ? "Online" : "Blocked"}
                </button>
              ))}
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", background: "#ffffff", borderRadius: "16px", border: "1px dashed #cbd5e1", color: "#64748b" }}>
              <i className="fa-solid fa-user-xmark" style={{ fontSize: "32px", color: "#cbd5e1", marginBottom: "8px" }}></i>
              <div style={{ fontSize: "13px", fontWeight: 700 }}>Walang athlete na tumugma sa iyong criteria.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {filteredUsers.map(u => {
                const lastSeenMs = parseMs(u.lastSeen);
                const isOnline = lastSeenMs && (now - lastSeenMs < ONLINE_THRESHOLD);

                return (
                  <div
                    key={u.uid}
                    style={{
                      background: u.isBlocked ? "#fef2f2" : "#ffffff",
                      borderRadius: "14px",
                      padding: "12px 14px",
                      border: u.isBlocked ? "1px solid #fca5a5" : "1px solid #e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "10px",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.02)"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <div style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          background: u.avatarUrl ? "none" : "#e0e7ff",
                          overflow: "hidden",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 800,
                          color: "#4f46e5",
                          fontSize: "14px",
                          border: "1px solid #c7d2fe"
                        }}>
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            (u.userName || "A").slice(0, 1).toUpperCase()
                          )}
                        </div>
                        {isOnline && (
                          <span style={{
                            position: "absolute",
                            bottom: "0",
                            right: "0",
                            width: "12px",
                            height: "12px",
                            borderRadius: "50%",
                            background: "#10b981",
                            border: "2px solid #ffffff"
                          }}></span>
                        )}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a" }}>{u.userName || "Athlete"}</span>
                          {isOnline ? (
                            <span style={{ fontSize: "8px", background: "#10b981", color: "#fff", padding: "1px 5px", borderRadius: "5px", fontWeight: 800 }}>
                              ONLINE
                            </span>
                          ) : (
                            <span style={{ fontSize: "8px", background: "#94a3b8", color: "#fff", padding: "1px 5px", borderRadius: "5px", fontWeight: 800 }}>
                              OFFLINE
                            </span>
                          )}
                          {u.isBlocked && (
                            <span style={{ fontSize: "8px", background: "#ef4444", color: "#fff", padding: "1px 5px", borderRadius: "5px", fontWeight: 800 }}>
                              BLOCKED
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {u.userEmail || "No Email Provided"}
                        </div>

                        <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "2px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          <span>Joined: {formatAdminCreated(u.createdAt)}</span>
                          <span>Last: <strong style={{ color: isOnline ? "#10b981" : "#64748b" }}>{isOnline ? "Active Now" : formatAdminLastOnline(u.lastSeen, now)}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <button
                        type="button"
                        onClick={() => startInvestigation(u)}
                        style={{
                          background: "#f5f3ff",
                          color: "#7c3aed",
                          border: "1px solid #ddd6fe",
                          padding: "6px 10px",
                          borderRadius: "8px",
                          fontSize: "11px",
                          fontWeight: 800,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                      >
                        <i className="fa-solid fa-magnifying-glass-arrow-right"></i>
                        <span>Investigate</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleBlockUser(u.uid, u.isBlocked)}
                        style={{
                          background: u.isBlocked ? "#10b981" : "#ef4444",
                          color: "#ffffff",
                          border: "none",
                          padding: "6px 10px",
                          borderRadius: "8px",
                          fontSize: "11px",
                          fontWeight: 800,
                          cursor: "pointer"
                        }}
                      >
                        {u.isBlocked ? "Unblock" : "Block User"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── 5. TAB CONTENT: EVIDENCE & CHAT INVESTIGATION VAULT ─── */}
      {activeTab === "vault" && (
        <div>
          {/* Security & Compliance Banner */}
          <div style={{
            background: "#4c1d95",
            color: "#ffffff",
            padding: "12px 16px",
            borderRadius: "14px",
            marginBottom: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
            boxShadow: "0 4px 15px rgba(76, 29, 149, 0.3)"
          }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                <i className="fa-solid fa-lock"></i>
                <span>Strict Security & Trust/Safety Investigation Vault</span>
              </div>
              <div style={{ fontSize: "11px", opacity: 0.9, marginTop: "2px" }}>
                Gamitin lamang ito sa pag-imbestiga ng mga ulat ng pambabastos, scam, o panloloko sa komunidad.
              </div>
            </div>
          </div>

          {/* Firebase Rules Helper Card if needed */}
          {ruleHelpRequired && (
            <div style={{
              background: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: "14px",
              padding: "14px",
              marginBottom: "14px",
              color: "#92400e"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 800, fontSize: "13px" }}>
                <i className="fa-solid fa-key" style={{ color: "#d97706" }}></i>
                <span>Pahintulutan ang Chat Evidence Vault sa Firebase</span>
              </div>
              <p style={{ fontSize: "11px", margin: "6px 0 10px 0", lineHeight: 1.5 }}>
                Pinoprotektahan ng Firestore ang pribadong mensahe. I-paste ang rule na ito sa <strong>Firebase Console ➜ Firestore Rules</strong>:
              </p>
              <pre style={{ background: "#1e293b", color: "#38bdf8", padding: "10px", borderRadius: "8px", fontSize: "10px", margin: 0, overflowX: "auto" }}>
{`match /chats/{chatId} {
  allow read: if (isAuthenticated() && request.auth.uid in resource.data.participants) || isAdmin();
  allow write: if (isAuthenticated() && (
    request.auth.uid in request.resource.data.participants ||
    request.auth.uid in resource.data.participants
  )) || isAdmin();

  match /messages/{messageId} {
    allow read, write: if isAuthenticated();
  }
}`}
              </pre>
              <div style={{ marginTop: "8px", display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`match /chats/{chatId} {\n  allow read: if (isAuthenticated() && request.auth.uid in resource.data.participants) || isAdmin();\n  allow write: if (isAuthenticated() && (request.auth.uid in request.resource.data.participants || request.auth.uid in resource.data.participants)) || isAdmin();\n  match /messages/{messageId} {\n    allow read, write: if isAuthenticated();\n  }\n}`);
                    notify("Na-kopya ang Firestore rule sa clipboard! 📋", "success");
                  }}
                  style={{
                    background: "#d97706",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "5px 10px",
                    fontSize: "10px",
                    fontWeight: 800,
                    cursor: "pointer"
                  }}
                >
                  <i className="fa-regular fa-copy"></i> Kopyahin ang Rule
                </button>
              </div>
            </div>
          )}

          {/* Select User to Investigate */}
          <div style={{ background: "#ffffff", padding: "14px", borderRadius: "14px", border: "1px solid #e2e8f0", marginBottom: "14px" }}>
            <label style={{ fontSize: "11px", fontWeight: 800, color: "#475569", display: "block", marginBottom: "6px", textTransform: "uppercase" }}>
              Pumili ng Account na Iniimbestigahan:
            </label>
            <select
              value={investigatingUser?.uid || ""}
              onChange={(e) => {
                const found = userList.find(u => u.uid === e.target.value);
                if (found) startInvestigation(found);
              }}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                fontSize: "12px",
                fontWeight: 700,
                outline: "none",
                background: "#f8fafc"
              }}
            >
              <option value="">-- Pumili mula sa listahan ng Athletes ({userList.length}) --</option>
              {userList.map(u => (
                <option key={u.uid} value={u.uid}>
                  {u.userName || "Athlete"} ({u.userEmail || u.uid}) {u.isBlocked ? "⛔ [BLOCKED]" : ""}
                </option>
              ))}
            </select>

            {investigatingUser && (
              <div style={{ marginTop: "12px", padding: "10px 12px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a" }}>
                    Paksa: {investigatingUser.userName} ({investigatingUser.userEmail || "No Email"})
                  </div>
                  <div style={{ fontSize: "10px", color: "#64748b", marginTop: "1px" }}>
                    UID: <code>{investigatingUser.uid}</code>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleBlockUser(investigatingUser.uid, investigatingUser.isBlocked)}
                  style={{
                    background: investigatingUser.isBlocked ? "#10b981" : "#ef4444",
                    color: "#ffffff",
                    border: "none",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: 800,
                    cursor: "pointer"
                  }}
                >
                  {investigatingUser.isBlocked ? "Unblock Account" : "Block Account Agad"}
                </button>
              </div>
            )}
          </div>

          {/* Investigation Chat Threads */}
          {isLoadingChats ? (
            <div style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "24px", color: "#7c3aed", marginBottom: "8px" }}></i>
              <div style={{ fontSize: "12px", fontWeight: 700 }}>Kinukuha ang mga mensahe mula sa cloud database...</div>
            </div>
          ) : userChats.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: activeChatThread ? "1fr 1fr" : "1fr", gap: "12px" }}>
              {/* Left Column: Chat Threads List */}
              <div style={{ background: "#ffffff", padding: "12px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", marginBottom: "8px", textTransform: "uppercase" }}>
                  Natagpuang Chat Threads ({userChats.length})
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {userChats.map(c => {
                    const otherUid = c.participants?.find(p => p !== investigatingUser?.uid);
                    const otherUser = userList.find(u => u.uid === otherUid);
                    const isSelected = activeChatThread?.id === c.id;

                    return (
                      <div
                        key={c.id}
                        onClick={() => loadChatTranscript(c)}
                        style={{
                          padding: "10px",
                          borderRadius: "10px",
                          border: isSelected ? "1.5px solid #7c3aed" : "1px solid #e2e8f0",
                          background: isSelected ? "#f5f3ff" : "#f8fafc",
                          cursor: "pointer",
                          transition: "all 0.15s ease"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a" }}>
                            {otherUser?.userName || "Athlete (" + (otherUid?.slice(0, 6) || "ID") + ")"}
                          </span>
                          <span style={{ fontSize: "9px", color: "#94a3b8" }}>
                            {c.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : ""}
                          </span>
                        </div>
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {c.lastMessage || "(Walang text preview)"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Chat Transcript Inspector */}
              {activeChatThread && (
                <div style={{ background: "#ffffff", padding: "14px", borderRadius: "14px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "8px", borderBottom: "1px solid #f1f5f9", marginBottom: "10px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 900, color: "#0f172a" }}>
                      Transcript Viewer
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveChatThread(null)}
                      style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "14px" }}
                    >
                      ✕
                    </button>
                  </div>

                  {isLoadingTranscript ? (
                    <div style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                      <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "20px", color: "#7c3aed", marginBottom: "6px" }}></i>
                      <div style={{ fontSize: "11px" }}>Binubuksan ang transcript...</div>
                    </div>
                  ) : chatTranscript.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "20px", color: "#94a3b8", fontSize: "11px" }}>
                      Walang nakitang laman sa chat thread na ito.
                    </div>
                  ) : (
                    <div style={{ maxHeight: "350px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", paddingRight: "4px" }}>
                      {chatTranscript.map((m, idx) => {
                        const isTarget = m.senderUid === investigatingUser?.uid;

                        return (
                          <div
                            key={m.id || idx}
                            style={{
                              alignSelf: isTarget ? "flex-end" : "flex-start",
                              maxWidth: "85%",
                              background: isTarget ? "#ede9fe" : "#f1f5f9",
                              border: isTarget ? "1px solid #ddd6fe" : "1px solid #e2e8f0",
                              padding: "8px 12px",
                              borderRadius: "12px"
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", fontSize: "9px", fontWeight: 800, color: isTarget ? "#6d28d9" : "#475569", marginBottom: "2px" }}>
                              <span>{m.senderName || (isTarget ? investigatingUser.userName : "Partner")}</span>
                              <span>{m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}</span>
                            </div>
                            <div style={{ fontSize: "12px", color: "#0f172a", wordBreak: "break-word" }}>
                              {m.text}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : investigatingUser ? (
            <div style={{ textAlign: "center", padding: "30px", background: "#ffffff", borderRadius: "14px", border: "1px dashed #cbd5e1", color: "#64748b" }}>
              <i className="fa-regular fa-comment-slash" style={{ fontSize: "28px", color: "#cbd5e1", marginBottom: "8px" }}></i>
              <div style={{ fontSize: "12px", fontWeight: 700 }}>Walang anumang naitalang personal chat ang account na ito sa cloud.</div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
