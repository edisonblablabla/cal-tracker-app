import React, { useState, useEffect, useMemo, useRef } from "react";
import { db } from "../services/firebase";
import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  increment
} from "firebase/firestore";

export default function CommunityTab({
  draftSocialPost,
  setDraftSocialPost,
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
  selectedPost,
  setSelectedPost,
  handleLike,
  setResonatePost,
  showToast,
  formatPostTime = (ts) => "Just now"
}) {
  const [activeSubTab, setActiveSubTab] = useState("leaderboard");
  const [leaderboardMetric, setLeaderboardMetric] = useState("distance");
  const [showComposer, setShowComposer] = useState(false);

  // DRAWERS & PANELS
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [showInboxDrawer, setShowInboxDrawer] = useState(false);
  const [showSearchDrawer, setShowSearchDrawer] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // CHAT & POST DETAILS
  const [activeChatPartner, setActiveChatPartner] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInputText, setChatInputText] = useState("");
  const [isSendingMsg, setIsSendingMsg] = useState(false);
  const [liveChats, setLiveChats] = useState([]);
  const chatMessagesEndRef = useRef(null);

  const [activeHuddlePost, setActiveHuddlePost] = useState(null);
  const [huddleComments, setHuddleComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // FULLSCREEN PHOTO LIGHTBOX
  const [viewingPhoto, setViewingPhoto] = useState(null);

  // COMMENT MANAGEMENT
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [activeCommentMenuId, setActiveCommentMenuId] = useState(null);

  const [dbUsers, setDbUsers] = useState([]);
  const isAdmin = user?.email && String(user.email).toLowerCase().includes("admin");

  // ==============================================================
  // 🧭 SINGLE-SOURCE-OF-TRUTH NAVIGATION & BACK BUTTON FLOWCHART
  // ==============================================================
  const openLayer = (layerName, openFn) => {
    try {
      window.history.pushState({ tab: "community", drawer: layerName }, "");
    } catch (e) {}
    openFn();
  };

  const closeCurrentLayer = () => {
    if (window.history.state?.drawer) {
      try {
        window.history.back();
        return;
      } catch (e) {}
    }
    // Fallback kung walang history state
    if (viewingPhoto) { setViewingPhoto(null); return; }
    if (activeChatPartner) { setActiveChatPartner(null); return; }
    setActiveHuddlePost(null);
    setShowInboxDrawer(false);
    setShowSearchDrawer(false);
    setShowNotifDrawer(false);
    if (typeof setSelectedPost === "function") setSelectedPost(null);
  };

  useEffect(() => {
    const handlePopState = (e) => {
      const drawer = e.state?.drawer;

      if (!drawer) {
        setViewingPhoto(null);
        setActiveChatPartner(null);
        setActiveHuddlePost(null);
        setShowInboxDrawer(false);
        setShowSearchDrawer(false);
        setShowNotifDrawer(false);
        setEditingCommentId(null);
        setActiveCommentMenuId(null);
        if (typeof setSelectedPost === "function") setSelectedPost(null);
        return;
      }

      if (drawer === "photo") {
        return;
      }

      if (drawer === "chat") {
        setViewingPhoto(null);
        setShowInboxDrawer(true);
        return;
      }

      if (drawer === "inbox") {
        setViewingPhoto(null);
        setActiveChatPartner(null);
        setShowInboxDrawer(true);
        return;
      }

      if (drawer === "huddle") {
        setViewingPhoto(null);
        return;
      }

      if (drawer === "search") {
        setViewingPhoto(null);
        setShowSearchDrawer(true);
        return;
      }

      if (drawer === "notif") {
        setViewingPhoto(null);
        setShowNotifDrawer(true);
        return;
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const hasAnyDrawerOpen = Boolean(viewingPhoto || activeHuddlePost || showNotifDrawer || showInboxDrawer || showSearchDrawer || activeChatPartner);

  // ─── 1. REALTIME FIRESTORE USERS SYNC ───
  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, "users"), (snap) => {
        const fetched = snap.docs.map(d => ({ uid: d.id, id: d.id, ...d.data() }));
        setDbUsers(fetched);
      }, (err) => console.error("Error fetching db users:", err));
      return () => unsub();
    } catch (e) { console.error(e); }
  }, []);

  const allAthletes = useMemo(() => {
    const map = new Map();
    (userList || []).forEach(u => {
      const id = u.uid || u.id;
      if (id) map.set(id, u);
    });
    dbUsers.forEach(u => {
      const id = u.uid || u.id;
      if (id) {
        const existing = map.get(id) || {};
        map.set(id, { ...existing, ...u });
      }
    });
    return Array.from(map.values()).filter(u => {
      const name = (u.userName || u.displayName || u.name || "").trim();
      return name && name.toLowerCase() !== "no data";
    });
  }, [userList, dbUsers]);

  const getAthlete = (uid, fallbackName = "") => {
    if (!uid) return { uid: "", name: fallbackName || "Athlete", photo: "", lastSeen: 0 };
    const found = allAthletes.find(u => (u.uid === uid || u.id === uid));
    if (found) {
      return {
        uid: found.uid || found.id,
        name: found.userName || found.displayName || found.name || fallbackName || "Athlete",
        photo: found.avatarUrl || found.photoURL || found.photo || found.userAvatar || "",
        lastSeen: found.lastSeen || 0
      };
    }
    return { uid, name: fallbackName || "Athlete", photo: "", lastSeen: 0 };
  };

  const getPartnerPresence = (partnerUid) => {
    if (!partnerUid) return { isOnline: false, text: "Offline", color: "#94a3b8" };
    const athlete = getAthlete(partnerUid);
    const lastSeen = athlete.lastSeen;

    if (!lastSeen || lastSeen === 1) return { isOnline: false, text: "Offline", color: "#94a3b8" };
    const diffMs = Date.now() - lastSeen;
    if (diffMs < 75000) return { isOnline: true, text: "Active now", color: "#10b981" };
    if (diffMs < 3600000) return { isOnline: false, text: "Active " + Math.floor(diffMs / 60000) + "m ago", color: "#64748b" };
    if (diffMs < 86400000) return { isOnline: false, text: "Active " + Math.floor(diffMs / 3600000) + "h ago", color: "#64748b" };
    return { isOnline: false, text: "Offline", color: "#94a3b8" };
  };

  // ─── 2. ROBUST AVATAR RENDERER (SUPPORTS BASE64, HTTP, HTTPS) ───
  const renderAvatar = (photoUrl, name = "Athlete", size = 34, border = "none") => {
    const pStr = typeof photoUrl === "string" ? photoUrl.trim() : "";
    const hasValidPhoto = pStr &&
      (pStr.startsWith("http://") || pStr.startsWith("https://") || pStr.startsWith("data:image/") || pStr.startsWith("blob:")) &&
      !pStr.includes("pravatar");

    if (hasValidPhoto) {
      return (
        <img
          src={pStr}
          alt={name}
          style={{ width: size + "px", height: size + "px", borderRadius: "50%", objectFit: "cover", border: border, flexShrink: 0 }}
        />
      );
    }
    const initial = (name || "A").trim().charAt(0).toUpperCase();
    return (
      <div
        style={{
          width: size + "px",
          height: size + "px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #4f46e5 0%, #38bdf8 100%)",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 900,
          fontSize: Math.round(size * 0.42) + "px",
          border: border,
          flexShrink: 0,
          textTransform: "uppercase"
        }}
      >
        {initial}
      </div>
    );
  };

    const handleOpenAthleteProfile = (targetUid, fallbackObj = null) => {
    if (!targetUid) return;
    if (targetUid === user?.uid) {
      setShowSearchDrawer(false);
      setSearchQuery("");
      if (typeof setSelectedVisitor === "function") setSelectedVisitor(null);
      if (typeof setActiveTab === "function") setActiveTab("profile");
      return;
    }
    const found = allAthletes.find(u => (u.uid === targetUid || u.id === targetUid || (fallbackObj && (u.uid === fallbackObj.uid || u.id === fallbackObj.id))));
    const finalName = found?.userName || found?.displayName || found?.name || fallbackObj?.userName || fallbackObj?.displayName || fallbackObj?.name || "Athlete";
    const finalPhoto = found?.avatarUrl || found?.photoURL || found?.photo || fallbackObj?.avatarUrl || fallbackObj?.photoURL || fallbackObj?.photo || "";
    const finalTitle = found?.userTitle || fallbackObj?.userTitle || "Fitness Enthusiast";
    const finalStreak = found?.streakDays || fallbackObj?.streakDays || fallbackObj?.streak || 1;
    const isPrivate = Boolean(found?.isPrivateAccount || fallbackObj?.isPrivateAccount);

    const athleteObj = {
      uid: targetUid,
      id: targetUid,
      userName: finalName,
      displayName: finalName,
      name: finalName,
      avatarUrl: finalPhoto,
      photoURL: finalPhoto,
      photo: finalPhoto,
      userTitle: finalTitle,
      streakDays: finalStreak,
      isPrivateAccount: isPrivate,
      boosting: found?.boosting || fallbackObj?.boosting || []
    };

    // Isara ang search drawer nang maayos nang hindi nagti-trigger ng history collision
    setShowSearchDrawer(false);
    setSearchQuery("");
    if (typeof setSelectedVisitor === "function") setSelectedVisitor(athleteObj);
    if (typeof setActivePanel === "function") setActivePanel("visitor_profile");
  };

  // ─── 3. DRAFT POST SYNC (NO AUTOFOCUS) ───
  useEffect(() => {
    if (draftSocialPost) {
      setActiveSubTab("feed");
      setShowComposer(true);
      if (typeof setPostText === "function") setPostText(draftSocialPost.caption || "");
      if (typeof setImagePreview === "function" && draftSocialPost.image) setImagePreview(draftSocialPost.image);
      if (typeof setDraftSocialPost === "function") setDraftSocialPost(null);
    }
  }, [draftSocialPost]);

  // ─── 4. REAL-TIME CHATS & MESSAGES ───
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, "chats"), where("participants", "array-contains", user.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      fetched.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      setLiveChats(fetched);
    }, (err) => console.error("Error fetching chats:", err));

    return () => unsub();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid || !activeChatPartner) {
      setChatMessages([]);
      return;
    }
    const otherUid = activeChatPartner.uid || activeChatPartner.id;
    const chatId = [user.uid, otherUid].sort().join("_");

    const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setChatMessages(msgs);
      setTimeout(() => chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }, (err) => console.error("Error fetching messages:", err));

    return () => unsub();
  }, [user?.uid, activeChatPartner]);

  // ─── 5. REAL-TIME COMMENTS LISTENER ───
  useEffect(() => {
    if (!activeHuddlePost?.id) {
      setHuddleComments([]);
      return;
    }
    const q = query(collection(db, "posts", activeHuddlePost.id, "comments"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setHuddleComments(list);
    }, (err) => console.error("Error fetching post comments:", err));

    return () => unsub();
  }, [activeHuddlePost?.id]);

  // ─── UNREAD BADGES ───
  const unreadMsgCount = useMemo(() => {
    const list = liveChats.length > 0 ? liveChats : inboxChats;
    if (!Array.isArray(list)) return 0;
    return list.filter(c => c.lastSenderUid !== user?.uid && (c.updatedAt || 0) > (lastSeenMsgTime || 0)).length;
  }, [liveChats, inboxChats, user?.uid, lastSeenMsgTime]);

  const unreadNotifCount = useMemo(() => {
    if (!Array.isArray(allUserNotifs)) return 0;
    return allUserNotifs.filter(n => (n.timestamp || 0) > (lastSeenNotifTime || 0)).length;
  }, [allUserNotifs, lastSeenNotifTime]);

  // ─── SEARCH RESULTS (ZERO KUNG WALANG QUERY) ───
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return allAthletes.filter(u => {
      const name = (u.userName || u.displayName || u.name || "").toLowerCase();
      const email = (u.userEmail || u.email || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [allAthletes, searchQuery]);

  // ─── LEADERBOARD DATA ───
  const sortedAthletes = useMemo(() => {
    let list = [...allAthletes];

    if (user && !list.some(u => (u.uid === user.uid || u.id === user.uid))) {
      list.push({
        uid: user.uid,
        id: user.uid,
        userName: appData?.userName || user.displayName || "You",
        avatarUrl: appData?.avatarUrl || avatarPreview || "",
        totalDistance: appData?.totalDistance || 0,
        todayBurnedCal: appData?.todayBurnedCal || 0,
        streakDays: appData?.streakDays || 1
      });
    }

    return list.map(u => {
      const uid = u.uid || u.id;
      const dist = Number(u.totalDistance || u.distanceKm || u.totalDistanceKm || (u.steps ? u.steps * 0.0008 : 0)) || 0;
      const cal = Number(u.todayBurnedCal || u.totalBurnedCalories || u.burnedCal || u.calories || (dist > 0 ? dist * 65 : 0)) || 0;
      const streak = Number(u.streakDays || u.streak || 1);
      const name = u.userName || u.displayName || u.name || "Athlete";
      const photo = u.avatarUrl || u.photoURL || u.photo || "";

      return {
        uid,
        name,
        photo,
        dist: Math.round(dist * 10) / 10,
        cal: Math.round(cal),
        streak,
        isCurrent: uid === user?.uid
      };
    }).sort((a, b) => {
      if (leaderboardMetric === "calories") return b.cal - a.cal;
      if (leaderboardMetric === "streak") return b.streak - a.streak;
      return b.dist - a.dist;
    });
  }, [allAthletes, user, appData, avatarPreview, leaderboardMetric]);

  const top1 = sortedAthletes[0] || null;
  const top2 = sortedAthletes[1] || null;
  const top3 = sortedAthletes[2] || null;
  const runnersUp = sortedAthletes.slice(3);

  const currentUserIndex = sortedAthletes.findIndex(u => u.isCurrent);
  const currentUserRank = currentUserIndex !== -1 ? currentUserIndex + 1 : sortedAthletes.length;
  const currentAthlete = sortedAthletes[currentUserIndex] || { dist: 0, cal: 0, streak: 0 };

  // ─── ACTIONS ───
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!chatInputText.trim() || !user?.uid || !activeChatPartner) return;

    setIsSendingMsg(true);
    const textToSend = chatInputText.trim();
    const otherUid = activeChatPartner.uid || activeChatPartner.id;
    const myName = appData?.userName || user.displayName || "Athlete";
    const myAvatar = appData?.avatarUrl || avatarPreview || "";
    const chatId = [user.uid, otherUid].sort().join("_");

    try {
      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: textToSend,
        senderUid: user.uid,
        senderName: myName,
        senderAvatar: myAvatar,
        createdAt: Date.now()
      });

      await setDoc(doc(db, "chats", chatId), {
        participants: [user.uid, otherUid],
        lastMessage: textToSend,
        lastSenderUid: user.uid,
        updatedAt: Date.now()
      }, { merge: true });

      await addDoc(collection(db, "notifications"), {
        recipientUid: otherUid,
        senderUid: user.uid,
        senderName: myName,
        senderAvatar: myAvatar,
        type: "chat",
        chatPartnerUid: user.uid,
        text: 'sent you a message: "' + textToSend.slice(0, 30) + '..."',
        timestamp: Date.now()
      });

      setChatInputText("");
    } catch (err) {
      console.error(err);
      if (showToast) showToast("Failed to send message.");
    } finally {
      setIsSendingMsg(false);
    }
  };

  const handleAddComment = async (e) => {
    if (e) e.preventDefault();
    if (!newCommentText.trim() || !activeHuddlePost?.id || !user) return;

    setIsSubmittingComment(true);
    const commentContent = newCommentText.trim();
    const myName = appData?.userName || user.displayName || "Athlete";
    const myAvatar = appData?.avatarUrl || avatarPreview || user?.photoURL || "";

    try {
      await addDoc(collection(db, "posts", activeHuddlePost.id, "comments"), {
        text: commentContent,
        userId: user.uid,
        userName: myName,
        userAvatar: myAvatar,
        createdAt: Date.now()
      });

      await updateDoc(doc(db, "posts", activeHuddlePost.id), {
        commentsCount: increment(1)
      });

      if (activeHuddlePost.userId && activeHuddlePost.userId !== user.uid) {
        await addDoc(collection(db, "notifications"), {
          recipientUid: activeHuddlePost.userId,
          senderUid: user.uid,
          senderName: myName,
          senderAvatar: myAvatar,
          type: "comment",
          postId: activeHuddlePost.id,
          text: 'commented: "' + commentContent.slice(0, 25) + '..."',
          timestamp: Date.now()
        });
      }

      setNewCommentText("");
      if (showToast) showToast("Comment posted! ⚡");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleSaveEditComment = async (commentId) => {
    if (!editingCommentText.trim() || !activeHuddlePost?.id) return;
    try {
      await updateDoc(doc(db, "posts", activeHuddlePost.id, "comments", commentId), {
        text: editingCommentText.trim(),
        isEdited: true,
        editedAt: Date.now()
      });
      setEditingCommentId(null);
      setEditingCommentText("");
      setActiveCommentMenuId(null);
      if (showToast) showToast("Comment updated! ⚡");
    } catch (err) {
      console.error(err);
      if (showToast) showToast("Failed to update comment.");
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!activeHuddlePost?.id) return;
    if (window.confirm("Delete this comment permanently?")) {
      try {
        await deleteDoc(doc(db, "posts", activeHuddlePost.id, "comments", commentId));
        await updateDoc(doc(db, "posts", activeHuddlePost.id), {
          commentsCount: increment(-1)
        });
        setActiveCommentMenuId(null);
        if (showToast) showToast("Comment deleted.");
      } catch (err) {
        console.error(err);
        if (showToast) showToast("Failed to delete comment.");
      }
    }
  };

  const triggerPulseBoost = (post) => {
    if (typeof handleLike === "function") {
      handleLike(post.id, post.likes || 0, post.likedBy || []);
    }
  };

  // FULL-BLEED MOBILE AT CENTERED TABLET DRAWER
  const getDrawerStyle = (isOpen) => ({
    position: "fixed",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: "100%",
    maxWidth: "480px",
    margin: "0 auto",
    height: "100dvh",
    backgroundColor: "#ffffff",
    zIndex: 4000,
    transform: isOpen ? "translateX(0)" : "translateX(105%)",
    visibility: isOpen ? "visible" : "hidden",
    pointerEvents: isOpen ? "auto" : "none",
    transition: "transform 0.28s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.28s",
    boxShadow: isOpen ? "-8px 0 28px rgba(15, 23, 42, 0.2)" : "none",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxSizing: "border-box"
  });

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh", paddingBottom: "90px", margin: 0, padding: 0, fontFamily: "sans-serif" }}>

      {/* 📌 1. COMBINED FIXED TOP BAR: BRAND HEADER + TAB SWITCHER */}
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        width: "100%",
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        boxShadow: "0 2px 10px rgba(15, 23, 42, 0.06)",
        zIndex: 2000,
        margin: 0,
        padding: 0,
        boxSizing: "border-box"
      }}>
        {/* Row 1: Brand & Action Controls */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "50px",
          padding: "0 16px",
          width: "100%",
          maxWidth: "480px",
          margin: "0 auto",
          boxSizing: "border-box"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            <div style={{
              width: "30px",
              height: "30px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #4f46e5 0%, #38bdf8 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 2px 6px rgba(79, 70, 229, 0.2)"
            }}>
              <i className="fa-solid fa-heart-pulse" style={{ color: "#ffffff", fontSize: "14px" }}></i>
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: "14.5px", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.2px", lineHeight: 1.1 }}>
                NUTRIPULSE
              </h1>
              <span style={{ fontSize: "8px", fontWeight: 800, color: "#0284c7", letterSpacing: "0.8px", display: "block" }}>
                COMMUNITY
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
            {/* 🔍 SEARCH */}
            <button
              type="button"
              onClick={() => openLayer("search", () => setShowSearchDrawer(true))}
              style={{ width: "32px", height: "32px", background: "none", border: "none", borderRadius: "8px", cursor: "pointer", color: "#334155", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
              title="Search Athletes"
            >
              <i className="fa-solid fa-magnifying-glass" style={{ fontSize: "15px" }}></i>
            </button>

            {/* 💬 MESSAGES */}
            <button
              type="button"
              onClick={() => openLayer("inbox", () => {
                setShowInboxDrawer(true);
                setActiveChatPartner(null);
                if (typeof setLastSeenMsgTime === "function") setLastSeenMsgTime(Date.now());
              })}
              style={{ width: "32px", height: "32px", background: "none", border: "none", borderRadius: "8px", cursor: "pointer", color: "#334155", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
              title="Huddle Messages"
            >
              <i className="fa-regular fa-comment-dots" style={{ fontSize: "16px" }}></i>
              {unreadMsgCount > 0 && (
                <span style={{ position: "absolute", top: "2px", right: "2px", background: "#ef4444", color: "#ffffff", fontSize: "8.5px", fontWeight: 800, minWidth: "14px", height: "14px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 2px" }}>
                  {unreadMsgCount > 9 ? "9+" : unreadMsgCount}
                </span>
              )}
            </button>

            {/* 🔔 NOTIFICATIONS */}
            <button
              type="button"
              onClick={() => openLayer("notif", () => {
                setShowNotifDrawer(true);
                if (typeof setLastSeenNotifTime === "function") setLastSeenNotifTime(Date.now());
              })}
              style={{ width: "32px", height: "32px", background: "none", border: "none", borderRadius: "8px", cursor: "pointer", color: "#334155", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
              title="Notifications"
            >
              <i className="fa-regular fa-bell" style={{ fontSize: "16px" }}></i>
              {unreadNotifCount > 0 && (
                <span style={{ position: "absolute", top: "3px", right: "3px", background: "#f43f5e", width: "7px", height: "7px", borderRadius: "50%", border: "1.5px solid #ffffff" }}></span>
              )}
            </button>

            {/* 👤 AVATAR */}
            <button
              type="button"
              onClick={() => handleOpenAthleteProfile(user?.uid)}
              style={{ width: "32px", height: "32px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
              title="My Profile"
            >
              {renderAvatar(appData?.avatarUrl || avatarPreview || user?.photoURL, appData?.userName || user?.displayName || "You", 28, "1.5px solid #38bdf8")}
            </button>
          </div>
        </div>

        {/* Row 2: Fixed Switcher */}
        <div style={{ padding: "0 16px 8px 16px", maxWidth: "480px", margin: "0 auto", boxSizing: "border-box" }}>
          <div style={{ display: "flex", background: "#f1f5f9", borderRadius: "10px", padding: "2.5px" }}>
            <button
              type="button"
              onClick={() => setActiveSubTab("leaderboard")}
              style={{
                flex: 1,
                padding: "7.5px 0",
                borderRadius: "8px",
                border: "none",
                fontWeight: 800,
                fontSize: "12px",
                cursor: "pointer",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "6px",
                background: activeSubTab === "leaderboard" ? "#ffffff" : "transparent",
                color: activeSubTab === "leaderboard" ? "#0f172a" : "#64748b",
                boxShadow: activeSubTab === "leaderboard" ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
                transition: "all 0.15s ease"
              }}
            >
              <i className="fa-solid fa-trophy" style={{ color: activeSubTab === "leaderboard" ? "#eab308" : "#94a3b8" }}></i>
              LEADERBOARD
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab("feed")}
              style={{
                flex: 1,
                padding: "7.5px 0",
                borderRadius: "8px",
                border: "none",
                fontWeight: 800,
                fontSize: "12px",
                cursor: "pointer",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "6px",
                background: activeSubTab === "feed" ? "#ffffff" : "transparent",
                color: activeSubTab === "feed" ? "#0f172a" : "#64748b",
                boxShadow: activeSubTab === "feed" ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
                transition: "all 0.15s ease"
              }}
            >
              <i className="fa-solid fa-bolt" style={{ color: activeSubTab === "feed" ? "#0284c7" : "#94a3b8" }}></i>
              PULSE FEED
            </button>
          </div>
        </div>
      </div>

      {/* ─── BODY WRAPPER ─── */}
      <div style={{ paddingTop: "104px", maxWidth: "480px", margin: "0 auto" }}>

        {/* 🏆 LEADERBOARD VIEW */}
        {activeSubTab === "leaderboard" && (
          <div style={{ padding: "0 16px" }}>
            <div style={{ display: "flex", gap: "8px", margin: "10px 0 16px 0", overflowX: "auto" }}>
              <button
                type="button"
                onClick={() => setLeaderboardMetric("distance")}
                style={{
                  background: leaderboardMetric === "distance" ? "#0f172a" : "#ffffff",
                  color: leaderboardMetric === "distance" ? "#ffffff" : "#475569",
                  border: "1px solid " + (leaderboardMetric === "distance" ? "#0f172a" : "#cbd5e1"),
                  padding: "6px 12px",
                  borderRadius: "20px",
                  fontSize: "11.5px",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px"
                }}
              >
                <i className="fa-solid fa-person-running" style={{ color: leaderboardMetric === "distance" ? "#38bdf8" : "#64748b" }}></i>
                Distance (KM)
              </button>

              <button
                type="button"
                onClick={() => setLeaderboardMetric("calories")}
                style={{
                  background: leaderboardMetric === "calories" ? "#0f172a" : "#ffffff",
                  color: leaderboardMetric === "calories" ? "#ffffff" : "#475569",
                  border: "1px solid " + (leaderboardMetric === "calories" ? "#0f172a" : "#cbd5e1"),
                  padding: "6px 12px",
                  borderRadius: "20px",
                  fontSize: "11.5px",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px"
                }}
              >
                <i className="fa-solid fa-fire" style={{ color: leaderboardMetric === "calories" ? "#f97316" : "#64748b" }}></i>
                Calories
              </button>

              <button
                type="button"
                onClick={() => setLeaderboardMetric("streak")}
                style={{
                  background: leaderboardMetric === "streak" ? "#0f172a" : "#ffffff",
                  color: leaderboardMetric === "streak" ? "#ffffff" : "#475569",
                  border: "1px solid " + (leaderboardMetric === "streak" ? "#0f172a" : "#cbd5e1"),
                  padding: "6px 12px",
                  borderRadius: "20px",
                  fontSize: "11.5px",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px"
                }}
              >
                <i className="fa-solid fa-bolt" style={{ color: leaderboardMetric === "streak" ? "#eab308" : "#64748b" }}></i>
                Streak
              </button>
            </div>

            {/* Podium */}
            {top1 && (
              <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-end",
                gap: "8px",
                margin: "18px 0 24px 0",
                padding: "8px 0"
              }}>
                {top2 ? (
                  <div
                    onClick={() => handleOpenAthleteProfile(top2.uid, top2)}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, maxWidth: "100px", cursor: "pointer" }}
                  >
                    {renderAvatar(top2.photo, top2.name, 48, "3px solid #94a3b8")}
                    <div style={{
                      background: "linear-gradient(180deg, #e2e8f0 0%, #cbd5e1 100%)",
                      width: "100%",
                      height: "75px",
                      borderTopLeftRadius: "10px",
                      borderTopRightRadius: "10px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: "-12px",
                      boxShadow: "0 4px 10px rgba(0,0,0,0.04)"
                    }}>
                      <span style={{ fontSize: "11px", fontWeight: 800, color: "#334155", maxWidth: "90%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {top2.name.split(" ")[0]}
                      </span>
                      <span style={{ fontSize: "13px", fontWeight: 900, color: "#0f172a" }}>
                        {leaderboardMetric === "distance" ? top2.dist + "k" : leaderboardMetric === "calories" ? top2.cal : top2.streak + "d"}
                      </span>
                      <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748b" }}>#2</span>
                    </div>
                  </div>
                ) : <div style={{ flex: 1, maxWidth: "100px" }} />}

                <div
                  onClick={() => handleOpenAthleteProfile(top1.uid, top1)}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1.1, maxWidth: "110px", cursor: "pointer" }}
                >
                  <i className="fa-solid fa-crown" style={{ color: "#eab308", fontSize: "18px", marginBottom: "2px", zIndex: 3 }}></i>
                  {renderAvatar(top1.photo, top1.name, 60, "3px solid #eab308")}
                  <div style={{
                    background: "linear-gradient(180deg, #fef08a 0%, #facc15 100%)",
                    width: "100%",
                    height: "95px",
                    borderTopLeftRadius: "12px",
                    borderTopRightRadius: "12px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: "-14px",
                    boxShadow: "0 4px 14px rgba(234, 179, 8, 0.25)"
                  }}>
                    <span style={{ fontSize: "12px", fontWeight: 900, color: "#713f12", maxWidth: "90%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {top1.name.split(" ")[0]}
                    </span>
                    <span style={{ fontSize: "15px", fontWeight: 900, color: "#422006" }}>
                      {leaderboardMetric === "distance" ? top1.dist + " km" : leaderboardMetric === "calories" ? top1.cal + " cal" : top1.streak + " days"}
                    </span>
                    <span style={{ fontSize: "11px", fontWeight: 900, color: "#854d0e" }}>👑 #1</span>
                  </div>
                </div>

                {top3 ? (
                  <div
                    onClick={() => handleOpenAthleteProfile(top3.uid, top3)}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, maxWidth: "100px", cursor: "pointer" }}
                  >
                    {renderAvatar(top3.photo, top3.name, 44, "3px solid #f97316")}
                    <div style={{
                      background: "linear-gradient(180deg, #fed7aa 0%, #fdba74 100%)",
                      width: "100%",
                      height: "65px",
                      borderTopLeftRadius: "10px",
                      borderTopRightRadius: "10px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: "-12px",
                      boxShadow: "0 4px 10px rgba(0,0,0,0.04)"
                    }}>
                      <span style={{ fontSize: "11px", fontWeight: 800, color: "#7c2d12", maxWidth: "90%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {top3.name.split(" ")[0]}
                      </span>
                      <span style={{ fontSize: "13px", fontWeight: 900, color: "#431407" }}>
                        {leaderboardMetric === "distance" ? top3.dist + "k" : leaderboardMetric === "calories" ? top3.cal : top3.streak + "d"}
                      </span>
                      <span style={{ fontSize: "10px", fontWeight: 800, color: "#9a3412" }}>#3</span>
                    </div>
                  </div>
                ) : <div style={{ flex: 1, maxWidth: "100px" }} />}
              </div>
            )}

            {/* Rankings List */}
            <div style={{ background: "#ffffff", borderRadius: "14px", padding: "6px 12px", border: "1px solid #f1f5f9", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
              {runnersUp.length > 0 ? (
                runnersUp.map((athlete, idx) => (
                  <div
                    key={athlete.uid || idx}
                    onClick={() => handleOpenAthleteProfile(athlete.uid, athlete)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "10px 4px",
                      borderBottom: idx !== runnersUp.length - 1 ? "1px solid #f1f5f9" : "none",
                      cursor: "pointer"
                    }}
                  >
                    <span style={{ width: "24px", fontWeight: 800, color: "#64748b", fontSize: "13px" }}>
                      {idx + 4}
                    </span>
                    <div style={{ margin: "0 10px" }}>
                      {renderAvatar(athlete.photo, athlete.name, 34)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {athlete.name} {athlete.isCurrent && <span style={{ color: "#0284c7", fontSize: "11px" }}>(You)</span>}
                      </div>
                    </div>
                    <div style={{ fontWeight: 900, color: "#0f172a", fontSize: "13px" }}>
                      {leaderboardMetric === "distance" ? athlete.dist.toFixed(1) + " km" : leaderboardMetric === "calories" ? athlete.cal + " cal" : athlete.streak + " days"}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: "center", padding: "20px 10px", color: "#94a3b8", fontSize: "12.5px" }}>
                  {sortedAthletes.length <= 3 ? "All active athletes are on the podium! ⚡" : "Log your runs to climb the leaderboard!"}
                </div>
              )}
            </div>

            {/* Sticky Rank Bar */}
            <div style={{
              position: "fixed",
              bottom: "65px",
              left: "14px",
              right: "14px",
              maxWidth: "452px",
              margin: "0 auto",
              background: "linear-gradient(90deg, #f0f9ff 0%, #e0f2fe 100%)",
              borderRadius: "12px",
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              border: "1px solid #bae6fd",
              boxShadow: "0 4px 14px rgba(56, 189, 248, 0.2)",
              zIndex: 90
            }}>
              <div style={{ marginRight: "10px" }}>
                {renderAvatar(appData?.avatarUrl || avatarPreview || user?.photoURL, appData?.userName || user?.displayName || "You", 36, "2px solid #38bdf8")}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", fontWeight: 900, color: "#0369a1" }}>
                  Your Rank: #{currentUserRank}
                </div>
                <div style={{ fontSize: "10.5px", fontWeight: 700, color: "#0284c7" }}>
                  Keep pushing your limits! ⚡
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "14px", fontWeight: 900, color: "#0f172a" }}>
                  {leaderboardMetric === "distance" ? currentAthlete.dist + " km" : leaderboardMetric === "calories" ? currentAthlete.cal + " cal" : currentAthlete.streak + " days"}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ⚡ PULSE FEED VIEW */}
        {activeSubTab === "feed" && (
          <div style={{ padding: "0 16px" }}>

            {/* Post Composer Card */}
            <div style={{ background: "#ffffff", borderRadius: "14px", padding: "14px", border: "1px solid #f1f5f9", boxShadow: "0 2px 6px rgba(0,0,0,0.02)", marginBottom: "16px" }}>
              <h3 style={{ margin: "0 0 8px 0", fontSize: "13.5px", fontWeight: 800, color: "#0f172a" }}>
                Share Athletic Activity
              </h3>

              {!showComposer ? (
                <div
                  onClick={() => setShowComposer(true)}
                  style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", background: "#f8fafc", padding: "10px 12px", borderRadius: "10px", border: "1px dashed #cbd5e1" }}
                >
                  {renderAvatar(appData?.avatarUrl || avatarPreview || user?.photoURL, appData?.userName || user?.displayName || "You", 28)}
                  <span style={{ color: "#94a3b8", fontSize: "12.5px", flex: 1 }}>
                    Share your latest sweat session... 🏃🚴
                  </span>
                  <i className="fa-solid fa-camera" style={{ color: "#4f46e5", fontSize: "16px" }}></i>
                </div>
              ) : (
                <div>
                  <textarea
                    value={postText || ""}
                    onChange={(e) => setPostText && setPostText(e.target.value)}
                    placeholder="Tell the squad about your run or workout..."
                    style={{
                      width: "100%",
                      minHeight: "75px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "10px",
                      padding: "10px",
                      fontSize: "13px",
                      outline: "none",
                      resize: "none",
                      fontFamily: "inherit",
                      boxSizing: "border-box"
                    }}
                  />

                  {imagePreview && (
                    <div style={{ position: "relative", marginTop: "8px", borderRadius: "10px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                      <img src={imagePreview} alt="Attached" style={{ width: "100%", maxHeight: "240px", objectFit: "contain", display: "block", background: "#0f172a" }} />
                      <button
                        type="button"
                        onClick={() => setImagePreview && setImagePreview(null)}
                        style={{
                          position: "absolute", top: "6px", right: "6px", background: "rgba(15,23,42,0.75)",
                          color: "#ffffff", border: "none", borderRadius: "50%", width: "24px", height: "24px",
                          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
                    <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", color: "#64748b", fontSize: "12px", fontWeight: 700 }}>
                      <i className="fa-solid fa-image" style={{ color: "#4f46e5", fontSize: "15px" }}></i>
                      <span>Photo</span>
                      <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
                    </label>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        type="button"
                        onClick={() => {
                          setShowComposer(false);
                          if (setPostText) setPostText("");
                          if (setImagePreview) setImagePreview(null);
                        }}
                        style={{ padding: "6px 12px", background: "transparent", color: "#64748b", border: "none", fontWeight: 700, borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={createPost}
                        disabled={isPublishing}
                        style={{
                          padding: "7px 16px",
                          background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                          color: "#ffffff",
                          border: "none",
                          fontWeight: 800,
                          borderRadius: "8px",
                          cursor: isPublishing ? "not-allowed" : "pointer",
                          fontSize: "12px",
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                          boxShadow: "0 2px 6px rgba(99,102,241,0.25)"
                        }}
                      >
                        {isPublishing ? "Publishing..." : "Post ⚡"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* TUNAY NA POSTS LIST */}
            {Array.isArray(publicCommunityPosts) && publicCommunityPosts.length > 0 ? (
              publicCommunityPosts.map((post) => {
                const isOwner = post.userId === user?.uid;
                const hasBoosted = Array.isArray(post.likedBy) ? post.likedBy.includes(user?.uid) : false;
                const boostCount = post.likes || 0;
                const commentsCount = post.commentsCount || 0;
                const authorInfo = getAthlete(post.userId, post.userName);

                return (
                  <div
                    key={post.id}
                    style={{
                      background: "#ffffff",
                      borderRadius: "14px",
                      padding: "14px",
                      border: "1px solid #f1f5f9",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                      marginBottom: "16px"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                      <div
                        style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
                        onClick={() => handleOpenAthleteProfile(post.userId, authorInfo)}
                      >
                        {renderAvatar(authorInfo.photo, authorInfo.name, 38, "2px solid #e2e8f0")}
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>
                            {authorInfo.name}
                          </div>
                          <div style={{ fontSize: "10.5px", color: "#94a3b8", fontWeight: 600 }}>
                            {formatPostTime(post.createdAt)}
                          </div>
                        </div>
                      </div>

                      {isOwner && (
                        <div style={{ position: "relative" }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (typeof setActiveMenuPostId === "function") {
                                setActiveMenuPostId(activeMenuPostId === post.id ? null : post.id);
                              }
                            }}
                            style={{ background: "none", border: "none", color: "#94a3b8", padding: "4px 8px", cursor: "pointer", fontSize: "14px" }}
                          >
                            <i className="fa-solid fa-ellipsis-vertical"></i>
                          </button>
                          {activeMenuPostId === post.id && (
                            <div style={{
                              position: "absolute", right: 0, top: "24px", background: "#ffffff",
                              borderRadius: "8px", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                              zIndex: 10, minWidth: "100px", overflow: "hidden"
                            }}>
                              {typeof openEditModal === "function" && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); openEditModal(post); }}
                                  style={{ width: "100%", padding: "8px 12px", border: "none", background: "none", textAlign: "left", fontSize: "12px", fontWeight: 700, color: "#334155", cursor: "pointer" }}
                                >
                                  Edit Post
                                </button>
                              )}
                              {typeof handleDeletePost === "function" && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleDeletePost(post.id); }}
                                  style={{ width: "100%", padding: "8px 12px", border: "none", background: "none", textAlign: "left", fontSize: "12px", fontWeight: 700, color: "#ef4444", cursor: "pointer" }}
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* TAP POST TEXT TO OPEN ACTIVITY HUDDLE */}
                    <div
                      onClick={() => openLayer("huddle", () => {
                        setActiveHuddlePost(post);
                        if (typeof setSelectedPost === "function") setSelectedPost(post);
                      })}
                      style={{ cursor: "pointer" }}
                    >
                      {post.text && (
                        <p style={{ fontSize: "13.5px", color: "#334155", lineHeight: "1.5", margin: "0 0 10px 0", whiteSpace: "pre-wrap" }}>
                          {post.text}
                        </p>
                      )}

                      {/* GPS Telemetry Ribbon */}
                      {(post.telemetry || post.distanceKm) && (
                        <div style={{
                          display: "flex",
                          justifyContent: "space-around",
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          borderRadius: "10px",
                          padding: "8px",
                          marginBottom: "10px"
                        }}>
                          <div style={{ textAlign: "center" }}>
                            <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748b", display: "block" }}>DISTANCE</span>
                            <span style={{ fontSize: "13px", fontWeight: 900, color: "#0f172a" }}>
                              {(post.telemetry?.distanceKm || post.distanceKm || 0).toFixed(2)} km
                            </span>
                          </div>
                          <div style={{ textAlign: "center" }}>
                            <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748b", display: "block" }}>TIME</span>
                            <span style={{ fontSize: "13px", fontWeight: 900, color: "#0f172a" }}>
                              {post.telemetry?.duration || post.duration || "--:--"}
                            </span>
                          </div>
                          <div style={{ textAlign: "center" }}>
                            <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748b", display: "block" }}>BURN</span>
                            <span style={{ fontSize: "13px", fontWeight: 900, color: "#f97316" }}>
                              +{post.telemetry?.calories || post.caloriesBurned || post.kcal || 0} cal
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* TAP IMAGE DIRECTLY TO OPEN FULLSCREEN PHOTO LIGHTBOX */}
                    {post.imageUrl && (
                      <div
                        onClick={() => openLayer("photo", () => setViewingPhoto(post.imageUrl))}
                        style={{ borderRadius: "10px", overflow: "hidden", marginBottom: "10px", border: "1px solid #f1f5f9", background: "#0b0f19", cursor: "zoom-in" }}
                        title="Tap to zoom full picture"
                      >
                        <img
                          src={post.imageUrl}
                          alt="Activity"
                          style={{ width: "100%", maxHeight: "360px", objectFit: "contain", display: "block", margin: "0 auto" }}
                        />
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f8fafc", paddingTop: "10px" }}>
                      <button
                        type="button"
                        onClick={() => triggerPulseBoost(post)}
                        style={{
                          background: hasBoosted ? "rgba(56, 189, 248, 0.12)" : "transparent",
                          border: "none",
                          color: hasBoosted ? "#0284c7" : "#64748b",
                          fontSize: "12.5px",
                          fontWeight: 800,
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                          cursor: "pointer",
                          padding: "5px 10px",
                          borderRadius: "8px"
                        }}
                      >
                        <i className="fa-solid fa-bolt" style={{ color: hasBoosted ? "#0284c7" : "#94a3b8" }}></i>
                        <span>Pulse Boost ({boostCount})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openLayer("huddle", () => {
                          setActiveHuddlePost(post);
                          if (typeof setSelectedPost === "function") setSelectedPost(post);
                        })}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#64748b",
                          fontSize: "12.5px",
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                          cursor: "pointer",
                          padding: "5px 10px"
                        }}
                      >
                        <i className="fa-regular fa-comment-dots"></i>
                        <span>Huddle ({commentsCount})</span>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
                <i className="fa-solid fa-shoe-prints" style={{ fontSize: "36px", marginBottom: "8px", color: "#cbd5e1" }}></i>
                <p style={{ fontWeight: 700, fontSize: "13px" }}>No community activities logged yet. Be the first to share!</p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ============================================================== */}
      {/* 💬 1. 1-ON-1 CHAT DRAWER                                       */}
      {/* ============================================================== */}
      <div style={getDrawerStyle(showInboxDrawer)}>
        <div style={{
          height: "54px",
          padding: "0 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #f1f5f9",
          backgroundColor: "#ffffff",
          flexShrink: 0
        }}>
          {activeChatPartner ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
              <div onClick={() => handleOpenAthleteProfile(activeChatPartner.uid || activeChatPartner.id, activeChatPartner)} style={{ cursor: "pointer" }}>
                {renderAvatar(activeChatPartner.photo || activeChatPartner.avatarUrl, activeChatPartner.name || activeChatPartner.userName, 32)}
              </div>
              <div style={{ minWidth: 0 }}>
                <h3
                  onClick={() => handleOpenAthleteProfile(activeChatPartner.uid || activeChatPartner.id, activeChatPartner)}
                  style={{ margin: 0, color: "#0f172a", fontSize: "14px", fontWeight: 900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "pointer" }}
                >
                  {activeChatPartner.name || activeChatPartner.userName}
                </h3>
                {(() => {
                  const partnerUid = activeChatPartner.uid || activeChatPartner.id;
                  const presence = getPartnerPresence(partnerUid);
                  return (
                    <span style={{ fontSize: "10px", color: presence.color, fontWeight: 700 }}>
                      ● {presence.text}
                    </span>
                  );
                })()}
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "7px", background: "rgba(99, 102, 241, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <i className="fa-solid fa-comment-dots" style={{ color: "#6366f1", fontSize: "13px" }}></i>
              </div>
              <h3 style={{ margin: 0, color: "#0f172a", fontSize: "15px", fontWeight: 900 }}>Huddle Messages</h3>
            </div>
          )}

          <button
            type="button"
            onClick={closeCurrentLayer}
            style={{ background: "#f1f5f9", border: "none", width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b", fontSize: "14px", fontWeight: 800 }}
          >
            ✕
          </button>
        </div>

        {activeChatPartner ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, backgroundColor: "#f8fafc" }}>
            <div style={{ flex: 1, overflowY: "auto", padding: "14px 12px", display: "flex", flexDirection: "column", gap: "10px", minHeight: 0 }}>
              {chatMessages.length > 0 ? (
                chatMessages.map((m, i) => {
                  const isMe = m.senderUid === user?.uid;
                  return (
                    <div
                      key={m.id || i}
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
                        {m.text}
                      </div>
                      <span style={{ fontSize: "9.5px", color: "#94a3b8", marginTop: "3px", padding: "0 2px" }}>
                        {formatPostTime(m.createdAt)}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
                  <i className="fa-regular fa-comment-dots" style={{ fontSize: "32px", color: "#cbd5e1", marginBottom: "8px" }}></i>
                  <p style={{ fontSize: "12.5px", margin: 0 }}>Send a message to start chatting with {activeChatPartner.name || activeChatPartner.userName}!</p>
                </div>
              )}
              <div ref={chatMessagesEndRef} />
            </div>

            <form
              onSubmit={handleSendMessage}
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
                value={chatInputText}
                onChange={(e) => setChatInputText(e.target.value)}
                placeholder={"Message " + (activeChatPartner.name || activeChatPartner.userName) + "..."}
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
                disabled={!chatInputText.trim() || isSendingMsg}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  border: "none",
                  background: chatInputText.trim() ? "linear-gradient(135deg, #4f46e5 0%, #38bdf8 100%)" : "#e2e8f0",
                  color: chatInputText.trim() ? "#ffffff" : "#94a3b8",
                  cursor: chatInputText.trim() ? "pointer" : "default",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: chatInputText.trim() ? "0 2px 6px rgba(79, 70, 229, 0.3)" : "none"
                }}
              >
                <i className="fa-solid fa-paper-plane" style={{ fontSize: "14px" }}></i>
              </button>
            </form>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div style={{
              padding: "8px 18px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#f8fafc",
              borderBottom: "1px solid #f1f5f9",
              flexShrink: 0
            }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b" }}>Active Conversations</span>
              <button
                type="button"
                onClick={() => {
                  setShowInboxDrawer(false);
                  openLayer("search", () => setShowSearchDrawer(true));
                }}
                style={{ background: "none", border: "none", color: "#0284c7", fontSize: "11px", fontWeight: 800, cursor: "pointer", padding: 0 }}
              >
                + New Chat
              </button>
            </div>

            <div style={{ padding: "12px 14px", flex: 1 }}>
              {liveChats.length > 0 ? (
                liveChats.map((chat) => {
                  const otherUid = (chat.participants || []).find(p => p !== user?.uid);
                  const recipient = getAthlete(otherUid);

                  return (
                    <div
                      key={chat.id}
                      onClick={() => openLayer("chat", () => setActiveChatPartner(recipient))}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "11px 12px",
                        borderRadius: "12px",
                        background: "#ffffff",
                        border: "1px solid #f1f5f9",
                        marginBottom: "8px",
                        cursor: "pointer",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                      }}
                    >
                      {renderAvatar(recipient.photo, recipient.name, 36)}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a" }}>
                          {recipient.name}
                        </div>
                        <div style={{ fontSize: "11.5px", color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {chat.lastMessage || "Tap to chat..."}
                        </div>
                      </div>
                      <i className="fa-solid fa-chevron-right" style={{ color: "#cbd5e1", fontSize: "11px" }}></i>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: "center", padding: "50px 20px", color: "#94a3b8" }}>
                  <i className="fa-solid fa-comments" style={{ fontSize: "38px", color: "#cbd5e1", marginBottom: "12px" }}></i>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>No active huddles yet</div>
                  <p style={{ fontSize: "12px", color: "#64748b", marginTop: "4px", marginBottom: "16px" }}>
                    Connect with athletes to start chatting!
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowInboxDrawer(false);
                      openLayer("search", () => setShowSearchDrawer(true));
                    }}
                    style={{
                      padding: "8px 16px",
                      background: "linear-gradient(135deg, #4f46e5 0%, #38bdf8 100%)",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: 800,
                      cursor: "pointer"
                    }}
                  >
                    Find Athletes 🔍
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 🔍 2. SEARCH ATHLETES DRAWER                                   */}
      {/* ============================================================== */}
      <div style={getDrawerStyle(showSearchDrawer)}>
        <div style={{ height: "54px", padding: "0 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", backgroundColor: "#ffffff", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "7px", background: "rgba(56, 189, 248, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="fa-solid fa-magnifying-glass" style={{ color: "#0284c7", fontSize: "13px" }}></i>
            </div>
            <h3 style={{ margin: 0, color: "#0f172a", fontSize: "15px", fontWeight: 900 }}>Search Athletes</h3>
          </div>
          <button
            type="button"
            onClick={closeCurrentLayer}
            style={{ background: "#f1f5f9", border: "none", width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b", fontSize: "14px", fontWeight: 800 }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#f8fafc", borderRadius: "10px", padding: "8px 12px", border: "1px solid #e2e8f0" }}>
            <i className="fa-solid fa-magnifying-glass" style={{ color: "#94a3b8", fontSize: "13px" }}></i>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search runners by name or email..."
              style={{ border: "none", background: "transparent", outline: "none", width: "100%", fontSize: "13px", fontFamily: "inherit", color: "#0f172a" }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 0 }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", minHeight: 0 }}>
          {!searchQuery.trim() ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
              <i className="fa-solid fa-magnifying-glass" style={{ fontSize: "38px", color: "#cbd5e1", marginBottom: "12px", display: "block" }}></i>
              <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>Find Athletes</div>
              <p style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                Type an athlete's name above to view their passport or start a chat!
              </p>
            </div>
          ) : searchResults.length > 0 ? (
            searchResults.map((athlete, idx) => {
              const aName = athlete.userName || athlete.displayName || athlete.name || "Athlete";
              const aPhoto = athlete.avatarUrl || athlete.photoURL || athlete.photo || "";
              const aUid = athlete.uid || athlete.id;
              const isMe = aUid === user?.uid;

              return (
                <div
                  key={aUid || idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    borderRadius: "12px",
                    background: "#ffffff",
                    border: "1px solid #f1f5f9",
                    marginBottom: "8px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                  }}
                >
                  <div
                    onClick={() => handleOpenAthleteProfile(aUid, athlete)}
                    style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1, cursor: "pointer" }}
                  >
                    {renderAvatar(aPhoto, aName, 36)}
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {aName} {isMe && <span style={{ color: "#0284c7", fontSize: "10.5px" }}>(You)</span>}
                      </div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>
                        NutriPulse Member
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "6px", flexShrink: 0, marginLeft: "8px" }}>
                    {!isMe && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowSearchDrawer(false);
                          openLayer("chat", () => {
                            setActiveChatPartner({ uid: aUid, id: aUid, userName: aName, avatarUrl: aPhoto });
                            setShowInboxDrawer(true);
                          });
                        }}
                        style={{
                          background: "#f0f9ff",
                          border: "1px solid #bae6fd",
                          borderRadius: "8px",
                          padding: "6px 10px",
                          color: "#0284c7",
                          cursor: "pointer",
                          fontSize: "11.5px",
                          fontWeight: 800,
                          display: "flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                        title="Direct Message"
                      >
                        <i className="fa-solid fa-comment-dots"></i>
                        <span>Chat</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenAthleteProfile(aUid, athlete)}
                      style={{
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        padding: "6px 10px",
                        color: "#475569",
                        cursor: "pointer",
                        fontSize: "11.5px",
                        fontWeight: 700
                      }}
                      title="View Profile"
                    >
                      <i className="fa-regular fa-user"></i>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8", fontSize: "13px" }}>
              No athletes found matching "{searchQuery}"
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 🔔 3. NOTIFICATIONS DRAWER                                     */}
      {/* ============================================================== */}
      <div style={getDrawerStyle(showNotifDrawer)}>
        <div style={{ height: "54px", padding: "0 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", backgroundColor: "#ffffff", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "7px", background: "rgba(239, 68, 68, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="fa-solid fa-bell" style={{ color: "#ef4444", fontSize: "13px" }}></i>
            </div>
            <h3 style={{ margin: 0, color: "#0f172a", fontSize: "15px", fontWeight: 900 }}>Notifications</h3>
          </div>
          <button
            type="button"
            onClick={closeCurrentLayer}
            style={{ background: "#f1f5f9", border: "none", width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b", fontSize: "14px", fontWeight: 800 }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: "8px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b" }}>Recent Activity & Boosts</span>
          <button
            type="button"
            onClick={() => {
              if (typeof setLastSeenNotifTime === "function") setLastSeenNotifTime(Date.now());
              if (showToast) showToast("All notifications marked as read!");
            }}
            style={{ background: "none", border: "none", color: "#0284c7", fontSize: "11px", fontWeight: 800, cursor: "pointer", padding: 0 }}
          >
            Mark all read
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", minHeight: 0 }}>
          {Array.isArray(allUserNotifs) && allUserNotifs.length > 0 ? (
            allUserNotifs.map((notif, idx) => {
              const isUnread = (notif.timestamp || 0) > (lastSeenNotifTime || 0);
              const sender = getAthlete(notif.senderUid || notif.uid, notif.senderName || notif.title);

              return (
                <div
                  key={notif.id || idx}
                  onClick={() => {
                    if (notif.postId && Array.isArray(publicCommunityPosts)) {
                      const targetPost = publicCommunityPosts.find(p => p.id === notif.postId);
                      if (targetPost) {
                        setShowNotifDrawer(false);
                        openLayer("huddle", () => {
                          setActiveHuddlePost(targetPost);
                        });
                      } else if (showToast) {
                        showToast("Post may have been removed.");
                      }
                    } else if (notif.type === "chat" || notif.chatPartnerUid) {
                      const partnerUid = notif.chatPartnerUid || notif.senderUid;
                      const partner = getAthlete(partnerUid);
                      setShowNotifDrawer(false);
                      openLayer("chat", () => {
                        setActiveChatPartner({ uid: partnerUid, userName: partner.name, avatarUrl: partner.photo });
                        setShowInboxDrawer(true);
                      });
                    }
                  }}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    padding: "11px 12px",
                    borderRadius: "12px",
                    background: isUnread ? "#f0f9ff" : "#ffffff",
                    border: "1px solid " + (isUnread ? "#bae6fd" : "#f1f5f9"),
                    marginBottom: "8px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                    cursor: (notif.postId || notif.chatPartnerUid) ? "pointer" : "default"
                  }}
                >
                  <div style={{ marginTop: "2px" }}>
                    {renderAvatar(notif.senderAvatar || sender.photo, sender.name, 34)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: "0 0 4px 0", fontSize: "12.5px", color: "#0f172a", lineHeight: 1.4, fontWeight: isUnread ? 700 : 500 }}>
                      <span style={{ fontWeight: 800 }}>{sender.name}</span>{" "}
                      {notif.text || notif.message || "interacted with your profile"}
                    </p>
                    <span style={{ fontSize: "10.5px", color: "#94a3b8", fontWeight: 600 }}>
                      {formatPostTime(notif.timestamp)}
                    </span>
                  </div>
                  {isUnread && (
                    <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#0284c7", flexShrink: 0, marginTop: "6px" }}></div>
                  )}
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8", fontSize: "13px" }}>
              No new notifications yet.
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 💬 4. POST HUDDLE (COMMENTS & DETAIL) DRAWER                   */}
      {/* ============================================================== */}
      <div style={getDrawerStyle(Boolean(activeHuddlePost))}>
        <div style={{ height: "54px", padding: "0 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", backgroundColor: "#ffffff", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "7px", background: "rgba(16, 185, 129, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="fa-solid fa-comments" style={{ color: "#10b981", fontSize: "13px" }}></i>
            </div>
            <h3 style={{ margin: 0, color: "#0f172a", fontSize: "15px", fontWeight: 900 }}>Activity Huddle</h3>
          </div>
          <button
            type="button"
            onClick={closeCurrentLayer}
            style={{ background: "#f1f5f9", border: "none", width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b", fontSize: "14px", fontWeight: 800 }}
          >
            ✕
          </button>
        </div>

        {activeHuddlePost && (() => {
          const author = getAthlete(activeHuddlePost.userId, activeHuddlePost.userName);
          return (
            <div style={{ padding: "14px 16px", background: "#f8fafc", borderBottom: "1px solid #f1f5f9", flexShrink: 0, maxHeight: "55vh", overflowY: "auto" }}>
              <div
                onClick={() => handleOpenAthleteProfile(activeHuddlePost.userId, author)}
                style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", cursor: "pointer" }}
              >
                {renderAvatar(author.photo, author.name, 32)}
                <div>
                  <span style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a", display: "block" }}>
                    {author.name}
                  </span>
                  <span style={{ fontSize: "10px", color: "#94a3b8" }}>
                    {formatPostTime(activeHuddlePost.createdAt)}
                  </span>
                </div>
              </div>

              {activeHuddlePost.text && (
                <p style={{ margin: "0 0 10px 0", fontSize: "13px", color: "#334155", lineHeight: 1.45, whiteSpace: "pre-wrap" }}>
                  {activeHuddlePost.text}
                </p>
              )}

              {/* TAP POST IMAGE TO ZOOM IN FULLSCREEN LIGHTBOX */}
              {activeHuddlePost.imageUrl && (
                <div
                  onClick={() => openLayer("photo", () => setViewingPhoto(activeHuddlePost.imageUrl))}
                  style={{ borderRadius: "10px", overflow: "hidden", border: "1px solid #e2e8f0", background: "#0b0f19", marginBottom: "8px", cursor: "zoom-in" }}
                  title="Tap to zoom picture"
                >
                  <img
                    src={activeHuddlePost.imageUrl}
                    alt="Activity Graphic"
                    style={{ width: "100%", maxHeight: "360px", objectFit: "contain", display: "block", margin: "0 auto" }}
                  />
                </div>
              )}
            </div>
          );
        })()}

        {/* Realtime Comments List with Avatar Resolution & Inline Edit/Delete */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px", minHeight: 0 }}>
          {huddleComments.length > 0 ? (
            huddleComments.map((c, i) => {
              const commenter = getAthlete(c.userId || c.uid, c.userName || c.name);
              const commenterAvatar = commenter.photo || c.userAvatar || c.avatarUrl || "";
              const isCommentOwner = c.userId === user?.uid;
              const canManage = isCommentOwner || isAdmin;
              const isCurrentlyEditing = editingCommentId === c.id;

              return (
                <div key={c.id || i} style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: "12px", border: "1px solid #f1f5f9", marginBottom: "10px", position: "relative" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                    <div
                      onClick={() => handleOpenAthleteProfile(c.userId || c.uid, commenter)}
                      style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
                    >
                      {renderAvatar(commenterAvatar, commenter.name, 28)}
                      <div>
                        <span style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a" }}>{commenter.name}</span>
                        {c.isEdited && <span style={{ fontSize: "8.5px", color: "#94a3b8", fontStyle: "italic", marginLeft: "4px" }}>(edited)</span>}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "9.5px", color: "#94a3b8" }}>{formatPostTime(c.createdAt)}</span>
                      {canManage && (
                        <div style={{ position: "relative" }}>
                          <button
                            type="button"
                            onClick={() => setActiveCommentMenuId(activeCommentMenuId === c.id ? null : c.id)}
                            style={{ background: "none", border: "none", color: "#94a3b8", padding: "2px 5px", cursor: "pointer", fontSize: "13px" }}
                          >
                            <i className="fa-solid fa-ellipsis-vertical"></i>
                          </button>

                          {activeCommentMenuId === c.id && (
                            <div style={{
                              position: "absolute",
                              right: 0,
                              top: "20px",
                              background: "#ffffff",
                              border: "1px solid #e2e8f0",
                              borderRadius: "10px",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                              zIndex: 100,
                              minWidth: "100px",
                              overflow: "hidden"
                            }}>
                              {isCommentOwner && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCommentId(c.id);
                                    setEditingCommentText(c.text);
                                    setActiveCommentMenuId(null);
                                  }}
                                  style={{ width: "100%", padding: "7px 10px", background: "none", border: "none", textAlign: "left", fontSize: "11.5px", fontWeight: 700, color: "#334155", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                                >
                                  <i className="fa-solid fa-pen" style={{ color: "#0284c7" }}></i> Edit
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteComment(c.id)}
                                style={{ width: "100%", padding: "7px 10px", background: "none", border: "none", textAlign: "left", fontSize: "11.5px", fontWeight: 700, color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                              >
                                <i className="fa-solid fa-trash"></i> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {isCurrentlyEditing ? (
                    <div style={{ marginTop: "6px" }}>
                      <input
                        type="text"
                        value={editingCommentText}
                        onChange={(e) => setEditingCommentText(e.target.value)}
                        style={{ width: "100%", padding: "7px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px", outline: "none", boxSizing: "border-box" }}
                      />
                      <div style={{ display: "flex", gap: "6px", marginTop: "6px", justifyContent: "flex-end" }}>
                        <button
                          type="button"
                          onClick={() => setEditingCommentId(null)}
                          style={{ padding: "4px 8px", background: "#f1f5f9", border: "none", borderRadius: "6px", fontSize: "10.5px", fontWeight: 700, color: "#64748b", cursor: "pointer" }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEditComment(c.id)}
                          style={{ padding: "4px 10px", background: "#0284c7", border: "none", borderRadius: "6px", fontSize: "10.5px", fontWeight: 800, color: "#ffffff", cursor: "pointer" }}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p style={{ margin: "4px 0 0 36px", fontSize: "12.5px", color: "#334155", lineHeight: 1.4, wordBreak: "break-word" }}>
                      {c.text}
                    </p>
                  )}
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8", fontSize: "12.5px" }}>
              No comments in this huddle yet. Send some energy! ⚡
            </div>
          )}
        </div>

        {/* Comment Send Box */}
        <form
          onSubmit={handleAddComment}
          style={{ padding: "10px 14px 14px 14px", borderTop: "1px solid #f1f5f9", backgroundColor: "#ffffff", display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}
        >
          <input
            type="text"
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder="Cheer or reply to huddle..."
            style={{ flex: 1, padding: "10px 14px", borderRadius: "20px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none", backgroundColor: "#f8fafc", fontFamily: "inherit" }}
          />
          <button
            type="submit"
            disabled={!newCommentText.trim() || isSubmittingComment}
            style={{
              padding: "9px 15px",
              borderRadius: "20px",
              border: "none",
              background: newCommentText.trim() ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "#e2e8f0",
              color: newCommentText.trim() ? "#ffffff" : "#94a3b8",
              fontSize: "12px",
              fontWeight: 800,
              cursor: newCommentText.trim() ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}
          >
            <span>{isSubmittingComment ? "..." : "Send"}</span>
            <i className="fa-solid fa-paper-plane" style={{ fontSize: "11px" }}></i>
          </button>
        </form>
      </div>

      {/* ============================================================== */}
      {/* 🖼️ 5. FULLSCREEN PHOTO LIGHTBOX VIEWER                         */}
      {/* ============================================================== */}
      {viewingPhoto && (
        <div
          onClick={closeCurrentLayer}
          style={{
            position: "fixed",
            inset: 0,
            width: "100vw",
            height: "100dvh",
            backgroundColor: "rgba(0, 0, 0, 0.94)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            boxSizing: "border-box",
            backdropFilter: "blur(6px)"
          }}
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); closeCurrentLayer(); }}
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              background: "rgba(255, 255, 255, 0.2)",
              border: "none",
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              color: "#ffffff",
              fontSize: "18px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 100000
            }}
          >
            ✕
          </button>
          <img
            src={viewingPhoto}
            alt="Full Photo"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "100%",
              maxHeight: "92dvh",
              objectFit: "contain",
              display: "block",
              margin: "0 auto",
              borderRadius: "8px",
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.6)"
            }}
          />
        </div>
      )}

      {/* 🌑 UNIVERSAL BACKDROP OVERLAY */}
      {hasAnyDrawerOpen && !viewingPhoto && (
        <div
          onClick={closeCurrentLayer}
          style={{
            position: "fixed",
            inset: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            zIndex: 3999,
            backdropFilter: "blur(4px)"
          }}
        />
      )}

    </div>
  );
}
