import React, { useState, useEffect, useMemo } from "react";
import { db } from "../services/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc
} from "firebase/firestore";

export default function ProfileTab({
  user,
  appData,
  avatarPreview,
  setActiveTab,
  setSelectedVisitor,
  setActivePanel,
  showToast,
  formatPostTime = (ts) => "Just now"
}) {
  const [profileSubTab, setProfileSubTab] = useState("activities"); // "activities" | "boosters" | "boosting"
  const [myPosts, setMyPosts] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Edit form states
  const [editName, setEditName] = useState(appData?.userName || user?.displayName || "");
  const [editTitle, setEditTitle] = useState(appData?.userTitle || "Fitness Enthusiast");
  const [editBio, setEditBio] = useState(appData?.userBio || "Crushing daily fitness goals.");
  const [isSaving, setIsSaving] = useState(false);

  // ─── 1. REALTIME LISTENER SA MGA POST NG CURRENT USER ───
  useEffect(() => {
    if (!user?.uid) return;
    setLoadingPosts(true);

    try {
      const q = query(collection(db, "posts"), where("userId", "==", user.uid));
      const unsub = onSnapshot(q, (snapshot) => {
        const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Memory sort para hindi mangailangan ng Firestore composite index
        posts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setMyPosts(posts);
        setLoadingPosts(false);
      }, (err) => {
        console.error("Error loading user posts:", err);
        setLoadingPosts(false);
      });
      return () => unsub();
    } catch (e) {
      console.error(e);
      setLoadingPosts(false);
    }
  }, [user?.uid]);

  // ─── 2. REALTIME LISTENER SA LAHAT NG USERS PARA SA BOOSTERS & BOOSTING ───
  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
        const users = snapshot.docs.map(doc => ({ uid: doc.id, id: doc.id, ...doc.data() }));
        setAllUsers(users);
      }, (err) => console.error("Error fetching network users:", err));
      return () => unsub();
    } catch (e) {
      console.error(e);
    }
  }, []);

  // ─── 3. BOOSTERS (Followers) AT BOOSTING (Following) NETWORK ───
  const myBoostingList = useMemo(() => {
    const boostingIds = appData?.boosting || [];
    return allUsers.filter(u => boostingIds.includes(u.uid || u.id));
  }, [allUsers, appData?.boosting]);

  const myBoostersList = useMemo(() => {
    if (!user?.uid) return [];
    return allUsers.filter(u => Array.isArray(u.boosting) && u.boosting.includes(user.uid));
  }, [allUsers, user?.uid]);

  // ─── 4. METRICS & TELEMETRY CALCULATIONS ───
  const totalDistance = useMemo(() => {
    const rawDist = Number(appData?.totalDistance || appData?.distanceKm || 0);
    const stepDist = (Number(appData?.steps || 0) * 0.00075);
    return Math.max(rawDist, stepDist).toFixed(1);
  }, [appData]);

  const totalCalories = useMemo(() => {
    return Number(appData?.todayBurnedCal || appData?.caloriesBurned || 0);
  }, [appData]);

  const currentStreak = useMemo(() => {
    return Number(appData?.streakDays || 0);
  }, [appData]);

  const isStreakActiveToday = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return appData?.lastActiveDate === todayStr;
  }, [appData?.lastActiveDate]);

  // ─── AVATAR RENDERER ───
  const renderAvatar = (photoUrl, name = "Athlete", size = 48) => {
    const pStr = typeof photoUrl === "string" ? photoUrl.trim() : "";
    const hasPhoto = pStr && (pStr.startsWith("http") || pStr.startsWith("data:image/") || pStr.startsWith("blob:")) && !pStr.includes("pravatar");

    if (hasPhoto) {
      return (
        <img
          src={pStr}
          alt={name}
          style={{ width: size + "px", height: size + "px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
        />
      );
    }
    const initial = (name || "A").trim().charAt(0).toUpperCase();
    return (
      <div style={{
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
        flexShrink: 0
      }}>
        {initial}
      </div>
    );
  };

  // ─── ACTIONS ───
  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    if (!user?.uid) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        userName: editName.trim() || "Athlete",
        userTitle: editTitle.trim() || "Fitness Enthusiast",
        userBio: editBio.trim() || ""
      });
      setIsEditingProfile(false);
      if (showToast) showToast("Athlete passport updated! ⚡");
    } catch (err) {
      console.error(err);
      if (showToast) showToast("Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Permanently delete this activity log?")) return;
    try {
      await deleteDoc(doc(db, "posts", postId));
      if (showToast) showToast("Activity deleted.");
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAthlete = (athlete) => {
    if (typeof setSelectedVisitor === "function") setSelectedVisitor(athlete);
    if (typeof setActivePanel === "function") setActivePanel("visitor_profile");
  };

  return (
    <div style={{ backgroundColor: "#0b0f19", minHeight: "100vh", paddingBottom: "100px", color: "#f8fafc", fontFamily: "sans-serif" }}>
      
      {/* 📌 TOP ATHLETIC BAR */}
      <div style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        backgroundColor: "rgba(11, 15, 25, 0.95)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid #1e293b",
        padding: "14px 18px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        maxWidth: "480px",
        margin: "0 auto"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#38bdf8", boxShadow: "0 0 10px #38bdf8" }} />
          <span style={{ fontSize: "12px", fontWeight: 900, letterSpacing: "1px", textTransform: "uppercase", color: "#94a3b8" }}>
            Athlete Passport
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditName(appData?.userName || user?.displayName || "");
            setEditTitle(appData?.userTitle || "Fitness Enthusiast");
            setEditBio(appData?.userBio || "Crushing daily fitness goals.");
            setIsEditingProfile(true);
          }}
          style={{
            background: "#1e293b",
            border: "1px solid #334155",
            color: "#f8fafc",
            borderRadius: "20px",
            padding: "5px 12px",
            fontSize: "11px",
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "5px"
          }}
        >
          <i className="fa-solid fa-pen" style={{ fontSize: "10px", color: "#38bdf8" }}></i>
          Edit Passport
        </button>
      </div>

      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "16px" }}>

        {/* 🪪 ATHLETE IDENTITY CARD (SLEEK & NON-FACEBOOK) */}
        <div style={{
          background: "linear-gradient(145deg, #131b2e 0%, #0f172a 100%)",
          borderRadius: "20px",
          padding: "20px",
          border: "1px solid #1e293b",
          boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
          position: "relative",
          overflow: "hidden"
        }}>
          {/* Subtle background glow */}
          <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "120px", height: "120px", background: "rgba(56, 189, 248, 0.12)", filter: "blur(40px)", borderRadius: "50%", pointerEvents: "none" }} />

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{
              padding: "3px",
              borderRadius: "50%",
              background: currentStreak >= 3 ? "linear-gradient(135deg, #f59e0b, #ef4444)" : "linear-gradient(135deg, #38bdf8, #6366f1)",
              boxShadow: currentStreak >= 3 ? "0 0 16px rgba(245, 158, 11, 0.4)" : "0 0 16px rgba(56, 189, 248, 0.25)"
            }}>
              {renderAvatar(appData?.avatarUrl || avatarPreview || user?.photoURL, appData?.userName || user?.displayName, 64)}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 900, color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {appData?.userName || user?.displayName || "Athlete"}
                </h2>
                <i className="fa-solid fa-circle-check" style={{ color: "#38bdf8", fontSize: "14px" }}></i>
              </div>
              <span style={{ fontSize: "11.5px", fontWeight: 700, color: "#94a3b8", display: "block", marginTop: "2px" }}>
                {appData?.userTitle || "Fitness Enthusiast"}
              </span>
              <p style={{ margin: "6px 0 0 0", fontSize: "11px", color: "#64748b", lineHeight: 1.4 }}>
                {appData?.userBio || "Disciplined daily athletic logs & nutrition tracking."}
              </p>
            </div>
          </div>

          {/* ⚡ KEY PERFORMANCE METRIC TILES */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginTop: "18px" }}>
            
            {/* STREAK TILE */}
            <div style={{ background: "#0b0f19", borderRadius: "12px", padding: "10px", border: "1px solid #1e293b", textAlign: "center" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                <i className="fa-solid fa-fire" style={{ color: currentStreak >= 3 ? "#f59e0b" : "#64748b", fontSize: "13px" }}></i>
                <span style={{ fontSize: "16px", fontWeight: 900, color: currentStreak >= 3 ? "#f59e0b" : "#f8fafc" }}>
                  {currentStreak}
                </span>
              </div>
              <span style={{ fontSize: "9px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", display: "block", marginTop: "2px" }}>
                Streak (Days)
              </span>
              <span style={{ fontSize: "8px", color: isStreakActiveToday ? "#10b981" : "#f59e0b", fontWeight: 700, display: "block", marginTop: "2px" }}>
                {isStreakActiveToday ? "● Active today" : "○ Needs log"}
              </span>
            </div>

            {/* TOTAL DISTANCE TILE */}
            <div style={{ background: "#0b0f19", borderRadius: "12px", padding: "10px", border: "1px solid #1e293b", textAlign: "center" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                <i className="fa-solid fa-person-running" style={{ color: "#38bdf8", fontSize: "13px" }}></i>
                <span style={{ fontSize: "16px", fontWeight: 900, color: "#f8fafc" }}>
                  {totalDistance}
                </span>
              </div>
              <span style={{ fontSize: "9px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", display: "block", marginTop: "2px" }}>
                Distance (KM)
              </span>
              <span style={{ fontSize: "8px", color: "#64748b", fontWeight: 700, display: "block", marginTop: "2px" }}>
                GPS + Steps
              </span>
            </div>

            {/* CALORIE BURN TILE */}
            <div style={{ background: "#0b0f19", borderRadius: "12px", padding: "10px", border: "1px solid #1e293b", textAlign: "center" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                <i className="fa-solid fa-bolt" style={{ color: "#f97316", fontSize: "13px" }}></i>
                <span style={{ fontSize: "16px", fontWeight: 900, color: "#f8fafc" }}>
                  {totalCalories}
                </span>
              </div>
              <span style={{ fontSize: "9px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", display: "block", marginTop: "2px" }}>
                Active Burn
              </span>
              <span style={{ fontSize: "8px", color: "#64748b", fontWeight: 700, display: "block", marginTop: "2px" }}>
                kcal recorded
              </span>
            </div>

          </div>
        </div>

        {/* 🎛️ ATHLETE PASSPORT NAVIGATION TABS */}
        <div style={{
          display: "flex",
          background: "#131b2e",
          borderRadius: "12px",
          padding: "3px",
          margin: "16px 0 14px 0",
          border: "1px solid #1e293b"
        }}>
          <button
            type="button"
            onClick={() => setProfileSubTab("activities")}
            style={{
              flex: 1,
              padding: "9px 0",
              borderRadius: "9px",
              border: "none",
              fontSize: "11.5px",
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "6px",
              background: profileSubTab === "activities" ? "#0284c7" : "transparent",
              color: profileSubTab === "activities" ? "#ffffff" : "#94a3b8",
              transition: "all 0.15s ease"
            }}
          >
            <i className="fa-solid fa-route"></i>
            Activities ({myPosts.length})
          </button>

          <button
            type="button"
            onClick={() => setProfileSubTab("boosters")}
            style={{
              flex: 1,
              padding: "9px 0",
              borderRadius: "9px",
              border: "none",
              fontSize: "11.5px",
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "6px",
              background: profileSubTab === "boosters" ? "#0284c7" : "transparent",
              color: profileSubTab === "boosters" ? "#ffffff" : "#94a3b8",
              transition: "all 0.15s ease"
            }}
          >
            <i className="fa-solid fa-users"></i>
            Boosters ({myBoostersList.length})
          </button>

          <button
            type="button"
            onClick={() => setProfileSubTab("boosting")}
            style={{
              flex: 1,
              padding: "9px 0",
              borderRadius: "9px",
              border: "none",
              fontSize: "11.5px",
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "6px",
              background: profileSubTab === "boosting" ? "#0284c7" : "transparent",
              color: profileSubTab === "boosting" ? "#ffffff" : "#94a3b8",
              transition: "all 0.15s ease"
            }}
          >
            <i className="fa-solid fa-user-plus"></i>
            Boosting ({myBoostingList.length})
          </button>
        </div>

        {/* ─── TAB 1: ACTIVITIES & WORKOUT POSTS PANEL ─── */}
        {profileSubTab === "activities" && (
          <div>
            {loadingPosts ? (
              <div style={{ textAlign: "center", padding: "40px 16px", color: "#64748b", fontSize: "13px" }}>
                <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "20px", marginBottom: "8px", display: "block" }}></i>
                Loading athletic telemetry...
              </div>
            ) : myPosts.length > 0 ? (
              myPosts.map((post) => (
                <div
                  key={post.id}
                  style={{
                    background: "#131b2e",
                    borderRadius: "16px",
                    padding: "14px",
                    border: "1px solid #1e293b",
                    marginBottom: "12px",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.2)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "26px", height: "26px", borderRadius: "6px", background: "rgba(56, 189, 248, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <i className="fa-solid fa-bolt" style={{ color: "#38bdf8", fontSize: "12px" }}></i>
                      </div>
                      <span style={{ fontSize: "11px", fontWeight: 800, color: "#94a3b8" }}>
                        {formatPostTime(post.createdAt)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeletePost(post.id)}
                      style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "12px", padding: "4px" }}
                      title="Delete activity"
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>

                  {post.text && (
                    <p style={{ margin: "0 0 10px 0", fontSize: "13px", color: "#e2e8f0", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                      {post.text}
                    </p>
                  )}

                  {/* Telemetry Grid (kung may workout stats) */}
                  {(post.telemetry || post.distanceKm) && (
                    <div style={{
                      display: "flex",
                      justifyContent: "space-around",
                      background: "#0b0f19",
                      borderRadius: "10px",
                      padding: "8px",
                      border: "1px solid #1e293b",
                      marginBottom: "10px"
                    }}>
                      <div style={{ textAlign: "center" }}>
                        <span style={{ fontSize: "9px", fontWeight: 800, color: "#64748b", display: "block" }}>DISTANCE</span>
                        <span style={{ fontSize: "13px", fontWeight: 900, color: "#38bdf8" }}>
                          {(post.telemetry?.distanceKm || post.distanceKm || 0).toFixed(2)} km
                        </span>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <span style={{ fontSize: "9px", fontWeight: 800, color: "#64748b", display: "block" }}>TIME</span>
                        <span style={{ fontSize: "13px", fontWeight: 900, color: "#f8fafc" }}>
                          {post.telemetry?.duration || post.duration || "--:--"}
                        </span>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <span style={{ fontSize: "9px", fontWeight: 800, color: "#64748b", display: "block" }}>ENERGY</span>
                        <span style={{ fontSize: "13px", fontWeight: 900, color: "#f97316" }}>
                          +{post.telemetry?.calories || post.caloriesBurned || post.kcal || 0} cal
                        </span>
                      </div>
                    </div>
                  )}

                  {post.imageUrl && (
                    <div style={{ borderRadius: "10px", overflow: "hidden", border: "1px solid #1e293b", marginBottom: "8px", background: "#0b0f19" }}>
                      <img src={post.imageUrl} alt="Activity Track" style={{ width: "100%", maxHeight: "260px", objectFit: "contain", display: "block", margin: "0 auto" }} />
                    </div>
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingTop: "6px", borderTop: "1px solid #1e293b", fontSize: "11px", color: "#64748b", fontWeight: 700 }}>
                    <span><i className="fa-solid fa-heart" style={{ color: "#ef4444" }}></i> {post.likes || 0} Pulses</span>
                    <span><i className="fa-solid fa-comment" style={{ color: "#38bdf8" }}></i> {post.commentsCount || 0} Comments</span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{
                textAlign: "center",
                padding: "40px 16px",
                background: "#131b2e",
                borderRadius: "16px",
                border: "1px dashed #1e293b"
              }}>
                <i className="fa-solid fa-person-running" style={{ fontSize: "36px", color: "#334155", marginBottom: "10px", display: "block" }}></i>
                <div style={{ fontSize: "14px", fontWeight: 800, color: "#ffffff" }}>No activities logged yet</div>
                <p style={{ fontSize: "12px", color: "#64748b", margin: "4px 0 16px 0" }}>
                  Record a GPS walk, run, or log a meal to populate your athletic passport!
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab && setActiveTab("home")}
                  style={{
                    padding: "9px 18px",
                    background: "linear-gradient(135deg, #0284c7 0%, #4f46e5 100%)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: 800,
                    cursor: "pointer"
                  }}
                >
                  Start Workout ⚡
                </button>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 2: BOOSTERS (FOLLOWERS) LIST ─── */}
        {profileSubTab === "boosters" && (
          <div>
            {myBoostersList.length > 0 ? (
              myBoostersList.map((athlete) => (
                <div
                  key={athlete.uid || athlete.id}
                  onClick={() => handleOpenAthlete(athlete)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    background: "#131b2e",
                    borderRadius: "14px",
                    border: "1px solid #1e293b",
                    marginBottom: "8px",
                    cursor: "pointer"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {renderAvatar(athlete.avatarUrl || athlete.photoURL, athlete.userName || athlete.displayName, 40)}
                    <div>
                      <span style={{ fontSize: "13.5px", fontWeight: 800, color: "#f8fafc", display: "block" }}>
                        {athlete.userName || athlete.displayName || "Athlete"}
                      </span>
                      <span style={{ fontSize: "10.5px", color: "#64748b", fontWeight: 600 }}>
                        {athlete.userTitle || "Fitness Member"} • 🔥 {athlete.streakDays || 0}d
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    style={{
                      background: "#1e293b",
                      border: "1px solid #334155",
                      color: "#38bdf8",
                      borderRadius: "10px",
                      padding: "6px 12px",
                      fontSize: "11px",
                      fontWeight: 800
                    }}
                  >
                    View
                  </button>
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", padding: "40px 16px", background: "#131b2e", borderRadius: "16px", border: "1px dashed #1e293b", color: "#64748b" }}>
                <i className="fa-solid fa-users" style={{ fontSize: "32px", color: "#334155", marginBottom: "8px", display: "block" }}></i>
                <div style={{ fontSize: "13.5px", fontWeight: 800, color: "#ffffff" }}>No Boosters yet</div>
                <p style={{ fontSize: "11.5px", marginTop: "4px" }}>
                  Share your runs and workouts in the Community Feed to gain boosters!
                </p>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 3: BOOSTING (FOLLOWING) LIST ─── */}
        {profileSubTab === "boosting" && (
          <div>
            {myBoostingList.length > 0 ? (
              myBoostingList.map((athlete) => (
                <div
                  key={athlete.uid || athlete.id}
                  onClick={() => handleOpenAthlete(athlete)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    background: "#131b2e",
                    borderRadius: "14px",
                    border: "1px solid #1e293b",
                    marginBottom: "8px",
                    cursor: "pointer"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {renderAvatar(athlete.avatarUrl || athlete.photoURL, athlete.userName || athlete.displayName, 40)}
                    <div>
                      <span style={{ fontSize: "13.5px", fontWeight: 800, color: "#f8fafc", display: "block" }}>
                        {athlete.userName || athlete.displayName || "Athlete"}
                      </span>
                      <span style={{ fontSize: "10.5px", color: "#64748b", fontWeight: 600 }}>
                        {athlete.userTitle || "Fitness Member"} • 🔥 {athlete.streakDays || 0}d
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    style={{
                      background: "#1e293b",
                      border: "1px solid #334155",
                      color: "#38bdf8",
                      borderRadius: "10px",
                      padding: "6px 12px",
                      fontSize: "11px",
                      fontWeight: 800
                    }}
                  >
                    View
                  </button>
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", padding: "40px 16px", background: "#131b2e", borderRadius: "16px", border: "1px dashed #1e293b", color: "#64748b" }}>
                <i className="fa-solid fa-user-plus" style={{ fontSize: "32px", color: "#334155", marginBottom: "8px", display: "block" }}></i>
                <div style={{ fontSize: "13.5px", fontWeight: 800, color: "#ffffff" }}>Not boosting any athletes yet</div>
                <p style={{ fontSize: "11.5px", marginTop: "4px", marginBottom: "14px" }}>
                  Find runners and gym enthusiasts in the Community to boost!
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab && setActiveTab("community")}
                  style={{
                    padding: "8px 16px",
                    background: "#1e293b",
                    border: "1px solid #334155",
                    color: "#38bdf8",
                    borderRadius: "12px",
                    fontSize: "11.5px",
                    fontWeight: 800,
                    cursor: "pointer"
                  }}
                >
                  Explore Leaderboard 🔍
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* 📝 EDIT PASSPORT MODAL */}
      {isEditingProfile && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          backdropFilter: "blur(4px)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px"
        }}>
          <div style={{
            background: "#131b2e",
            border: "1px solid #1e293b",
            borderRadius: "20px",
            width: "100%",
            maxWidth: "400px",
            padding: "20px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.5)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 900, color: "#ffffff" }}>
                Edit Athlete Passport
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                style={{ background: "#1e293b", border: "none", width: "28px", height: "28px", borderRadius: "50%", color: "#94a3b8", cursor: "pointer", fontWeight: 800 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "10.5px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                  Athlete Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", background: "#0b0f19", border: "1px solid #1e293b", color: "#f8fafc", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                  placeholder="e.g. Edison Runner"
                />
              </div>

              <div>
                <label style={{ fontSize: "10.5px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                  Discipline / Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", background: "#0b0f19", border: "1px solid #1e293b", color: "#f8fafc", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                  placeholder="e.g. 10K Runner & Calisthenics"
                />
              </div>

              <div>
                <label style={{ fontSize: "10.5px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                  Bio / Goal
                </label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={3}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", background: "#0b0f19", border: "1px solid #1e293b", color: "#f8fafc", fontSize: "13px", outline: "none", resize: "none", boxSizing: "border-box" }}
                  placeholder="Tell the community about your fitness goals..."
                />
              </div>

              <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  style={{ flex: 1, padding: "10px", background: "#1e293b", color: "#94a3b8", border: "none", borderRadius: "10px", fontWeight: 800, fontSize: "12px", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{ flex: 1, padding: "10px", background: "linear-gradient(135deg, #0284c7 0%, #4f46e5 100%)", color: "#ffffff", border: "none", borderRadius: "10px", fontWeight: 800, fontSize: "12px", cursor: isSaving ? "not-allowed" : "pointer" }}
                >
                  {isSaving ? "Saving..." : "Save Passport"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
