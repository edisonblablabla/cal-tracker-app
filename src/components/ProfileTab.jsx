import ConfirmModal from "./ConfirmModal";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { db } from "../services/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  increment,
  arrayUnion,
  arrayRemove
} from "firebase/firestore";
import { getAuth, signOut } from "firebase/auth";
import { auth } from "../services/firebase";

export default function ProfileTab({
  handleSignOut,
  user,
  appData,
  saveToCloud,
  setAppData,
  handleDirectAvatarChange,
  handleDirectCoverChange,
  coverPreview,
  avatarPreview,
  setActiveTab,
  setSelectedVisitor,
  setActivePanel,
  setSelectedPost,
  showToast,
  formatPostTime = (ts) => "Just now",
  profPostText = "",
  setProfPostText,
  profImagePreview = null,
  setProfImagePreview,
  profPostVisibility = "public",
  setProfPostVisibility,
  handleImageChange,
  createPost,
  isPublishing = false
}) {
  const [profileSubTab, setProfileSubTab] = useState("activities");
  const [showComposer, setShowComposer] = useState(false);
  const profFileInputRef = useRef(null); // "activities" | "boosters" | "boosting"
  const [myPosts, setMyPosts] = useState([]);
  const [allAthletes, setAllAthletes] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Modals & Panels states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [saveSuccessPopup, setSaveSuccessPopup] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState(null);
  const [activePostMenuId, setActivePostMenuId] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [editText, setEditText] = useState("");
  const [isSavingPost, setIsSavingPost] = useState(false);

  // Built-in Activity Huddle Drawer
  const [activeHuddlePost, setActiveHuddlePost] = useState(null);
  const [huddleComments, setHuddleComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState(null);

  // Edit Profile form states
  const [editName, setEditName] = useState(appData?.userName || user?.displayName || "");
  const [editTitle, setEditTitle] = useState(appData?.userTitle || "Fitness Enthusiast");
  const [editBio, setEditBio] = useState(appData?.userBio || "Crushing daily fitness goals.");
  const [settingsSubTab, setSettingsSubTab] = useState("identity"); // "identity" | "metrics" | "goals"
  const [editHeight, setEditHeight] = useState(appData?.height || "165");
  const [editWeight, setEditWeight] = useState(appData?.weight || "60");
  const [editActivityLevel, setEditActivityLevel] = useState(appData?.activityLevel || "moderate");
  const [editObjective, setEditObjective] = useState(appData?.primaryObjective || appData?.objective || "maintain");
  const [editBurnGoal, setEditBurnGoal] = useState(appData?.targetBurn || appData?.dailyBurnGoal || 500);
  const [editStepGoal, setEditStepGoal] = useState(appData?.stepGoal || 8000);

  useEffect(() => {
    if (isEditingProfile && appData) {
      if (appData.userName || user?.displayName) setEditName(appData.userName || user?.displayName || "");
      if (appData.userTitle) setEditTitle(appData.userTitle);
      if (appData.userBio) setEditBio(appData.userBio);
      if (appData.height) setEditHeight(String(appData.height));
      if (appData.weight) setEditWeight(String(appData.weight));
      if (appData.activityLevel) setEditActivityLevel(appData.activityLevel);
      if (appData.primaryObjective || appData.objective) setEditObjective(appData.primaryObjective || appData.objective);
      if (appData.targetBurn || appData.dailyBurnGoal) setEditBurnGoal(appData.targetBurn || appData.dailyBurnGoal);
      if (appData.stepGoal) setEditStepGoal(appData.stepGoal);
    }
  }, [isEditingProfile, appData, user]);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // 🧭 BACK BUTTON NAVIGATION LISTENER
  useEffect(() => {
    const handlePopState = (e) => {
      const drawer = e.state?.profileDrawer;
      if (!drawer) {
        setViewingPhoto(null);
        setActiveHuddlePost(null);
        setIsEditingProfile(false);
        setEditingPost(null);
        setActivePostMenuId(null);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const openLayer = (layerName, fn) => {
    try { window.history.pushState({ profileDrawer: layerName }, ""); } catch (e) {}
    fn();
  };

  const closeCurrentLayer = () => {
    if (window.history.state?.profileDrawer) {
      try { window.history.back(); return; } catch (e) {}
    }
    if (viewingPhoto) { setViewingPhoto(null); return; }
    if (activeHuddlePost) { setActiveHuddlePost(null); return; }
    if (activeVisitorProfile) { return; }
    if (isEditingProfile) { setIsEditingProfile(false); return; }
    if (editingPost) { setEditingPost(null); return; }
  };

  // ─── 1. REALTIME LISTENER SA SARILING POSTS ───
  useEffect(() => {
    if (!user?.uid) return;
    setLoadingPosts(true);
    try {
      const q = query(collection(db, "posts"), where("userId", "==", user.uid));
      const unsub = onSnapshot(q, (snapshot) => {
        const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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

  // ─── 2. REALTIME LISTENER SA LAHAT NG ATHLETES (PARA SA BOOSTERS AT BOOSTING) ───
  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
        const users = snapshot.docs.map(doc => ({ uid: doc.id, id: doc.id, ...doc.data() }));
        setAllAthletes(users);
      }, (err) => console.error("Error fetching network users:", err));
      return () => unsub();
    } catch (e) {
      console.error(e);
    }
  }, []);

  // ─── 3. REALTIME COMMENTS SA ACTIVE HUDDLE POST ───
  useEffect(() => {
    if (!activeHuddlePost?.id) {
      setHuddleComments([]);
      return;
    }
    try {
      const unsub = onSnapshot(collection(db, "posts", activeHuddlePost.id, "comments"), (snapshot) => {
        const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        comments.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        setHuddleComments(comments);
      });
      return () => unsub();
    } catch (e) {
      console.error(e);
    }
  }, [activeHuddlePost?.id]);

  // ─── 4. BOOSTERS & BOOSTING LIST DATA ───
  const myBoostingList = useMemo(() => {
    const boostingIds = appData?.boosting || [];
    return allAthletes.filter(u => boostingIds.includes(u.uid || u.id));
  }, [allAthletes, appData?.boosting]);

  const myBoostersList = useMemo(() => {
    if (!user?.uid) return [];
    return allAthletes.filter(u => Array.isArray(u.boosting) && u.boosting.includes(user.uid));
  }, [allAthletes, user?.uid]);

  // ─── 5. STREAK AT TELEMETRY DATA ───
  const currentStreak = useMemo(() => {
    return Number(appData?.streakDays || 0);
  }, [appData?.streakDays]);

  const isStreakActiveToday = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return appData?.lastActiveDate === todayStr;
  }, [appData?.lastActiveDate]);

  const totalDistance = useMemo(() => {
    const rawDist = Number(appData?.totalDistance || appData?.distanceKm || 0);
    const stepDist = (Number(appData?.steps || appData?.todaySteps || 0) * 0.00075);
    const maxD = Math.max(rawDist, stepDist);
    return maxD > 0 && maxD < 10 ? maxD.toFixed(2) : maxD.toFixed(1);
  }, [appData?.totalDistance, appData?.distanceKm, appData?.steps]);

  const totalCalories = useMemo(() => {
    return Number(appData?.todayBurnedCal || appData?.caloriesBurned || 0);
  }, [appData?.todayBurnedCal, appData?.caloriesBurned]);

  // ─── ROBUST AVATAR RENDERER ───
  const renderAvatar = (photoUrl, name = "Athlete", size = 44, border = "none") => {
    const pStr = typeof photoUrl === "string" ? photoUrl.trim() : "";
    const hasPhoto = pStr && (pStr.startsWith("http") || pStr.startsWith("data:image/") || pStr.startsWith("blob:")) && !pStr.includes("pravatar");

    if (hasPhoto) {
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
        border: border,
        flexShrink: 0
      }}>
        {initial}
      </div>
    );
  };

  // ─── HANDLERS ───
  const handleOpenAthlete = (athlete) => {
    if (!athlete) return;
    const targetUid = athlete.uid || athlete.id;
    if (targetUid === user?.uid) return;
    if (typeof setSelectedVisitor === "function") setSelectedVisitor(athlete);
    if (typeof setActivePanel === "function") setActivePanel("visitor_profile");
  };

  const handleOpenHuddle = (post) => {
    if (!post) return;
    if (typeof setSelectedPost === "function") setSelectedPost(post);
    openLayer("huddle", () => setActiveHuddlePost(post));
  };

  
  const handleLogout = () => {
    setConfirmModalConfig({
      title: "Sign Out",
      message: "Sigurado ka bang nais mong mag-sign out sa NutriPulse?",
      confirmText: "Sign Out",
      confirmColor: "#ef4444",
      icon: "fa-right-from-bracket",
      onConfirm: async () => {
        setConfirmModalConfig(null);
        try {
          if (typeof handleSignOut === "function") {
            await handleSignOut();
          } else {
            const authInstance = (typeof auth !== "undefined" && auth) ? auth : getAuth();
            await signOut(authInstance);
          }
          setSaveSuccessPopup(true);
      if (showToast) showToast("Athlete Settings saved & synchronized! ⚡");
        } catch (err) {
          console.error("Sign out error:", err);
          try { await signOut(getAuth()); } catch (e) {}
        }
      }
    });
  };

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    if (!user?.uid) return;
    setIsSavingProfile(true);
    try {
      const numWeight = parseFloat(editWeight) || Number(appData?.weight) || 60;
      const numHeight = parseFloat(editHeight) || Number(appData?.height) || 165;

      // 1. Kalkulahin ang bagong BMR at TDEE base sa updated metrics
      let actMultiplier = 1.55;
      const currentAct = editActivityLevel || appData?.activityLevel || "moderate";
      if (currentAct === "sedentary") actMultiplier = 1.2;
      else if (currentAct === "light") actMultiplier = 1.375;
      else if (currentAct === "moderate") actMultiplier = 1.55;
      else if (currentAct === "active") actMultiplier = 1.725;

      const bmr = (10 * numWeight) + (6.25 * numHeight) - (5 * 25) + 5;
      const tdee = Math.round(bmr * actMultiplier);

      // 2. I-recalculate ang targets ayon sa kasalukuyang active strategy sa Goals Tab
      const activeType = appData?.activeGoalType || "jogger";
      let baseGoal = tdee;
      let pGoal = Math.round(numWeight * 2.0);
      let cGoal = Math.round(numWeight * 3.2);
      let fGoal = Math.round(numWeight * 0.9);
      let dailyStepsTarget = appData?.dailyStepsTarget || 10000;
      let dailyBurnTarget = appData?.dailyBurnTarget || 450;

      if (activeType === "jogger") {
        baseGoal = tdee + 100; pGoal = Math.round(numWeight * 1.8); cGoal = Math.round(numWeight * 4.5); fGoal = Math.round(numWeight * 0.9);
        dailyStepsTarget = 8000; dailyBurnTarget = 500;
      } else if (activeType === "marathon") {
        baseGoal = tdee + 400; pGoal = Math.round(numWeight * 1.8); cGoal = Math.round(numWeight * 6.0); fGoal = Math.round(numWeight * 1.0);
        dailyStepsTarget = 15000; dailyBurnTarget = 750;
      } else if (activeType === "steps") {
        baseGoal = Math.max(1200, tdee - 250); pGoal = Math.round(numWeight * 2.0); cGoal = Math.round(numWeight * 3.2); fGoal = Math.round(numWeight * 0.8);
        dailyStepsTarget = 10000; dailyBurnTarget = 450;
      } else if (activeType === "bulk") {
        baseGoal = tdee + 250; pGoal = Math.round(numWeight * 2.2); cGoal = Math.round(numWeight * 4.0); fGoal = Math.round(numWeight * 1.0);
        dailyStepsTarget = 6000; dailyBurnTarget = 350;
      } else if (activeType === "cut") {
        baseGoal = Math.max(1200, tdee - 450); pGoal = Math.round(numWeight * 2.4); cGoal = Math.round(numWeight * 2.0); fGoal = Math.round(numWeight * 0.8);
        dailyStepsTarget = 12000; dailyBurnTarget = 600;
      } else if (activeType === "recomp") {
        baseGoal = tdee; pGoal = Math.round(numWeight * 2.2); cGoal = Math.round(numWeight * 3.0); fGoal = Math.round(numWeight * 0.9);
        dailyStepsTarget = 8000; dailyBurnTarget = 450;
      } else if (activeType === "dirty") {
        baseGoal = tdee + 600; pGoal = Math.round(numWeight * 2.0); cGoal = Math.round(numWeight * 5.0); fGoal = Math.round(numWeight * 1.2);
        dailyStepsTarget = 5000; dailyBurnTarget = 300;
      } else if (activeType === "maint") {
        baseGoal = tdee; pGoal = Math.round(numWeight * 2.0); cGoal = Math.round(numWeight * 3.2); fGoal = Math.round(numWeight * 0.9);
        dailyStepsTarget = 8000; dailyBurnTarget = 400;
      }

      // 3. I-update ang weight history kapag may aktwal na pagbabago sa timbang
      let updatedHistory = Array.isArray(appData?.weightHistory) ? [...appData.weightHistory] : [];
      if (appData?.weight && Number(appData.weight) !== numWeight) {
        updatedHistory.push({
          id: Date.now(), val: numWeight, weight: numWeight, date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }), timestamp: Date.now()
        });
      }

      const payload = {
        ...(appData || {}),
        userName: editName.trim() || "Athlete",
        userTitle: editTitle.trim() || "Fitness Enthusiast",
        userBio: editBio.trim() || "",
        weight: numWeight,
        currentWeight: numWeight,
        prevWeight: appData?.weight || numWeight,
        height: numHeight,
        activityLevel: currentAct,
        primaryObjective: editObjective || "maintain",
        baseGoal,
        targetCalories: baseGoal,
        pGoal,
        cGoal,
        fGoal,
        dailyStepsTarget,
        dailyBurnTarget,
        weightHistory: updatedHistory
      };

      // 4. Direktang i-sync sa React State sa App.jsx at Firestore Cloud
      if (typeof saveToCloud === "function") {
        await saveToCloud(payload);
      } else {
        if (typeof setAppData === "function") setAppData(payload);
        await updateDoc(doc(db, "users", user.uid), payload);
      }

      setSaveSuccessPopup(true);
      if (showToast) showToast("Athlete Settings saved & synchronized! ⚡");
    } catch (err) {
      console.error(err);
      if (showToast) showToast("Failed to update profile: " + err.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDeletePost = (postId) => {
    setConfirmModalConfig({
      title: "Delete Activity",
      message: "Permanently delete this activity log from your passport?",
      confirmText: "Delete",
      confirmColor: "#ef4444",
      icon: "fa-trash",
      onConfirm: async () => {
        setConfirmModalConfig(null);
        try {
          await deleteDoc(doc(db, "posts", postId));
          setActivePostMenuId(null);
          if (showToast) showToast("Activity deleted.");
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  const handleOpenEditPostModal = (post) => {
    setActivePostMenuId(null);
    setEditingPost(post);
    setEditText(post.text || "");
    openLayer("edit_post", () => {});
  };

  const handleSaveEditedPost = async (e) => {
    if (e) e.preventDefault();
    if (!editingPost?.id) return;
    setIsSavingPost(true);
    try {
      await updateDoc(doc(db, "posts", editingPost.id), {
        text: editText.trim(),
        isEdited: true,
        editedAt: Date.now()
      });
      setEditingPost(null);
      if (showToast) showToast("Post updated! ⚡");
    } catch (err) {
      console.error(err);
      if (showToast) showToast("Failed to update post.");
    } finally {
      setIsSavingPost(false);
    }
  };

  const handleAddComment = async (e) => {
    if (e) e.preventDefault();
    if (!newCommentText.trim() || !activeHuddlePost?.id || !user) return;
    setIsSubmittingComment(true);
    const textToSend = newCommentText.trim();
    const myName = appData?.userName || user.displayName || "Athlete";
    const myAvatar = appData?.avatarUrl || avatarPreview || user?.photoURL || "";

    try {
      await addDoc(collection(db, "posts", activeHuddlePost.id, "comments"), {
        text: textToSend,
        userId: user.uid,
        userName: myName,
        userAvatar: myAvatar,
        createdAt: Date.now()
      });
      await updateDoc(doc(db, "posts", activeHuddlePost.id), {
        commentsCount: increment(1)
      });
      setNewCommentText("");
      if (showToast) showToast("Comment sent! ⚡");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleToggleBoostAthlete = async (targetUid) => {
    if (!user?.uid || !targetUid) return;
    const isCurrentlyBoosting = (appData?.boosting || []).includes(targetUid);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        boosting: isCurrentlyBoosting ? arrayRemove(targetUid) : arrayUnion(targetUid)
      });
      if (showToast) showToast(isCurrentlyBoosting ? "Removed boost" : "Athlete Boosted! ⚡");
    } catch (err) {
      console.error(err);
    }
  };

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
    zIndex: 4500,
    transform: isOpen ? "translateX(0)" : "translateX(105%)",
    visibility: isOpen ? "visible" : "hidden",
    pointerEvents: isOpen ? "auto" : "none",
    transition: "transform 0.28s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.28s",
    boxShadow: isOpen ? "-8px 0 28px rgba(15, 23, 42, 0.15)" : "none",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxSizing: "border-box"
  });

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh", paddingBottom: "90px", margin: 0, padding: 0, fontFamily: "sans-serif" }}>

      {/* 📌 TOP HEADER: ATHLETE PROFILE + SETTINGS GEAR LOGO */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, width: "100%", backgroundColor: "#ffffff", borderBottom: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(15, 23, 42, 0.04)", zIndex: 2000, margin: 0, padding: 0, boxSizing: "border-box" }}>
        <div style={{ height: "52px", padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: "480px", margin: "0 auto", boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
          <div style={{
            width: "30px",
            height: "30px",
            borderRadius: "8px",
            background: "linear-gradient(135deg, #4f46e5 0%, #38bdf8 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 6px rgba(79, 70, 229, 0.25)"
          }}>
            <i className="fa-solid fa-user-gear" style={{ color: "#ffffff", fontSize: "14px" }}></i>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "15px", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.2px", lineHeight: 1.1 }}>
              Athlete Profile
            </h1>
            <span style={{ fontSize: "8px", fontWeight: 800, color: "#0284c7", letterSpacing: "0.8px", display: "block" }}>
              NUTRIPULSE PASSPORT
            </span>
          </div>
        </div>

        {/* ⚙️ SETTINGS GEAR BUTTON */}
        <button
          type="button"
          onClick={() => {
            setEditName(appData?.userName || user?.displayName || "");
            setEditTitle(appData?.userTitle || "Fitness Enthusiast");
            setEditBio(appData?.userBio || "Crushing daily fitness goals.");
            openLayer("settings", () => setIsEditingProfile(true));
          }}
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "#f1f5f9",
            border: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#334155",
            transition: "all 0.15s ease"
          }}
          title="Profile Settings"
        >
          <i className="fa-solid fa-gear" style={{ fontSize: "16px" }}></i>
        </button>
      </div>

      </div>
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "10px clamp(8px, 2.5vw, 14px)", paddingTop: "60px", boxSizing: "border-box" }}>

        {/* 🪪 CLEAN ATHLETE IDENTITY CARD (LIGHT SYSTEM THEME) */}
        <div style={{
          background: "#ffffff",
          borderRadius: "18px",
          padding: "14px clamp(10px, 3vw, 16px)", border: "1px solid #e2e8f0", boxShadow: "0 2px 10px rgba(15, 23, 42, 0.04)", boxSizing: "border-box"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{
              padding: "2.5px",
              borderRadius: "50%",
              background: currentStreak >= 3 ? "linear-gradient(135deg, #eab308 0%, #f97316 100%)" : "linear-gradient(135deg, #4f46e5 0%, #38bdf8 100%)",
              boxShadow: currentStreak >= 3 ? "0 3px 10px rgba(234, 179, 8, 0.3)" : "0 3px 10px rgba(56, 189, 248, 0.25)",
              flexShrink: 0
            }}>
              {renderAvatar(appData?.avatarUrl || avatarPreview || user?.photoURL, appData?.userName || user?.displayName, 62, "2px solid #ffffff")}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 900, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {appData?.userName || user?.displayName || "Athlete"}
                </h2>
                <i className="fa-solid fa-circle-check" style={{ color: "#0284c7", fontSize: "14px" }}></i>
              </div>
              <span style={{ fontSize: "12px", fontWeight: 800, color: "#0284c7", display: "inline-block", background: "rgba(56, 189, 248, 0.12)", padding: "2px 8px", borderRadius: "10px", marginTop: "3px" }}>
                {appData?.userTitle || "Fitness Enthusiast"}
              </span>
              <p style={{ margin: "6px 0 0 0", fontSize: "12px", color: "#475569", lineHeight: 1.4 }}>
                {appData?.userBio || "Crushing daily fitness goals."}
              </p>
            </div>
          </div>

          {/* ⚡ 3 PERFORMANCE METRICS TILES (BULLETPROOF NO-OVERFLOW) */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px", marginTop: "14px" }}>
              
              {/* 1. STREAK TILE */}
              <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "8px 4px", border: "1px solid #e2e8f0", textAlign: "center", boxSizing: "border-box", minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                  <i className="fa-solid fa-fire" style={{ color: currentStreak >= 3 ? "#f97316" : (currentStreak >= 1 ? "#eab308" : "#94a3b8"), fontSize: "13px" }}></i>
                  <span style={{ fontSize: "clamp(14px, 3.8vw, 16px)", fontWeight: 900, color: currentStreak >= 3 ? "#f97316" : "#0f172a", lineHeight: 1 }}>
                    {currentStreak}
                  </span>
                </div>
                <div style={{ fontSize: "clamp(8.5px, 2.3vw, 9.5px)", fontWeight: 800, color: "#64748b", textTransform: "uppercase", marginTop: "3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  STREAK
                </div>
                <div style={{ fontSize: "clamp(7.5px, 2vw, 8.5px)", color: isStreakActiveToday ? "#10b981" : "#f59e0b", fontWeight: 800, marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {isStreakActiveToday ? "● Active" : "○ Needs log"}
                </div>
              </div>

              {/* 2. TOTAL DISTANCE TILE (GPS + STEPS) */}
              <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "8px 4px", border: "1px solid #e2e8f0", textAlign: "center", boxSizing: "border-box", minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                  <i className="fa-solid fa-person-running" style={{ color: "#0284c7", fontSize: "13px" }}></i>
                  <span style={{ fontSize: "clamp(14px, 3.8vw, 16px)", fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>
                    {totalDistance}
                  </span>
                </div>
                <div style={{ fontSize: "clamp(8.5px, 2.3vw, 9.5px)", fontWeight: 800, color: "#64748b", textTransform: "uppercase", marginTop: "3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  DISTANCE
                </div>
                <div style={{ fontSize: "clamp(7.5px, 2vw, 8.5px)", color: "#64748b", fontWeight: 700, marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  km (GPS/Steps)
                </div>
              </div>

              {/* 3. CALORIES BURNED TILE */}
              <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "8px 4px", border: "1px solid #e2e8f0", textAlign: "center", boxSizing: "border-box", minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                  <i className="fa-solid fa-bolt" style={{ color: "#f97316", fontSize: "13px" }}></i>
                  <span style={{ fontSize: "clamp(14px, 3.8vw, 16px)", fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>
                    {totalCalories}
                  </span>
                </div>
                <div style={{ fontSize: "clamp(8.5px, 2.3vw, 9.5px)", fontWeight: 800, color: "#64748b", textTransform: "uppercase", marginTop: "3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  ACTIVE BURN
                </div>
                <div style={{ fontSize: "clamp(7.5px, 2vw, 8.5px)", color: "#64748b", fontWeight: 700, marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  kcal burned
                </div>
              </div>

            </div>
          </div>

          {/* 🎛️ SEGMENTED CONTROL TABS (SINGLE-LINE NO TEXT BREAK) */}
          <div style={{
            display: "flex",
            background: "#f1f5f9",
            borderRadius: "10px",
            padding: "3px",
            margin: "12px 0",
            border: "1px solid #e2e8f0",
            gap: "3px",
            boxSizing: "border-box"
          }}>
            <button
              type="button"
              onClick={() => setProfileSubTab("activities")}
              style={{
                flex: 1,
                padding: "7px 2px",
                borderRadius: "8px",
                border: "none",
                fontSize: "clamp(10px, 2.7vw, 11.5px)",
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "4px",
                background: profileSubTab === "activities" ? "#ffffff" : "transparent",
                color: profileSubTab === "activities" ? "#0f172a" : "#64748b",
                boxShadow: profileSubTab === "activities" ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease"
              }}
            >
              <i className="fa-solid fa-route" style={{ color: profileSubTab === "activities" ? "#0284c7" : "#94a3b8", fontSize: "11px" }}></i>
              <span>Activities ({myPosts.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setProfileSubTab("boosters")}
              style={{
                flex: 1,
                padding: "7px 2px",
                borderRadius: "8px",
                border: "none",
                fontSize: "clamp(10px, 2.7vw, 11.5px)",
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "4px",
                background: profileSubTab === "boosters" ? "#ffffff" : "transparent",
                color: profileSubTab === "boosters" ? "#0f172a" : "#64748b",
                boxShadow: profileSubTab === "boosters" ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease"
              }}
            >
              <i className="fa-solid fa-users" style={{ color: profileSubTab === "boosters" ? "#10b981" : "#94a3b8", fontSize: "11px" }}></i>
              <span>Boosters ({myBoostersList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setProfileSubTab("boosting")}
              style={{
                flex: 1,
                padding: "7px 2px",
                borderRadius: "8px",
                border: "none",
                fontSize: "clamp(10px, 2.7vw, 11.5px)",
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "4px",
                background: profileSubTab === "boosting" ? "#ffffff" : "transparent",
                color: profileSubTab === "boosting" ? "#0f172a" : "#64748b",
                boxShadow: profileSubTab === "boosting" ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease"
              }}
            >
              <i className="fa-solid fa-user-plus" style={{ color: profileSubTab === "boosting" ? "#6366f1" : "#94a3b8", fontSize: "11px" }}></i>
              <span>Boosting ({myBoostingList.length})</span>
            </button>
          </div>

          {/* ─── TAB 1: ACTIVITIES (MAY 3 DOTS MENU & TAP TO OPEN HUDDLE) ─── */}
        {profileSubTab === "activities" && (
          <div>
              {/* ─── ✍️ PULSE FEED 1:1 COMPOSER (COLLAPSIBLE PILL TO EXPANDED) ─── */}
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "14px",
                  padding: "12px 14px",
                  marginBottom: "16px",
                  border: "1px solid #f1f5f9",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
                }}
              >
                {!showComposer ? (
                  <div
                    onClick={() => setShowComposer(true)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      cursor: "pointer"
                    }}
                  >
                    {renderAvatar(avatarPreview || appData?.avatarUrl || user?.photoURL, appData?.userName || user?.displayName || "You", 28)}
                    <span style={{ color: "#94a3b8", fontSize: "12.5px", flex: 1 }}>
                      Share your latest sweat session... 🏃🚴
                    </span>
                    <i className="fa-solid fa-camera" style={{ color: "#4f46e5", fontSize: "16px" }}></i>
                  </div>
                ) : (
                  <div>
                    <textarea
                      value={profPostText || ""}
                      onChange={(e) => setProfPostText && setProfPostText(e.target.value)}
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

                    {profImagePreview && (
                      <div style={{ position: "relative", marginTop: "8px", borderRadius: "10px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                        <img
                          src={profImagePreview}
                          alt="Attached"
                          style={{ width: "100%", maxHeight: "240px", objectFit: "contain", display: "block", background: "#0f172a" }}
                        />
                        <button
                          type="button"
                          onClick={() => setProfImagePreview && setProfImagePreview(null)}
                          style={{
                            position: "absolute",
                            top: "6px",
                            right: "6px",
                            background: "rgba(15,23,42,0.75)",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "50%",
                            width: "24px",
                            height: "24px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", flexWrap: "wrap", gap: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", color: "#64748b", fontSize: "12px", fontWeight: 700 }}>
                          <i className="fa-solid fa-image" style={{ color: "#4f46e5", fontSize: "15px" }}></i>
                          <span>Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (handleImageChange) {
                                handleImageChange(e, true);
                              }
                              if (e.target.files && e.target.files[0]) {
                                const reader = new FileReader();
                                reader.onload = (ev) => setProfImagePreview && setProfImagePreview(ev.target.result);
                                reader.readAsDataURL(e.target.files[0]);
                              }
                            }}
                            style={{ display: "none" }}
                          />
                        </label>

                        <select
                          value={profPostVisibility || "public"}
                          onChange={(e) => setProfPostVisibility && setProfPostVisibility(e.target.value)}
                          style={{
                            background: "#f8fafc",
                            color: "#475569",
                            border: "1px solid #e2e8f0",
                            borderRadius: "6px",
                            padding: "4px 8px",
                            fontSize: "11px",
                            fontWeight: 700,
                            cursor: "pointer",
                            outline: "none"
                          }}
                        >
                          <option value="public">🌐 Public</option>
                          <option value="boosters">👥 Boosters</option>
                        </select>
                      </div>

                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          type="button"
                          onClick={() => {
                            setShowComposer(false);
                            if (setProfPostText) setProfPostText("");
                            if (setProfImagePreview) setProfImagePreview(null);
                          }}
                          style={{
                            padding: "6px 12px",
                            background: "transparent",
                            color: "#64748b",
                            border: "none",
                            fontWeight: 700,
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "12px"
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (createPost) {
                              await createPost(true);
                              setShowComposer(false);
                            }
                          }}
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
            {loadingPosts ? (
              <div style={{ textAlign: "center", padding: "40px 16px", color: "#64748b", fontSize: "13px" }}>
                <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "20px", marginBottom: "8px", display: "block" }}></i>
                Loading activities...
              </div>
            ) : myPosts.length > 0 ? (
              myPosts.map((post) => (
                <div
                  key={post.id}
                  style={{
                    background: "#ffffff",
                    borderRadius: "16px",
                    padding: "14px",
                    border: "1px solid #e2e8f0",
                    marginBottom: "12px",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.02)",
                    position: "relative"
                  }}
                >
                  {/* Card Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {renderAvatar(appData?.avatarUrl || avatarPreview || user?.photoURL, appData?.userName || user?.displayName, 32)}
                      <div>
                        <span style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a", display: "block" }}>
                          {appData?.userName || user?.displayName || "You"}
                        </span>
                        <span style={{ fontSize: "10px", color: "#94a3b8" }}>
                          {formatPostTime(post.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* 3 DOTS MENU (EDIT & DELETE) */}
                    <div style={{ position: "relative" }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePostMenuId(activePostMenuId === post.id ? null : post.id);
                        }}
                        style={{ background: "none", border: "none", color: "#94a3b8", padding: "4px 8px", cursor: "pointer", fontSize: "14px" }}
                        title="Options"
                      >
                        <i className="fa-solid fa-ellipsis-vertical"></i>
                      </button>

                      {activePostMenuId === post.id && (
                        <div style={{
                          position: "absolute",
                          right: 0,
                          top: "24px",
                          background: "#ffffff",
                          borderRadius: "10px",
                          border: "1px solid #e2e8f0",
                          boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
                          zIndex: 100,
                          minWidth: "120px",
                          overflow: "hidden"
                        }}>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleOpenEditPostModal(post); }}
                            style={{ width: "100%", padding: "9px 12px", border: "none", background: "none", textAlign: "left", fontSize: "12px", fontWeight: 700, color: "#334155", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                          >
                            <i className="fa-solid fa-pen" style={{ color: "#0284c7" }}></i> Edit Post
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleDeletePost(post.id); }}
                            style={{ width: "100%", padding: "9px 12px", border: "none", background: "none", textAlign: "left", fontSize: "12px", fontWeight: 700, color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                          >
                            <i className="fa-solid fa-trash"></i> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CLICKABLE POST BODY (OPENS HUDDLE PANEL) */}
                  <div onClick={() => handleOpenHuddle(post)} style={{ cursor: "pointer" }}>
                    {post.text && (
                      <p style={{ margin: "0 0 10px 0", fontSize: "13px", color: "#334155", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                        {post.text}
                      </p>
                    )}

                    {/* Telemetry Grid */}
                    {(post.telemetry || post.distanceKm) && (
                      <div style={{
                        display: "flex",
                        justifyContent: "space-around",
                        background: "#f8fafc",
                        borderRadius: "10px",
                        padding: "8px",
                        border: "1px solid #e2e8f0",
                        marginBottom: "10px"
                      }}>
                        <div style={{ textAlign: "center" }}>
                          <span style={{ fontSize: "9.5px", fontWeight: 800, color: "#64748b", display: "block" }}>DISTANCE</span>
                          <span style={{ fontSize: "13px", fontWeight: 900, color: "#0284c7" }}>
                            {(post.telemetry?.distanceKm || post.distanceKm || 0).toFixed(2)} km
                          </span>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <span style={{ fontSize: "9.5px", fontWeight: 800, color: "#64748b", display: "block" }}>TIME</span>
                          <span style={{ fontSize: "13px", fontWeight: 900, color: "#0f172a" }}>
                            {post.telemetry?.duration || post.duration || "--:--"}
                          </span>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <span style={{ fontSize: "9.5px", fontWeight: 800, color: "#64748b", display: "block" }}>BURN</span>
                          <span style={{ fontSize: "13px", fontWeight: 900, color: "#f97316" }}>
                            +{post.telemetry?.calories || post.caloriesBurned || post.kcal || 0} cal
                          </span>
                        </div>
                      </div>
                    )}

                    {post.imageUrl && (
                      <div style={{ borderRadius: "10px", overflow: "hidden", border: "1px solid #e2e8f0", marginBottom: "8px", background: "#0b0f19" }}>
                        <img src={post.imageUrl} alt="Activity" style={{ width: "100%", maxHeight: "250px", objectFit: "contain", display: "block", margin: "0 auto" }} />
                      </div>
                    )}
                  </div>

                  {/* Reaction / Comment Bar */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px", borderTop: "1px solid #f1f5f9" }}>
                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 700 }}>
                      <i className="fa-solid fa-bolt" style={{ color: "#0284c7" }}></i> {post.likes || 0} Pulses
                    </span>

                    <button
                      type="button"
                      onClick={() => handleOpenHuddle(post)}
                      style={{ background: "transparent", border: "none", color: "#64748b", fontSize: "12px", fontWeight: 700, display: "flex", alignItems: "center", gap: "5px", cursor: "pointer", padding: "4px 8px" }}
                    >
                      <i className="fa-regular fa-comment-dots"></i>
                      <span>Huddle ({post.commentsCount || 0})</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{
                textAlign: "center",
                padding: "40px 16px",
                background: "#ffffff",
                borderRadius: "16px",
                border: "1px dashed #cbd5e1"
              }}>
                <i className="fa-solid fa-person-running" style={{ fontSize: "36px", color: "#cbd5e1", marginBottom: "10px", display: "block" }}></i>
                <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>No activities logged yet</div>
                <p style={{ fontSize: "12px", color: "#64748b", margin: "4px 0 16px 0" }}>
                  Record a walk, run, or workout to start your athletic feed!
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab && setActiveTab("home")}
                  style={{
                    padding: "9px 18px",
                    background: "linear-gradient(135deg, #4f46e5 0%, #38bdf8 100%)",
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

        {/* ─── TAB 2: BOOSTERS (CLICKABLE TO OPEN ATHLETE PROFILE) ─── */}
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
                    background: "#ffffff",
                    borderRadius: "14px",
                    border: "1px solid #e2e8f0",
                    marginBottom: "8px",
                    cursor: "pointer",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {renderAvatar(athlete.avatarUrl || athlete.photoURL, athlete.userName || athlete.displayName, 38)}
                    <div>
                      <span style={{ fontSize: "13.5px", fontWeight: 800, color: "#0f172a", display: "block" }}>
                        {athlete.userName || athlete.displayName || "Athlete"}
                      </span>
                      <span style={{ fontSize: "11px", color: "#64748b" }}>
                        {athlete.userTitle || "Fitness Member"} • 🔥 {athlete.streakDays || 0}d
                      </span>
                    </div>
                  </div>
                  <i className="fa-solid fa-chevron-right" style={{ color: "#cbd5e1", fontSize: "12px" }}></i>
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", padding: "40px 16px", background: "#ffffff", borderRadius: "16px", border: "1px dashed #cbd5e1", color: "#64748b" }}>
                <i className="fa-solid fa-users" style={{ fontSize: "32px", color: "#cbd5e1", marginBottom: "8px", display: "block" }}></i>
                <div style={{ fontSize: "13.5px", fontWeight: 800, color: "#0f172a" }}>No Boosters yet</div>
                <p style={{ fontSize: "11.5px", marginTop: "4px" }}>
                  Share your athletic logs in the Community feed to gain supporters!
                </p>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 3: BOOSTING (CLICKABLE TO OPEN ATHLETE PROFILE) ─── */}
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
                    background: "#ffffff",
                    borderRadius: "14px",
                    border: "1px solid #e2e8f0",
                    marginBottom: "8px",
                    cursor: "pointer",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {renderAvatar(athlete.avatarUrl || athlete.photoURL, athlete.userName || athlete.displayName, 38)}
                    <div>
                      <span style={{ fontSize: "13.5px", fontWeight: 800, color: "#0f172a", display: "block" }}>
                        {athlete.userName || athlete.displayName || "Athlete"}
                      </span>
                      <span style={{ fontSize: "11px", color: "#64748b" }}>
                        {athlete.userTitle || "Fitness Member"} • 🔥 {athlete.streakDays || 0}d
                      </span>
                    </div>
                  </div>
                  <i className="fa-solid fa-chevron-right" style={{ color: "#cbd5e1", fontSize: "12px" }}></i>
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", padding: "40px 16px", background: "#ffffff", borderRadius: "16px", border: "1px dashed #cbd5e1", color: "#64748b" }}>
                <i className="fa-solid fa-user-plus" style={{ fontSize: "32px", color: "#cbd5e1", marginBottom: "8px", display: "block" }}></i>
                <div style={{ fontSize: "13.5px", fontWeight: 800, color: "#0f172a" }}>Not boosting any athletes yet</div>
                <p style={{ fontSize: "11.5px", marginTop: "4px", marginBottom: "14px" }}>
                  Find runners and workout enthusiasts on the Leaderboard!
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab && setActiveTab("community")}
                  style={{
                    padding: "8px 16px",
                    background: "#f1f5f9",
                    border: "1px solid #cbd5e1",
                    color: "#0f172a",
                    borderRadius: "12px",
                    fontSize: "12px",
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

      {/* 💬 BUILT-IN ACTIVITY HUDDLE DRAWER (SINGLE-SCROLL) */}
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

        {/* Unified Scroll Feed */}
        <div style={{ flex: 1, overflowY: "auto", minHeight: 0, paddingBottom: "20px" }}>
          {activeHuddlePost && (
            <div style={{ padding: "16px", background: "#ffffff", borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                {renderAvatar(appData?.avatarUrl || avatarPreview || user?.photoURL, appData?.userName || user?.displayName, 36)}
                <div>
                  <span style={{ fontSize: "13.5px", fontWeight: 800, color: "#0f172a", display: "block" }}>
                    {appData?.userName || user?.displayName || "You"}
                  </span>
                  <span style={{ fontSize: "10px", color: "#94a3b8" }}>
                    {formatPostTime(activeHuddlePost.createdAt)}
                  </span>
                </div>
              </div>

              {activeHuddlePost.text && (
                <p style={{ margin: "0 0 10px 0", fontSize: "13px", color: "#334155", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                  {activeHuddlePost.text}
                </p>
              )}

              {activeHuddlePost.imageUrl && (
                <div
                  onClick={() => openLayer("photo", () => setViewingPhoto(activeHuddlePost.imageUrl))}
                  style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid #e2e8f0", background: "#0b0f19", marginBottom: "6px", cursor: "zoom-in" }}
                >
                  <img src={activeHuddlePost.imageUrl} alt="Activity" style={{ width: "100%", maxHeight: "250px", objectFit: "contain", display: "block", margin: "0 auto" }} />
                </div>
              )}
            </div>
          )}

          {/* Divider */}
          <div style={{ padding: "12px 16px 6px 16px" }}>
            <span style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
              Conversation ({huddleComments.length})
            </span>
          </div>

          {/* Comments List */}
          <div style={{ padding: "6px 16px" }}>
            {huddleComments.length > 0 ? (
              huddleComments.map((c, i) => (
                <div key={c.id || i} style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: "12px", border: "1px solid #f1f5f9", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    {renderAvatar(c.userAvatar, c.userName, 26)}
                    <div>
                      <span style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a" }}>{c.userName}</span>
                      <span style={{ fontSize: "9.5px", color: "#94a3b8", marginLeft: "6px" }}>{formatPostTime(c.createdAt)}</span>
                    </div>
                  </div>
                  <p style={{ margin: "2px 0 0 34px", fontSize: "12.5px", color: "#334155", lineHeight: 1.4, wordBreak: "break-word" }}>
                    {c.text}
                  </p>
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", padding: "24px 16px", color: "#94a3b8", fontSize: "12.5px" }}>
                No comments yet.
              </div>
            )}
          </div>
        </div>

        {/* Pinned Bottom Input */}
        <form onSubmit={handleAddComment} style={{ padding: "10px 14px 14px 14px", borderTop: "1px solid #f1f5f9", backgroundColor: "#ffffff", display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
          <input
            type="text"
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder="Reply to huddle..."
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
              cursor: newCommentText.trim() ? "pointer" : "default"
            }}
          >
            Send
          </button>
        </form>
      </div>

      {/* ⚙️ ATHLETE SETTINGS & PROFILE MANAGEMENT MODAL */}
      {isEditingProfile && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(4px)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
          boxSizing: "border-box"
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "20px",
            width: "100%",
            maxWidth: "400px",
            maxHeight: "min(88dvh, 88vh)", display: "flex", flexDirection: "column", boxShadow: "0 20px 40px rgba(0,0,0,0.22)", overflow: "hidden", position: "relative"
          }}>
            {/* Modal Header */}
            <div style={{
              padding: "16px 20px",
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "rgba(56, 189, 248, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <i className="fa-solid fa-gear" style={{ color: "#0284c7", fontSize: "14px" }}></i>
                </div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 900, color: "#0f172a" }}>
                  Athlete Settings
                </h3>
              </div>
              <button
                type="button"
                onClick={() => { setIsEditingProfile(false); setSaveSuccessPopup(false); }}
                style={{ background: "#f1f5f9", border: "none", width: "28px", height: "28px", borderRadius: "50%", color: "#64748b", cursor: "pointer", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                ✕
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div style={{ padding: "16px 18px 50px 18px", overflowY: "auto", flex: 1, minHeight: 0, WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }}>
              <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {/* Tab Switcher sa loob ng Modal */}
                  <div style={{ display: "flex", gap: "6px", background: "#f1f5f9", padding: "4px", borderRadius: "10px", marginBottom: "4px" }}>
                    <button
                      type="button"
                      onClick={() => setSettingsSubTab("identity")}
                      style={{
                        flex: 1,
                        padding: "7px 0",
                        borderRadius: "8px",
                        border: "none",
                        fontSize: "11.5px",
                        fontWeight: 800,
                        cursor: "pointer",
                        background: settingsSubTab === "identity" ? "#ffffff" : "transparent",
                        color: settingsSubTab === "identity" ? "#0284c7" : "#64748b",
                        boxShadow: settingsSubTab === "identity" ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                        transition: "all 0.15s ease"
                      }}
                    >
                      👤 Identity
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettingsSubTab("metrics")}
                      style={{
                        flex: 1,
                        padding: "7px 0",
                        borderRadius: "8px",
                        border: "none",
                        fontSize: "11.5px",
                        fontWeight: 800,
                        cursor: "pointer",
                        background: settingsSubTab === "metrics" ? "#ffffff" : "transparent",
                        color: settingsSubTab === "metrics" ? "#0284c7" : "#64748b",
                        boxShadow: settingsSubTab === "metrics" ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                        transition: "all 0.15s ease"
                      }}
                    >
                      ⚖️ Body
                    </button>
                    
                  </div>

                  {/* ─── TAB 1: IDENTITY ─── */}
                  {settingsSubTab === "identity" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      
                      {/* 📸 DIRECT AVATAR PHOTO PICKER */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "6px 0 12px", borderBottom: "1px dashed #e2e8f0", gap: "8px" }}>
                        <div style={{ position: "relative", width: "78px", height: "78px" }}>
                          {renderAvatar(avatarPreview || appData?.avatarUrl || user?.photoURL, editName || appData?.userName || "Athlete", 78, "3px solid #0284c7")}
                          <label
                            htmlFor="athlete-settings-avatar-input"
                            style={{
                              position: "absolute",
                              bottom: "-2px",
                              right: "-2px",
                              width: "28px",
                              height: "28px",
                              borderRadius: "50%",
                              background: "linear-gradient(135deg, #0284c7, #38bdf8)",
                              color: "#ffffff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
                              border: "2px solid #ffffff"
                            }}
                            title="Upload Profile Picture"
                          >
                            <i className="fa-solid fa-camera" style={{ fontSize: "12px" }}></i>
                          </label>
                          <input
                            id="athlete-settings-avatar-input"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (typeof handleDirectAvatarChange === "function") {
                                handleDirectAvatarChange(e);
                              } else if (e.target.files && e.target.files[0]) {
                                const reader = new FileReader();
                                reader.onload = async (evt) => {
                                  const url = evt.target.result;
                                  if (typeof saveToCloud === "function") {
                                    await saveToCloud({ ...(appData || {}), avatarUrl: url });
                                  } else {
                                    await updateDoc(doc(db, "users", user.uid), { avatarUrl: url });
                                  }
                                  if (showToast) showToast("Profile avatar updated! ⚡");
                                };
                                reader.readAsDataURL(e.target.files[0]);
                              }
                            }}
                            style={{ display: "none" }}
                          />
                        </div>
                        <label
                          htmlFor="athlete-settings-avatar-input"
                          style={{
                            fontSize: "11.5px",
                            fontWeight: 800,
                            color: "#0284c7",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px"
                          }}
                        >
                          <i className="fa-solid fa-camera"></i> Change Profile Picture
                        </label>
                      </div>
                      <div>
                        <label style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", display: "block", marginBottom: "5px", textTransform: "uppercase" }}>
                          Athlete Name
                        </label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #cbd5e1", color: "#0f172a", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                          placeholder="e.g. Edison Valerio"
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", display: "block", marginBottom: "5px", textTransform: "uppercase" }}>
                          Discipline / Title
                        </label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #cbd5e1", color: "#0f172a", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                          placeholder="e.g. Fitness Enthusiast"
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", display: "block", marginBottom: "5px", textTransform: "uppercase" }}>
                          Bio / Fitness Motto
                        </label>
                        <textarea
                          value={editBio}
                          onChange={(e) => setEditBio(e.target.value)}
                          rows={3}
                          style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #cbd5e1", color: "#0f172a", fontSize: "13px", outline: "none", resize: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                          placeholder="Tell your fitness journey..."
                        />
                      </div>

                      <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "12px", border: "1px solid #e2e8f0" }}>
                        <span style={{ fontSize: "10.5px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", display: "block" }}>
                          Signed-in Account
                        </span>
                        <span style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a", display: "block", marginTop: "3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {user?.email || "Athlete User"}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* ─── TAB 2: BODY METRICS ─── */}
                  {settingsSubTab === "metrics" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        <div>
                          <label style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", display: "block", marginBottom: "5px", textTransform: "uppercase" }}>
                            Weight (kg)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={editWeight}
                            onChange={(e) => setEditWeight(e.target.value)}
                            style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #cbd5e1", color: "#0f172a", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                            placeholder="60"
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", display: "block", marginBottom: "5px", textTransform: "uppercase" }}>
                            Height (cm)
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            value={editHeight}
                            onChange={(e) => setEditHeight(e.target.value)}
                            style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #cbd5e1", color: "#0f172a", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                            placeholder="165"
                          />
                        </div>
                      </div>

                      {/* Live Calculated BMI */}
                      {(() => {
                        const w = parseFloat(editWeight);
                        const h = parseFloat(editHeight) / 100;
                        if (w > 0 && h > 0) {
                          const bmi = (w / (h * h)).toFixed(1);
                          let status = "Normal";
                          let color = "#10b981";
                          let bg = "rgba(16, 185, 129, 0.1)";
                          if (bmi < 18.5) { status = "Underweight"; color = "#f59e0b"; bg = "rgba(245, 158, 11, 0.1)"; }
                          else if (bmi >= 25 && bmi < 30) { status = "Overweight"; color = "#f97316"; bg = "rgba(249, 115, 22, 0.1)"; }
                          else if (bmi >= 30) { status = "Obese"; color = "#ef4444"; bg = "rgba(239, 68, 68, 0.1)"; }

                          return (
                            <div style={{ background: bg, border: "1px solid " + color + "40", borderRadius: "12px", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div>
                                <span style={{ fontSize: "11px", fontWeight: 800, color: "#475569", textTransform: "uppercase" }}>Calculated BMI</span>
                                <div style={{ fontSize: "16px", fontWeight: 900, color }}>{bmi} <span style={{ fontSize: "12px", fontWeight: 700 }}>kg/m²</span></div>
                              </div>
                              <span style={{ fontSize: "12px", fontWeight: 800, padding: "4px 10px", borderRadius: "20px", background: color, color: "#ffffff" }}>
                                {status}
                              </span>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      <div>
                        <label style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", display: "block", marginBottom: "5px", textTransform: "uppercase" }}>
                          Activity Level
                        </label>
                        <select
                          value={editActivityLevel}
                          onChange={(e) => setEditActivityLevel(e.target.value)}
                          style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #cbd5e1", color: "#0f172a", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                        >
                          <option value="sedentary">🛋️ Sedentary (Minimal or no workout)</option>
                          <option value="light">🚶 Lightly Active (1-3 workouts / week)</option>
                          <option value="moderate">🏃 Moderately Active (3-5 workouts / week)</option>
                          <option value="active">⚡ Very Active (6-7 intense sessions / week)</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", display: "block", marginBottom: "5px", textTransform: "uppercase" }}>
                          Primary Objective
                        </label>
                        <select
                          value={editObjective}
                          onChange={(e) => setEditObjective(e.target.value)}
                          style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #cbd5e1", color: "#0f172a", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                        >
                          <option value="maintain">⚖️ Maintain Weight & Healthy Lifestyle</option>
                          <option value="lose">🔥 Fat Loss / Calorie Deficit</option>
                          <option value="muscle">💪 Muscle Hypertrophy & Strength</option>
                          <option value="endurance">🚴 Athletic Stamina & Cardio Endurance</option>
                        </select>
                      </div>
                    </div>
                  )}

                  

                  {/* Action Buttons: Cancel & Save */}
                  <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                    <button
                      type="button"
                      onClick={() => { setIsEditingProfile(false); setSaveSuccessPopup(false); }}
                      style={{ flex: 1, padding: "10px", background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: "10px", fontWeight: 800, fontSize: "12.5px", cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      style={{ flex: 1, padding: "10px", background: "linear-gradient(135deg, #4f46e5 0%, #38bdf8 100%)", color: "#ffffff", border: "none", borderRadius: "10px", fontWeight: 800, fontSize: "12.5px", cursor: isSavingProfile ? "not-allowed" : "pointer" }}
                    >
                      {isSavingProfile ? "Saving..." : "Save Changes ⚡"}
                    </button>
                  </div>

                  {/* Prominent Red Sign Out */}
                    <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "14px", marginTop: "8px", paddingBottom: "16px" }}>
                    <button
                      type="button"
                      onClick={handleLogout}
                      style={{
                        width: "100%",
                        padding: "11px",
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                        borderRadius: "10px",
                        color: "#dc2626",
                        fontSize: "13px",
                        fontWeight: 800,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        transition: "all 0.15s ease"
                      }}
                    >
                      <i className="fa-solid fa-arrow-right-from-bracket"></i>
                      Sign Out
                    </button>
                  </div>
                </form>
            </div>
          </div>
        </div>
      )}

      {/* ✏️ EDIT POST MODAL */}
      {editingPost && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(4px)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px"
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "18px",
            width: "100%",
            maxWidth: "380px",
            padding: "20px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.15)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 900, color: "#0f172a" }}>
                Edit Activity Caption
              </h3>
              <button
                type="button"
                onClick={() => setEditingPost(null)}
                style={{ background: "#f1f5f9", border: "none", width: "26px", height: "26px", borderRadius: "50%", color: "#64748b", cursor: "pointer", fontWeight: 800 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditedPost}>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={4}
                style={{ width: "100%", padding: "10px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #cbd5e1", color: "#0f172a", fontSize: "13px", outline: "none", resize: "none", boxSizing: "border-box" }}
              />
              <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setEditingPost(null)}
                  style={{ flex: 1, padding: "9px", background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: "10px", fontWeight: 800, fontSize: "12px", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPost}
                  style={{ flex: 1, padding: "9px", background: "linear-gradient(135deg, #0284c7 0%, #4f46e5 100%)", color: "#ffffff", border: "none", borderRadius: "10px", fontWeight: 800, fontSize: "12px", cursor: isSavingPost ? "not-allowed" : "pointer" }}
                >
                  {isSavingPost ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🖼️ FULLSCREEN PHOTO LIGHTBOX */}
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
            style={{ position: "absolute", top: "16px", right: "16px", background: "rgba(255, 255, 255, 0.2)", border: "none", width: "36px", height: "36px", borderRadius: "50%", color: "#ffffff", fontSize: "18px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            ✕
          </button>
          <img
            src={viewingPhoto}
            alt="Full Photo"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "100%", maxHeight: "92dvh", objectFit: "contain", display: "block", margin: "0 auto", borderRadius: "8px" }}
          />
        </div>
      )}
      {/* ⚠️ MODERN CUSTOM CONFIRMATION MODAL */}
      {confirmModalConfig && (
        <ConfirmModal
          isOpen={Boolean(confirmModalConfig)}
          title={confirmModalConfig.title}
          message={confirmModalConfig.message}
          confirmText={confirmModalConfig.confirmText}
          confirmColor={confirmModalConfig.confirmColor}
          icon={confirmModalConfig.icon}
          onConfirm={confirmModalConfig.onConfirm}
          onCancel={() => setConfirmModalConfig(null)}
        />
      )}
    </div>
  );
}