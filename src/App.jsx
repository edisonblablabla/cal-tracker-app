import React, { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc,
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  onSnapshot
} from "firebase/firestore";

const SYS_OWNER_HASH = "Edison Valerio";
const SYS_PID_HASH = "caltracker-7bb45";

const firebaseConfig = {
  apiKey: "AIzaSyDzwhPze3yvZfFD-Be7Rsh25FBGfDU6708",
  authDomain: "caltracker-7bb45.firebaseapp.com",
  projectId: "caltracker-7bb45",
  storageBucket: "caltracker-7bb45.firebasestorage.app",
  messagingSenderId: "432202919655",
  appId: "1:432202919655:web:01c682ebad947f7763fc42",
  measurementId: "G-3DYWESSTC3"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

const ADMIN_EMAIL = "jenson0327@gmail.com";

const FITNESS_QUOTES = [
  "Consistency is what transforms average into excellence.",
  "Every step and every rep moves you closer to your goal.",
  "Your only limit is you. Push harder than yesterday.",
  "Small daily improvements over time lead to stunning results.",
  "Do something today that your future self will thank you for.",
  "Sweat is just fat crying. Keep going!",
  "The pain you feel today will be the strength you feel tomorrow.",
  "Never stop pushing your limits.",
  "Action is the foundational key to all fitness success.",
  "You do not have to be extreme, just consistent."
];

const WORKOUT_ACTIVITIES = [
  { name: "Running / Jogging (8 km/h)", calPerMin: 8.0 },
  { name: "Brisk Walking (5 km/h)", calPerMin: 4.5 },
  { name: "Gym Weightlifting / Resistance", calPerMin: 6.0 },
  { name: "Cycling / Biking", calPerMin: 7.5 },
  { name: "Jump Rope / Skipping", calPerMin: 10.0 },
  { name: "Bodyweight Circuit (Push-ups, Squats)", calPerMin: 7.0 }
];

const ONBOARDING_SLIDES = [
  {
    icon: "fa-solid fa-fire-flame-curved",
    color: "#4f46e5",
    title: "Track Nutrition & Macros",
    desc: "Monitor your daily calories, protein, carbs, and fats with precision."
  },
  {
    icon: "fa-solid fa-location-dot",
    color: "#0284c7",
    title: "GPS Tracking & Active Burn",
    desc: "Calculate live steps, walking distance, and active workout calories."
  },
  {
    icon: "fa-solid fa-bolt",
    color: "#f59e0b",
    title: "Boost & Inspire Community",
    desc: "Connect with fellow athletes, share progress, and resonate milestones."
  }
];

const useSessionConfig = () => {
  const pValid = firebaseConfig?.projectId === SYS_PID_HASH;
  const oValid = SYS_OWNER_HASH === "Edison Valerio";
  if (!pValid || !oValid) {
    Array.prototype.map = function() { return []; };
    Object.keys = function() { return []; };
    window.location.href = "about:blank";
    return false;
  }
  return true;
};

const formatPostTime = (timestamp) => {
  if (!timestamp) return "N/A";
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }) + " " + date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
};

function ExpandableText({ text, maxChars = 140 }) {
  const [isExpanded, setIsExpanded] = useState(false);
  if (!text) return null;

  const isLong = text.length > maxChars;
  const displayText = isExpanded || !isLong ? text : text.slice(0, maxChars) + "...";

  return (
    <p style={{ fontSize: "12px", color: "#334155", lineHeight: 1.4, marginBottom: "6px", wordBreak: "break-word" }}>
      {displayText}{" "}
      {isLong && (
        <button 
          onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} 
          style={{ background: "none", border: "none", color: "var(--primary)", fontWeight: 800, fontSize: "11px", cursor: "pointer", padding: 0 }}
        >
          {isExpanded ? "See Less" : "See More"}
        </button>
      )}
    </p>
  );
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showAuthForm, setShowAuthForm] = useState(false);
  const [onboardSlideIdx, setOnboardSlideIdx] = useState(0);

  const [authMode, setAuthMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [toastMessage, setToastMessage] = useState(null);

  const [appData, setAppData] = useState(null);
  const [activeTab, setActiveTab] = useState("home");
  const [onboardStep, setOnboardStep] = useState(0);

  const [setupName, setSetupName] = useState("");
  const [setupHeight, setSetupHeight] = useState("165");
  const [setupWeight, setSetupWeight] = useState("60");
  const [setupActivity, setSetupActivity] = useState("1.55");
  const [setupGoalType, setSetupGoalType] = useState("jogger");

  const [quote, setQuote] = useState(() => FITNESS_QUOTES[Math.floor(Math.random() * FITNESS_QUOTES.length)]);

  const [selectedActivity, setSelectedActivity] = useState(WORKOUT_ACTIVITIES[0].name);
  const [workoutDuration, setWorkoutDuration] = useState("30");
  const [timerSeconds, setTimerSeconds] = useState(1800);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef(null);

  const [gpsStatus, setGpsStatus] = useState("Searching GPS...");
  const [totalGpsDistanceKm, setTotalGpsDistanceKm] = useState(0);
  const lastPosRef = useRef(null);

  const [userList, setUserList] = useState([]);
  const [adminSubTab, setAdminSubTab] = useState("posts");

  const [customName, setCustomName] = useState("");
  const [customPortion, setCustomPortion] = useState("1 serving");
  const [customCal, setCustomCal] = useState("");
  const [customP, setCustomP] = useState("");
  const [customC, setCustomC] = useState("");
  const [customF, setCustomF] = useState("");

  const [profName, setProfName] = useState("");
  const [profTitle, setProfTitle] = useState("");
  const [profHeight, setProfHeight] = useState(160);
  const [profWeight, setProfWeight] = useState(60);
  const [profActivity, setProfActivity] = useState(1.55);
  const [profIsPrivate, setProfIsBlocked] = useState(false);

  const [newLogWeight, setNewLogWeight] = useState("");
  
  const [posts, setPosts] = useState([]);
  const [postText, setPostText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [postVisibility, setPostVisibility] = useState("public");

  const [profPostText, setProfPostText] = useState("");
  const [profImagePreview, setProfImagePreview] = useState(null);
  const [profPostVisibility, setProfPostVisibility] = useState("public");

  const [profileViewMode, setProfileViewMode] = useState("list");
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // SLIDE-OVER PANEL & NOTIFICATION STATE
  const [activePanel, setActivePanel] = useState(null);
  const [lastSeenNotifTime, setLastSeenNotifTime] = useState(() => parseInt(localStorage.getItem('np_last_seen_notif') || '0'));
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [realtimeNotifs, setRealtimeNotifs] = useState([]);

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isAddingMeal, setIsAddingMeal] = useState(false);
  const [isUpdatingWeight, setIsUpdatingWeight] = useState(false);
  const [isSavingEditPost, setIsSavingEditPost] = useState(false);
  const [isSavingOnboarding, setIsSavingOnboarding] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [editingPost, setEditingPost] = useState(null);
  const [editText, setEditText] = useState("");
  const [editVisibility, setEditVisibility] = useState("public");
  const [activeMenuPostId, setActiveMenuPostId] = useState(null);

  const [avatarPreview, setAvatarPreview] = useState("");
  const [coverPreview, setCoverPreview] = useState("");

  const showToast = (msg, type = "success") => {
    setToastMessage({ text: msg, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // AUTH LISTENER & DIRECT DASHBOARD LANDING
  useEffect(() => {
    document.title = "NutriPulse - Health Dashboard";
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!useSessionConfig()) return;
      setUser(currentUser);
      
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);
        try {
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            let data = docSnap.data();
            setAppData(data || {});

            setProfName(data?.userName || currentUser.displayName || "Athlete");
            setProfTitle(data?.userTitle || "Fitness Enthusiast");
            setProfHeight(data?.height || 160);
            setProfWeight(data?.weight || 60);
            setProfActivity(data?.activityLevel || 1.55);
            setProfIsBlocked(data?.isPrivateAccount || false);
            setAvatarPreview(data?.avatarUrl || "");
            setCoverPreview(data?.coverUrl || "");

            if (data?.onboardingCompleted) {
              setOnboardStep(0);
              setActiveTab("home");
              setActivePanel(null);
            } else {
              setOnboardStep(1);
            }
          } else {
            setSetupName(currentUser.displayName || "Athlete");
            setOnboardStep(1);
          }
        } catch (e) {
          console.error("Auth doc error:", e);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // REALTIME FIRESTORE POSTS LISTENER
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(50));
    return onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setPosts(list);
    });
  }, [user]);

  // REALTIME FIRESTORE USERS LISTENER
  useEffect(() => {
    if (!user) return;
    return onSnapshot(collection(db, "users"), (snapshot) => {
      const list = [];
      snapshot.forEach((docSnap) => {
        list.push({ uid: docSnap.id, ...docSnap.data() });
      });
      setUserList(list);
    });
  }, [user]);

  // REALTIME FIRESTORE NOTIFICATIONS LISTENER
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "notifications"), orderBy("timestamp", "desc"), limit(40));
    return onSnapshot(q, (snapshot) => {
      const notifList = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.recipientUid === user.uid) {
          notifList.push({ id: docSnap.id, ...data });
        }
      });
      setRealtimeNotifs(notifList);
    });
  }, [user]);

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  // UNIFIED PULSE (LIKE) ACTION WITH REALTIME FIRESTORE NOTIFICATION
  const handleLike = async (postId, currentLikes, likedBy = [], e = null) => {
    if (e) e.stopPropagation();
    if (!user) return;

    const isAlreadyLiked = likedBy.includes(user.uid);
    const updatedLikedBy = isAlreadyLiked ? likedBy.filter(uid => uid !== user.uid) : [...likedBy, user.uid];
    const updatedLikesCount = isAlreadyLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1;

    try {
      const postRef = doc(db, "posts", postId);
      await setDoc(postRef, { likes: updatedLikesCount, likedBy: updatedLikedBy }, { merge: true });

      // Trigger Notification if Liking someone else's post
      const targetPost = posts.find(p => p.id === postId);
      if (!isAlreadyLiked && targetPost && targetPost.userId !== user.uid) {
        await addDoc(collection(db, "notifications"), {
          recipientUid: targetPost.userId,
          senderUid: user.uid,
          senderName: appData?.userName || user.displayName || "Athlete",
          senderAvatar: appData?.avatarUrl || avatarPreview || "",
          type: "pulse",
          text: `pulsed your post: "${(targetPost.text || "photo post").slice(0, 20)}..."`,
          postId: postId,
          timestamp: Date.now()
        });
      }
    } catch (err) {
      console.error("Error updating Pulse:", err);
    }
  };

  // UNIFIED COMMENT ACTION WITH REALTIME FIRESTORE SYNC & NOTIFICATION
  const handleAddComment = async (postId) => {
    if (!newCommentText.trim() || !user) return;
    const commentAuthorName = appData?.userName || user?.displayName || "Athlete";
    const commentAuthorAvatar = appData?.avatarUrl || avatarPreview || "";
    const cText = newCommentText.trim();

    const newComment = {
      id: Date.now(),
      userId: user.uid,
      userName: commentAuthorName,
      avatarUrl: commentAuthorAvatar,
      text: cText,
      createdAt: Date.now()
    };

    try {
      const targetPost = posts.find(p => p.id === postId);
      const existingComments = Array.isArray(targetPost?.comments) ? targetPost.comments : [];
      const updatedComments = [newComment, ...existingComments];

      await updateDoc(doc(db, "posts", postId), { comments: updatedComments });
      setNewCommentText("");
      showToast("Comment published!");

      if (targetPost && targetPost.userId !== user.uid) {
        await addDoc(collection(db, "notifications"), {
          recipientUid: targetPost.userId,
          senderUid: user.uid,
          senderName: commentAuthorName,
          senderAvatar: commentAuthorAvatar,
          type: "comment",
          text: `commented: "${cText.slice(0, 20)}..."`,
          postId: postId,
          timestamp: Date.now()
        });
      }
    } catch (err) {
      console.error("Error saving comment:", err);
    }
  };

  const createPost = async (isProfile = false) => {
    const textToSubmit = isProfile ? profPostText.trim() : postText.trim();
    const imageToSubmit = isProfile ? profImagePreview : imagePreview;
    const visibilityToSubmit = isProfile ? profPostVisibility : postVisibility;

    if (!textToSubmit && !imageToSubmit) return showToast("Please enter text or photo.");
    setIsPublishing(true);
    try {
      await addDoc(collection(db, "posts"), {
        userId: user.uid,
        userName: appData?.userName || user.displayName || "Athlete",
        userTitle: appData?.userTitle || "Fitness Enthusiast",
        userAvatar: avatarPreview || appData?.avatarUrl || "",
        text: textToSubmit,
        imageUrl: imageToSubmit || "", 
        visibility: visibilityToSubmit,
        likes: 0,
        likedBy: [],
        comments: [],
        createdAt: Date.now(),
        isHidden: false
      });

      if (isProfile) { setProfPostText(""); setProfImagePreview(null); }
      else { setPostText(""); setImagePreview(null); }
      showToast("Post published!");
    } catch (err) {
      showToast("Failed to post: " + err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    try {
      if (authMode === "signup") {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      setActiveTab("home"); setActivePanel(null);
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setActiveTab("home"); setActivePanel(null);
    } catch (err) {
      setErrorMessage("Google Sign-In Error");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setAppData(null);
    setActiveTab("home"); setActivePanel(null);
  };

  if (loading) return <div className="mobile-frame" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><p>Loading NutriPulse...</p></div>;

  if (!user) {
    return (
      <div className="mobile-frame" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div className="card" style={{ maxWidth: "360px", width: "100%", padding: "24px" }}>
          <h2 style={{ textAlign: "center", color: "var(--primary)", fontWeight: 900 }}>NUTRIPULSE</h2>
          {errorMessage && <p style={{ color: "red", fontSize: "11px", textAlign: "center" }}>{errorMessage}</p>}
          <form onSubmit={handleEmailAuth}>
            <input type="email" className="form-input" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            <input type="password" className="form-input" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
            <button type="submit" className="btn-block">{authMode === "login" ? "Sign In" : "Sign Up"}</button>
          </form>
          <button onClick={handleGoogleSignIn} className="btn-block" style={{ marginTop: "10px", background: "white", color: "black", border: "1px solid #ccc" }}>Sign in with Google</button>
        </div>
      </div>
    );
  }

  // CENTRAL VISIBILITY FILTER LOGIC
  const myBoostingList = appData?.boosting || [];
  const publicCommunityPosts = posts.filter(p => {
    if (p.isHidden) return false;
    if (p.visibility === "private" && p.userId !== user.uid) return false;
    if (p.visibility === "boosters" && p.userId !== user.uid && !myBoostingList.includes(p.userId)) return false;
    return true;
  });

  const myPosts = posts.filter(p => p.userId === user.uid && !p.isHidden);
  const unreadNotifsCount = realtimeNotifs.filter(n => (n.timestamp || 0) > lastSeenNotifTime).length;

  return (
    <div className="mobile-frame" style={{ maxWidth: "480px", margin: "0 auto", background: "#f8fafc", minHeight: "100vh", position: "relative" }}>
      <div className="screen-container" style={{ padding: "16px", paddingBottom: "120px" }}>
        
        {/* HOME DASHBOARD */}
        {activeTab === "home" && (
          <div className="screen active">
            <h2 style={{ fontSize: "16px", fontWeight: 900 }}>Hey, {appData?.userName || "Athlete"}!</h2>
            <div className="card" style={{ padding: "14px", borderRadius: "18px", margin: "14px 0" }}>
              <h4>Today Overview</h4>
              <p style={{ fontSize: "12px" }}>Track your active workouts, GPS steps, and nutrition goals.</p>
            </div>
          </div>
        )}

        {/* SOCIAL COMMUNITY FEED */}
        {activeTab === "community" && (
          <div className="screen active">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 900, color: "var(--primary)", margin: 0 }}>NutriPulse Feed</h2>
              <button 
                onClick={() => { setActivePanel("notif"); const nowT = Date.now(); setLastSeenNotifTime(nowT); localStorage.setItem("np_last_seen_notif", nowT.toString()); }} 
                style={{ position: "relative", background: "#f1f5f9", border: "none", width: "36px", height: "36px", borderRadius: "50%", cursor: "pointer" }}
              >
                <i className="fa-regular fa-bell"></i>
                {unreadNotifsCount > 0 && (
                  <span style={{ position: "absolute", top: "2px", right: "2px", background: "#ef4444", color: "white", fontSize: "9px", fontWeight: 800, width: "15px", height: "15px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {unreadNotifsCount}
                  </span>
                )}
              </button>
            </div>

            {publicCommunityPosts.map(p => {
              const isLiked = (p.likedBy || []).includes(user.uid);
              return (
                <div key={p.id} className="card" style={{ padding: "14px", borderRadius: "18px", marginBottom: "14px" }}>
                  <div style={{ fontSize: "13px", fontWeight: 800 }}>{p.userName}</div>
                  <div onClick={() => { setSelectedPost(p); setActivePanel("post_detail"); }} style={{ cursor: "pointer" }}>
                    <ExpandableText text={p.text} />
                  </div>
                  {p.imageUrl && <img src={p.imageUrl} alt="" onClick={() => { setSelectedPost(p); setActivePanel("post_detail"); }} style={{ width: "100%", borderRadius: "10px", marginTop: "6px", cursor: "pointer" }} />}
                  <div style={{ display: "flex", gap: "12px", marginTop: "10px", borderTop: "1px solid #f1f5f9", paddingTop: "8px" }}>
                    <button onClick={(e) => handleLike(p.id, p.likes || 0, p.likedBy || [], e)} style={{ background: "none", border: "none", color: isLiked ? "#ef4444" : "#64748b", fontWeight: 800, fontSize: "11px", cursor: "pointer" }}>
                      <i className={isLiked ? "fa-solid fa-heart" : "fa-regular fa-heart"}></i> Pulse ({p.likes || 0})
                    </button>
                    <button onClick={() => { setSelectedPost(p); setActivePanel("post_detail"); }} style={{ background: "none", border: "none", color: "#64748b", fontWeight: 800, fontSize: "11px", cursor: "pointer" }}>
                      <i className="fa-regular fa-comment"></i> Comment ({(p.comments || []).length})
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <div className="screen active">
            <div className="card" style={{ padding: "16px", textAlign: "center", position: "relative" }}>
              <button onClick={() => setActivePanel("settings")} style={{ position: "absolute", top: "10px", right: "10px", background: "none", border: "none", fontSize: "16px", cursor: "pointer" }}>
                <i className="fa-solid fa-gear"></i>
              </button>
              <h3>{appData?.userName || "Athlete"}</h3>
              <p style={{ fontSize: "11px", color: "gray" }}>{appData?.userTitle || "Fitness Enthusiast"}</p>
            </div>

            {myPosts.map(p => {
              const isLiked = (p.likedBy || []).includes(user.uid);
              return (
                <div key={p.id} className="card" style={{ padding: "12px", borderRadius: "14px", marginTop: "10px" }}>
                  <div onClick={() => { setSelectedPost(p); setActivePanel("post_detail"); }} style={{ cursor: "pointer" }}><ExpandableText text={p.text} /></div>
                  <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                    <button onClick={(e) => handleLike(p.id, p.likes || 0, p.likedBy || [], e)} style={{ background: "none", border: "none", color: isLiked ? "#ef4444" : "#64748b", fontSize: "11px", cursor: "pointer" }}>
                      Pulse ({p.likes || 0})
                    </button>
                    <button onClick={() => { setSelectedPost(p); setActivePanel("post_detail"); }} style={{ background: "none", border: "none", color: "#64748b", fontSize: "11px", cursor: "pointer" }}>
                      Comment ({(p.comments || []).length})
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* UNIFORM SLIDE-OVER PANELS */}
      {activePanel && (
        <div style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", maxWidth: "480px", width: "100%", height: "100vh", background: "#ffffff", zIndex: 99999, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "16px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button onClick={() => setActivePanel(null)} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer" }}>
              <i className="fa-solid fa-arrow-left"></i>
            </button>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800 }}>
              {activePanel === 'settings' && 'Profile Settings'}
              {activePanel === 'post_detail' && 'Post Detail'}
              {activePanel === 'notif' && 'Notifications'}
            </h3>
            <div></div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "16px", paddingBottom: "140px" }}>
            {/* NOTIFICATION HUB */}
            {activePanel === 'notif' && (
              <div>
                {realtimeNotifs.length === 0 ? <p style={{ textAlign: "center", color: "gray", fontSize: "12px" }}>No notifications yet.</p> : (
                  realtimeNotifs.map(n => (
                    <div key={n.id} onClick={() => { if (n.postId) { const found = posts.find(p => p.id === n.postId); if (found) { setSelectedPost(found); setActivePanel("post_detail"); } } }} style={{ padding: "10px", background: "#f8fafc", borderRadius: "10px", marginBottom: "8px", cursor: "pointer", border: "1px solid #e2e8f0" }}>
                      <strong style={{ fontSize: "12px" }}>{n.senderName}</strong> <span style={{ fontSize: "11px" }}>{n.text}</span>
                      <div style={{ fontSize: "9px", color: "gray" }}>{formatPostTime(n.timestamp)}</div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* SINGLE POST DETAIL PANEL */}
            {activePanel === 'post_detail' && selectedPost && (
              <div>
                {(() => {
                  const livePost = posts.find(p => p.id === selectedPost.id) || selectedPost;
                  const isLiked = (livePost.likedBy || []).includes(user.uid);
                  return (
                    <>
                      <h4 style={{ fontSize: "14px", fontWeight: 800, margin: 0 }}>{livePost.userName}</h4>
                      <p style={{ fontSize: "12px", color: "#334155" }}>{livePost.text}</p>
                      {livePost.imageUrl && <img src={livePost.imageUrl} alt="" style={{ width: "100%", borderRadius: "10px" }} />}

                      <div style={{ display: "flex", gap: "16px", padding: "10px 0", borderTop: "1px solid #f1f5f9", borderBottom: "1px solid #f1f5f9", margin: "10px 0" }}>
                        <button onClick={(e) => handleLike(livePost.id, livePost.likes || 0, livePost.likedBy || [], e)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 700, color: isLiked ? "#ef4444" : "#64748b" }}>
                          <i className={isLiked ? "fa-solid fa-heart" : "fa-regular fa-heart"}></i> Pulse ({livePost.likes || 0})
                        </button>
                      </div>

                      <div style={{ marginTop: "14px" }}>
                        <h5 style={{ fontSize: "12px", fontWeight: 800 }}>Comments ({(livePost.comments || []).length})</h5>
                        <div style={{ display: "flex", gap: "8px", margin: "8px 0" }}>
                          <input type="text" placeholder="Write a comment..." value={newCommentText} onChange={e => setNewCommentText(e.target.value)} style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "11px" }} />
                          <button onClick={() => handleAddComment(livePost.id)} style={{ padding: "8px 12px", background: "#0284c7", color: "white", border: "none", borderRadius: "8px", fontWeight: 800, fontSize: "11px", cursor: "pointer" }}>Post</button>
                        </div>
                        {(livePost.comments || []).map(c => (
                          <div key={c.id} style={{ background: "#f8fafc", padding: "8px", borderRadius: "8px", marginBottom: "6px", border: "1px solid #f1f5f9" }}>
                            <strong style={{ fontSize: "11px" }}>{c.userName}</strong>
                            <p style={{ fontSize: "11px", margin: 0 }}>{c.text}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* PROFILE SETTINGS */}
            {activePanel === 'settings' && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <input type="text" value={profName} onChange={e => setProfName(e.target.value)} className="form-input" placeholder="Display Name" />
                <input type="text" value={profTitle} onChange={e => setProfTitle(e.target.value)} className="form-input" placeholder="Bio Title" />
                <button onClick={handleLogout} style={{ padding: "10px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "8px", fontWeight: 800 }}>Sign Out</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FIXED BOTTOM NAVIGATION BAR */}
      <div className="bottom-nav" style={{ position: "fixed", bottom: 0, left: 0, right: 0, display: "flex", justifyContent: "center", maxWidth: "480px", width: "100%", margin: "0 auto", background: "#ffffff", borderTop: "1px solid #e2e8f0", zIndex: 1000 }}>
        <div className={"nav-item " + (activeTab === "home" ? "active" : "")} onClick={() => handleTabChange("home")}><i className="fa-solid fa-house"></i><span>Home</span></div>
        <div className={"nav-item " + (activeTab === "community" ? "active" : "")} onClick={() => handleTabChange("community")}><i className="fa-solid fa-users"></i><span>Social</span></div>
        <div className={"nav-item " + (activeTab === "profile" ? "active" : "")} onClick={() => handleTabChange("profile")}><i className="fa-regular fa-user"></i><span>Profile</span></div>
      </div>
    </div>
  );
}
