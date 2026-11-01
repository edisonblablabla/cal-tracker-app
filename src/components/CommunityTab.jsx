import React, { useState, useEffect, useMemo } from "react";

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
  // ─── TABS & SLIDE-OVER STATE ───
  const [activeSubTab, setActiveSubTab] = useState("leaderboard"); // 'leaderboard' o 'feed'
  const [leaderboardMetric, setLeaderboardMetric] = useState("distance"); // 'distance', 'calories', 'streak'
  const [showComposer, setShowComposer] = useState(false);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);

  // ─── HELPER: MALINIS NA AVATAR RENDERER (WALANG PRAVATAR) ───
  const renderAvatar = (photoUrl, name = "Athlete", size = 34, border = "none") => {
    const hasValidPhoto = photoUrl && typeof photoUrl === "string" && photoUrl.startsWith("http") && !photoUrl.includes("pravatar");
    if (hasValidPhoto) {
      return (
        <img
          src={photoUrl}
          alt={name}
          style={{
            width: size + "px",
            height: size + "px",
            borderRadius: "50%",
            objectFit: "cover",
            border: border,
            flexShrink: 0
          }}
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

  // ─── AUTO-LOAD DRAFT POST MULA SA HOMETAB GPS TRACKER ───
  useEffect(() => {
    if (draftSocialPost) {
      setActiveSubTab("feed");
      setShowComposer(true);
      if (typeof setPostText === "function") {
        setPostText(draftSocialPost.caption || "");
      }
      if (typeof setImagePreview === "function" && draftSocialPost.image) {
        setImagePreview(draftSocialPost.image);
      }
      if (typeof setDraftSocialPost === "function") {
        setDraftSocialPost(null);
      }
    }
  }, [draftSocialPost]);

  useEffect(() => {
    if (postText || imagePreview) {
      setShowComposer(true);
    }
  }, [postText, imagePreview]);

  // ─── UNREAD COUNTS PARA SA MESSAGES AT NOTIFICATIONS ───
  const unreadMsgCount = useMemo(() => {
    if (!Array.isArray(inboxChats)) return 0;
    return inboxChats.filter(c => {
      const t = c.lastMessageTime?.toMillis ? c.lastMessageTime.toMillis() : (c.updatedAt || 0);
      return t > (lastSeenMsgTime || 0);
    }).length;
  }, [inboxChats, lastSeenMsgTime]);

  const unreadNotifCount = useMemo(() => {
    if (!Array.isArray(allUserNotifs)) return 0;
    return allUserNotifs.filter(n => {
      const t = n.createdAt?.toMillis ? n.createdAt.toMillis() : (n.timestamp || 0);
      return t > (lastSeenNotifTime || 0);
    }).length;
  }, [allUserNotifs, lastSeenNotifTime]);

  // ─── TELEMETRY STATS MULA SA MGA TUNAY NA COMMUNITY POSTS ───
  const telemetryStatsByUser = useMemo(() => {
    const stats = {};
    if (Array.isArray(publicCommunityPosts)) {
      publicCommunityPosts.forEach(p => {
        const uid = p.userId || p.authorId;
        if (!uid) return;
        if (!stats[uid]) stats[uid] = { dist: 0, cal: 0 };
        const d = Number(p.telemetry?.distanceKm || p.distanceKm || p.distance || 0);
        const c = Number(p.telemetry?.calories || p.caloriesBurned || p.calories || p.kcal || 0);
        stats[uid].dist += d;
        stats[uid].cal += c;
      });
    }
    return stats;
  }, [publicCommunityPosts]);

  // ─── TUNAY NA LEADERBOARD DATA (WALANG DUMMY AT WALANG NO-DATA STUBS) ───
  const sortedAthletes = useMemo(() => {
    let list = Array.isArray(userList) && userList.length > 0 ? [...userList] : [];

    // Tiyaking kasama ang kasalukuyang user sa talaan
    if (user && !list.some(u => (u.id === user.uid || u.uid === user.uid))) {
      list.push({
        id: user.uid,
        uid: user.uid,
        displayName: user.displayName || "You",
        photoURL: user.photoURL || avatarPreview || "",
        distanceKm: appData?.totalDistance || 0,
        caloriesBurned: appData?.totalBurnedCalories || 0,
        streakDays: appData?.streakDays || 1
      });
    }

    // Salain at alisin ang mga dummy records
    const realUsers = list.filter(u => {
      const name = (u.displayName || u.name || u.username || "").trim();
      return name && name.toLowerCase() !== "no data" && name.toLowerCase() !== "undefined";
    });

    return realUsers.map(u => {
      const uid = u.id || u.uid;
      const userTelemetry = telemetryStatsByUser[uid] || { dist: 0, cal: 0 };

      const rawDist = Number(u.distanceKm || u.totalDistance || u.totalDistanceKm || u.distance || u.weeklyKm || u.totalKm || (u.steps ? u.steps * 0.0008 : 0)) || 0;
      const dist = rawDist > 0 ? rawDist : userTelemetry.dist;

      const rawCal = Number(u.caloriesBurned || u.totalBurnedCalories || u.burnedCal || u.calories || u.totalCalories) || 0;
      const cal = rawCal > 0 ? rawCal : (userTelemetry.cal > 0 ? userTelemetry.cal : (dist > 0 ? dist * 65 : 0));

      const streak = Number(u.streakDays || u.streak || u.currentStreak || 1);
      const name = u.displayName || u.name || u.username || "Athlete";
      const photo = u.photoURL || u.avatar || u.avatarPreview || "";

      return {
        id: uid,
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
  }, [userList, user, appData, avatarPreview, leaderboardMetric, telemetryStatsByUser]);

  const top1 = sortedAthletes[0] || null;
  const top2 = sortedAthletes[1] || null;
  const top3 = sortedAthletes[2] || null;
  const runnersUp = sortedAthletes.slice(3);

  const currentUserIndex = sortedAthletes.findIndex(u => u.isCurrent);
  const currentUserRank = currentUserIndex !== -1 ? currentUserIndex + 1 : sortedAthletes.length;
  const currentAthlete = sortedAthletes[currentUserIndex] || { dist: 0, cal: 0, streak: 0 };

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh", paddingBottom: "90px", margin: 0, padding: 0, fontFamily: "sans-serif" }}>

      {/* ─── 1. FIXED EDGE-TO-EDGE TOP BRANDING HEADER ─── */}
      <header style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        width: "100%",
        height: "54px",
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        boxShadow: "0 2px 8px rgba(15, 23, 42, 0.05)",
        zIndex: 2000,
        margin: 0,
        padding: "0 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxSizing: "border-box"
      }}>
        {/* Logo & Brand Name */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          <div style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            background: "linear-gradient(135deg, #4f46e5 0%, #38bdf8 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 2px 6px rgba(79, 70, 229, 0.2)"
          }}>
            <i className="fa-solid fa-heart-pulse" style={{ color: "#ffffff", fontSize: "15px" }}></i>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "15px", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.2px", lineHeight: 1.1 }}>
              NUTRIPULSE
            </h1>
            <span style={{ fontSize: "8.5px", fontWeight: 800, color: "#0284c7", letterSpacing: "0.8px", display: "block" }}>
              COMMUNITY
            </span>
          </div>
        </div>

        {/* Action Controls: Tunay na Search, Messages, Notifications, Avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          {/* 🔍 SEARCH BUTTON (BUBUKSAN ANG TUNAY NA SEARCH MODAL NG APP) */}
          <button
            type="button"
            onClick={() => {
              if (typeof setShowSearchModal === "function") {
                setShowSearchModal(true);
              } else if (showToast) {
                showToast("Opening athlete search...");
              }
            }}
            style={{ width: "32px", height: "32px", background: "none", border: "none", borderRadius: "8px", cursor: "pointer", color: "#334155", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
            title="Search Athletes"
          >
            <i className="fa-solid fa-magnifying-glass" style={{ fontSize: "15px" }}></i>
          </button>

          {/* 💬 MESSAGES BUTTON (BUBUKSAN ANG TUNAY NA INBOX PANEL NG APP) */}
          <button
            type="button"
            onClick={() => {
              if (typeof setActivePanel === "function") {
                setActivePanel("inbox");
              }
              if (typeof setLastSeenMsgTime === "function") {
                setLastSeenMsgTime(Date.now());
              }
            }}
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

          {/* 🔔 NOTIFICATIONS BUTTON (BUBUKSAN ANG TUNAY NA SLIDE-OVER DRAWER) */}
          <button
            type="button"
            onClick={() => {
              setShowNotifDrawer(true);
              if (typeof setLastSeenNotifTime === "function") setLastSeenNotifTime(Date.now());
            }}
            style={{ width: "32px", height: "32px", background: "none", border: "none", borderRadius: "8px", cursor: "pointer", color: "#334155", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
            title="Notifications"
          >
            <i className="fa-regular fa-bell" style={{ fontSize: "16px" }}></i>
            {unreadNotifCount > 0 && (
              <span style={{ position: "absolute", top: "3px", right: "3px", background: "#f43f5e", width: "7px", height: "7px", borderRadius: "50%", border: "1.5px solid #ffffff" }}></span>
            )}
          </button>

          {/* 👤 AVATAR (BUBUKSAN ANG PROFILE TAB) */}
          <button
            type="button"
            onClick={() => {
              if (typeof setSelectedVisitor === "function") setSelectedVisitor(null);
              if (typeof setActiveTab === "function") setActiveTab("profile");
            }}
            style={{ width: "32px", height: "32px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
            title="My Profile"
          >
            {renderAvatar(user?.photoURL || avatarPreview, user?.displayName || "You", 28, "1.5px solid #38bdf8")}
          </button>
        </div>
      </header>

      {/* ─── 2. CONTENT WRAPPER ─── */}
      <div style={{ paddingTop: "64px" }}>

        {/* ─── SEGMENTED TAB SWITCHER ─── */}
        <div style={{ padding: "10px 16px 8px 16px", maxWidth: "560px", margin: "0 auto", boxSizing: "border-box" }}>
          <div style={{ display: "flex", background: "#e2e8f0", borderRadius: "12px", padding: "3px" }}>
            <button
              type="button"
              onClick={() => setActiveSubTab("leaderboard")}
              style={{
                flex: 1,
                padding: "8px 0",
                borderRadius: "10px",
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
                boxShadow: activeSubTab === "leaderboard" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
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
                padding: "8px 0",
                borderRadius: "10px",
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
                boxShadow: activeSubTab === "feed" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                transition: "all 0.15s ease"
              }}
            >
              <i className="fa-solid fa-bolt" style={{ color: activeSubTab === "feed" ? "#0284c7" : "#94a3b8" }}></i>
              PULSE FEED
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 🏆 LEADERBOARD VIEW (TUNAY NA MGA ATLETA, WALANG FAKE CARDS)   */}
        {/* ============================================================== */}
        {activeSubTab === "leaderboard" && (
          <div style={{ padding: "0 16px" }}>

            {/* Metric Selector Chips */}
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

            {/* 🥇 PODIUM (LILITAW LAMANG KUNG MAY TUNAY NA NANGUNGUNA) */}
            {top1 && (
              <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-end",
                gap: "8px",
                margin: "20px 0 24px 0",
                padding: "10px 0"
              }}>
                {/* 🥈 Rank 2 (Kung may tunay na runner) */}
                {top2 ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, maxWidth: "100px" }}>
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

                {/* 🥇 Rank 1 (Ang Bida) */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1.1, maxWidth: "110px" }}>
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

                {/* 🥉 Rank 3 (Kung may tunay na runner) */}
                {top3 ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, maxWidth: "100px" }}>
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

            {/* 🔢 RANKING LIST (RANK #4 PABABA) */}
            <div style={{ background: "#ffffff", borderRadius: "14px", padding: "6px 12px", border: "1px solid #f1f5f9", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
              {runnersUp.length > 0 ? (
                runnersUp.map((athlete, idx) => (
                  <div
                    key={athlete.id || idx}
                    onClick={() => {
                      if (typeof setSelectedVisitor === "function") setSelectedVisitor(athlete);
                      if (typeof setActiveTab === "function") setActiveTab("profile");
                    }}
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
                  {sortedAthletes.length <= 3 ? "All active athletes are on the podium! ⚡" : "Log your daily run to climb the leaderboard!"}
                </div>
              )}
            </div>

            {/* 📌 STICKY YOUR RANK BAR SA ILALIM */}
            <div style={{
              position: "fixed",
              bottom: "65px",
              left: "14px",
              right: "14px",
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
                {renderAvatar(user?.photoURL || avatarPreview, user?.displayName || "You", 36, "2px solid #38bdf8")}
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

        {/* ============================================================== */}
        {/* ⚡ PULSE FEED VIEW (KONEKTADO SA TUNAY NA ACTIONS AT HANDLERS)  */}
        {/* ============================================================== */}
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
                  {renderAvatar(user?.photoURL || avatarPreview, user?.displayName || "You", 28)}
                  <span style={{ color: "#94a3b8", fontSize: "12.5px", flex: 1 }}>
                    Share your latest sweat session... 🏃🚴
                  </span>
                  <i className="fa-solid fa-camera" style={{ color: "#4f46e5", fontSize: "16px" }}></i>
                </div>
              ) : (
                <div>
                  <textarea
                    autoFocus
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
                      <img src={imagePreview} alt="Attached" style={{ width: "100%", maxHeight: "220px", objectFit: "cover", display: "block" }} />
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

            {/* TUNAY NA MGA POST MULA SA DATABASE (publicCommunityPosts) */}
            {Array.isArray(publicCommunityPosts) && publicCommunityPosts.length > 0 ? (
              publicCommunityPosts.map((post) => {
                const isOwner = post.userId === user?.uid || post.authorId === user?.uid;
                const hasBoosted = Array.isArray(post.likes) ? post.likes.includes(user?.uid) : false;
                const boostCount = Array.isArray(post.likes) ? post.likes.length : (post.boosts || 0);
                const commentsCount = Array.isArray(post.comments) ? post.comments.length : 0;
                const authorName = post.userName || post.authorName || "NutriPulse Athlete";
                const authorPhoto = post.userPhoto || post.authorPhoto || "";

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
                    {/* Athlete Post Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                      <div
                        style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
                        onClick={() => {
                          if (typeof setSelectedVisitor === "function") setSelectedVisitor(post);
                          if (typeof setActiveTab === "function") setActiveTab("profile");
                        }}
                      >
                        {renderAvatar(authorPhoto, authorName, 38, "2px solid #e2e8f0")}
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>
                            {authorName}
                          </div>
                          <div style={{ fontSize: "10.5px", color: "#94a3b8", fontWeight: 600 }}>
                            {formatPostTime(post.createdAt || post.timestamp)}
                          </div>
                        </div>
                      </div>

                      {/* 3-Dot Menu para sa Edit at Delete */}
                      {isOwner && (
                        <div style={{ position: "relative" }}>
                          <button
                            type="button"
                            onClick={() => {
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
                                  onClick={() => openEditModal(post)}
                                  style={{ width: "100%", padding: "8px 12px", border: "none", background: "none", textAlign: "left", fontSize: "12px", fontWeight: 700, color: "#334155", cursor: "pointer" }}
                                >
                                  Edit Post
                                </button>
                              )}
                              {typeof handleDeletePost === "function" && (
                                <button
                                  type="button"
                                  onClick={() => handleDeletePost(post.id)}
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

                    {/* Post Text / Caption */}
                    {(post.text || post.caption) && (
                      <p style={{ fontSize: "13.5px", color: "#334155", lineHeight: "1.5", margin: "0 0 10px 0", whiteSpace: "pre-wrap" }}>
                        {post.text || post.caption}
                      </p>
                    )}

                    {/* GPS Telemetry Ribbon kung may recorded metrics */}
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

                    {/* Activity Image / Route Map */}
                    {(post.image || post.imageUrl) && (
                      <div style={{ borderRadius: "10px", overflow: "hidden", marginBottom: "10px", border: "1px solid #f1f5f9" }}>
                        <img src={post.image || post.imageUrl} alt="Activity" style={{ width: "100%", display: "block" }} />
                      </div>
                    )}

                    {/* Interaction Bar: ⚡ Pulse Boost at 💬 Huddle Comments */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f8fafc", paddingTop: "10px" }}>
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof handleLike === "function") {
                            handleLike(post.id);
                          }
                        }}
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
                        onClick={() => {
                          if (typeof setSelectedPost === "function") {
                            setSelectedPost(post);
                          }
                        }}
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
      {/* 🔔 UNIFORM SLIDE-OVER NOTIFICATIONS DRAWER (TUNAY NA NOTIFS)    */}
      {/* ============================================================== */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: showNotifDrawer ? "0" : "-100%",
          width: "100%",
          maxWidth: "360px",
          height: "100vh",
          backgroundColor: "#ffffff",
          zIndex: 4000,
          transition: "right 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: showNotifDrawer ? "-6px 0 24px rgba(15, 23, 42, 0.15)" : "none",
          display: "flex",
          flexDirection: "column"
        }}
      >
        <div style={{ padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", backgroundColor: "#ffffff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "7px", background: "rgba(239, 68, 68, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="fa-solid fa-bell" style={{ color: "#ef4444", fontSize: "13px" }}></i>
            </div>
            <h3 style={{ margin: 0, color: "#0f172a", fontSize: "15px", fontWeight: 900 }}>Notifications</h3>
          </div>
          <button
            type="button"
            onClick={() => setShowNotifDrawer(false)}
            style={{ background: "#f1f5f9", border: "none", width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b", fontSize: "14px", fontWeight: 800 }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: "8px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
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

        <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>
          {Array.isArray(allUserNotifs) && allUserNotifs.length > 0 ? (
            allUserNotifs.map((notif, idx) => {
              const isUnread = notif.createdAt?.toMillis
                ? notif.createdAt.toMillis() > (lastSeenNotifTime || 0)
                : (notif.timestamp || 0) > (lastSeenNotifTime || 0);

              const senderName = notif.senderName || notif.authorName || "An athlete";
              const senderPhoto = notif.senderPhoto || notif.authorPhoto || "";

              return (
                <div
                  key={notif.id || idx}
                  onClick={() => {
                    if (notif.postId && Array.isArray(publicCommunityPosts)) {
                      const targetPost = publicCommunityPosts.find(p => p.id === notif.postId);
                      if (targetPost && typeof setSelectedPost === "function") {
                        setSelectedPost(targetPost);
                        setShowNotifDrawer(false);
                      }
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
                    cursor: notif.postId ? "pointer" : "default"
                  }}
                >
                  <div style={{ marginTop: "2px" }}>
                    {renderAvatar(senderPhoto, senderName, 34)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: "0 0 4px 0", fontSize: "12.5px", color: "#0f172a", lineHeight: 1.4, fontWeight: isUnread ? 700 : 500 }}>
                      <span style={{ fontWeight: 800 }}>{senderName}</span>{" "}
                      {notif.message || notif.text || "interacted with your workout!"}
                    </p>
                    <span style={{ fontSize: "10.5px", color: "#94a3b8", fontWeight: 600 }}>
                      {formatPostTime(notif.createdAt || notif.timestamp)}
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

      {/* 🌑 BACKDROP OVERLAY PARA SA NOTIFICATIONS DRAWER */}
      {showNotifDrawer && (
        <div
          onClick={() => setShowNotifDrawer(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(15, 23, 42, 0.4)",
            zIndex: 3999,
            backdropFilter: "blur(2px)"
          }}
        />
      )}

    </div>
  );
}
