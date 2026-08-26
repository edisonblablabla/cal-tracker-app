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
  getDocs,
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
  const [confirmModal, setConfirmModal] = useState(null);

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
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const [viewingAthlete, setViewingAthlete] = useState(null);
  const [boosterListModalType, setBoosterListModalType] = useState(null);
  const [resonatePost, setResonatePost] = useState(null);

  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifModal, setShowNotifModal] = useState(false);

  // SLIDE-OVER PANEL CENTRAL CONTROLLER
  const [activePanel, setActivePanel] = useState(null);
  const [lastSeenNotifTime, setLastSeenNotifTime] = useState(() => parseInt(localStorage.getItem('np_last_seen_notif') || '0'));
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [postComments, setPostComments] = useState(() => JSON.parse(localStorage.getItem('np_post_comments') || '{}'));
  const [newCommentText, setNewCommentText] = useState('');

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isAddingMeal, setIsAddingMeal] = useState(false);
  const [isUpdatingWeight, setIsUpdatingWeight] = useState(false);
  const [isSavingEditPost, setIsSavingEditPost] = useState(false);
  const [isSavingOnboarding, setIsSavingOnboarding] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [editingPost, setEditingPost] = useState(null);
  const [editText, setEditText] = useState("");
  const [editVisibility, setEditVisibility] = useState("public");
  const [activeMenuPostId, setActiveMenuPostId] = useState(null);
  const [viewingImage, setViewingImage] = useState(null);

  const [avatarPreview, setAvatarPreview] = useState("");
  const [coverPreview, setCoverPreview] = useState("");

  const showToast = (msg, type = "success") => {
    setToastMessage({ text: msg, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  useEffect(() => {
    document.title = "NutriPulse - Health Dashboard";
    let heartbeatInterval = null;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!useSessionConfig()) return;
      setUser(currentUser);
      setShowSettingsModal(false);
      
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);
        try {
          const docSnap = await getDoc(userDocRef);
          
          if (docSnap.exists()) {
            let data = docSnap.data();
            const todayStr = new Date().toDateString();

            if (data?.lastLogDate && data.lastLogDate !== todayStr) {
              data = {
                ...data,
                todayBurnedCal: 0,
                lastLogDate: todayStr
              };
              await setDoc(userDocRef, { todayBurnedCal: 0, lastLogDate: todayStr }, { merge: true });
            }

            setAppData(data || {});

            const sendPresencePing = () => {
              setDoc(userDocRef, { lastSeen: Date.now() }, { merge: true }).catch(console.error);
            };

            sendPresencePing();
            heartbeatInterval = setInterval(sendPresencePing, 30000);

            setProfName(data?.userName || currentUser.displayName || "Athlete");
            setProfTitle(data?.userTitle || "Fitness Enthusiast");
            setProfHeight(data?.height || 160);
            setProfWeight(data?.weight || 60);
            setProfActivity(data?.activityLevel || 1.55);
            setProfIsBlocked(data?.isPrivateAccount || false);
            setNewLogWeight(data?.weight || 60);
            setAvatarPreview(data?.avatarUrl || "");
            setCoverPreview(data?.coverUrl || "");

            // STRICT ONBOARDING & DASHBOARD DIRECT LANDING FIX
            if (data?.onboardingCompleted) {
              setOnboardStep(0);
              setActiveTab("home");
              setActivePanel(null); // Force close all slide panels on login
            } else {
              setOnboardStep(1);
            }
          } else {
            setSetupName(currentUser.displayName || "Athlete");
            setOnboardStep(1);
          }
        } catch (e) {
          console.error("Auth doc fetch error:", e);
        }
      } else {
        if (heartbeatInterval) clearInterval(heartbeatInterval);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    };
  }, []);

  useEffect(() => {
    if (activeTab === "home" && "geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setGpsStatus("GPS Active");
          const { latitude, longitude } = position.coords;

          if (lastPosRef.current) {
            const dist = getDistanceFromLatLonInKm(
              lastPosRef.current.latitude,
              lastPosRef.current.longitude,
              latitude,
              longitude
            );
            if (dist > 0.003 && dist < 0.1) {
              setTotalGpsDistanceKm(prev => prev + dist);
            }
          }
          lastPosRef.current = { latitude, longitude };
        },
        (error) => {
          setGpsStatus("Allow Location Permission for Steps");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [activeTab]);

  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsTimerRunning(false);
            finishWorkoutSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isTimerRunning]);

  useEffect(() => {
    if (activeTab === "home") {
      shuffleQuote();
    }
    let unsubUsers = null;
    let unsubPosts = null;
    if (activeTab === "community" || activeTab === "profile" || activeTab === "admin") {
      unsubPosts = fetchPosts();
      unsubUsers = fetchUsers();
    }
    return () => { 
      if (unsubUsers) unsubUsers(); 
      if (unsubPosts) unsubPosts();
    };
  }, [activeTab]);

  const shuffleQuote = () => {
    const randomIndex = Math.floor(Math.random() * FITNESS_QUOTES.length);
    setQuote(FITNESS_QUOTES[randomIndex]);
  };

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    window.scrollTo({ top: 0, behavior: "instant" });
    const container = document.querySelector(".screen-container");
    if (container) container.scrollTop = 0;
  };

  const handleSetWorkoutTarget = (mins) => {
    const parsedMins = parseInt(mins) || 0;
    setWorkoutDuration(mins);
    setTimerSeconds(parsedMins * 60);
    setIsTimerRunning(false);
  };

  const startTimer = () => {
    if (timerSeconds <= 0) return showToast("Please set duration in minutes.");
    setIsTimerRunning(true);
  };

  const pauseTimer = () => {
    setIsTimerRunning(false);
  };

  const finishWorkoutSession = async () => {
    setIsTimerRunning(false);
    const actObj = WORKOUT_ACTIVITIES.find(a => a.name === selectedActivity) || WORKOUT_ACTIVITIES[0];
    const initialMins = parseInt(workoutDuration) || 30;
    const elapsedMins = Math.max(1, Math.round((initialMins * 60 - timerSeconds) / 60));
    const burned = Math.round(elapsedMins * actObj.calPerMin);

    const currentBurned = appData?.todayBurnedCal || 0;
    await saveToCloud({
      ...appData,
      todayBurnedCal: currentBurned + burned
    });

    showToast(`Workout Logged! Completed ${elapsedMins} mins of ${actObj.name} (-${burned} kcal).`);
    setTimerSeconds(initialMins * 60);
  };

  const fetchPosts = () => {
    try {
      const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(50));
      return onSnapshot(q, (snapshot) => {
        const list = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setPosts(list);
      }, (err) => {
        console.error("Error listening to posts:", err);
      });
    } catch (err) {
      console.error("Error setting up posts listener:", err);
    }
  };

  const fetchUsers = () => {
    try {
      const usersRef = collection(db, "users");
      return onSnapshot(usersRef, (snapshot) => {
        const list = [];
        snapshot.forEach((docSnap) => {
          list.push({ uid: docSnap.id, ...docSnap.data() });
        });
        list.sort((a, b) => {
          const timeA = a.createdAt || a.lastSeen || 0;
          const timeB = b.createdAt || b.lastSeen || 0;
          return timeB - timeA;
        });
        setUserList(list);
      });
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const toggleBlockUser = async (targetUid, isCurrentlyBlocked) => {
    const actionText = isCurrentlyBlocked ? "Unblock this user account?" : "Block this user account?";
    if (window.confirm(actionText)) {
      try {
        await setDoc(doc(db, "users", targetUid), { isBlocked: !isCurrentlyBlocked }, { merge: true });
        await fetchUsers();
        await fetchPosts();
        showToast(isCurrentlyBlocked ? "User unblocked successfully." : "User blocked!");
      } catch (err) {
        console.error("Error updating user block status:", err);
      }
    }
  };

  const toggleHidePost = async (postId, currentlyHidden) => {
    const actionText = currentlyHidden ? "Unhide this post?" : "Hide this post?";
    if (window.confirm(actionText)) {
      try {
        const postRef = doc(db, "posts", postId);
        await updateDoc(postRef, { isHidden: !currentlyHidden });
        await fetchPosts();
        showToast(currentlyHidden ? "Post visible again." : "Post hidden.");
      } catch (err) {
        console.error("Error toggling post visibility:", err);
      }
    }
  };

  const toggleBoostAthlete = async (targetUid, targetIsPrivate) => {
    const myBoosters = appData?.boosting || [];
    const pendingReqs = appData?.pendingBoosterRequests || [];
    const isAlreadyBoosting = myBoosters.includes(targetUid);
    const isPending = pendingReqs.includes(targetUid);

    let updatedBoosting = [...myBoosters];
    let updatedRequests = [...pendingReqs];

    if (isAlreadyBoosting) {
      updatedBoosting = updatedBoosting.filter(id => id !== targetUid);
      showToast("Unboosted athlete.", "info");
    } else if (targetIsPrivate && !isPending) {
      updatedRequests.push(targetUid);
      showToast("Booster Request sent!", "info");
    } else {
      updatedBoosting.push(targetUid);
      showToast("You are now Boosting this athlete!");
    }

    const updatedData = { ...appData, boosting: updatedBoosting, pendingBoosterRequests: updatedRequests };
    await saveToCloud(updatedData);
    await fetchUsers();
  };

  const compressImage = (file, callback) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 600;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        callback(dataUrl);
      };
    };
  };

  const handleImageChange = (e, isProfile = false) => {
    const file = e.target.files[0];
    if (file) {
      compressImage(file, (compressedUrl) => {
        if (isProfile) setProfImagePreview(compressedUrl);
        else setImagePreview(compressedUrl);
      });
    }
  };

  const handleDirectAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      compressImage(file, async (compressedUrl) => {
        setAvatarPreview(compressedUrl);
        await saveToCloud({ ...appData, avatarUrl: compressedUrl });
        showToast("Profile avatar updated!");
      });
    }
  };

  const handleDirectCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      compressImage(file, async (compressedUrl) => {
        setCoverPreview(compressedUrl);
        await saveToCloud({ ...appData, coverUrl: compressedUrl });
        showToast("Cover banner updated!");
      });
    }
  };

  const createPost = async (isProfile = false) => {
    if (appData?.isBlocked) return showToast("Your account is currently blocked.");

    const textToSubmit = isProfile ? profPostText.trim() : postText.trim();
    const imageToSubmit = isProfile ? profImagePreview : imagePreview;
    const visibilityToSubmit = isProfile ? profPostVisibility : postVisibility;

    if (!textToSubmit && !imageToSubmit) return showToast("Please enter text or select an image.");
    setIsPublishing(true);
    try {
      const newPost = {
        userId: user.uid,
        userName: appData?.userName || user.displayName || "Athlete",
        userTitle: appData?.userTitle || "Fitness Enthusiast",
        userAvatar: avatarPreview || appData?.avatarUrl || "",
        text: textToSubmit,
        imageUrl: imageToSubmit || "", 
        visibility: visibilityToSubmit,
        likes: 0,
        likedBy: [],
        createdAt: Date.now(),
        isHidden: false
      };
      await addDoc(collection(db, "posts"), newPost);
      
      if (isProfile) {
        setProfPostText("");
        setProfImagePreview(null);
        setProfPostVisibility("public");
      } else {
        setPostText("");
        setImagePreview(null);
        setPostVisibility("public");
      }

      await fetchPosts();
      showToast("Post published!");
    } catch (err) {
      console.error("Error creating post:", err);
      showToast("Failed to publish post: " + err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  const openEditModal = (post) => {
    setEditingPost(post);
    setEditText(post.text || "");
    setEditVisibility(post.visibility || "public");
    setActiveMenuPostId(null);
  };

  const saveEditedPost = async () => {
    if (!editingPost) return;
    setIsSavingEditPost(true);
    try {
      const postRef = doc(db, "posts", editingPost.id);
      await updateDoc(postRef, {
        text: editText,
        visibility: editVisibility
      });
      setEditingPost(null);
      await fetchPosts();
      showToast("Post updated!");
    } catch (err) {
      console.error("Error updating post:", err);
    } finally {
      setIsSavingEditPost(false);
    }
  };

  const handleLike = async (postId, currentLikes, likedBy = []) => {
    const isAlreadyLiked = likedBy.includes(user.uid);
    let updatedLikedBy = [];
    let updatedLikesCount = currentLikes;

    if (isAlreadyLiked) {
      updatedLikedBy = likedBy.filter(uid => uid !== user.uid);
      updatedLikesCount = Math.max(0, currentLikes - 1);
    } else {
      updatedLikedBy = [...likedBy, user.uid];
      updatedLikesCount = currentLikes + 1;
    }

    try {
      const postRef = doc(db, "posts", postId);
      await setDoc(postRef, { 
        likes: updatedLikesCount, 
        likedBy: updatedLikedBy 
      }, { merge: true });
    } catch (err) {
      console.error("Error toggling pulse:", err);
    }
  };

  const handleAddComment = (postId) => {
    if (!newCommentText.trim()) return;
    const existing = postComments[postId] || [];
    const commentAuthorName = appData?.userName || user?.displayName || "Athlete";
    const commentAuthorAvatar = appData?.avatarUrl || avatarPreview || "";
    
    const newComment = {
      id: Date.now(),
      userName: commentAuthorName,
      avatarUrl: commentAuthorAvatar,
      text: newCommentText.trim(),
      createdAt: Date.now()
    };
    
    const updated = { ...postComments, [postId]: [newComment, ...existing] };
    setPostComments(updated);
    localStorage.setItem("np_post_comments", JSON.stringify(updated));
    setNewCommentText("");
    showToast("Comment added!");

    if (selectedPost && selectedPost.userId !== user?.uid) {
      try {
        addDoc(collection(db, "notifications"), {
          recipientUid: selectedPost.userId,
          senderName: commentAuthorName,
          senderAvatar: commentAuthorAvatar,
          type: "comment",
          text: `commented on your post: "${newCommentText.trim().slice(0, 20)}..."`,
          postId: postId,
          timestamp: Date.now()
        });
      } catch (err) {
        console.error("Comment notif error:", err);
      }
    }
  };

  const handleDeletePost = async (postId) => {
    setActiveMenuPostId(null);
    if (window.confirm("Delete this post permanently?")) {
      try {
        await deleteDoc(doc(db, "posts", postId));
        fetchPosts();
      } catch (err) {
        console.error("Error deleting post:", err);
      }
    }
  };

  const saveToCloud = async (newData) => {
    setAppData(newData);
    if (user) {
      try {
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, newData, { merge: true });
      } catch (err) {
        console.error("Cloud sync error:", err);
      }
    }
  };

  const completeOnboarding = async () => {
    setIsSavingOnboarding(true);
    try {
      const w = parseFloat(setupWeight) || 60;
      const h = parseFloat(setupHeight) || 160;
      const act = parseFloat(setupActivity) || 1.55;
      const todayShort = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const todayStr = new Date().toDateString();

      let bmr = (10 * w) + (6.25 * h) - (5 * 25) + 5;
      let tdee = Math.round(bmr * act);

      let baseGoal = tdee;
      let pGoal = Math.round(w * 2.0);
      let cGoal = Math.round(w * 3.2);
      let fGoal = Math.round(w * 0.9);

      if (setupGoalType === "jogger") baseGoal = tdee + 100;
      else if (setupGoalType === "marathon") baseGoal = tdee + 400;
      else if (setupGoalType === "steps") baseGoal = Math.max(1200, tdee - 250);
      else if (setupGoalType === "bulk") baseGoal = tdee + 250;
      else if (setupGoalType === "cut") baseGoal = Math.max(1200, tdee - 450);

      const initialData = {
        userName: setupName || user.displayName || "Athlete",
        userEmail: user.email || "",
        userTitle: "Fitness Enthusiast",
        avatarUrl: "",
        coverUrl: "",
        height: h,
        weight: w,
        prevWeight: w,
        weightHistory: [{ val: w, date: todayShort }],
        activityLevel: act,
        dayMode: "workout",
        streakDays: 1,
        lastLogDate: todayStr,
        activeGoalType: setupGoalType,
        baseGoal, goal: baseGoal, pGoal, cGoal, fGoal,
        todayBurnedCal: 0,
        isBlocked: false,
        isPrivateAccount: false,
        boosting: [],
        myBoosters: [],
        pendingBoosterRequests: [],
        onboardingCompleted: true,
        createdAt: Date.now(),
        weeklyLogs: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 },
        meals: []
      };

      await saveToCloud(initialData);
      setProfName(initialData.userName);
      setProfTitle(initialData.userTitle);
      setProfHeight(h);
      setProfWeight(w);
      setProfActivity(act);
      setOnboardStep(0);
      setShowSettingsModal(false);
      setActiveTab("home");
      setActivePanel(null);
    } finally {
      setIsSavingOnboarding(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    if (!email || !password) {
      setErrorMessage("Please enter your email and password.");
      return;
    }
    try {
      if (authMode === "signup") {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      setActiveTab("home");
      setActivePanel(null);
    } catch (error) {
      if (error.code === "auth/invalid-credential" || error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        setErrorMessage("Invalid email or password.");
      } else if (error.code === "auth/email-already-in-use") {
        setErrorMessage("An account is already registered with this email.");
      } else {
        setErrorMessage(error.message);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage("");
    try {
      await signInWithPopup(auth, googleProvider);
      setActiveTab("home");
      setActivePanel(null);
    } catch (error) {
      setErrorMessage("Google Login Error: " + error.message);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    if (user) {
      try {
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, { 
          lastSeen: 1, 
          lastLoggedOutAt: Date.now() 
        }, { merge: true });
      } catch (err) {
        console.error("Logout presence error:", err);
      }
    }
    await signOut(auth);
    setAppData(null);
    setAvatarPreview("");
    setCoverPreview("");
    setProfPostText("");
    setProfImagePreview(null);
    setOnboardStep(0);
    setShowAuthForm(false);
    setActiveTab("home");
    setActivePanel(null);
    setIsLoggingOut(false);
  };

  const setDayMode = (mode) => {
    saveToCloud({ ...appData, dayMode: mode });
  };

  const addCustomMeal = async () => {
    const cal = parseInt(customCal) || 0;
    if (!customName || cal <= 0) return showToast("Please enter a meal name and calorie value.");

    setIsAddingMeal(true);
    try {
      const todayStr = new Date().toDateString();
      await logMealEntry({
        name: customName,
        portion: customPortion || "1 serving",
        cal,
        p: parseInt(customP) || 0,
        c: parseInt(customC) || 0,
        f: parseInt(customF) || 0,
        id: Date.now(),
        dateLogged: todayStr
      });

      setCustomName(""); setCustomPortion("1 serving"); setCustomCal(""); setCustomP(""); setCustomC(""); setCustomF("");
    } finally {
      setIsAddingMeal(false);
    }
  };

  const logMealEntry = async (mealObj) => {
    const todayStr = new Date().toDateString();
    let streak = appData?.streakDays || 1;
    if (appData?.lastLogDate !== todayStr) streak += 1;

    const existingMeals = appData?.meals || [];
    const updatedMeals = [mealObj, ...existingMeals];

    await saveToCloud({
      ...appData,
      meals: updatedMeals,
      streakDays: streak,
      lastLogDate: todayStr
    });
  };

  const deleteMeal = (id) => {
    if (!appData) return;
    saveToCloud({ ...appData, meals: (appData.meals || []).filter(m => m.id !== id) });
    showToast("Meal removed from log", "info");
  };

  const handleUpdateWeight = async () => {
    if (!newLogWeight || isNaN(newLogWeight)) return showToast("Please enter a valid weight number.");
    setIsUpdatingWeight(true);
    try {
      const w = parseFloat(newLogWeight);
      const userDocRef = doc(db, "users", user.uid);
      const nowStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
      
      const currentHistory = Array.isArray(appData?.weightHistory) ? appData.weightHistory : [];
      const normalizedHistory = currentHistory.map(item => 
        typeof item === 'object' ? item : { val: item, date: "Prev" }
      );

      if (normalizedHistory.length === 0 && appData?.weight) {
        normalizedHistory.push({ val: appData.weight, date: "Start" });
      }

      const updatedHistory = [...normalizedHistory, { val: w, date: nowStr }].slice(-5);

      const bmr = 10 * w + 6.25 * (appData?.height || 165) - 5 * 25 + 5;
      const tdee = Math.round(bmr * (appData?.activityLevel || 1.375));

      const updatedData = {
        ...appData,
        prevWeight: appData?.weight || w,
        weight: w,
        weightHistory: updatedHistory,
        baseGoal: tdee
      };

      await setDoc(userDocRef, updatedData, { merge: true });
      setAppData(updatedData);
      setProfWeight(w);
      setNewLogWeight("");
      showToast("Weight logged!");
    } catch (err) {
      console.error("Error updating weight:", err);
    } finally {
      setIsUpdatingWeight(false);
    }
  };

  const saveUserProfile = async () => {
    setIsSavingProfile(true);
    try {
      const w = parseFloat(profWeight) || 60;
      const h = parseFloat(profHeight) || 160;
      const act = parseFloat(profActivity) || 1.55;

      let bmr = (10 * w) + (6.25 * h) - (5 * 25) + 5;
      let tdee = Math.round(bmr * act);

      await saveToCloud({
        ...appData,
        userName: profName || "Athlete",
        userTitle: profTitle || "Fitness Enthusiast",
        avatarUrl: avatarPreview || appData?.avatarUrl || "",
        coverUrl: coverPreview || appData?.coverUrl || "",
        height: h,
        weight: w,
        activityLevel: act,
        baseGoal: tdee,
        isPrivateAccount: profIsPrivate
      });
      showToast("Settings saved!");
      setActivePanel(null);
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="mobile-frame" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontWeight: 800, color: "var(--primary)" }}>Loading NutriPulse...</p>
      </div>
    );
  }

  if (appData?.isBlocked && !isAdmin) {
    return (
      <div className="mobile-frame" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div className="card" style={{ maxWidth: "360px", width: "100%", padding: "24px", textAlign: "center", border: "1px solid #fecaca" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 900, color: "#dc2626", marginBottom: "8px" }}>Account Restricted</h3>
          <p style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.5, marginBottom: "16px" }}>
            Your account is currently frozen under administrative review.
          </p>
          <button className="btn-block" onClick={handleLogout} style={{ background: "#dc2626" }}>
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    if (!showAuthForm) {
      const currentSlide = ONBOARDING_SLIDES[onboardSlideIdx];
      return (
        <div className="mobile-frame" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "32px 24px", background: "linear-gradient(180deg, #f8fafc 0%, #edf2f7 100%)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 900, color: "var(--primary)", letterSpacing: "-0.5px" }}>NUTRIPULSE</h2>
            <button onClick={() => setShowAuthForm(true)} style={{ background: "transparent", border: "none", color: "#64748b", fontWeight: 800, fontSize: "12px", cursor: "pointer" }}>Skip</button>
          </div>

          <div style={{ textAlign: "center", margin: "auto 0" }}>
            <div style={{ width: "90px", height: "90px", borderRadius: "50%", background: currentSlide.color + "15", color: currentSlide.color, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px auto", fontSize: "38px" }}>
              <i className={currentSlide.icon}></i>
            </div>
            <h3 style={{ fontSize: "20px", fontWeight: 900, color: "#0f172a", marginBottom: "8px" }}>{currentSlide.title}</h3>
            <p style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.6, maxWidth: "280px", margin: "0 auto" }}>{currentSlide.desc}</p>

            <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginTop: "24px" }}>
              {ONBOARDING_SLIDES.map((_, idx) => (
                <div key={idx} onClick={() => setOnboardSlideIdx(idx)} style={{ width: onboardSlideIdx === idx ? "20px" : "6px", height: "6px", borderRadius: "3px", background: onboardSlideIdx === idx ? "var(--primary)" : "#cbd5e1", cursor: "pointer", transition: "all 0.3s ease" }}></div>
              ))}
            </div>
          </div>

          <div>
            <button 
              onClick={() => {
                if (onboardSlideIdx < ONBOARDING_SLIDES.length - 1) {
                  setOnboardSlideIdx(onboardSlideIdx + 1);
                } else {
                  setShowAuthForm(true);
                }
              }} 
              className="btn-block" 
              style={{ height: "46px", fontSize: "13px", marginBottom: "10px" }}
            >
              {onboardSlideIdx < ONBOARDING_SLIDES.length - 1 ? "Next Step" : "Get Started"}
            </button>

            <button onClick={() => { setAuthMode("login"); setShowAuthForm(true); }} style={{ width: "100%", background: "transparent", border: "none", color: "#0f172a", fontWeight: 800, fontSize: "12px", cursor: "pointer", padding: "8px 0" }}>
              Already have an account? <span style={{ color: "var(--primary)" }}>Sign In</span>
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="mobile-frame" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div className="card" style={{ maxWidth: "360px", width: "100%", padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
            <button onClick={() => setShowAuthForm(false)} style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", fontSize: "12px", fontWeight: 800, color: "#334155" }}>
              <i className="fa-solid fa-arrow-left"></i>
            </button>
            <h2 style={{ fontSize: "18px", fontWeight: 900, color: "var(--primary)", letterSpacing: "0.5px", margin: "0 auto 0 auto" }}>NUTRIPULSE</h2>
          </div>

          {errorMessage && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: "12px", padding: "10px 12px", fontSize: "11px", fontWeight: 700, marginBottom: "14px", textAlign: "center" }}>
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleEmailAuth}>
            <div style={{ marginBottom: "10px" }}>
              <label style={{ fontSize: "11px", fontWeight: 700 }}>Email Address</label>
              <input type="email" className="form-input" placeholder="athlete@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "11px", fontWeight: 700 }}>Password</label>
              <input type="password" className="form-input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
            </div>

            <button type="submit" className="btn-block" style={{ height: "44px", fontSize: "13px" }}>
              {authMode === "login" ? "Sign In with Email" : "Sign Up with Email"}
            </button>
          </form>

          <div style={{ display: "flex", alignItems: "center", margin: "18px 0", gap: "8px" }}>
            <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }}></div>
            <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 700 }}>OR</span>
            <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }}></div>
          </div>

          <button onClick={handleGoogleSignIn} className="btn-block" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", height: "44px", fontSize: "12px", background: "#ffffff", color: "#0f172a", border: "1px solid #cbd5e1" }}>
            <i className="fa-brands fa-google" style={{ color: "#ea4335", fontSize: "15px" }}></i>
            Sign in with Google
          </button>

          <div style={{ textAlign: "center", marginTop: "16px" }}>
            <button onClick={() => { setErrorMessage(""); setAuthMode(authMode === "login" ? "signup" : "login"); }} style={{ background: "none", border: "none", color: "var(--primary)", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
              {authMode === "login" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // FIRST-TIME REGISTRATION ONBOARDING STEPS ONLY
  if (onboardStep === 1) {
    return (
      <div className="mobile-frame" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div className="card" style={{ maxWidth: "360px", width: "100%", padding: "24px", textAlign: "center" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "12px" }}>Health Disclaimer</h3>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "20px" }}>
            NutriPulse is designed for general fitness tracking only. Consult a physician before starting any diet or exercise program.
          </p>
          <button className="btn-block" onClick={() => setOnboardStep(2)}>
            I Understand & Agree
          </button>
        </div>
      </div>
    );
  }

  if (onboardStep === 2) {
    return (
      <div className="mobile-frame" style={{ padding: "20px", overflowY: "auto" }}>
        <div className="card" style={{ maxWidth: "360px", margin: "0 auto", padding: "24px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 800, textAlign: "center", marginBottom: "6px" }}>Setup Profile</h3>

          <label style={{ fontSize: "11px", fontWeight: 700 }}>Your Name</label>
          <input type="text" className="form-input" value={setupName} onChange={e => setSetupName(e.target.value)} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <div>
              <label style={{ fontSize: "11px", fontWeight: 700 }}>Height (cm)</label>
              <input type="number" className="form-input" value={setupHeight} onChange={e => setSetupHeight(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: "11px", fontWeight: 700 }}>Weight (kg)</label>
              <input type="number" className="form-input" value={setupWeight} onChange={e => setSetupWeight(e.target.value)} />
            </div>
          </div>

          <button className="btn-block" onClick={completeOnboarding} disabled={isSavingOnboarding} style={{ marginTop: "14px" }}>
            {isSavingOnboarding ? "Saving..." : "Save & Finish"}
          </button>
        </div>
      </div>
    );
  }

  if (!appData) {
    return (
      <div className="mobile-frame" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontWeight: 800, color: "var(--primary)" }}>Initializing NutriPulse...</p>
      </div>
    );
  }

  const todayStr = new Date().toDateString();
  const allMeals = appData?.meals || [];
  const todayMeals = allMeals.filter(m => !m.dateLogged || m.dateLogged === todayStr);

  let totalCal = 0, totalP = 0, totalC = 0, totalF = 0;
  todayMeals.forEach(m => {
    totalCal += m.cal; totalP += m.p; totalC += m.c; totalF += m.f;
  });

  const activeGoal = appData?.dayMode === "workout" ? (appData?.baseGoal || 2200) + 200 : (appData?.baseGoal || 2200);
  const pct = Math.min(Math.round((totalCal / activeGoal) * 100), 100);
  const strokeOffset = 283 - (283 * (pct / 100));

  const currentWeight = appData?.weight || 60;
  const estimatedWaterLiters = ((currentWeight * 35) / 1000).toFixed(1);

  const gpsCalculatedSteps = Math.round(totalGpsDistanceKm * 1350);
  const gpsCalBurned = Math.round(gpsCalculatedSteps * 0.04);

  const myBoostingList = appData?.boosting || [];
  const publicCommunityPosts = posts.filter(p => {
    if (p.isHidden) return false;
    if (p.visibility === "private") return false;
    if (p.visibility === "boosters" && p.userId !== user?.uid && !myBoostingList.includes(p.userId)) return false;
    return true;
  });

  const myPosts = posts.filter(p => p.userId === user?.uid && !p.isHidden);
  const myTotalPulses = myPosts.reduce((acc, curr) => acc + (curr.likes || 0), 0);

  const myRealtimeBoostersList = userList.filter(u => (u.boosting || []).includes(user?.uid));
  const myRealtimeBoostingList = userList.filter(u => (appData?.boosting || []).includes(u.uid));
  const myRealtimeBoostersCount = myRealtimeBoostersList.length;

  // NOTIFICATION ENGINE
  const pendingRequestsNotifs = (appData?.pendingBoosterRequests || []).map(reqUid => {
    const reqUser = userList.find(u => u.uid === reqUid);
    return {
      id: "req_" + reqUid,
      type: "request",
      title: reqUser?.userName || "An Athlete",
      avatar: reqUser?.avatarUrl || "",
      text: "sent a request",
      uid: reqUid,
      timestamp: reqUser?.lastSeen || Date.now()
    };
  });

  const pulseActivityNotifs = posts.filter(p => p.userId === user?.uid && Array.isArray(p.likedBy) && p.likedBy.length > 0).flatMap(p => {
    return p.likedBy.filter(likerUid => likerUid !== user?.uid).map(likerUid => {
      const likerUser = userList.find(u => u.uid === likerUid);
      return {
        id: "pulse_" + p.id + "_" + likerUid,
        type: "pulse",
        title: likerUser?.userName || "An Athlete",
        avatar: likerUser?.avatarUrl || "",
        text: "pulsed your post",
        postId: p.id,
        timestamp: p.createdAt || Date.now()
      };
    });
  });

  const commentActivityNotifs = (posts || []).filter(p => p.userId === user?.uid).flatMap(p => {
    const list = postComments[p.id] || [];
    return list.filter(c => c.userName !== (appData?.userName || user?.displayName)).map(c => ({
      id: "comment_" + c.id,
      type: "comment",
      title: c.userName,
      avatar: c.avatarUrl,
      text: `commented: "${c.text.slice(0, 20)}..."`,
      postId: p.id,
      timestamp: c.createdAt
    }));
  });

  const allUserNotifs = [...pendingRequestsNotifs, ...pulseActivityNotifs, ...commentActivityNotifs].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  const timerMinDisplay = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
  const timerSecDisplay = String(timerSeconds % 60).padStart(2, '0');

  return (
    <div className="mobile-frame" style={{ maxWidth: "480px", margin: "0 auto", background: "#f8fafc", minHeight: "100vh", position: "relative" }}>
      <div className="screen-container" style={{ padding: "16px", paddingBottom: "120px" }}>
        
        {/* TAB 1: HOME */}
        {activeTab === "home" && (
          <div className="screen active">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "linear-gradient(135deg, #4f46e5, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "11px" }}>
                  <i className="fa-solid fa-heart-pulse"></i>
                </div>
                <div>
                  <span style={{ fontSize: "9px", fontWeight: 800, color: "var(--primary)", textTransform: "uppercase" }}>NUTRIPULSE</span>
                  <h2 style={{ fontSize: "14px", fontWeight: 900, margin: 0, color: "#0f172a" }}>Hey, {appData?.userName || "Athlete"}!</h2>
                </div>
              </div>
              <div className="streak-badge" style={{ padding: "4px 8px", fontSize: "10px" }}>
                <i className="fa-solid fa-fire"></i> {appData?.streakDays || 1}d
              </div>
            </div>

            <div className="motivation-card" onClick={shuffleQuote} style={{ cursor: "pointer", padding: "8px 12px", marginBottom: "12px", borderRadius: "12px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700 }}>"{quote}"</div>
            </div>

            <div className="card" style={{ padding: "14px", borderRadius: "18px", marginBottom: "14px" }}>
              <div style={{ fontSize: "13px", fontWeight: 800, marginBottom: "8px" }}>Today Overview</div>
              <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.3fr", gap: "10px", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div className="ring-box" style={{ width: "52px", height: "52px" }}>
                    <svg viewBox="0 0 100 100">
                      <circle className="ring-bg" cx="50" cy="50" r="45"></circle>
                      <circle className="ring-progress" cx="50" cy="50" r="45" style={{ strokeDashoffset: strokeOffset }}></circle>
                    </svg>
                    <div className="ring-text" style={{ fontSize: "11px" }}><span>{pct}%</span></div>
                  </div>
                  <div>
                    <p style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: 700, margin: 0 }}>TARGET</p>
                    <h4 style={{ fontSize: "14px", fontWeight: 900, margin: 0, color: "#0f172a" }}>{totalCal}/{activeGoal}</h4>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", fontWeight: 800 }}>
                      <span>Protein</span><span>{totalP}/{appData?.pGoal || 120}g</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", fontWeight: 800 }}>
                      <span>Carbs</span><span>{totalC}/{appData?.cGoal || 200}g</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", fontWeight: 800 }}>
                      <span>Fats</span><span>{totalF}/{appData?.fGoal || 60}g</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DIARY */}
        {activeTab === "diary" && (
          <div className="screen active">
            <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "14px" }}>Food & Nutrition Log</h3>
            <div className="card">
              <div style={{ fontSize: "14px", fontWeight: 800, marginBottom: "10px" }}>Log Food Entry</div>
              <input type="text" className="form-input" placeholder="Food Name" value={customName} onChange={e => setCustomName(e.target.value)} />
              <input type="number" className="form-input" placeholder="Calories" value={customCal} onChange={e => setCustomCal(e.target.value)} />
              <button className="btn-block" onClick={addCustomMeal}>Add Meal</button>
            </div>
          </div>
        )}

        {/* TAB 3: COMMUNITY */}
        {activeTab === "community" && (
          <div className="screen active">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 900, color: "var(--primary)", margin: 0 }}>NutriPulse</h2>
              <button 
                onClick={() => { setActivePanel("notif"); const nowT = Date.now(); setLastSeenNotifTime(nowT); localStorage.setItem("np_last_seen_notif", nowT.toString()); }} 
                style={{ position: "relative", background: "#f1f5f9", border: "none", width: "36px", height: "36px", borderRadius: "50%", cursor: "pointer" }}
              >
                <i className="fa-regular fa-bell"></i>
                {allUserNotifs.filter(n => (n.timestamp || 0) > lastSeenNotifTime).length > 0 && (
                  <span style={{ position: "absolute", top: "2px", right: "2px", background: "#ef4444", color: "white", fontSize: "9px", fontWeight: 800, width: "15px", height: "15px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {allUserNotifs.filter(n => (n.timestamp || 0) > lastSeenNotifTime).length}
                  </span>
                )}
              </button>
            </div>

            {publicCommunityPosts.map(p => (
              <div key={p.id} className="card" style={{ padding: "14px", borderRadius: "18px", marginBottom: "14px" }}>
                <div style={{ fontSize: "13px", fontWeight: 800, marginBottom: "6px" }}>{p.userName}</div>
                <div onClick={() => { setSelectedPost(p); setActivePanel("post_detail"); }} style={{ cursor: "pointer" }}>
                  <ExpandableText text={p.text} />
                </div>
                {p.imageUrl && <img src={p.imageUrl} alt="" style={{ width: "100%", borderRadius: "10px", marginTop: "6px" }} />}
                <div style={{ display: "flex", gap: "10px", marginTop: "8px", borderTop: "1px solid #f1f5f9", paddingTop: "6px" }}>
                  <button onClick={() => handleLike(p.id, p.likes || 0, p.likedBy || [])} style={{ background: "none", border: "none", color: "#ef4444", fontWeight: 800, fontSize: "11px", cursor: "pointer" }}>
                    Pulse ({p.likes || 0})
                  </button>
                  <button onClick={() => { setSelectedPost(p); setActivePanel("post_detail"); }} style={{ background: "none", border: "none", color: "#64748b", fontWeight: 800, fontSize: "11px", cursor: "pointer" }}>
                    Comment ({(postComments[p.id] || []).length})
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 6: PROFILE */}
        {activeTab === "profile" && (
          <div className="screen active">
            <div className="card" style={{ padding: 0, overflow: "hidden", borderRadius: "20px", marginBottom: "12px", position: "relative" }}>
              <div style={{ height: "85px", background: "linear-gradient(135deg, #0284c7, #4f46e5)", position: "relative" }}>
                <button 
                  onClick={() => setActivePanel("settings")} 
                  style={{ position: "absolute", top: "10px", right: "10px", background: "rgba(255,255,255,0.25)", color: "white", border: "none", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer" }}
                >
                  <i className="fa-solid fa-gear"></i>
                </button>
              </div>

              <div style={{ padding: "0 12px 12px 12px", textAlign: "center" }}>
                <h3 style={{ fontSize: "17px", fontWeight: 900, color: "#0f172a", marginTop: "8px" }}>{appData?.userName || "Athlete"}</h3>
                <p style={{ fontSize: "10px", color: "var(--text-muted)", margin: 0 }}>{appData?.userTitle || "Fitness Enthusiast"}</p>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* REFACTORED SLIDE-OVER PANELS */}
      {activePanel && (
        <div style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", maxWidth: "480px", width: "100%", height: "100vh", background: "#ffffff", zIndex: 99999, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "16px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button onClick={() => setActivePanel(null)} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer" }}>
                <i className="fa-solid fa-arrow-left"></i>
              </button>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800 }}>
                {activePanel === 'settings' && 'Profile Settings'}
                {activePanel === 'post_detail' && 'Post Detail'}
                {activePanel === 'notif' && 'Notifications'}
              </h3>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
            {/* NEW CLEAN PROFILE SETTINGS */}
            {activePanel === 'settings' && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>Display Name</label>
                  <input type="text" value={profName} onChange={e => setProfName(e.target.value)} className="form-input" />
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>Bio Title</label>
                  <input type="text" value={profTitle} onChange={e => setProfTitle(e.target.value)} className="form-input" />
                </div>
                <button onClick={saveUserProfile} disabled={isSavingProfile} style={{ padding: "12px", background: "#0284c7", color: "white", border: "none", borderRadius: "10px", fontWeight: 800, cursor: "pointer" }}>
                  {isSavingProfile ? "Saving..." : "Save Changes"}
                </button>
                <button onClick={handleLogout} style={{ padding: "12px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "10px", fontWeight: 800, cursor: "pointer" }}>
                  Sign Out Account
                </button>
              </div>
            )}

            {/* POST DETAIL VIEW PANEL */}
            {activePanel === 'post_detail' && selectedPost && (
              <div>
                <h4 style={{ fontSize: "14px", fontWeight: 800 }}>{selectedPost.userName}</h4>
                <p style={{ fontSize: "12px", color: "#334155" }}>{selectedPost.text}</p>
                {selectedPost.imageUrl && <img src={selectedPost.imageUrl} alt="" style={{ width: "100%", borderRadius: "10px" }} />}
                
                <div style={{ marginTop: "14px" }}>
                  <h5 style={{ fontSize: "12px", fontWeight: 800 }}>Comments ({(postComments[selectedPost.id] || []).length})</h5>
                  <div style={{ display: "flex", gap: "8px", margin: "8px 0" }}>
                    <input type="text" placeholder="Write a comment..." value={newCommentText} onChange={e => setNewCommentText(e.target.value)} style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                    <button onClick={() => handleAddComment(selectedPost.id)} style={{ padding: "8px 12px", background: "#0284c7", color: "white", border: "none", borderRadius: "8px", fontWeight: 800 }}>Post</button>
                  </div>
                  {(postComments[selectedPost.id] || []).map(c => (
                    <div key={c.id} style={{ background: "#f8fafc", padding: "8px", borderRadius: "8px", marginBottom: "6px" }}>
                      <strong style={{ fontSize: "11px" }}>{c.userName}</strong>
                      <p style={{ fontSize: "11px", margin: 0 }}>{c.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BOTTOM NAVIGATION BAR */}
      <div className="bottom-nav" style={{ position: "fixed", bottom: 0, left: 0, right: 0, display: "flex", justifyContent: "center", maxWidth: "480px", width: "100%", margin: "0 auto", background: "#ffffff", borderTop: "1px solid #e2e8f0", zIndex: 1000 }}>
        <div className={"nav-item " + (activeTab === "home" ? "active" : "")} onClick={() => handleTabChange("home")}><i className="fa-solid fa-house"></i><span>Home</span></div>
        <div className={"nav-item " + (activeTab === "diary" ? "active" : "")} onClick={() => handleTabChange("diary")}><i className="fa-regular fa-calendar-check"></i><span>Log</span></div>
        <div className={"nav-item " + (activeTab === "community" ? "active" : "")} onClick={() => handleTabChange("community")}><i className="fa-solid fa-users"></i><span>Social</span></div>
        <div className={"nav-item " + (activeTab === "profile" ? "active" : "")} onClick={() => handleTabChange("profile")}><i className="fa-regular fa-user"></i><span>Profile</span></div>
      </div>
    </div>
  );
}
