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
  return dateStr + ", " + timeStr;
}

function formatAdminLastOnline(ts, now) {
  const ms = parseMs(ts);
  if (!ms || isNaN(ms) || ms <= 1) return "No activity recorded";
  const diff = (now || Date.now()) - ms;
  const d = new Date(ms);
  const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

  if (diff < ONLINE_THRESHOLD) return "Active Now";
  if (diff < 3600000) return Math.max(1, Math.floor(diff / 60000)) + "m ago (" + timeStr + ")";
  if (diff < 86400000) return Math.floor(diff / 3600000) + "h ago (" + timeStr + ")";
  const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return dateStr + ", " + timeStr;
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

  // ─── INVESTIGATION & FORENSIC SUITE STATES ───
  const [investigatingUser, setInvestigatingUser] = useState(null);
  const [investigationTab, setInvestigationTab] = useState("overview");
  const [userChats, setUserChats] = useState([]);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [activeChatThread, setActiveChatThread] = useState(null);
  const [chatTranscript, setChatTranscript] = useState([]);
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);

  // ─── IN-APP FLOATING NOTIFICATION ───
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
      return ms && ms > 1 && (now - ms < ONLINE_THRESHOLD);
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
        return ms && ms > 1 && (now - ms < ONLINE_THRESHOLD);
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

  // ─── FORENSIC INVESTIGATION: LAUNCH AUDIT DOSSIER ───
  const startInvestigation = async (userObj) => {
    if (!userObj || !userObj.uid) return;
    setInvestigatingUser(userObj);
    handleSubTabChange("vault");
    setInvestigationTab("overview");
    setActiveChatThread(null);
    setChatTranscript([]);
    setIsLoadingChats(true);

    try {
      const q = query(collection(db, "chats"), where("participants", "array-contains", userObj.uid));
      const snap = await getDocs(q);
      const threads = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      threads.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      setUserChats(threads);

      if (threads.length === 0) {
        notify("Walang nakitang aktibong chat logs para sa account na ito.", "info");
      } else {
        notify("Natagpuan ang " + threads.length + " chat threads para kay " + (userObj.userName || "User") + "!", "success");
      }
    } catch (err) {
      console.warn("Primary chat query failed, trying partner lookup...", err);
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
          notify("Natagpuan ang " + foundThreads.length + " chat threads gamit ang direct scan!", "success");
        } else {
          notify("Walang natagpuang chat threads para sa account na ito.", "info");
        }
      } catch (fallbackErr) {
        console.error("Forensic chat fetch failed:", fallbackErr);
        notify("Nabigong makuha ang chat logs.", "error");
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
      notify("Matagumpay na nabura ang post sa database!", "success");
      if (typeof fetchPosts === "function") fetchPosts();
    } catch (err) {
      console.error("Error deleting post:", err);
      notify("Nabigong burahin ang post.", "error");
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    notify("Na-copy ang " + label + " sa clipboard!", "success");
  };

  return (
    <div className="screen active" style={{ maxWidth: "780px", margin: "0 auto", paddingBottom: "70px", boxSizing: "border-box", width: "100%" }}>
      
      {/* ─── IN-APP FLOATING NOTIFICATION ─── */}
      {internalToast && (
        <div style={{
          position: "fixed",
          top: "16px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 99999,
          background: internalToast.type === "error" ? "#b91c1c" : internalToast.type === "warning" ? "#d97706" : internalToast.type === "success" ? "#059669" : "#1e293b",
          color: "#ffffff",
          padding: "8px 16px",
          borderRadius: "12px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
          fontSize: "12px",
          fontWeight: 800,
          border: "1px solid rgba(255,255,255,0.2)",
          maxWidth: "92vw",
          boxSizing: "border-box"
        }}>
          <i className={internalToast.type === "error" ? "fa-solid fa-triangle-exclamation" : internalToast.type === "warning" ? "fa-solid fa-shield-halved" : internalToast.type === "success" ? "fa-solid fa-circle-check" : "fa-solid fa-bell"}></i>
          <span style={{ flex: 1, wordBreak: "break-word" }}>{internalToast.msg}</span>
          <button
            type="button"
            onClick={() => setInternalToast(null)}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.8)", cursor: "pointer", fontSize: "14px", marginLeft: "4px" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ─── 1. COMMAND CENTER EXECUTIVE HEADER ─── */}
      <div style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        padding: "14px 16px",
        borderRadius: "16px",
        color: "#ffffff",
        marginBottom: "12px",
        boxShadow: "0 8px 20px -4px rgba(15, 23, 42, 0.35)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxSizing: "border-box"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{
                width: "26px",
                height: "26px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #ef4444, #dc2626)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 6px rgba(239,68,68,0.4)",
                flexShrink: 0
              }}>
                <i className="fa-solid fa-shield-halved" style={{ fontSize: "13px", color: "#fff" }}></i>
              </div>
              <h2 style={{ fontSize: "16px", fontWeight: 900, margin: 0, letterSpacing: "-0.3px", lineHeight: 1.2 }}>
                NutriPulse Command Center
              </h2>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "3px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 600 }}>Super Admin Console</span>
              <span style={{ fontSize: "8.5px", background: "rgba(16, 185, 129, 0.2)", color: "#34d399", padding: "1px 5px", borderRadius: "8px", fontWeight: 800, border: "1px solid rgba(52, 211, 153, 0.3)" }}>
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
              padding: "6px 12px",
              borderRadius: "8px",
              fontSize: "10.5px",
              fontWeight: 800,
              cursor: isRefreshing ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              backdropFilter: "blur(4px)",
              transition: "all 0.2s ease"
            }}
          >
            <i className={"fa-solid fa-arrows-rotate " + (isRefreshing ? "fa-spin" : "")}></i>
            <span>{isRefreshing ? "Syncing..." : "Refresh"}</span>
          </button>
        </div>

        {/* ─── 4 PRO COMPACT KPI CARDS (2x2 Grid on Mobile) ─── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "8px",
          marginTop: "12px"
        }}>
          <div style={{ background: "rgba(255,255,255,0.06)", padding: "8px 10px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize: "9px", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>Registered</div>
            <div style={{ fontSize: "17px", fontWeight: 900, color: "#38bdf8", marginTop: "2px", lineHeight: 1 }}>
              {userList.length} <span style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 600 }}>Athletes</span>
            </div>
          </div>

          <div style={{ background: "rgba(16,185,129,0.08)", padding: "8px 10px", borderRadius: "10px", border: "1px solid rgba(16,185,129,0.2)" }}>
            <div style={{ fontSize: "9px", color: "#34d399", fontWeight: 700, textTransform: "uppercase" }}>Live Online</div>
            <div style={{ fontSize: "17px", fontWeight: 900, color: "#10b981", marginTop: "2px", display: "flex", alignItems: "center", gap: "5px", lineHeight: 1 }}>
              <span>{onlineUsers.length}</span>
              <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981" }}></span>
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.06)", padding: "8px 10px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize: "9px", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>Community Feed</div>
            <div style={{ fontSize: "17px", fontWeight: 900, color: "#f8fafc", marginTop: "2px", lineHeight: 1 }}>
              {posts.length} <span style={{ fontSize: "9.5px", color: hiddenPosts.length > 0 ? "#f59e0b" : "#94a3b8", fontWeight: 700 }}>({hiddenPosts.length} Hidden)</span>
            </div>
          </div>

          <div style={{ background: blockedUsers.length > 0 ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.06)", padding: "8px 10px", borderRadius: "10px", border: blockedUsers.length > 0 ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize: "9px", color: blockedUsers.length > 0 ? "#f87171" : "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>Security Flags</div>
            <div style={{ fontSize: "17px", fontWeight: 900, color: blockedUsers.length > 0 ? "#ef4444" : "#cbd5e1", marginTop: "2px", lineHeight: 1 }}>
              {blockedUsers.length} <span style={{ fontSize: "10px", fontWeight: 700 }}>Blocked</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. MAIN SUB-TAB SWITCHER (Single-line Compact Responsive) ─── */}
      <div style={{
        display: "flex",
        background: "#e2e8f0",
        padding: "3px",
        borderRadius: "12px",
        gap: "3px",
        marginBottom: "12px",
        boxSizing: "border-box"
      }}>
        <button
          type="button"
          onClick={() => handleSubTabChange("posts")}
          style={{
            flex: 1,
            padding: "8px 4px",
            borderRadius: "9px",
            border: "none",
            fontWeight: 800,
            fontSize: "clamp(10.5px, 2.7vw, 12px)",
            background: activeTab === "posts" ? "#ffffff" : "transparent",
            color: activeTab === "posts" ? "#0f172a" : "#64748b",
            boxShadow: activeTab === "posts" ? "0 2px 5px rgba(0,0,0,0.08)" : "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
            whiteSpace: "nowrap"
          }}
        >
          <i className="fa-solid fa-newspaper" style={{ color: activeTab === "posts" ? "#ef4444" : "inherit" }}></i>
          <span>Posts ({posts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => handleSubTabChange("users")}
          style={{
            flex: 1,
            padding: "8px 4px",
            borderRadius: "9px",
            border: "none",
            fontWeight: 800,
            fontSize: "clamp(10.5px, 2.7vw, 12px)",
            background: activeTab === "users" ? "#ffffff" : "transparent",
            color: activeTab === "users" ? "#0f172a" : "#64748b",
            boxShadow: activeTab === "users" ? "0 2px 5px rgba(0,0,0,0.08)" : "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
            whiteSpace: "nowrap"
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
            padding: "8px 4px",
            borderRadius: "9px",
            border: "none",
            fontWeight: 800,
            fontSize: "clamp(10.5px, 2.7vw, 12px)",
            background: activeTab === "vault" ? "#ffffff" : "transparent",
            color: activeTab === "vault" ? "#7c3aed" : "#64748b",
            boxShadow: activeTab === "vault" ? "0 2px 5px rgba(0,0,0,0.08)" : "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
            whiteSpace: "nowrap"
          }}
        >
          <i className="fa-solid fa-user-secret" style={{ color: activeTab === "vault" ? "#7c3aed" : "inherit" }}></i>
          <span>Dossier 🕵️‍♂️</span>
        </button>
      </div>

      {/* ─── 3. TAB CONTENT: POSTS & FEED ─── */}
      {activeTab === "posts" && (
        <div>
          <div style={{ position: "relative", marginBottom: "10px" }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: "absolute", left: "12px", top: "11px", color: "#94a3b8", fontSize: "12px" }}></i>
            <input
              type="text"
              placeholder="Search posts by caption, author, UID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px 9px 34px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                fontSize: "12px",
                outline: "none",
                background: "#ffffff",
                boxSizing: "border-box"
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{ position: "absolute", right: "10px", top: "7px", background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "13px" }}
              >
                ✕
              </button>
            )}
          </div>

          {filteredPosts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px 16px", background: "#ffffff", borderRadius: "14px", border: "1px dashed #cbd5e1", color: "#64748b" }}>
              <i className="fa-regular fa-folder-open" style={{ fontSize: "28px", color: "#cbd5e1", marginBottom: "6px" }}></i>
              <div style={{ fontSize: "12px", fontWeight: 700 }}>Walang posts na tumutugma sa filter.</div>
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
                      borderRadius: "14px",
                      padding: "12px 14px",
                      border: p.isHidden ? "1px solid #fcd34d" : "1px solid #e2e8f0",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.02)",
                      boxSizing: "border-box"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, flex: 1 }}>
                        <div style={{
                          width: "34px",
                          height: "34px",
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
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "12.5px", fontWeight: 800, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {p.userName || "Athlete"}
                            </span>
                            <span style={{ fontSize: "8.5px", background: "#f1f5f9", padding: "1px 5px", borderRadius: "5px", fontWeight: 700, color: "#475569" }}>
                              {p.visibility || "public"}
                            </span>
                            {p.isHidden && (
                              <span style={{ fontSize: "8.5px", background: "#f59e0b", color: "#fff", padding: "1px 5px", borderRadius: "5px", fontWeight: 800 }}>
                                HIDDEN
                              </span>
                            )}
                            {isBlocked && (
                              <span style={{ fontSize: "8.5px", background: "#ef4444", color: "#fff", padding: "1px 5px", borderRadius: "5px", fontWeight: 800 }}>
                                BLOCKED
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: "9.5px", color: "#94a3b8", marginTop: "1px" }}>
                            {formatAdminCreated(p.createdAt)}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "4px", flexShrink: 0, marginLeft: "6px" }}>
                        <button
                          type="button"
                          onClick={() => toggleHidePost(p.id, p.isHidden)}
                          style={{
                            background: p.isHidden ? "#10b981" : "#f59e0b",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "7px",
                            padding: "3px 7px",
                            fontSize: "9.5px",
                            fontWeight: 800,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "3px"
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
                            borderRadius: "7px",
                            padding: "3px 7px",
                            fontSize: "9.5px",
                            fontWeight: 800,
                            cursor: "pointer"
                          }}
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </div>

                    <div style={{ margin: "6px 0", fontSize: "12px", color: "#1e293b", wordBreak: "break-word" }}>
                      <ExpandableText text={p.text} maxChars={110} />
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
                          borderRadius: "8px",
                          overflow: "hidden",
                          maxHeight: "130px",
                          marginBottom: "6px",
                          background: "#0f172a",
                          cursor: "pointer",
                          position: "relative"
                        }}
                      >
                        <img src={p.imageUrl} alt="Attached Media" style={{ width: "100%", height: "130px", objectFit: "cover" }} />
                        <span style={{ position: "absolute", bottom: "4px", right: "4px", background: "rgba(0,0,0,0.65)", color: "#fff", fontSize: "8.5px", padding: "1px 5px", borderRadius: "4px", fontWeight: 700 }}>
                          Click to inspect
                        </span>
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "6px", paddingTop: "6px", borderTop: "1px solid #f1f5f9", fontSize: "9.5px", color: "#64748b" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                        <span>UID:</span>
                        <code style={{ background: "#f1f5f9", padding: "1px 4px", borderRadius: "4px", fontSize: "9px" }}>{p.userId?.slice(0, 8)}...</code>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(p.userId, "User ID")}
                          style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", padding: "0 2px" }}
                        >
                          <i className="fa-regular fa-copy"></i>
                        </button>
                      </div>

                      <div style={{ display: "flex", gap: "5px" }}>
                        <button
                          type="button"
                          onClick={() => author && startInvestigation(author)}
                          style={{
                            background: "#ede9fe",
                            color: "#7c3aed",
                            border: "none",
                            borderRadius: "6px",
                            padding: "2px 7px",
                            fontSize: "9.5px",
                            fontWeight: 800,
                            cursor: "pointer"
                          }}
                        >
                          🕵️‍♂️ Dossier
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleBlockUser(p.userId, isBlocked)}
                          style={{
                            background: isBlocked ? "#10b981" : "#ef4444",
                            color: "#fff",
                            border: "none",
                            borderRadius: "6px",
                            padding: "2px 7px",
                            fontSize: "9.5px",
                            fontWeight: 800,
                            cursor: "pointer"
                          }}
                        >
                          {isBlocked ? "Unblock" : "Block"}
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

      {/* ─── 4. TAB CONTENT: ATHLETES DIRECTORY (100% RESPONSIVE DUAL-ROW MOBILE CARDS) ─── */}
      {activeTab === "users" && (
        <div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
            <div style={{ position: "relative", flex: 1, minWidth: "180px" }}>
              <i className="fa-solid fa-magnifying-glass" style={{ position: "absolute", left: "12px", top: "10px", color: "#94a3b8", fontSize: "12px" }}></i>
              <input
                type="text"
                placeholder="Search athletes by name, email, UID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px 8px 32px",
                  borderRadius: "9px",
                  border: "1px solid #cbd5e1",
                  fontSize: "11.5px",
                  outline: "none",
                  background: "#ffffff",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "3px" }}>
              {["all", "online", "blocked"].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setUserFilter(f)}
                  style={{
                    padding: "5px 10px",
                    borderRadius: "7px",
                    border: "none",
                    fontWeight: 800,
                    fontSize: "10.5px",
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
            <div style={{ textAlign: "center", padding: "30px 16px", background: "#ffffff", borderRadius: "14px", border: "1px dashed #cbd5e1", color: "#64748b" }}>
              <i className="fa-solid fa-user-xmark" style={{ fontSize: "28px", color: "#cbd5e1", marginBottom: "6px" }}></i>
              <div style={{ fontSize: "12px", fontWeight: 700 }}>Walang athlete na tumugma sa criteria.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {filteredUsers.map(u => {
                // 🔍 SMART LAST ONLINE RESOLUTION
                const lastSeenRaw = parseMs(u.lastSeen);
                const loggedOutRaw = parseMs(u.lastLoggedOutAt);

                const isOnline = lastSeenRaw && lastSeenRaw > 1 && (now - lastSeenRaw < ONLINE_THRESHOLD);

                let effectiveLastOnline = null;
                if (lastSeenRaw && lastSeenRaw > 1) effectiveLastOnline = lastSeenRaw;
                if (loggedOutRaw && loggedOutRaw > (effectiveLastOnline || 0)) effectiveLastOnline = loggedOutRaw;

                if (!effectiveLastOnline) {
                  const userPosts = (posts || []).filter(p => p.userId === u.uid);
                  if (userPosts.length > 0) {
                    const sorted = [...userPosts].sort((a, b) => (parseMs(b.createdAt) || 0) - (parseMs(a.createdAt) || 0));
                    effectiveLastOnline = sorted[0]?.createdAt || null;
                  }
                }

                if (!effectiveLastOnline && u.createdAt) {
                  effectiveLastOnline = u.createdAt;
                }

                return (
                  <div
                    key={u.uid}
                    style={{
                      background: u.isBlocked ? "#fef2f2" : "#ffffff",
                      borderRadius: "14px",
                      padding: "12px 14px",
                      border: u.isBlocked ? "1px solid #fca5a5" : "1px solid #e2e8f0",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                      boxSizing: "border-box",
                      width: "100%"
                    }}
                  >
                    {/* 1. TOP ROW: AVATAR & FULL-WIDTH IDENTITY DETAILS (NO SQUISHING) */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", width: "100%" }}>
                      <div style={{ position: "relative", flexShrink: 0, marginTop: "2px" }}>
                        <div style={{
                          width: "38px",
                          height: "38px",
                          borderRadius: "50%",
                          background: u.avatarUrl ? "none" : "#e0e7ff",
                          overflow: "hidden",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 800,
                          color: "#4f46e5",
                          fontSize: "13px",
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
                            width: "11px",
                            height: "11px",
                            borderRadius: "50%",
                            background: "#10b981",
                            border: "2px solid #ffffff"
                          }}></span>
                        )}
                      </div>

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "13px", fontWeight: 900, color: "#0f172a" }}>
                            {u.userName || "Athlete"}
                          </span>
                          {isOnline ? (
                            <span style={{ fontSize: "8px", background: "#10b981", color: "#fff", padding: "1px 5px", borderRadius: "4px", fontWeight: 800 }}>
                              ONLINE
                            </span>
                          ) : (
                            <span style={{ fontSize: "8px", background: "#94a3b8", color: "#fff", padding: "1px 5px", borderRadius: "4px", fontWeight: 800 }}>
                              OFFLINE
                            </span>
                          )}
                          {u.isBlocked && (
                            <span style={{ fontSize: "8px", background: "#ef4444", color: "#fff", padding: "1px 5px", borderRadius: "4px", fontWeight: 800 }}>
                              BLOCKED
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: "10.5px", color: "#64748b", marginTop: "2px", wordBreak: "break-all" }}>
                          {u.userEmail || "No Email Provided"}
                        </div>

                        <div style={{ fontSize: "9.5px", color: "#94a3b8", marginTop: "3px", display: "flex", flexDirection: "column", gap: "1px" }}>
                          <div>Joined: {formatAdminCreated(u.createdAt)}</div>
                          <div>Last: <strong style={{ color: isOnline ? "#10b981" : "#475569" }}>{isOnline ? "Active Now" : formatAdminLastOnline(effectiveLastOnline, now)}</strong></div>
                        </div>
                      </div>
                    </div>

                    {/* 2. BOTTOM ROW: FULL-WIDTH CLEAN ACTION BAR (EASY TO TAP WITH THUMB) */}
                    <div style={{ display: "flex", gap: "8px", marginTop: "10px", paddingTop: "8px", borderTop: "1px solid #f1f5f9", width: "100%" }}>
                      <button
                        type="button"
                        onClick={() => startInvestigation(u)}
                        style={{
                          flex: 1,
                          background: "#f5f3ff",
                          color: "#7c3aed",
                          border: "1px solid #ddd6fe",
                          padding: "7px 10px",
                          borderRadius: "8px",
                          fontSize: "11px",
                          fontWeight: 800,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "5px"
                        }}
                      >
                        <i className="fa-solid fa-magnifying-glass-arrow-right"></i>
                        <span>Investigate</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleBlockUser(u.uid, u.isBlocked)}
                        style={{
                          flex: 1,
                          background: u.isBlocked ? "#10b981" : "#fee2e2",
                          color: u.isBlocked ? "#ffffff" : "#dc2626",
                          border: u.isBlocked ? "none" : "1px solid #fca5a5",
                          padding: "7px 10px",
                          borderRadius: "8px",
                          fontSize: "11px",
                          fontWeight: 800,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "5px"
                        }}
                      >
                        <i className={u.isBlocked ? "fa-solid fa-unlock" : "fa-solid fa-ban"}></i>
                        <span>{u.isBlocked ? "Unblock User" : "Block User"}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── 5. TAB CONTENT: FULL ATHLETE FORENSIC DOSSIER ─── */}
      {activeTab === "vault" && (
        <div>
          {/* Security & Compliance Banner */}
          <div style={{
            background: "linear-gradient(135deg, #3b0764 0%, #1e1b4b 100%)",
            color: "#ffffff",
            padding: "12px 14px",
            borderRadius: "14px",
            marginBottom: "12px",
            boxShadow: "0 6px 16px rgba(59, 7, 100, 0.3)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            boxSizing: "border-box"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                background: "rgba(239, 68, 68, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                flexShrink: 0
              }}>
                <i className="fa-solid fa-fingerprint" style={{ color: "#f87171", fontSize: "14px" }}></i>
              </div>
              <div>
                <div style={{ fontWeight: 900, fontSize: "13px", letterSpacing: "-0.2px" }}>
                  Athlete Forensic Dossier
                </div>
                <div style={{ fontSize: "10px", color: "#cbd5e1", marginTop: "1px" }}>
                  Pagsusuri sa pagkakakilanlan, mga post, at komunikasyon.
                </div>
              </div>
            </div>
          </div>

          {/* Select User Dropdown */}
          <div style={{ background: "#ffffff", padding: "12px 14px", borderRadius: "14px", border: "1px solid #e2e8f0", marginBottom: "12px", boxSizing: "border-box" }}>
            <label style={{ fontSize: "10.5px", fontWeight: 800, color: "#475569", display: "block", marginBottom: "5px", textTransform: "uppercase" }}>
              🎯 Pumili ng Account na Susuriin:
            </label>
            <select
              value={investigatingUser?.uid || ""}
              onChange={(e) => {
                const found = userList.find(u => u.uid === e.target.value);
                if (found) startInvestigation(found);
              }}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                fontSize: "11.5px",
                fontWeight: 700,
                outline: "none",
                background: "#f8fafc",
                color: "#0f172a",
                boxSizing: "border-box"
              }}
            >
              <option value="">-- Pumili mula sa Athletes ({userList.length}) --</option>
              {userList.map(u => (
                <option key={u.uid} value={u.uid}>
                  {u.userName || "Athlete"} ({u.userEmail || "No Email"}) {u.isBlocked ? "⛔ [BLOCKED]" : ""}
                </option>
              ))}
            </select>

            {/* Target Account Summary Banner */}
            {investigatingUser && (
              <div style={{
                marginTop: "10px",
                padding: "10px 12px",
                background: "#f1f5f9",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                boxSizing: "border-box"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: investigatingUser.avatarUrl ? "none" : "#e0e7ff",
                    overflow: "hidden",
                    border: "1px solid #cbd5e1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    color: "#4f46e5",
                    fontSize: "13px",
                    flexShrink: 0
                  }}>
                    {investigatingUser.avatarUrl ? (
                      <img src={investigatingUser.avatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      (investigatingUser.userName || "A").slice(0, 1).toUpperCase()
                    )}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: "12.5px", fontWeight: 900, color: "#0f172a" }}>
                      {investigatingUser.userName || "Athlete"}
                      {investigatingUser.isBlocked && (
                        <span style={{ marginLeft: "5px", fontSize: "8.5px", background: "#ef4444", color: "#fff", padding: "1px 5px", borderRadius: "4px", fontWeight: 800 }}>
                          BLOCKED
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "10px", color: "#64748b", wordBreak: "break-all" }}>
                      {investigatingUser.userEmail || "No Email"} • UID: <code>{investigatingUser.uid.slice(0, 10)}...</code>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "6px", marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #e2e8f0" }}>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(investigatingUser.uid, "User UID")}
                    style={{ flex: 1, background: "#e2e8f0", border: "none", color: "#334155", padding: "6px 8px", borderRadius: "7px", fontSize: "10.5px", fontWeight: 800, cursor: "pointer" }}
                  >
                    <i className="fa-regular fa-copy"></i> Copy UID
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleBlockUser(investigatingUser.uid, investigatingUser.isBlocked)}
                    style={{
                      flex: 1,
                      background: investigatingUser.isBlocked ? "#10b981" : "#ef4444",
                      color: "#ffffff",
                      border: "none",
                      padding: "6px 8px",
                      borderRadius: "7px",
                      fontSize: "10.5px",
                      fontWeight: 800,
                      cursor: "pointer"
                    }}
                  >
                    {investigatingUser.isBlocked ? "Unblock Account" : "⛔ Block Account"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 4-IN-1 FORENSIC DOSSIER TABS (2x2 Grid on Mobile) */}
          {investigatingUser ? (
            <div>
              {/* Internal Responsive Grid Switcher */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "6px", marginBottom: "12px" }}>
                {[
                  { id: "overview", label: "Identity & Footprint", icon: "fa-shield-halved" },
                  { id: "posts", label: "Posts History (" + posts.filter(p => p.userId === investigatingUser.uid).length + ")", icon: "fa-newspaper" },
                  { id: "chats", label: "Chat Vault (" + userChats.length + ")", icon: "fa-comments" },
                  { id: "health", label: "Health & Telemetry", icon: "fa-heart-pulse" }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setInvestigationTab(tab.id)}
                    style={{
                      padding: "7px 6px",
                      borderRadius: "9px",
                      border: "none",
                      fontSize: "clamp(10px, 2.7vw, 11px)",
                      fontWeight: 800,
                      cursor: "pointer",
                      background: investigationTab === tab.id ? "#1e293b" : "#e2e8f0",
                      color: investigationTab === tab.id ? "#ffffff" : "#475569",
                      boxShadow: investigationTab === tab.id ? "0 2px 5px rgba(0,0,0,0.12)" : "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "5px",
                      whiteSpace: "nowrap"
                    }}
                  >
                    <i className={"fa-solid " + tab.icon}></i>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* SECTION A: IDENTITY & DIGITAL FOOTPRINT */}
              {investigationTab === "overview" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "8px" }}>
                  <div style={{ background: "#ffffff", padding: "12px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: "9.5px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase" }}>Registration Date</div>
                    <div style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a", marginTop: "3px" }}>
                      {formatAdminCreated(investigatingUser.createdAt)}
                    </div>
                  </div>

                  <div style={{ background: "#ffffff", padding: "12px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: "9.5px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase" }}>Last Session</div>
                    <div style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a", marginTop: "3px" }}>
                      {formatAdminLastOnline(
                        investigatingUser.lastSeen > 1 ? investigatingUser.lastSeen : (investigatingUser.lastLoggedOutAt || investigatingUser.updatedAt),
                        now
                      )}
                    </div>
                  </div>

                  <div style={{ background: "#ffffff", padding: "12px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: "9.5px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase" }}>Posts Count</div>
                    <div style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a", marginTop: "3px" }}>
                      {posts.filter(p => p.userId === investigatingUser.uid).length} Posts Published
                    </div>
                  </div>

                  <div style={{ background: "#ffffff", padding: "12px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: "9.5px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase" }}>Permanent UID</div>
                    <div style={{ fontSize: "10px", fontWeight: 800, color: "#0f172a", marginTop: "3px", wordBreak: "break-all", fontFamily: "monospace" }}>
                      {investigatingUser.uid}
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION B: USER POSTS & CONTENT HISTORY */}
              {investigationTab === "posts" && (
                <div>
                  {(() => {
                    const userPosts = posts.filter(p => p.userId === investigatingUser.uid);
                    if (userPosts.length === 0) {
                      return (
                        <div style={{ textAlign: "center", padding: "26px", background: "#ffffff", borderRadius: "12px", border: "1px dashed #cbd5e1", color: "#64748b" }}>
                          <i className="fa-regular fa-newspaper" style={{ fontSize: "24px", color: "#cbd5e1", marginBottom: "6px" }}></i>
                          <div style={{ fontSize: "11.5px", fontWeight: 700 }}>Walang anumang naitalang post ang user na ito sa komunidad.</div>
                        </div>
                      );
                    }
                    return (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {userPosts.map(p => (
                          <div key={p.id} style={{ background: p.isHidden ? "#fffbeb" : "#ffffff", padding: "10px 12px", borderRadius: "12px", border: p.isHidden ? "1px solid #fcd34d" : "1px solid #e2e8f0" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "5px" }}>
                              <div>
                                <span style={{ fontSize: "9.5px", color: "#94a3b8" }}>{formatAdminCreated(p.createdAt)}</span>
                                {p.isHidden && (
                                  <span style={{ marginLeft: "5px", fontSize: "8.5px", background: "#f59e0b", color: "#fff", padding: "1px 5px", borderRadius: "4px", fontWeight: 800 }}>
                                    HIDDEN
                                  </span>
                                )}
                              </div>
                              <div style={{ display: "flex", gap: "4px" }}>
                                <button
                                  type="button"
                                  onClick={() => toggleHidePost(p.id, p.isHidden)}
                                  style={{ background: p.isHidden ? "#10b981" : "#f59e0b", color: "#fff", border: "none", borderRadius: "6px", padding: "2px 6px", fontSize: "9.5px", fontWeight: 800, cursor: "pointer" }}
                                >
                                  {p.isHidden ? "Unhide" : "Hide"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePostPermanently(p.id)}
                                  style={{ background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: "6px", padding: "2px 6px", fontSize: "9.5px", fontWeight: 800, cursor: "pointer" }}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                            <div style={{ fontSize: "11.5px", color: "#0f172a", marginBottom: "4px", wordBreak: "break-word" }}>
                              {p.text}
                            </div>
                            {p.imageUrl && (
                              <img src={p.imageUrl} alt="Attached" style={{ maxHeight: "110px", borderRadius: "7px", objectFit: "cover" }} />
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* SECTION C: CHAT VAULT */}
              {investigationTab === "chats" && (
                <div>
                  {isLoadingChats ? (
                    <div style={{ textAlign: "center", padding: "26px", color: "#64748b" }}>
                      <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "20px", color: "#7c3aed", marginBottom: "6px" }}></i>
                      <div style={{ fontSize: "11.5px", fontWeight: 700 }}>Kinukuha ang mga mensahe mula sa cloud database...</div>
                    </div>
                  ) : userChats.length > 0 ? (
                    <div style={{ display: "grid", gridTemplateColumns: activeChatThread ? "1fr 1fr" : "1fr", gap: "10px" }}>
                      <div style={{ background: "#ffffff", padding: "10px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                        <div style={{ fontSize: "10.5px", fontWeight: 800, color: "#64748b", marginBottom: "6px", textTransform: "uppercase" }}>
                          Chat Threads ({userChats.length})
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                          {userChats.map(c => {
                            const otherUid = c.participants?.find(p => p !== investigatingUser?.uid);
                            const otherUser = userList.find(u => u.uid === otherUid);
                            const isSelected = activeChatThread?.id === c.id;

                            return (
                              <div
                                key={c.id}
                                onClick={() => loadChatTranscript(c)}
                                style={{
                                  padding: "8px 10px",
                                  borderRadius: "9px",
                                  border: isSelected ? "1.5px solid #7c3aed" : "1px solid #e2e8f0",
                                  background: isSelected ? "#f5f3ff" : "#f8fafc",
                                  cursor: "pointer"
                                }}
                              >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <span style={{ fontSize: "11.5px", fontWeight: 800, color: "#0f172a" }}>
                                    {otherUser?.userName || "Athlete (" + (otherUid?.slice(0, 5) || "ID") + ")"}
                                  </span>
                                  <span style={{ fontSize: "8.5px", color: "#94a3b8" }}>
                                    {c.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : ""}
                                  </span>
                                </div>
                                <div style={{ fontSize: "10.5px", color: "#64748b", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {c.lastMessage || "(Walang text preview)"}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {activeChatThread && (
                        <div style={{ background: "#ffffff", padding: "12px", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "6px", borderBottom: "1px solid #f1f5f9", marginBottom: "8px" }}>
                            <span style={{ fontSize: "11.5px", fontWeight: 900, color: "#0f172a" }}>
                              Transcript Viewer
                            </span>
                            <button
                              type="button"
                              onClick={() => setActiveChatThread(null)}
                              style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "13px" }}
                            >
                              ✕
                            </button>
                          </div>

                          {isLoadingTranscript ? (
                            <div style={{ textAlign: "center", padding: "20px", color: "#64748b" }}>
                              <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "18px", color: "#7c3aed", marginBottom: "5px" }}></i>
                              <div style={{ fontSize: "10.5px" }}>Binubuksan ang transcript...</div>
                            </div>
                          ) : chatTranscript.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "16px", color: "#94a3b8", fontSize: "10.5px" }}>
                              Walang laman ang thread na ito.
                            </div>
                          ) : (
                            <div style={{ maxHeight: "300px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
                              {chatTranscript.map((m, idx) => {
                                const isTarget = m.senderUid === investigatingUser?.uid;
                                return (
                                  <div
                                    key={m.id || idx}
                                    style={{
                                      alignSelf: isTarget ? "flex-end" : "flex-start",
                                      maxWidth: "88%",
                                      background: isTarget ? "#ede9fe" : "#f1f5f9",
                                      border: isTarget ? "1px solid #ddd6fe" : "1px solid #e2e8f0",
                                      padding: "6px 10px",
                                      borderRadius: "10px"
                                    }}
                                  >
                                    <div style={{ display: "flex", justifyContent: "space-between", gap: "6px", fontSize: "8.5px", fontWeight: 800, color: isTarget ? "#6d28d9" : "#475569", marginBottom: "1px" }}>
                                      <span>{m.senderName || (isTarget ? investigatingUser.userName : "Partner")}</span>
                                      <span>{m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}</span>
                                    </div>
                                    <div style={{ fontSize: "11px", color: "#0f172a", wordBreak: "break-word" }}>
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
                  ) : (
                    <div style={{ textAlign: "center", padding: "26px", background: "#ffffff", borderRadius: "12px", border: "1px dashed #cbd5e1", color: "#64748b" }}>
                      <i className="fa-regular fa-comment-slash" style={{ fontSize: "24px", color: "#cbd5e1", marginBottom: "6px" }}></i>
                      <div style={{ fontSize: "11.5px", fontWeight: 700 }}>Walang naitalang personal chat ang account na ito sa cloud.</div>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION D: HEALTH & TELEMETRY */}
              {investigationTab === "health" && (
                <div style={{ background: "#ffffff", padding: "14px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "11.5px", fontWeight: 800, color: "#0f172a", marginBottom: "10px" }}>
                    Athlete Health Parameters & Stored Goals
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "8px" }}>
                    <div style={{ background: "#f8fafc", padding: "9px 10px", borderRadius: "9px", border: "1px solid #e2e8f0" }}>
                      <div style={{ fontSize: "9.5px", color: "#64748b", fontWeight: 700 }}>Starting Weight</div>
                      <div style={{ fontSize: "15px", fontWeight: 900, color: "#0f172a", marginTop: "2px" }}>
                        {investigatingUser.currentWeight || investigatingUser.weight || "N/A"} <span style={{ fontSize: "9.5px" }}>kg</span>
                      </div>
                    </div>
                    <div style={{ background: "#f8fafc", padding: "9px 10px", borderRadius: "9px", border: "1px solid #e2e8f0" }}>
                      <div style={{ fontSize: "9.5px", color: "#64748b", fontWeight: 700 }}>Target Goal Weight</div>
                      <div style={{ fontSize: "15px", fontWeight: 900, color: "#3b82f6", marginTop: "2px" }}>
                        {investigatingUser.targetWeight || "N/A"} <span style={{ fontSize: "9.5px" }}>kg</span>
                      </div>
                    </div>
                    <div style={{ background: "#f8fafc", padding: "9px 10px", borderRadius: "9px", border: "1px solid #e2e8f0" }}>
                      <div style={{ fontSize: "9.5px", color: "#64748b", fontWeight: 700 }}>Daily Calorie Target</div>
                      <div style={{ fontSize: "15px", fontWeight: 900, color: "#10b981", marginTop: "2px" }}>
                        {investigatingUser.dailyCalorieTarget || investigatingUser.calorieGoal || "N/A"} <span style={{ fontSize: "9.5px" }}>kcal</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "30px 16px", background: "#ffffff", borderRadius: "14px", border: "1px dashed #cbd5e1", color: "#64748b" }}>
              <i className="fa-solid fa-magnifying-glass-arrow-right" style={{ fontSize: "28px", color: "#cbd5e1", marginBottom: "8px" }}></i>
              <div style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a" }}>Walang Kasalukuyang Iniimbestigahan</div>
              <div style={{ fontSize: "10.5px", color: "#64748b", marginTop: "3px" }}>
                Pumili ng isang atleta sa dropdown menu sa itaas o pindutin ang <strong>Investigate</strong> sa Athletes list.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
