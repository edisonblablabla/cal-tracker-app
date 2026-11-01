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
  setSelectedPost,
  handleLike,
  setResonatePost,
  showToast,
  formatPostTime = (ts) => "Just now"
}) {
  // ─── TABS & FILTERS ───
  const [activeSubTab, setActiveSubTab] = useState("leaderboard"); // 'leaderboard' o 'feed'
  const [leaderboardMetric, setLeaderboardMetric] = useState("distance"); // 'distance', 'calories', 'streak'
  const [showComposer, setShowComposer] = useState(false);

  // ─── AUTO-LOAD DRAFT POST MULA SA HOMETAB ───
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

  // Awtomatikong buksan ang composer kung may draft text/image
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

  // ─── TUNAY NA LEADERBOARD DATA MULA SA USERLIST ───
  const sortedAthletes = useMemo(() => {
    let list = Array.isArray(userList) && userList.length > 0 ? [...userList] : [];

    // Tiyaking kasama ang kasalukuyang user kung wala pa sa listahan
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

    return list.map(u => {
      // Normalisasyon ng metrics
      const dist = Number(u.distanceKm || u.weeklyKm || u.totalDistance || (u.steps ? u.steps * 0.0008 : 0)) || 0;
      const cal = Number(u.caloriesBurned || u.weeklyCalories || u.burnedCal || (dist * 65)) || 0;
      const streak = Number(u.streakDays || u.streak || 1);
      const name = u.displayName || u.name || u.username || "Athlete";
      const photo = u.photoURL || u.avatar || u.avatarPreview || "https://i.pravatar.cc/150?u=" + (u.id || name);

      return {
        id: u.id || u.uid,
        name,
        photo,
        dist: Math.round(dist * 10) / 10,
        cal: Math.round(cal),
        streak,
        isCurrent: u.id === user?.uid || u.uid === user?.uid
      };
    }).sort((a, b) => {
      if (leaderboardMetric === "calories") return b.cal - a.cal;
      if (leaderboardMetric === "streak") return b.streak - a.streak;
      return b.dist - a.dist;
    });
  }, [userList, user, appData, avatarPreview, leaderboardMetric]);

  const top1 = sortedAthletes[0] || { name: "No Data", dist: 0, cal: 0, streak: 0, photo: "https://i.pravatar.cc/150" };
  const top2 = sortedAthletes[1] || { name: "No Data", dist: 0, cal: 0, streak: 0, photo: "https://i.pravatar.cc/150" };
  const top3 = sortedAthletes[2] || { name: "No Data", dist: 0, cal: 0, streak: 0, photo: "https://i.pravatar.cc/150" };
  const runnersUp = sortedAthletes.slice(3);

  // Hanapin ang ranggo ng kasalukuyang user
  const currentUserIndex = sortedAthletes.findIndex(u => u.isCurrent);
  const currentUserRank = currentUserIndex !== -1 ? currentUserIndex + 1 : sortedAthletes.length;
  const currentAthlete = sortedAthletes[currentUserIndex] || { dist: 0, cal: 0, streak: 0 };

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh", paddingBottom: "90px", fontFamily: "sans-serif" }}>

      {/* ─── 1. COMPACT SOLID BRAND HEADER ─── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "56px",
        padding: "0 12px",
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
        boxSizing: "border-box",
        width: "100%"
      }}>
        {/* Brand & Logo (Naka-lock ang sukat, hindi aabot sa kanan) */}
        <div style={{ display: "flex", alignItems: "center", gap: "7px", flexShrink: 0, maxWidth: "145px" }}>
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
            <i className="fa-solid fa-heart-pulse" style={{ color: "#ffffff", fontSize: "15px" }}></i>
          </div>
          <div style={{ minWidth: 0, overflow: "hidden" }}>
            <h1 style={{ margin: 0, fontSize: "14px", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.2px", lineHeight: 1.1, whiteSpace: "nowrap" }}>
              NUTRIPULSE
            </h1>
            <span style={{ fontSize: "8.5px", fontWeight: 800, color: "#0284c7", letterSpacing: "0.8px", display: "block" }}>
              COMMUNITY
            </span>
          </div>
        </div>

        {/* Action Controls: Search, Messages, Notifications, Avatar (Siksik, 32px touch target) */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
          {/* 🔍 SEARCH */}
          <button
            type="button"
            onClick={() => {
              if (typeof setShowSearchModal === "function") setShowSearchModal(true);
            }}
            style={{
              width: "32px",
              height: "32px",
              background: "none",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              color: "#334155",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0
            }}
            title="Search Athletes"
          >
            <i className="fa-solid fa-magnifying-glass" style={{ fontSize: "15px" }}></i>
          </button>

          {/* 💬 MESSAGES */}
          <button
            type="button"
            onClick={() => {
              if (typeof setActivePanel === "function") setActivePanel("inbox");
              if (typeof setLastSeenMsgTime === "function") setLastSeenMsgTime(Date.now());
            }}
            style={{
              width: "32px",
              height: "32px",
              background: "none",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              color: "#334155",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0
            }}
            title="Huddle Messages"
          >
            <i className="fa-regular fa-comment-dots" style={{ fontSize: "16px" }}></i>
            {unreadMsgCount > 0 && (
              <span style={{
                position: "absolute", top: "2px", right: "2px", background: "#ef4444", color: "#ffffff",
                fontSize: "8.5px", fontWeight: 800, minWidth: "14px", height: "14px", borderRadius: "10px",
                display: "flex", alignItems: "center", justifyContent: "center", padding: "0 2px"
              }}>
                {unreadMsgCount > 9 ? "9+" : unreadMsgCount}
              </span>
            )}
          </button>

          {/* 🔔 NOTIFICATIONS */}
          <button
            type="button"
            onClick={() => {
              if (typeof setActivePanel === "function") setActivePanel("notifications");
              if (typeof setLastSeenNotifTime === "function") setLastSeenNotifTime(Date.now());
            }}
            style={{
              width: "32px",
              height: "32px",
              background: "none",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              color: "#334155",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0
            }}
            title="Notifications"
          >
            <i className="fa-regular fa-bell" style={{ fontSize: "16px" }}></i>
            {unreadNotifCount > 0 && (
              <span style={{
                position: "absolute", top: "4px", right: "4px", background: "#f43f5e",
                width: "7px", height: "7px", borderRadius: "50%", border: "2px solid #ffffff"
              }}></span>
            )}
          </button>

          {/* 👤 AVATAR */}
          <button
            type="button"
            onClick={() => {
              if (typeof setSelectedVisitor === "function") setSelectedVisitor(null);
              if (typeof setActiveTab === "function") setActiveTab("profile");
            }}
            style={{
              width: "32px",
              height: "32px",
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0
            }}
            title="My Profile"
          >
            <img
              src={user?.photoURL || avatarPreview || "https://i.pravatar.cc/150"}
              alt="Profile"
              style={{ width: "26px", height: "26px", borderRadius: "50%", objectFit: "cover", border: "2px solid #38bdf8" }}
            />
          </button>
        </div>
      </div>

      {/* ─── 2. TAB SWITCHER (LEADERBOARD SA KALIWA, PULSE FEED SA KANAN) ─── */}
      <div style={{ padding: "12px 16px 8px 16px" }}>
        <div style={{ display: "flex", background: "#e2e8f0", borderRadius: "14px", padding: "3px" }}>
          <button
            type="button"
            onClick={() => setActiveSubTab("leaderboard")}
            style={{
              flex: 1,
              padding: "9px 0",
              borderRadius: "11px",
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
              transition: "all 0.2s ease"
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
              padding: "9px 0",
              borderRadius: "11px",
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
              transition: "all 0.2s ease"
            }}
          >
            <i className="fa-solid fa-bolt" style={{ color: activeSubTab === "feed" ? "#0284c7" : "#94a3b8" }}></i>
            PULSE FEED
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 🏆 LEADERBOARD VIEW (REAL DATA, METRIC FILTERS, PODIUM)        */}
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

          {/* 🥇 PODIUM (TOP 3 REAL USERS) */}
          <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end",
            gap: "8px",
            margin: "20px 0 24px 0",
            padding: "10px 0"
          }}>
            {/* 🥈 Rank 2 */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, maxWidth: "100px" }}>
              <img
                src={top2.photo}
                alt={top2.name}
                style={{ width: "48px", height: "48px", borderRadius: "50%", border: "3px solid #94a3b8", objectFit: "cover", zIndex: 2 }}
              />
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

            {/* 🥇 Rank 1 */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1.1, maxWidth: "110px" }}>
              <i className="fa-solid fa-crown" style={{ color: "#eab308", fontSize: "18px", marginBottom: "2px", zIndex: 3 }}></i>
              <img
                src={top1.photo}
                alt={top1.name}
                style={{ width: "60px", height: "60px", borderRadius: "50%", border: "3px solid #eab308", objectFit: "cover", zIndex: 2, boxShadow: "0 0 12px rgba(234, 179, 8, 0.4)" }}
              />
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

            {/* 🥉 Rank 3 */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, maxWidth: "100px" }}>
              <img
                src={top3.photo}
                alt={top3.name}
                style={{ width: "44px", height: "44px", borderRadius: "50%", border: "3px solid #f97316", objectFit: "cover", zIndex: 2 }}
              />
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
          </div>

          {/* 🔢 RANKING LIST (#4 PABABA) */}
          <div style={{ background: "#ffffff", borderRadius: "14px", padding: "6px 12px", border: "1px solid #f1f5f9", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
            {runnersUp.length > 0 ? (
              runnersUp.map((athlete, idx) => (
                <div
                  key={athlete.id || idx}
                  onClick={() => {
                    if (typeof setSelectedVisitor === "function") setSelectedVisitor(athlete);
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
                  <img
                    src={athlete.photo}
                    alt={athlete.name}
                    style={{ width: "34px", height: "34px", borderRadius: "50%", objectFit: "cover", margin: "0 10px" }}
                  />
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
              <div style={{ textAlign: "center", padding: "16px", color: "#94a3b8", fontSize: "12px" }}>
                More athletes will appear as they log their activities!
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
            <img
              src={user?.photoURL || avatarPreview || "https://i.pravatar.cc/150"}
              alt="You"
              style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", border: "2px solid #38bdf8", marginRight: "10px" }}
            />
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
      {/* ⚡ PULSE FEED VIEW (TUNAY NA POSTS, BOOST, EDIT, DELETE, COMMENTS) */}
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
                <img
                  src={user?.photoURL || avatarPreview || "https://i.pravatar.cc/150"}
                  alt="You"
                  style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover" }}
                />
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

          {/* TUNAY NA POSTS LIST MULA SA FIRESTORE (publicCommunityPosts) */}
          {Array.isArray(publicCommunityPosts) && publicCommunityPosts.length > 0 ? (
            publicCommunityPosts.map((post) => {
              const isOwner = post.userId === user?.uid || post.authorId === user?.uid;
              const hasBoosted = Array.isArray(post.likes) ? post.likes.includes(user?.uid) : false;
              const boostCount = Array.isArray(post.likes) ? post.likes.length : (post.boosts || 0);

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
                  {/* Athlete Card Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
                      onClick={() => {
                        if (typeof setSelectedVisitor === "function") setSelectedVisitor(post);
                      }}
                    >
                      <img
                        src={post.userPhoto || post.authorPhoto || "https://i.pravatar.cc/150"}
                        alt="Author"
                        style={{ width: "38px", height: "38px", borderRadius: "50%", objectFit: "cover", border: "2px solid #e2e8f0" }}
                      />
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>
                          {post.userName || post.authorName || "NutriPulse Athlete"}
                        </div>
                        <div style={{ fontSize: "10.5px", color: "#94a3b8", fontWeight: 600 }}>
                          {formatPostTime(post.createdAt || post.timestamp)}
                        </div>
                      </div>
                    </div>

                    {/* 3-Dot Menu para sa Edit / Delete */}
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

                  {/* Caption / Kwento */}
                  {(post.text || post.caption) && (
                    <p style={{ fontSize: "13.5px", color: "#334155", lineHeight: "1.5", margin: "0 0 10px 0", whiteSpace: "pre-wrap" }}>
                      {post.text || post.caption}
                    </p>
                  )}

                  {/* Route Canvas / Activity Image */}
                  {(post.image || post.imageUrl) && (
                    <div style={{ borderRadius: "10px", overflow: "hidden", marginBottom: "10px", border: "1px solid #f1f5f9" }}>
                      <img src={post.image || post.imageUrl} alt="Activity" style={{ width: "100%", display: "block" }} />
                    </div>
                  )}

                  {/* Interaction Bar: ⚡ Pulse Boost, 💬 Comments/Huddle */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f8fafc", paddingTop: "10px" }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof handleLike === "function") handleLike(post.id);
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
                        if (typeof setSelectedPost === "function") setSelectedPost(post);
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
                      <span>Huddle ({Array.isArray(post.comments) ? post.comments.length : 0})</span>
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
  );
}
