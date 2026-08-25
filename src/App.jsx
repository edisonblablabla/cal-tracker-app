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
  limit
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

            const handleVisibilityChange = () => {
              if (document.visibilityState === "visible") {
                sendPresencePing();
              }
            };

            const handleBeforeUnload = () => {
              setDoc(userDocRef, { lastSeen: 0 }, { merge: true });
            };

            window.addEventListener("visibilitychange", handleVisibilityChange);
            window.addEventListener("focus", sendPresencePing);
            window.addEventListener("beforeunload", handleBeforeUnload);

            setProfName(data?.userName || currentUser.displayName || "Athlete");
            setProfTitle(data?.userTitle || "Fitness Enthusiast");
            setProfHeight(data?.height || 160);
            setProfWeight(data?.weight || 60);
            setProfActivity(data?.activityLevel || 1.55);
            setProfIsBlocked(data?.isPrivateAccount || false);
            setNewLogWeight(data?.weight || 60);
            setAvatarPreview(data?.avatarUrl || "");
            setCoverPreview(data?.coverUrl || "");

            if (!data?.onboardingCompleted) {
              setOnboardStep(1);
            } else {
              setOnboardStep(0);
              setActiveTab("home");
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
    if (activeTab === "community" || activeTab === "profile" || activeTab === "admin") {
      fetchPosts();
      fetchUsers();
    }
  }, [activeTab]);

  const shuffleQuote = () => {
    const randomIndex = Math.floor(Math.random() * FITNESS_QUOTES.length);
    setQuote(FITNESS_QUOTES[randomIndex]);
  };

  const handleSetWorkoutTarget = (mins) => {
    const parsedMins = parseInt(mins) || 0;
    setWorkoutDuration(mins);
    setTimerSeconds(parsedMins * 60);
    setIsTimerRunning(false);
  };

  const startTimer = () => {
    if (timerSeconds <= 0) return alert("Please set duration in minutes.");
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

    alert(`Workout Logged! Completed ${elapsedMins} mins of ${actObj.name} (-${burned} kcal).`);
    setTimerSeconds(initialMins * 60);
  };

  const fetchPosts = async () => {
    try {
      const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(50));
      const querySnapshot = await getDocs(q);
      const list = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setPosts(list);
    } catch (err) {
      console.error("Error fetching posts:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const list = [];
      querySnapshot.forEach((docSnap) => {
        list.push({ uid: docSnap.id, ...docSnap.data() });
      });
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setUserList(list);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const toggleBlockUser = async (targetUid, isCurrentlyBlocked) => {
    const actionText = isCurrentlyBlocked ? "Unblock this user account?" : "Block this user account? (Account will be frozen, but data saved for evidence)";
    if (window.confirm(actionText)) {
      try {
        await setDoc(doc(db, "users", targetUid), { isBlocked: !isCurrentlyBlocked }, { merge: true });
        await fetchUsers();
        await fetchPosts();
        alert(isCurrentlyBlocked ? "User unblocked successfully." : "User blocked! Account restricted & record preserved.");
      } catch (err) {
        console.error("Error updating user block status:", err);
      }
    }
  };

  const toggleHidePost = async (postId, currentlyHidden) => {
    const actionText = currentlyHidden ? "Unhide this post and make it visible again?" : "Hide this post for evidence/investigation? (Will be hidden from users but saved in Admin)";
    if (window.confirm(actionText)) {
      try {
        const postRef = doc(db, "posts", postId);
        await updateDoc(postRef, { isHidden: !currentlyHidden });
        await fetchPosts();
        alert(currentlyHidden ? "Post is now visible to users again." : "Post hidden from feed and saved for evidence.");
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
      alert("Unboosted athlete.");
    } else if (targetIsPrivate && !isPending) {
      updatedRequests.push(targetUid);
      alert("Booster Request sent to athlete!");
    } else {
      updatedBoosting.push(targetUid);
      alert("You are now Boosting this athlete!");
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
        alert("Profile avatar updated successfully!");
      });
    }
  };

  const handleDirectCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      compressImage(file, async (compressedUrl) => {
        setCoverPreview(compressedUrl);
        await saveToCloud({ ...appData, coverUrl: compressedUrl });
        alert("Cover banner updated successfully!");
      });
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      compressImage(file, (compressedUrl) => setAvatarPreview(compressedUrl));
    }
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      compressImage(file, (compressedUrl) => setCoverPreview(compressedUrl));
    }
  };

  const createPost = async (isProfile = false) => {
    if (appData?.isBlocked) return alert("Your account is currently blocked/restricted.");

    const textToSubmit = isProfile ? profPostText.trim() : postText.trim();
    const imageToSubmit = isProfile ? profImagePreview : imagePreview;
    const visibilityToSubmit = isProfile ? profPostVisibility : postVisibility;

    if (!textToSubmit && !imageToSubmit) return alert("Please enter text or select an image.");
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
      alert("Post published successfully!");
    } catch (err) {
      console.error("Error creating post:", err);
      alert("Failed to publish post: " + err.message);
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
      alert("Post updated successfully!");
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
      fetchPosts();
    } catch (err) {
      console.error("Error toggling pulse:", err);
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
    } finally {
      setIsSavingOnboarding(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setShowSettingsModal(false);
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
    } catch (error) {
      if (error.code === "auth/invalid-credential" || error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        setErrorMessage("Invalid email or password. Please try again.");
      } else if (error.code === "auth/email-already-in-use") {
        setErrorMessage("An account is already registered with this email.");
      } else if (error.code === "auth/weak-password") {
        setErrorMessage("Password must be at least 6 characters long.");
      } else {
        setErrorMessage(error.message);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage("");
    setShowSettingsModal(false);
    try {
      await signInWithPopup(auth, googleProvider);
      setActiveTab("home");
    } catch (error) {
      setErrorMessage("Google Login Error: " + error.message);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setShowSettingsModal(false);
    if (user) {
      try {
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, { lastSeen: 0 }, { merge: true });
      } catch (err) {
        console.error("Logout presence error:", err);
      }
    }
    await signOut(auth);
    setAppData(null);
    setOnboardStep(0);
    setShowAuthForm(false);
    setActiveTab("home");
    setIsLoggingOut(false);
  };

  const setDayMode = (mode) => {
    saveToCloud({ ...appData, dayMode: mode });
  };

  const addCustomMeal = async () => {
    const cal = parseInt(customCal) || 0;
    if (!customName || cal <= 0) return alert("Please enter a meal name and calorie value.");

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
  };

  const handleUpdateWeight = async () => {
    if (!newLogWeight || isNaN(newLogWeight)) return alert("Please enter a valid weight number.");
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
      alert("Weight logged & 5-entry trend updated!");
    } catch (err) {
      console.error("Error updating weight:", err);
    } finally {
      setIsUpdatingWeight(false);
    }
  };

  const setGoalPreset = (type) => {
    if (!appData) return;
    const w = appData.weight || 60;
    const h = appData.height || 160;
    const act = parseFloat(appData.activityLevel) || 1.55;

    let bmr = (10 * w) + (6.25 * h) - (5 * 25) + 5;
    let tdee = Math.round(bmr * act);

    let baseGoal = tdee;
    let pGoal = Math.round(w * 2.0);
    let cGoal = Math.round(w * 3.2);
    let fGoal = Math.round(w * 0.9);

    if (type === "jogger") {
      baseGoal = tdee + 100; pGoal = Math.round(w * 1.8); cGoal = Math.round(w * 4.5); fGoal = Math.round(w * 0.9);
    } else if (type === "marathon") {
      baseGoal = tdee + 400; pGoal = Math.round(w * 1.8); cGoal = Math.round(w * 6.0); fGoal = Math.round(w * 1.0);
    } else if (type === "steps") {
      baseGoal = Math.max(1200, tdee - 250); pGoal = Math.round(w * 2.0); cGoal = Math.round(w * 3.2); fGoal = Math.round(w * 0.8);
    } else if (type === "bulk") {
      baseGoal = tdee + 250; pGoal = Math.round(w * 2.2); cGoal = Math.round(w * 4.0); fGoal = Math.round(w * 1.0);
    } else if (type === "cut") {
      baseGoal = Math.max(1200, tdee - 450); pGoal = Math.round(w * 2.4); cGoal = Math.round(w * 2.0); fGoal = Math.round(w * 0.8);
    } else if (type === "recomp") {
      baseGoal = tdee; pGoal = Math.round(w * 2.2); cGoal = Math.round(w * 3.0); fGoal = Math.round(w * 0.9);
    } else if (type === "dirty") {
      baseGoal = tdee + 600; pGoal = Math.round(w * 2.0); cGoal = Math.round(w * 5.0); fGoal = Math.round(w * 1.2);
    }

    saveToCloud({ ...appData, activeGoalType: type, baseGoal, pGoal, cGoal, fGoal });
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
      alert("Profile settings saved successfully.");
      setShowSettingsModal(false);
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
            Your account is currently frozen under administrative review. Your account data has been preserved.
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
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "linear-gradient(135deg, #4f46e5, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "11px", boxShadow: "0 2px 6px rgba(79,70,229,0.3)" }}>
                <i className="fa-solid fa-heart-pulse"></i>
              </div>
              <h2 style={{ fontSize: "20px", fontWeight: 900, color: "var(--primary)", letterSpacing: "-0.5px", margin: 0 }}>NUTRIPULSE</h2>
            </div>
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
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "linear-gradient(135deg, #4f46e5, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "22px", boxShadow: "0 4px 12px rgba(79,70,229,0.35)", marginBottom: "8px" }}>
              <i className="fa-solid fa-heart-pulse"></i>
            </div>
            <div style={{ display: "flex", alignItems: "center", width: "100%", position: "relative" }}>
              <button onClick={() => setShowAuthForm(false)} style={{ position: "absolute", left: 0, background: "#f1f5f9", border: "none", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", fontSize: "12px", fontWeight: 800, color: "#334155" }}>
                <i className="fa-solid fa-arrow-left"></i>
              </button>
              <h2 style={{ fontSize: "18px", fontWeight: 900, color: "var(--primary)", letterSpacing: "0.5px", margin: "0 auto" }}>NUTRIPULSE</h2>
            </div>
          </div>

          {errorMessage && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: "12px", padding: "10px 12px", fontSize: "11px", fontWeight: 700, marginBottom: "14px", textAlign: "center" }}>
              <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: "6px" }}></i>
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

  if (onboardStep === 1) {
    return (
      <div className="mobile-frame" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div className="card" style={{ maxWidth: "360px", width: "100%", padding: "24px", textAlign: "center" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "12px" }}>Health & Safety Disclaimer</h3>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "20px" }}>
            NutriPulse is designed for general fitness and informational tracking only. It does not provide medical advice. Please consult a physician before starting any diet or training program.
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
          <h3 style={{ fontSize: "18px", fontWeight: 800, textAlign: "center", marginBottom: "6px" }}>Setup Fitness Profile</h3>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "center", marginBottom: "16px" }}>Customize your physical metrics for accurate target calculations.</p>

          <label style={{ fontSize: "11px", fontWeight: 700 }}>Your Name</label>
          <input type="text" className="form-input" placeholder="e.g. Edison" value={setupName} onChange={e => setSetupName(e.target.value)} />

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

          <label style={{ fontSize: "11px", fontWeight: 700 }}>Activity Level</label>
          <select className="form-select" value={setupActivity} onChange={e => setSetupActivity(e.target.value)}>
            <option value="1.2">Sedentary (Little or no exercise)</option>
            <option value="1.375">Light Exercise (1-3 days/week)</option>
            <option value="1.55">Moderate Exercise (3-5 days/week)</option>
            <option value="1.725">Heavy Athlete (6-7 days/week)</option>
          </select>

          <label style={{ fontSize: "11px", fontWeight: 700 }}>Primary Objective</label>
          <select className="form-select" value={setupGoalType} onChange={e => setSetupGoalType(e.target.value)}>
            <option value="jogger">Daily Jogger / Casual Runner</option>
            <option value="marathon">Endurance & Marathon Prep</option>
            <option value="steps">Daily 10k Steps / Fat Loss</option>
            <option value="bulk">Lean Bulk (Clean Muscle Gain)</option>
            <option value="cut">Aggressive Cut (Fast Fat Loss)</option>
            <option value="recomp">Body Recomposition</option>
            <option value="dirty">Heavy Mass Gain</option>
          </select>

          <button className="btn-block" onClick={completeOnboarding} disabled={isSavingOnboarding} style={{ marginTop: "10px" }}>
            {isSavingOnboarding ? "Saving Profile..." : "Save & Continue"}
          </button>
        </div>
      </div>
    );
  }

  if (!appData) {
    return (
      <div className="mobile-frame" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontWeight: 800, color: "var(--primary)" }}>Initializing Profile Data...</p>
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

  const goalTitles = {
    "jogger": "Daily Jogger",
    "marathon": "Endurance & Marathon",
    "steps": "Daily 10k Steps",
    "bulk": "Lean Bulk",
    "cut": "Aggressive Cut",
    "recomp": "Body Recomposition",
    "dirty": "Heavy Mass Gain",
    "maint": "Maintenance"
  };

  const heightM = (appData?.height || 160) / 100;
  const numericBmi = parseFloat((currentWeight / (heightM * heightM)).toFixed(1));
  const bmiScore = numericBmi.toFixed(1);

  let bmiCategory = "Healthy Weight";
  let bmiColor = "#10b981";
  let bmiBarPct = 50;

  if (numericBmi < 18.5) {
    bmiCategory = "Underweight";
    bmiColor = "#3b82f6";
    bmiBarPct = 20;
  } else if (numericBmi >= 18.5 && numericBmi <= 24.9) {
    bmiCategory = "Healthy Weight";
    bmiColor = "#10b981";
    bmiBarPct = 50;
  } else if (numericBmi >= 25 && numericBmi <= 29.9) {
    bmiCategory = "Overweight";
    bmiColor = "#f59e0b";
    bmiBarPct = 75;
  } else {
    bmiCategory = "Obese Range";
    bmiColor = "#ef4444";
    bmiBarPct = 95;
  }

  const weightChange = (appData?.prevWeight) ? parseFloat((currentWeight - appData.prevWeight).toFixed(1)) : 0;

  let trendMessage = "";
  let badgeStyle = {};

  if (numericBmi >= 30.0) {
    trendMessage = `Obese range (BMI ${bmiScore}). Stick to your active calorie deficit plan.`;
    badgeStyle = { color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca" };
  } else if (numericBmi >= 25.0 && numericBmi <= 29.9) {
    trendMessage = `Overweight range (BMI ${bmiScore}). Keep working on your active deficit.`;
    badgeStyle = { color: "#d97706", background: "#fffbeb", border: "1px solid #fde68a" };
  } else if (numericBmi >= 23.5 && numericBmi <= 24.9) {
    if (weightChange > 0) {
      trendMessage = `Approaching overweight (BMI ${bmiScore}). Increase steps or trim intake.`;
      badgeStyle = { color: "#b45309", background: "#fffbeb", border: "1px solid #fde68a" };
    } else {
      trendMessage = `Upper normal zone (BMI ${bmiScore}). Heading in a good direction!`;
      badgeStyle = { color: "#0284c7", background: "#f0f9ff", border: "1px solid #bae6fd" };
    }
  } else if (numericBmi >= 20.0 && numericBmi < 23.5) {
    trendMessage = `Optimal healthy zone (BMI ${bmiScore}). Great balance, stay consistent!`;
    badgeStyle = { color: "#15803d", background: "#f0fdf4", border: "1px solid #bbf7d0" };
  } else if (numericBmi >= 18.5 && numericBmi < 20.0) {
    if (weightChange < 0) {
      trendMessage = `Nearing lower normal boundary (BMI ${bmiScore}). Keep nutrition steady.`;
      badgeStyle = { color: "#0284c7", background: "#f0f9ff", border: "1px solid #bae6fd" };
    } else {
      trendMessage = `Healthy range (BMI ${bmiScore}). Steady progress logged.`;
      badgeStyle = { color: "#15803d", background: "#f0fdf4", border: "1px solid #bbf7d0" };
    }
  } else {
    trendMessage = `Underweight range (BMI ${bmiScore}). Focus on nutrient-dense meals.`;
    badgeStyle = { color: "#2563eb", background: "#eff6ff", border: "1px solid #bfdbfe" };
  }

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

  const filteredSearchUsers = searchQuery.trim() === "" ? [] : userList.filter(u => 
    (u.userName || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
    (u.userEmail || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingRequestsNotifs = (appData?.pendingBoosterRequests || []).map(reqUid => {
    const reqUser = userList.find(u => u.uid === reqUid);
    return {
      id: reqUid,
      type: "request",
      title: reqUser?.userName || "An Athlete",
      avatar: reqUser?.avatarUrl || "",
      text: "sent you a booster request",
      uid: reqUid
    };
  });

  const pulseActivityNotifs = posts.filter(p => p.userId === user?.uid && Array.isArray(p.likedBy) && p.likedBy.length > 0).flatMap(p => {
    return p.likedBy.filter(likerUid => likerUid !== user?.uid).map(likerUid => {
      const likerUser = userList.find(u => u.uid === likerUid);
      return {
        id: p.id + "_" + likerUid,
        type: "pulse",
        title: likerUser?.userName || "An Athlete",
        avatar: likerUser?.avatarUrl || "",
        text: "pulsed your post",
        uid: likerUid
      };
    });
  });

  const allUserNotifs = [...pendingRequestsNotifs, ...pulseActivityNotifs];

  const activeWorkoutObj = WORKOUT_ACTIVITIES.find(a => a.name === selectedActivity) || WORKOUT_ACTIVITIES[0];
  const initialMins = parseInt(workoutDuration) || 30;
  const elapsedMins = Math.max(1, Math.round((initialMins * 60 - timerSeconds) / 60));
  const estimatedWorkoutBurn = Math.round(elapsedMins * activeWorkoutObj.calPerMin);

  const timerMinDisplay = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
  const timerSecDisplay = String(timerSeconds % 60).padStart(2, '0');

  return (
    <div className="mobile-frame" style={{ maxWidth: "480px", margin: "0 auto", background: "#f8fafc", minHeight: "100vh", position: "relative" }}>
      <div className="screen-container" style={{ padding: "16px", paddingBottom: "120px" }}>
        {/* TAB 1: HOME */}
        {activeTab === "home" && (
          <div className="screen active">
            {/* ULTRA-COMPACT HEADER WITH AUTO-ELLIPSIS & PULSE LOGO */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", gap: "8px" }}>
              <div style={{ minWidth: 0, flex: 1, display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "linear-gradient(135deg, #4f46e5, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "11px", boxShadow: "0 2px 6px rgba(79,70,229,0.3)", flexShrink: 0 }}>
                  <i className="fa-solid fa-heart-pulse"></i>
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ fontSize: "9px", fontWeight: 800, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", lineHeight: 1 }}>NUTRIPULSE</span>
                  <h2 style={{ 
                    fontSize: "14px", 
                    fontWeight: 900, 
                    margin: 0, 
                    lineHeight: 1.2, 
                    color: "#0f172a",
                    whiteSpace: "nowrap", 
                    overflow: "hidden", 
                    textOverflow: "ellipsis" 
                  }}>
                    Hey, {appData?.userName || "Athlete"}! 👋
                  </h2>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "5px", flexShrink: 0 }}>
                <div className="streak-badge" style={{ padding: "4px 8px", fontSize: "10px" }}><i className="fa-solid fa-fire"></i> <span>{appData?.streakDays || 1}</span>d</div>
                <button onClick={() => setShowAboutModal(true)} style={{ background: "#e0e7ff", border: "none", color: "var(--primary)", borderRadius: "8px", width: "26px", height: "26px", fontWeight: 900, cursor: "pointer", fontSize: "11px" }}>?</button>
              </div>
            </div>

            <div className="motivation-card" onClick={shuffleQuote} style={{ cursor: "pointer", padding: "8px 12px", marginBottom: "12px", borderRadius: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                <span style={{ fontSize: "9px", textTransform: "uppercase", opacity: 0.7, fontWeight: 800 }}>Daily Motivation</span>
                <i className="fa-solid fa-rotate" style={{ fontSize: "10px", opacity: 0.6 }}></i>
              </div>
              <div style={{ fontSize: "11px", fontWeight: 700, lineHeight: 1.3 }}>"{quote}"</div>
            </div>

            <div className="card" style={{ padding: "14px", borderRadius: "18px", marginBottom: "14px" }}>
              <div style={{ fontSize: "13px", fontWeight: 800, marginBottom: "8px" }}>Today Overview</div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.3fr", gap: "10px", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div className="ring-box" style={{ width: "52px", height: "52px", flexShrink: 0 }}>
                    <svg viewBox="0 0 100 100">
                      <circle className="ring-bg" cx="50" cy="50" r="45"></circle>
                      <circle className="ring-progress" cx="50" cy="50" r="45" style={{ strokeDashoffset: strokeOffset }}></circle>
                    </svg>
                    <div className="ring-text" style={{ fontSize: "11px" }}><span>{pct}%</span></div>
                  </div>
                  <div>
                    <p style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: 700, margin: 0, textTransform: "uppercase" }}>Target</p>
                    <h4 style={{ fontSize: "14px", fontWeight: 900, margin: 0, color: "#0f172a", lineHeight: 1.1 }}>
                      {totalCal}<span style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)" }}>/{activeGoal}</span>
                    </h4>
                    <span style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: 700 }}>kcal</span>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", fontWeight: 800, color: "#334155" }}>
                      <span>Protein</span><span>{totalP}/{appData?.pGoal || 120}g</span>
                    </div>
                    <div className="macro-bar-bg" style={{ height: "5px", marginTop: "2px" }}>
                      <div className="macro-bar-fill" style={{ background: "var(--protein)", width: Math.min((totalP / (appData?.pGoal || 120)) * 100, 100) + "%" }}></div>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", fontWeight: 800, color: "#334155" }}>
                      <span>Carbs</span><span>{totalC}/{appData?.cGoal || 200}g</span>
                    </div>
                    <div className="macro-bar-bg" style={{ height: "5px", marginTop: "2px" }}>
                      <div className="macro-bar-fill" style={{ background: "var(--carbs)", width: Math.min((totalC / (appData?.cGoal || 200)) * 100, 100) + "%" }}></div>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", fontWeight: 800, color: "#334155" }}>
                      <span>Fats</span><span>{totalF}/{appData?.fGoal || 60}g</span>
                    </div>
                    <div className="macro-bar-bg" style={{ height: "5px", marginTop: "2px" }}>
                      <div className="macro-bar-fill" style={{ background: "var(--fats)", width: Math.min((totalF / (appData?.fGoal || 60)) * 100, 100) + "%" }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mode-toggle" style={{ marginBottom: "14px" }}>
              <button className={"mode-btn " + (appData?.dayMode === "rest" ? "active" : "")} onClick={() => setDayMode("rest")}>Rest Day</button>
              <button className={"mode-btn " + (appData?.dayMode === "workout" ? "active" : "")} onClick={() => setDayMode("workout")}>Workout Day</button>
            </div>

            <div className="card" style={{ padding: "16px", borderRadius: "20px", background: "linear-gradient(135deg, #0284c7, #0369a1)", color: "white", marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <i className="fa-solid fa-location-dot" style={{ fontSize: "18px", color: "#38bdf8" }}></i>
                  <h4 style={{ fontSize: "14px", fontWeight: 800 }}>GPS Step & Distance Tracker</h4>
                </div>
                <span style={{ fontSize: "9px", background: "rgba(255,255,255,0.2)", padding: "3px 8px", borderRadius: "8px", fontWeight: 800 }}>
                  {gpsStatus}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "8px" }}>
                <div style={{ background: "rgba(255,255,255,0.1)", padding: "10px", borderRadius: "12px", textAlign: "center" }}>
                  <div style={{ fontSize: "10px", opacity: 0.8, fontWeight: 700 }}>Estimated Steps</div>
                  <div style={{ fontSize: "18px", fontWeight: 900, marginTop: "2px" }}>{gpsCalculatedSteps.toLocaleString()}</div>
                </div>

                <div style={{ background: "rgba(255,255,255,0.1)", padding: "10px", borderRadius: "12px", textAlign: "center" }}>
                  <div style={{ fontSize: "10px", opacity: 0.8, fontWeight: 700 }}>Distance Walked</div>
                  <div style={{ fontSize: "18px", fontWeight: 900, marginTop: "2px" }}>{totalGpsDistanceKm.toFixed(2)} km</div>
                </div>
              </div>

              <div style={{ fontSize: "10px", opacity: 0.9, textAlign: "center", fontWeight: 700 }}>
                Active GPS Calorie Burn: <span style={{ color: "#f59e0b", fontWeight: 900 }}>{gpsCalBurned} kcal</span>
              </div>
            </div>

            <div className="card" style={{ padding: "16px", borderRadius: "20px", background: "linear-gradient(135deg, #0f172a, #1e293b)", color: "white", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <i className="fa-solid fa-stopwatch" style={{ fontSize: "18px", color: "#38bdf8" }}></i>
                <h4 style={{ fontSize: "15px", fontWeight: 800 }}>Workout Countdown Timer</h4>
              </div>

              <div style={{ marginBottom: "10px" }}>
                <label style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700, display: "block", marginBottom: "4px" }}>Select Activity</label>
                <select 
                  value={selectedActivity} 
                  onChange={e => setSelectedActivity(e.target.value)}
                  style={{ width: "100%", background: "#1e293b", border: "1px solid #334155", color: "white", borderRadius: "10px", padding: "8px", fontSize: "11px", fontWeight: 700, outline: "none" }}
                >
                  {WORKOUT_ACTIVITIES.map(a => (
                    <option key={a.name} value={a.name}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700, display: "block", marginBottom: "4px" }}>Target Duration (Minutes)</label>
                <input 
                  type="number" 
                  value={workoutDuration} 
                  onChange={e => handleSetWorkoutTarget(e.target.value)}
                  style={{ width: "100%", background: "#1e293b", border: "1px solid #334155", color: "white", borderRadius: "10px", padding: "8px", fontSize: "12px", fontWeight: 800, outline: "none" }} 
                />
              </div>

              <div style={{ background: "rgba(255,255,255,0.05)", padding: "14px", borderRadius: "14px", textAlign: "center", border: "1px solid rgba(255,255,255,0.1)", marginBottom: "12px" }}>
                <div style={{ fontSize: "28px", fontWeight: 900, letterSpacing: "2px", color: "#38bdf8", fontFamily: "monospace" }}>
                  {timerMinDisplay}:{timerSecDisplay}
                </div>
                <div style={{ fontSize: "11px", color: "#f59e0b", fontWeight: 800, marginTop: "4px" }}>
                  Est. Burn: {estimatedWorkoutBurn} kcal
                </div>

                <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginTop: "12px" }}>
                  {!isTimerRunning ? (
                    <button onClick={startTimer} style={{ background: "#10b981", color: "white", border: "none", padding: "8px 16px", borderRadius: "10px", fontWeight: 800, fontSize: "11px", cursor: "pointer" }}>
                      Start Timer
                    </button>
                  ) : (
                    <button onClick={pauseTimer} style={{ background: "#f59e0b", color: "white", border: "none", padding: "8px 16px", borderRadius: "10px", fontWeight: 800, fontSize: "11px", cursor: "pointer" }}>
                      Pause
                    </button>
                  )}
                  <button onClick={finishWorkoutSession} style={{ background: "#38bdf8", color: "#0f172a", border: "none", padding: "8px 16px", borderRadius: "10px", fontWeight: 800, fontSize: "11px", cursor: "pointer" }}>
                    Finish & Log
                  </button>
                </div>
              </div>

              {(appData?.todayBurnedCal || 0) > 0 && (
                <div style={{ fontSize: "10px", color: "#10b981", fontWeight: 800, textAlign: "center" }}>
                  Total Active Workout Burn Today: {appData.todayBurnedCal} kcal
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: LOG */}
        {activeTab === "diary" && (
          <div className="screen active">
            <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "14px" }}>Food & Nutrition Log</h3>

            <div className="diary-summary" style={{ display: "flex", justifyContent: "space-around", textAlign: "center", padding: "12px 0", background: "#f1f5f9", borderRadius: "16px", marginBottom: "16px" }}>
              <div><h4>{totalCal}</h4><p style={{ fontSize: "11px", color: "var(--text-muted)" }}>Eaten</p></div>
              <div><h4>{activeGoal}</h4><p style={{ fontSize: "11px", color: "var(--text-muted)" }}>Goal</p></div>
              <div style={{ color: "var(--success)" }}><h4>{Math.max(0, activeGoal - totalCal)}</h4><p style={{ fontSize: "11px" }}>Left</p></div>
            </div>

            <div className="card">
              <div style={{ fontSize: "14px", fontWeight: 800, marginBottom: "10px" }}>Log Food Entry</div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "8px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700 }}>Food / Dish Name</label>
                  <input type="text" className="form-input" placeholder="e.g. Chicken Adobo" value={customName} onChange={e => setCustomName(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700 }}>Portion Size</label>
                  <input type="text" className="form-input" placeholder="e.g. 1 plate / 1 cup" value={customPortion} onChange={e => setCustomPortion(e.target.value)} />
                </div>
              </div>
              
              <label style={{ fontSize: "11px", fontWeight: 700 }}>Calories (kcal)</label>
              <input type="number" className="form-input" placeholder="e.g. 350" value={customCal} onChange={e => setCustomCal(e.target.value)} />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
                <div><label style={{ fontSize: "10px", fontWeight: 700 }}>Protein (g)</label><input type="number" className="form-input" placeholder="0" value={customP} onChange={e => setCustomP(e.target.value)} /></div>
                <div><label style={{ fontSize: "10px", fontWeight: 700 }}>Carbs (g)</label><input type="number" className="form-input" placeholder="0" value={customC} onChange={e => setCustomC(e.target.value)} /></div>
                <div><label style={{ fontSize: "10px", fontWeight: 700 }}>Fats (g)</label><input type="number" className="form-input" placeholder="0" value={customF} onChange={e => setCustomF(e.target.value)} /></div>
              </div>

              <button className="btn-block" onClick={addCustomMeal} disabled={isAddingMeal}>
                {isAddingMeal ? "Adding Meal..." : "Add to Today's Log"}
              </button>
            </div>

            <div className="card">
              <div style={{ fontSize: "14px", fontWeight: 800, marginBottom: "8px" }}>Today's Logged Meals</div>
              <div>
                {(todayMeals.length === 0) ? (
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", textAlign: "center", padding: "16px 0" }}>No meals logged yet today.</p>
                ) : (
                  todayMeals.map((m, idx) => (
                    <div key={m.id} className="food-entry" style={{ borderLeft: idx === 0 ? "3px solid var(--primary)" : "none", paddingLeft: idx === 0 ? "8px" : "0" }}>
                      <div>
                        <div style={{ fontWeight: 800, display: "flex", alignItems: "center", gap: "6px" }}>
                          {m.name} 
                          <small style={{ fontWeight: 600, color: "var(--primary)" }}>({m.portion || "1 serving"})</small>
                          {idx === 0 && <span style={{ fontSize: "9px", background: "var(--primary)", color: "white", padding: "1px 5px", borderRadius: "4px" }}>Last Meal</span>}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{m.cal} kcal • P:{m.p}g C:{m.c}g F:{m.f}g</div>
                      </div>
                      <i className="fa-solid fa-trash" style={{ color: "var(--danger)", cursor: "pointer" }} onClick={() => deleteMeal(m.id)}></i>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: REDESIGNED SOCIAL TAB */}
        {activeTab === "community" && (
          <div className="screen active">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "linear-gradient(135deg, #4f46e5, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "13px", boxShadow: "0 2px 8px rgba(79,70,229,0.3)" }}>
                  <i className="fa-solid fa-heart-pulse"></i>
                </div>
                <h2 style={{ fontSize: "20px", fontWeight: 900, color: "var(--primary)", letterSpacing: "-0.5px", margin: 0 }}>NutriPulse</h2>
              </div>
              
              <div style={{ display: "flex", gap: "8px" }}>
                <button 
                  onClick={() => setShowSearchModal(true)} 
                  style={{ background: "#f1f5f9", border: "none", width: "36px", height: "36px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#334155", fontSize: "15px" }}
                >
                  <i className="fa-solid fa-magnifying-glass"></i>
                </button>

                <button 
                  onClick={() => setShowNotifModal(true)} 
                  style={{ position: "relative", background: "#f1f5f9", border: "none", width: "36px", height: "36px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#334155", fontSize: "15px" }}
                >
                  <i className="fa-regular fa-bell"></i>
                  {allUserNotifs.length > 0 && (
                    <span style={{ position: "absolute", top: "2px", right: "2px", background: "#ef4444", color: "white", fontSize: "9px", fontWeight: 800, width: "15px", height: "15px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {allUserNotifs.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div className="card" style={{ padding: "12px", borderRadius: "18px", boxShadow: "0 4px 16px rgba(0,0,0,0.04)", marginBottom: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#4f46e5", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "12px", overflow: "hidden", flexShrink: 0 }}>
                    {appData?.avatarUrl ? (
                      <img src={appData.avatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      (appData?.userName || "A").charAt(0).toUpperCase()
                    )}
                  </div>
                  <span style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a" }}>{appData?.userName || "Athlete"}</span>
                </div>

                <div style={{ display: "flex", gap: "3px", background: "#f1f5f9", padding: "2px", borderRadius: "8px" }}>
                  <button 
                    onClick={() => setPostVisibility("public")} 
                    style={{ background: postVisibility === "public" ? "#ffffff" : "transparent", border: "none", padding: "3px 7px", borderRadius: "6px", fontSize: "9px", fontWeight: 800, color: postVisibility === "public" ? "var(--primary)" : "#64748b", cursor: "pointer" }}
                  >
                    🌐 Public
                  </button>
                  <button 
                    onClick={() => setPostVisibility("boosters")} 
                    style={{ background: postVisibility === "boosters" ? "#ffffff" : "transparent", border: "none", padding: "3px 7px", borderRadius: "6px", fontSize: "9px", fontWeight: 800, color: postVisibility === "boosters" ? "var(--primary)" : "#64748b", cursor: "pointer" }}
                  >
                    👥 Boosters
                  </button>
                  <button 
                    onClick={() => setPostVisibility("private")} 
                    style={{ background: postVisibility === "private" ? "#ffffff" : "transparent", border: "none", padding: "3px 7px", borderRadius: "6px", fontSize: "9px", fontWeight: 800, color: postVisibility === "private" ? "var(--primary)" : "#64748b", cursor: "pointer" }}
                  >
                    🔒 Private
                  </button>
                </div>
              </div>

              <textarea 
                className="form-input" 
                style={{ height: "48px", borderRadius: "12px", padding: "8px 10px", fontSize: "11px", border: "1px solid #e2e8f0", resize: "none", marginBottom: "8px" }} 
                placeholder="Share a milestone or fitness update..."
                value={postText}
                onChange={e => setPostText(e.target.value)}
              />

              {imagePreview && (
                <div style={{ position: "relative", marginBottom: "8px" }}>
                  <img src={imagePreview} alt="Preview" style={{ width: "100%", maxHeight: "140px", objectFit: "cover", borderRadius: "12px" }} />
                  <button 
                    onClick={() => setImagePreview(null)}
                    style={{ position: "absolute", top: "6px", right: "6px", background: "rgba(0,0,0,0.6)", color: "white", border: "none", borderRadius: "50%", width: "22px", height: "22px", fontSize: "10px", cursor: "pointer" }}
                  >
                    X
                  </button>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: 700, color: "var(--primary)", cursor: "pointer", background: "#f0fdf4", padding: "6px 10px", borderRadius: "10px", border: "1px solid #bbf7d0" }}>
                  <i className="fa-solid fa-image" style={{ fontSize: "12px" }}></i> Photo
                  <input type="file" accept="image/*" onChange={e => handleImageChange(e, false)} style={{ display: "none" }} />
                </label>

                <button 
                  onClick={() => createPost(false)} 
                  disabled={isPublishing}
                  style={{ background: isPublishing ? "#94a3b8" : "var(--primary)", color: "white", border: "none", padding: "6px 14px", borderRadius: "10px", fontWeight: 800, fontSize: "11px", cursor: "pointer" }}
                >
                  {isPublishing ? "Publishing..." : "Publish Post"}
                </button>
              </div>
            </div>

            <div>
              {publicCommunityPosts.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)" }}>
                  <i className="fa-regular fa-newspaper" style={{ fontSize: "32px", marginBottom: "8px", opacity: 0.5 }}></i>
                  <p style={{ fontSize: "12px", fontWeight: 600 }}>No public or booster posts in the feed yet.<br />Be the first to share your progress!</p>
                </div>
              ) : (
                publicCommunityPosts.map(p => {
                  const isLiked = p.likedBy && p.likedBy.includes(user?.uid);
                  const isOwner = p.userId === user?.uid;
                  const postAuthorObj = userList.find(u => u.uid === p.userId);

                  return (
                    <div key={p.id} className="card" style={{ padding: "14px", borderRadius: "18px", marginBottom: "14px", boxShadow: "0 4px 15px rgba(0,0,0,0.03)", position: "relative" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                        <div 
                          onClick={() => setViewingAthlete(postAuthorObj || { uid: p.userId, userName: p.userName, userTitle: p.userTitle, avatarUrl: p.userAvatar })}
                          style={{ display: "flex", gap: "8px", alignItems: "center", cursor: "pointer" }}
                        >
                          <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#4f46e5", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "13px", overflow: "hidden" }}>
                            {p.userAvatar ? (
                              <img src={p.userAvatar} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              (p.userName || "A").charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a" }}>{p.userName}</div>
                            <div style={{ fontSize: "9px", color: "var(--text-muted)" }}>
                              {p.userTitle || "Athlete"} • {formatPostTime(p.createdAt)}
                            </div>
                          </div>
                        </div>

                        {isOwner && (
                          <div style={{ position: "relative" }}>
                            <button 
                              onClick={() => setActiveMenuPostId(activeMenuPostId === p.id ? null : p.id)} 
                              style={{ background: "transparent", border: "none", color: "#64748b", fontSize: "15px", cursor: "pointer", padding: "4px 8px" }}
                            >
                              <i className="fa-solid fa-ellipsis-vertical"></i>
                            </button>

                            {activeMenuPostId === p.id && (
                              <div style={{ position: "absolute", right: 0, top: "24px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", boxShadow: "0 8px 20px -4px rgba(0,0,0,0.1)", zIndex: 100, minWidth: "120px", overflow: "hidden" }}>
                                <button 
                                  onClick={() => openEditModal(p)} 
                                  style={{ width: "100%", padding: "8px 10px", background: "transparent", border: "none", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#334155", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                                >
                                  <i className="fa-solid fa-pen" style={{ color: "var(--primary)" }}></i> Edit
                                </button>
                                <button 
                                  onClick={() => handleDeletePost(p.id)} 
                                  style={{ width: "100%", padding: "8px 10px", background: "transparent", border: "none", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", borderTop: "1px solid #f1f5f9" }}
                                >
                                  <i className="fa-solid fa-trash"></i> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <ExpandableText text={p.text} />

                      {p.imageUrl && (
                        <div 
                          onClick={() => setViewingImage(p.imageUrl)} 
                          style={{ borderRadius: "12px", overflow: "hidden", marginBottom: "10px", border: "1px solid #f1f5f9", background: "#f8fafc", aspectRatio: "4/3", cursor: "pointer", position: "relative" }}
                        >
                          <img src={p.imageUrl} alt="Transformation Post" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                        </div>
                      )}

                      <div style={{ display: "flex", alignItems: "center", gap: "10px", borderTop: "1px solid #f1f5f9", paddingTop: "8px", marginTop: "4px" }}>
                        <button 
                          onClick={() => handleLike(p.id, p.likes || 0, p.likedBy || [])}
                          style={{ 
                            background: isLiked ? "#fef2f2" : "transparent", 
                            border: "none",
                            color: isLiked ? "#ef4444" : "#64748b", 
                            padding: "4px 8px", 
                            fontSize: "11px", 
                            fontWeight: 800, 
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            borderRadius: "10px"
                          }}
                        >
                          <i className={isLiked ? "fa-solid fa-heart" : "fa-regular fa-heart"} style={{ fontSize: "13px", color: isLiked ? "#ef4444" : "#64748b" }}></i>
                          {p.likes || 0} {(p.likes === 1) ? "Pulse" : "Pulses"}
                        </button>

                        <button 
                          onClick={() => setResonatePost(p)}
                          style={{ background: "transparent", border: "none", color: "#64748b", padding: "4px 8px", fontSize: "11px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}
                        >
                          <i className="fa-solid fa-share-nodes" style={{ fontSize: "12px" }}></i> Resonate
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 4: PROGRESS TAB */}
        {activeTab === "progress" && (
          <div className="screen active">
            <h3 style={{ fontSize: "18px", fontWeight: 800, textAlign: "center", marginBottom: "14px" }}>Weight & Health Progress</h3>
            
            <div className="card" style={{ padding: "16px", borderRadius: "20px", marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a", marginBottom: "12px" }}>Your Weight Trend (Last 5 Logs)</div>
              
              <div style={{ background: "#f8fafc", padding: "16px 12px 12px 12px", borderRadius: "16px", border: "1px solid #e2e8f0", marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-around", alignItems: "flex-end", height: "95px", paddingBottom: "8px", borderBottom: "2px solid #cbd5e1", gap: "6px" }}>
                  {(() => {
                    const todayShort = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
                    const rawLogs = (Array.isArray(appData?.weightHistory) && appData.weightHistory.length > 0) 
                      ? appData.weightHistory 
                      : [{ val: currentWeight, date: todayShort }];

                    const logs = rawLogs.map(item => typeof item === 'object' ? item : { val: item, date: "Prev" });
                    const valList = logs.map(l => l.val);

                    const minW = Math.min(...valList) - 2;
                    const maxW = Math.max(...valList) + 2;
                    const range = (maxW - minW) || 1;

                    return logs.map((item, idx) => {
                      const isLatest = idx === logs.length - 1;
                      const heightPct = Math.max(25, Math.min(90, ((item.val - minW) / range) * 100));

                      return (
                        <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                          <span style={{ fontSize: "9px", fontWeight: isLatest ? 900 : 700, color: isLatest ? "var(--primary)" : "#64748b" }}>
                            {item.val}kg
                          </span>
                          <div style={{ 
                            height: heightPct + "%", 
                            width: isLatest ? "8px" : "5px", 
                            background: isLatest ? "var(--primary)" : "#818cf8", 
                            borderRadius: "3px", 
                            margin: "4px 0" 
                          }}></div>
                          <span style={{ fontSize: "8px", color: isLatest ? "var(--primary)" : "var(--text-muted)", fontWeight: isLatest ? 800 : 600 }}>
                            {item.date}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>

                {(!appData?.weightHistory || appData.weightHistory.length <= 1) && (
                  <div style={{ fontSize: "10px", color: "#64748b", textAlign: "center", marginTop: "8px", fontWeight: 600 }}>
                    Initial weight baseline recorded. Log new weight updates below to build your 5-entry trend chart!
                  </div>
                )}
              </div>

              <div style={{ fontSize: "11px", fontWeight: 700, padding: "10px 12px", borderRadius: "12px", lineHeight: 1.4, ...badgeStyle }}>
                {trendMessage}
              </div>
            </div>

            <div className="card" style={{ padding: "16px", borderRadius: "20px", marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: 800, marginBottom: "8px" }}>Log New Weight Entry</div>
              <div style={{ display: "flex", gap: "8px" }}>
                <input 
                  type="number" 
                  className="form-input" 
                  style={{ marginBottom: 0 }} 
                  placeholder="Enter Weight (kg)" 
                  value={newLogWeight} 
                  onChange={e => setNewLogWeight(e.target.value)} 
                />
                <button className="btn-block" style={{ width: "120px" }} onClick={handleUpdateWeight} disabled={isUpdatingWeight}>
                  {isUpdatingWeight ? "Updating..." : "Update Weight"}
                </button>
              </div>
            </div>

            <div className="card" style={{ padding: "16px", borderRadius: "20px", marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: 800, marginBottom: "12px", color: "#0f172a" }}>Health & BMI Status Summary</div>
              
              <div style={{ marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 800, marginBottom: "4px" }}>
                  <span>BMI Score: {bmiScore}</span>
                  <span style={{ color: bmiColor }}>{bmiCategory}</span>
                </div>
                <div style={{ height: "8px", background: "#e2e8f0", borderRadius: "4px", overflow: "hidden", position: "relative" }}>
                  <div style={{ height: "100%", width: bmiBarPct + "%", background: bmiColor, borderRadius: "4px" }}></div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "var(--text-muted)", marginTop: "4px", fontWeight: 700 }}>
                  <span>Underweight</span>
                  <span>Normal</span>
                  <span>Overweight</span>
                  <span>Obese</span>
                </div>
              </div>

              <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", padding: "10px 12px", borderRadius: "12px", marginBottom: "12px" }}>
                <div style={{ fontSize: "11px", fontWeight: 800, color: "#0284c7" }}>
                  <i className="fa-solid fa-droplet" style={{ marginRight: "6px" }}></i> Estimated Daily Water Need
                </div>
                <div style={{ fontSize: "14px", fontWeight: 900, color: "#0369a1", marginTop: "2px" }}>
                  {estimatedWaterLiters} Liters / day
                </div>
                <div style={{ fontSize: "10px", color: "#0284c7", marginTop: "2px" }}>
                  Calculated based on your body weight ({currentWeight} kg).
                </div>
              </div>

              <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: "12px", fontSize: "11px", color: "#334155", lineHeight: 1.5 }}>
                <strong>Status Tip:</strong> {numericBmi < 18.5 ? "Slightly underweight. Consider adding nutrient-dense meals to your daily routine." : numericBmi <= 24.9 ? "You are in a healthy BMI range! Maintain your current balanced lifestyle." : "Above recommended BMI range. Stick to your active calorie deficit plan for steady results."}
              </div>
            </div>

            <div className="card" style={{ padding: "16px", borderRadius: "20px" }}>
              <div style={{ fontSize: "13px", fontWeight: 800, marginBottom: "10px" }}>Unlocked Achievements</div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <div style={{ background: "#f1f5f9", padding: "6px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, color: "var(--primary)" }}><i className="fa-solid fa-fire"></i> {appData?.streakDays || 1}-Day Streak</div>
                <div style={{ background: "#f1f5f9", padding: "6px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, color: "var(--water)" }}><i className="fa-solid fa-droplet"></i> Hydration Target ({estimatedWaterLiters}L)</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: GOALS */}
        {activeTab === "goals" && (
          <div className="screen active">
            <h3 style={{ fontSize: "18px", fontWeight: 800, textAlign: "center", marginBottom: "14px" }}>Fitness Objectives & Strategies</h3>
            
            <div className="card" style={{ background: "linear-gradient(135deg, #4f46e5, #3730a3)", color: "white", marginBottom: "14px" }}>
              <p style={{ fontSize: "11px", opacity: 0.8 }}>Active Strategy Plan</p>
              <h2 style={{ fontSize: "20px", fontWeight: 800 }}>{goalTitles[appData?.activeGoalType || 'jogger']}</h2>
              <p style={{ fontSize: "11px", opacity: 0.8, marginTop: "2px" }}><span>{activeGoal}</span> kcal/day</p>
            </div>

            <div className="goal-section-header">Running & Cardio Goals</div>

            <div className={"goal-card-option " + (appData?.activeGoalType === "jogger" ? "selected" : "")} onClick={() => setGoalPreset("jogger")}>
              <div style={{ fontSize: "13px", fontWeight: 800 }}>Daily Jogger / Casual Runner</div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>Moderate calories + High carbs fuel for daily 3k-5k runs.</div>
            </div>

            <div className={"goal-card-option " + (appData?.activeGoalType === "marathon" ? "selected" : "")} onClick={() => setGoalPreset("marathon")}>
              <div style={{ fontSize: "13px", fontWeight: 800 }}>Endurance & Marathon Prep</div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>High calorie surplus + Extra high carbs loading.</div>
            </div>

            <div className={"goal-card-option " + (appData?.activeGoalType === "steps" ? "selected" : "")} onClick={() => setGoalPreset("steps")}>
              <div style={{ fontSize: "13px", fontWeight: 800 }}>Daily 10k Steps / Active Walker</div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>Slight deficit for steady fat loss through everyday walking.</div>
            </div>

            <div className="goal-section-header">Gym & Weightlifting Goals</div>

            <div className={"goal-card-option " + (appData?.activeGoalType === "bulk" ? "selected" : "")} onClick={() => setGoalPreset("bulk")}>
              <div style={{ fontSize: "13px", fontWeight: 800 }}>Lean Bulk (Clean Muscle)</div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>Slight surplus for muscle growth with minimal fat.</div>
            </div>

            <div className={"goal-card-option " + (appData?.activeGoalType === "cut" ? "selected" : "")} onClick={() => setGoalPreset("cut")}>
              <div style={{ fontSize: "13px", fontWeight: 800 }}>Aggressive Cut (Fast Fat Loss)</div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>High deficit + High Protein to preserve muscle.</div>
            </div>

            <div className={"goal-card-option " + (appData?.activeGoalType === "recomp" ? "selected" : "")} onClick={() => setGoalPreset("recomp")}>
              <div style={{ fontSize: "13px", fontWeight: 800 }}>Body Recomposition</div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>Build muscle & lose fat simultaneously.</div>
            </div>

            <div className={"goal-card-option " + (appData?.activeGoalType === "dirty" ? "selected" : "")} onClick={() => setGoalPreset("dirty")}>
              <div style={{ fontSize: "13px", fontWeight: 800 }}>Heavy Mass Gain (Hardgainer)</div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>High calorie + High carbs for rapid weight gain.</div>
            </div>
          </div>
        )}

        {/* TAB 6: SAFE ULTRA-COMPACT ATHLETIC PROFILE DESIGN */}
        {activeTab === "profile" && (
          <div className="screen active">
            {/* HERO PROFILE HEADER */}
            <div className="card" style={{ padding: 0, overflow: "hidden", borderRadius: "20px", marginBottom: "12px", boxShadow: "0 6px 18px rgba(0,0,0,0.06)", position: "relative", border: "none" }}>
              <div style={{ 
                height: "85px", 
                background: (coverPreview || appData?.coverUrl) ? "url(" + (coverPreview || appData?.coverUrl) + ") center/cover" : "linear-gradient(135deg, #0284c7, #4f46e5)", 
                position: "relative" 
              }}>
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(15,23,42,0.35))" }}></div>
                
                {/* DIRECT BANNER CAMERA BUTTON */}
                <label style={{ position: "absolute", bottom: "8px", right: "50px", background: "rgba(0,0,0,0.55)", color: "white", padding: "4px 8px", borderRadius: "8px", cursor: "pointer", fontSize: "10px", fontWeight: 700, backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.3)", zIndex: 10 }}>
                  <i className="fa-solid fa-camera"></i> Cover
                  <input type="file" accept="image/*" onChange={handleDirectCoverChange} style={{ display: "none" }} />
                </label>

                <button 
                  onClick={() => setShowSettingsModal(true)} 
                  style={{ position: "absolute", top: "10px", right: "10px", background: "rgba(255,255,255,0.25)", backdropFilter: "blur(6px)", color: "white", border: "1px solid rgba(255,255,255,0.3)", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}
                >
                  <i className="fa-solid fa-gear"></i>
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 12px 12px 12px", textAlign: "center" }}>
                {/* AVATAR WITH DIRECT CAMERA BUTTON */}
                <div style={{ width: "66px", height: "68px", borderRadius: "50%", background: "#ffffff", padding: "2px", boxShadow: "0 4px 14px rgba(0,0,0,0.12)", overflow: "hidden", marginTop: "-34px", marginBottom: "6px", zIndex: 10, position: "relative" }}>
                  {(avatarPreview || appData?.avatarUrl) ? (
                    <img src={avatarPreview || appData?.avatarUrl} alt="Profile Avatar" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "linear-gradient(135deg, #4f46e5, #0284c7)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: 900 }}>
                      {(appData?.userName || "A").charAt(0).toUpperCase()}
                    </div>
                  )}

                  <label style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.35)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", cursor: "pointer", opacity: 0.8, fontSize: "14px" }}>
                    <i className="fa-solid fa-camera"></i>
                    <input type="file" accept="image/*" onChange={handleDirectAvatarChange} style={{ display: "none" }} />
                  </label>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "center" }}>
                  <h3 style={{ fontSize: "17px", fontWeight: 900, color: "#0f172a", margin: 0 }}>{appData?.userName || "Athlete"}</h3>
                  <span style={{ fontSize: "8px", background: appData?.isPrivateAccount ? "#f1f5f9" : "#e0e7ff", color: appData?.isPrivateAccount ? "#64748b" : "var(--primary)", padding: "1px 6px", borderRadius: "5px", fontWeight: 800 }}>
                    {appData?.isPrivateAccount ? "🔒 Private" : "🌐 Athlete"}
                  </span>
                </div>
                <p style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 600, marginTop: "1px", marginBottom: "0" }}>{appData?.userTitle || "Fitness Enthusiast"}</p>

                {/* ATHLETIC STATS GRID */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "4px", background: "#f8fafc", padding: "8px", borderRadius: "14px", marginTop: "10px", width: "100%", border: "1px solid #f1f5f9" }}>
                  <div onClick={() => setBoosterListModalType("boosting")} style={{ cursor: "pointer" }}>
                    <div style={{ fontSize: "12px", fontWeight: 900, color: "var(--primary)" }}>{(appData?.boosting || []).length}</div>
                    <div style={{ fontSize: "8px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Boosting</div>
                  </div>
                  <div onClick={() => setBoosterListModalType("boosters")} style={{ cursor: "pointer" }}>
                    <div style={{ fontSize: "12px", fontWeight: 900, color: "#10b981" }}>{myRealtimeBoostersCount}</div>
                    <div style={{ fontSize: "8px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Boosters</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 900, color: "#f59e0b" }}>{appData?.streakDays || 1}</div>
                    <div style={{ fontSize: "8px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Streak</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 900, color: "#ef4444" }}>{myTotalPulses}</div>
                    <div style={{ fontSize: "8px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Pulses</div>
                  </div>
                </div>
              </div>
            </div>

            {/* CREATE POST CARD */}
            <div className="card" style={{ padding: "12px", borderRadius: "18px", boxShadow: "0 4px 16px rgba(0,0,0,0.04)", marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a" }}>Create Post</span>
                
                <div style={{ display: "flex", gap: "3px", background: "#f1f5f9", padding: "2px", borderRadius: "8px" }}>
                  <button 
                    onClick={() => setProfPostVisibility("public")} 
                    style={{ background: profPostVisibility === "public" ? "#ffffff" : "transparent", border: "none", padding: "3px 7px", borderRadius: "6px", fontSize: "9px", fontWeight: 800, color: profPostVisibility === "public" ? "var(--primary)" : "#64748b", cursor: "pointer" }}
                  >
                    🌐 Public
                  </button>
                  <button 
                    onClick={() => setProfPostVisibility("boosters")} 
                    style={{ background: profPostVisibility === "boosters" ? "#ffffff" : "transparent", border: "none", padding: "3px 7px", borderRadius: "6px", fontSize: "9px", fontWeight: 800, color: profPostVisibility === "boosters" ? "var(--primary)" : "#64748b", cursor: "pointer" }}
                  >
                    👥 Boosters
                  </button>
                  <button 
                    onClick={() => setProfPostVisibility("private")} 
                    style={{ background: profPostVisibility === "private" ? "#ffffff" : "transparent", border: "none", padding: "3px 7px", borderRadius: "6px", fontSize: "9px", fontWeight: 800, color: profPostVisibility === "private" ? "var(--primary)" : "#64748b", cursor: "pointer" }}
                  >
                    🔒 Private
                  </button>
                </div>
              </div>

              <textarea 
                className="form-input" 
                style={{ height: "50px", borderRadius: "12px", padding: "8px 10px", fontSize: "11px", border: "1px solid #e2e8f0", resize: "none", marginBottom: "8px" }} 
                placeholder="Share a fitness update..."
                value={profPostText}
                onChange={e => setProfPostText(e.target.value)}
              />

              {profImagePreview && (
                <div style={{ position: "relative", marginBottom: "8px" }}>
                  <img src={profImagePreview} alt="Preview" style={{ width: "100%", maxHeight: "140px", objectFit: "cover", borderRadius: "12px" }} />
                  <button 
                    onClick={() => setProfImagePreview(null)}
                    style={{ position: "absolute", top: "6px", right: "6px", background: "rgba(0,0,0,0.6)", color: "white", border: "none", borderRadius: "50%", width: "22px", height: "22px", fontSize: "10px", cursor: "pointer" }}
                  >
                    X
                  </button>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: 700, color: "var(--primary)", cursor: "pointer", background: "#f0fdf4", padding: "6px 10px", borderRadius: "10px", border: "1px solid #bbf7d0" }}>
                  <i className="fa-solid fa-image" style={{ fontSize: "12px" }}></i> Photo
                  <input type="file" accept="image/*" onChange={e => handleImageChange(e, true)} style={{ display: "none" }} />
                </label>

                <button 
                  onClick={() => createPost(true)} 
                  disabled={isPublishing}
                  style={{ background: isPublishing ? "#94a3b8" : "var(--primary)", color: "white", border: "none", padding: "6px 14px", borderRadius: "10px", fontWeight: 800, fontSize: "11px", cursor: "pointer" }}
                >
                  {isPublishing ? "Publishing..." : "Publish Post"}
                </button>
              </div>
            </div>

            {/* MY POSTS FEED HEADER & VIEW SWITCHER */}
            <div className="card" style={{ padding: "14px", borderRadius: "18px", marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a" }}>My Fitness Feed</span>
                <div style={{ display: "flex", gap: "3px", background: "#f1f5f9", padding: "2px", borderRadius: "8px" }}>
                  <button 
                    onClick={() => setProfileViewMode("list")} 
                    style={{ background: profileViewMode === "list" ? "#ffffff" : "transparent", border: "none", padding: "4px 10px", borderRadius: "6px", cursor: "pointer", color: profileViewMode === "list" ? "var(--primary)" : "#64748b", fontWeight: 800, fontSize: "10px" }}
                  >
                    <i className="fa-solid fa-list" style={{ marginRight: "4px" }}></i> Feed
                  </button>
                  <button 
                    onClick={() => setProfileViewMode("grid")} 
                    style={{ background: profileViewMode === "grid" ? "#ffffff" : "transparent", border: "none", padding: "4px 10px", borderRadius: "6px", cursor: "pointer", color: profileViewMode === "grid" ? "var(--primary)" : "#64748b", fontWeight: 800, fontSize: "10px" }}
                  >
                    <i className="fa-solid fa-border-all" style={{ marginRight: "4px" }}></i> Grid
                  </button>
                </div>
              </div>

              {myPosts.length === 0 ? (
                <p style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "center", padding: "16px 0" }}>No posts created yet.</p>
              ) : profileViewMode === "grid" ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
                  {myPosts.map(p => {
                    const vis = p?.visibility || "public";
                    return (
                      <div key={p.id} style={{ position: "relative", aspectRatio: "1/1", borderRadius: "10px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                        {p.imageUrl ? (
                          <img 
                            src={p.imageUrl} 
                            alt="Post" 
                            onClick={() => setViewingImage(p.imageUrl)}
                            style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "pointer" }} 
                          />
                        ) : (
                          <div style={{ width: "100%", height: "100%", padding: "8px", background: "linear-gradient(135deg, #4f46e5, #3b82f6)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontSize: "9px", fontWeight: 700, lineHeight: 1.2 }}>
                            {p.text}
                          </div>
                        )}
                        
                        <span style={{ position: "absolute", bottom: "3px", left: "3px", background: "rgba(15, 23, 42, 0.8)", color: "white", borderRadius: "4px", padding: "1px 4px", fontSize: "7px", fontWeight: 800 }}>
                          {vis === "private" ? "🔒 Private" : vis === "boosters" ? "👥 Boosters" : "🌐 Public"}
                        </span>

                        <button 
                          onClick={() => openEditModal(p)} 
                          style={{ position: "absolute", top: "3px", right: "3px", background: "rgba(255, 255, 255, 0.9)", color: "#0f172a", border: "none", borderRadius: "50%", width: "20px", height: "20px", fontSize: "9px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          <i className="fa-solid fa-pen"></i>
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                myPosts.map(p => {
                  const vis = p?.visibility || "public";
                  return (
                    <div key={p.id} style={{ background: "#ffffff", border: "1px solid #f1f5f9", borderRadius: "14px", padding: "12px", marginBottom: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.02)", position: "relative" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#4f46e5", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "12px", overflow: "hidden" }}>
                            {appData?.avatarUrl ? (
                              <img src={appData.avatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              (appData?.userName || "A").charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a" }}>{appData?.userName || "Athlete"}</span>
                              <span style={{ fontSize: "8px", fontWeight: 800, color: vis === "private" ? "#64748b" : "var(--primary)", background: vis === "private" ? "#f1f5f9" : "#e0e7ff", padding: "1px 5px", borderRadius: "5px" }}>
                                {vis === "private" ? "🔒 Private" : vis === "boosters" ? "👥 Boosters" : "🌐 Public"}
                              </span>
                            </div>
                            <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>{formatPostTime(p.createdAt)}</span>
                          </div>
                        </div>

                        <div style={{ position: "relative" }}>
                          <button 
                            onClick={() => setActiveMenuPostId(activeMenuPostId === p.id ? null : p.id)} 
                            style={{ background: "transparent", border: "none", color: "#64748b", fontSize: "14px", cursor: "pointer", padding: "4px 6px" }}
                          >
                            <i className="fa-solid fa-ellipsis-vertical"></i>
                          </button>

                          {activeMenuPostId === p.id && (
                            <div style={{ position: "absolute", right: 0, top: "22px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", boxShadow: "0 8px 20px -4px rgba(0,0,0,0.1)", zIndex: 100, minWidth: "110px", overflow: "hidden" }}>
                              <button 
                                onClick={() => openEditModal(p)} 
                                style={{ width: "100%", padding: "8px 10px", background: "transparent", border: "none", textAlign: "left", fontSize: "10px", fontWeight: 700, color: "#334155", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                              >
                                <i className="fa-solid fa-pen" style={{ color: "var(--primary)" }}></i> Edit
                              </button>
                              <button 
                                onClick={() => handleDeletePost(p.id)} 
                                style={{ width: "100%", padding: "8px 10px", background: "transparent", border: "none", textAlign: "left", fontSize: "10px", fontWeight: 700, color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", borderTop: "1px solid #f1f5f9" }}
                              >
                                <i className="fa-solid fa-trash"></i> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <ExpandableText text={p.text} />

                      {p.imageUrl && (
                        <div 
                          onClick={() => setViewingImage(p.imageUrl)} 
                          style={{ borderRadius: "10px", overflow: "hidden", border: "1px solid #f1f5f9", marginBottom: "6px", background: "#f8fafc", aspectRatio: "4/3", cursor: "pointer", position: "relative" }}
                        >
                          <img src={p.imageUrl} alt="Post" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                      )}

                      <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px", borderTop: "1px solid #f8fafc", paddingTop: "6px", marginTop: "4px" }}>
                        <i className="fa-solid fa-heart" style={{ color: "#ef4444" }}></i> {p.likes || 0} {(p.likes === 1) ? "Pulse" : "Pulses"}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 7: ULTRA-COMPACT ADMIN PANEL */}
        {isAdmin && activeTab === "admin" && (
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
                <span>👥 Accounts: <strong style={{ color: "#38bdf8" }}>{userList.length}</strong></span>
              </div>
            )}

            {/* ADMIN CONTENT LISTINGS */}
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
                            onClick={() => setViewingImage(p.imageUrl)} 
                            style={{ borderRadius: "8px", overflow: "hidden", marginBottom: "6px", height: "60px", background: "#f8fafc", cursor: "pointer", position: "relative" }}
                          >
                            <img src={p.imageUrl} alt="Uploaded Media" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>
                        )}

                        <div style={{ fontSize: "8px", color: "var(--text-muted)", fontWeight: 600 }}>User ID: {p.userId} • {formatPostTime(p.createdAt)}</div>
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
                    const isOnline = u.lastSeen && (Date.now() - u.lastSeen < 300000);
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
                            <span><strong>Created:</strong> {formatPostTime(u.createdAt)}</span>
                            <span><strong>Last Online:</strong> <strong style={{ color: isOnline ? "#10b981" : "#475569" }}>{isOnline ? "Active Now" : formatPostTime(u.lastSeen)}</strong></span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ISOLATED MODALS LAYER */}

      {/* ABOUT NUTRIPULSE SYSTEM MODAL WITH FEEDBACK INTEGRATION */}
      {showAboutModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(6px)", zIndex: 2900, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div className="card" style={{ width: "100%", maxWidth: "380px", padding: "22px", borderRadius: "24px", background: "#ffffff", textAlign: "center" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "linear-gradient(135deg, #4f46e5, #06b6d4)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", margin: "0 auto 12px auto", boxShadow: "0 4px 16px rgba(79,70,229,0.35)" }}>
              <i className="fa-solid fa-heart-pulse"></i>
            </div>
            <h3 style={{ fontSize: "18px", fontWeight: 900, color: "#0f172a", margin: 0 }}>NutriPulse Web App</h3>
            <span style={{ fontSize: "10px", color: "var(--primary)", fontWeight: 800, background: "#e0e7ff", padding: "2px 8px", borderRadius: "6px", display: "inline-block", marginTop: "4px" }}>
              Version 1.0.0 (Official Build)
            </span>

            <div style={{ margin: "14px 0 10px 0", textAlign: "left", fontSize: "11px", color: "#475569", lineHeight: 1.6, background: "#f8fafc", padding: "12px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
              <div style={{ marginBottom: "6px" }}><strong>Architecture:</strong> Athletic Nutrition, Live GPS Step Calculations, Workout Countdowns, and Social Boosting Feed.</div>
              <div><strong>Official System Creator:</strong> <span style={{ color: "#0f172a", fontWeight: 800 }}>Edison Valerio</span></div>
            </div>

            {/* DIRECT FEEDBACK ACTION BUTTON */}
            <a 
              href="mailto:jenson0327@gmail.com?subject=NutriPulse%20User%20Feedback" 
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", width: "100%", background: "#f0fdf4", color: "#10b981", border: "1px solid #a7f3d0", padding: "8px", borderRadius: "12px", fontSize: "11px", fontWeight: 800, textDecoration: "none", marginBottom: "12px" }}
            >
              <i className="fa-solid fa-comment-dots"></i> Send App Feedback & Suggestions
            </a>

            <p style={{ fontSize: "9px", color: "#94a3b8", fontWeight: 700, marginBottom: "14px" }}>
              Protected by Git Cryptographic Signatures & Firebase Ownership. Copyright © 2026 Edison Valerio. All rights reserved.
            </p>

            <button onClick={() => setShowAboutModal(false)} className="btn-block" style={{ height: "38px", fontSize: "12px" }}>
              Close Information
            </button>
          </div>
        </div>
      )}

      {/* SEARCH ATHLETES OVERLAY MODAL */}
      {showSearchModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(6px)", zIndex: 2800, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "16px", paddingTop: "40px" }}>
          <div className="card" style={{ width: "100%", maxWidth: "380px", padding: "18px", borderRadius: "20px", background: "#ffffff", maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h4 style={{ fontSize: "15px", fontWeight: 900, color: "#0f172a" }}>Search Athletes</h4>
              <button onClick={() => { setShowSearchModal(false); setSearchQuery(""); }} style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: "26px", height: "26px", cursor: "pointer", fontWeight: 800, fontSize: "11px" }}>X</button>
            </div>

            <input 
              type="text" 
              className="form-input" 
              placeholder="Search by name or email..." 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              style={{ marginBottom: "12px", borderRadius: "12px", padding: "10px" }}
            />

            <div>
              {searchQuery.trim() === "" ? (
                <p style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "center", padding: "20px 0" }}>
                  Type a name or email to search athletes...
                </p>
              ) : filteredSearchUsers.length === 0 ? (
                <p style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "center", padding: "16px 0" }}>No athletes found matching "{searchQuery}".</p>
              ) : (
                filteredSearchUsers.map(u => (
                  <div key={u.uid} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", background: "#f8fafc", borderRadius: "12px", marginBottom: "6px", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, flex: 1 }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#4f46e5", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "12px", overflow: "hidden", flexShrink: 0 }}>
                        {u.avatarUrl ? <img src={u.avatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (u.userName || "A").charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: "11px", fontWeight: 800, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.userName || "Athlete"}</div>
                        <div style={{ fontSize: "9px", color: "var(--text-muted)" }}>{u.userTitle || "Fitness Enthusiast"}</div>
                      </div>
                    </div>

                    <button 
                      onClick={() => { setViewingAthlete(u); setShowSearchModal(false); setSearchQuery(""); }}
                      style={{ background: "var(--primary)", color: "white", border: "none", padding: "4px 10px", borderRadius: "8px", fontSize: "9px", fontWeight: 800, cursor: "pointer", flexShrink: 0 }}
                    >
                      View
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MULTI-ACTIVITY NOTIFICATION OVERLAY MODAL */}
      {showNotifModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(6px)", zIndex: 2800, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "16px", paddingTop: "40px" }}>
          <div className="card" style={{ width: "100%", maxWidth: "380px", padding: "18px", borderRadius: "20px", background: "#ffffff", maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h4 style={{ fontSize: "15px", fontWeight: 900, color: "#0f172a" }}>Notifications</h4>
              <button onClick={() => setShowNotifModal(false)} style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: "26px", height: "26px", cursor: "pointer", fontWeight: 800, fontSize: "11px" }}>X</button>
            </div>

            <div>
              {allUserNotifs.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-muted)" }}>
                  <i className="fa-regular fa-bell-slash" style={{ fontSize: "28px", marginBottom: "8px", opacity: 0.5 }}></i>
                  <p style={{ fontSize: "11px", fontWeight: 600 }}>No new notifications at the moment.</p>
                </div>
              ) : (
                allUserNotifs.map(notif => {
                  return (
                    <div key={notif.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px", background: "#f8fafc", borderRadius: "12px", marginBottom: "8px", border: "1px solid #e2e8f0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, flex: 1 }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#4f46e5", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "12px", overflow: "hidden", flexShrink: 0 }}>
                          {notif.avatar ? <img src={notif.avatar} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (notif.title || "A").charAt(0).toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: "11px", fontWeight: 800, color: "#0f172a" }}>{notif.title}</div>
                          <div style={{ fontSize: "9px", color: "var(--text-muted)" }}>{notif.text}</div>
                        </div>
                      </div>

                      {notif.type === "request" ? (
                        <button 
                          onClick={() => { toggleBoostAthlete(notif.uid, false); setShowNotifModal(false); }}
                          style={{ background: "#10b981", color: "white", border: "none", padding: "4px 10px", borderRadius: "8px", fontSize: "9px", fontWeight: 800, cursor: "pointer", flexShrink: 0 }}
                        >
                          Accept
                        </button>
                      ) : (
                        <button 
                          onClick={() => { 
                            const targetUserObj = userList.find(u => u.uid === notif.uid);
                            if (targetUserObj) setViewingAthlete(targetUserObj);
                            setShowNotifModal(false); 
                          }}
                          style={{ background: "#e0e7ff", color: "var(--primary)", border: "none", padding: "4px 10px", borderRadius: "8px", fontSize: "9px", fontWeight: 800, cursor: "pointer", flexShrink: 0 }}
                        >
                          View
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* 1. BOOSTERS / BOOSTING LIST MODAL */}
      {boosterListModalType && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(6px)", zIndex: 2600, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div className="card" style={{ width: "100%", maxWidth: "360px", padding: "18px", borderRadius: "20px", background: "#ffffff", maxHeight: "75vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h4 style={{ fontSize: "14px", fontWeight: 900, textTransform: "capitalize", color: "#0f172a" }}>
                {boosterListModalType === "boosting" ? "Athletes You're Boosting" : "Your Boosters"}
              </h4>
              <button onClick={() => setBoosterListModalType(null)} style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: "26px", height: "26px", cursor: "pointer", fontWeight: 800, fontSize: "11px" }}>X</button>
            </div>

            {((boosterListModalType === "boosting" ? myRealtimeBoostingList : myRealtimeBoostersList).length === 0) ? (
              <p style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "center", padding: "20px 0" }}>No athletes in this list yet.</p>
            ) : (
              (boosterListModalType === "boosting" ? myRealtimeBoostingList : myRealtimeBoostersList).map(u => (
                <div key={u.uid} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", background: "#f8fafc", borderRadius: "12px", marginBottom: "6px", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, flex: 1 }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#4f46e5", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "12px", overflow: "hidden", flexShrink: 0 }}>
                      {u.avatarUrl ? <img src={u.avatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (u.userName || "A").charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: "11px", fontWeight: 800, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.userName}</div>
                      <div style={{ fontSize: "9px", color: "var(--text-muted)" }}>{u.userTitle || "Athlete"}</div>
                    </div>
                  </div>

                  <button 
                    onClick={() => { setViewingAthlete(u); setBoosterListModalType(null); }}
                    style={{ background: "#e0e7ff", color: "var(--primary)", border: "none", padding: "4px 10px", borderRadius: "8px", fontSize: "9px", fontWeight: 800, cursor: "pointer", flexShrink: 0 }}
                  >
                    View
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 2. STYLED RESONATE / SHARE BOTTOM SHEET MODAL */}
      {resonatePost && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(6px)", zIndex: 2700, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div className="card" style={{ width: "100%", maxWidth: "480px", padding: "20px", borderRadius: "24px 24px 0 0", background: "#ffffff", boxShadow: "0 -10px 25px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h4 style={{ fontSize: "15px", fontWeight: 900, color: "#0f172a" }}>Resonate Fitness Post</h4>
              <button onClick={() => setResonatePost(null)} style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", fontWeight: 800 }}>X</button>
            </div>

            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "12px", lineHeight: 1.4 }}>
              Amplify <strong>{resonatePost.userName}'s</strong> fitness update to motivate fellow athletes.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "14px" }}>
              <button 
                onClick={() => { navigator.clipboard.writeText(window.location.href); alert("Post link copied to clipboard!"); setResonatePost(null); }}
                style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", padding: "10px", borderRadius: "12px", fontSize: "11px", fontWeight: 800, color: "#0f172a", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              >
                <i className="fa-solid fa-link" style={{ color: "var(--primary)" }}></i> Copy Link
              </button>

              <button 
                onClick={() => { alert("Resonated! Shared directly with your Boosters."); setResonatePost(null); }}
                style={{ background: "var(--primary)", color: "white", border: "none", padding: "10px", borderRadius: "12px", fontSize: "11px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              >
                <i className="fa-solid fa-paper-plane"></i> Share to Feed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VISITING ATHLETE PUBLIC PROFILE MODAL */}
      {viewingAthlete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(6px)", zIndex: 2500, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div className="card" style={{ width: "100%", maxWidth: "380px", padding: "20px", borderRadius: "24px", background: "#ffffff", maxHeight: "85vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>Athlete Profile</span>
              <button onClick={() => setViewingAthlete(null)} style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", fontWeight: 800 }}>X</button>
            </div>

            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <div style={{ width: "68px", height: "68px", borderRadius: "50%", background: "linear-gradient(135deg, #4f46e5, #818cf8)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "22px", margin: "0 auto 8px auto", overflow: "hidden" }}>
                {viewingAthlete.avatarUrl ? (
                  <img src={viewingAthlete.avatarUrl} alt="Athlete" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  (viewingAthlete.userName || "A").charAt(0).toUpperCase()
                )}
              </div>
              <h3 style={{ fontSize: "16px", fontWeight: 900, margin: 0, color: "#0f172a" }}>{viewingAthlete.userName}</h3>
              <p style={{ fontSize: "10px", color: "var(--text-muted)", margin: "2px 0 10px 0", fontWeight: 600 }}>{viewingAthlete.userTitle || "Fitness Enthusiast"}</p>

              {viewingAthlete.uid !== user?.uid && (
                <button 
                  onClick={() => toggleBoostAthlete(viewingAthlete.uid, viewingAthlete.isPrivateAccount)}
                  style={{ 
                    background: (appData?.boosting || []).includes(viewingAthlete.uid) ? "#10b981" : "var(--primary)", 
                    color: "white", 
                    border: "none", 
                    padding: "8px 20px", 
                    borderRadius: "12px", 
                    fontWeight: 800, 
                    fontSize: "12px", 
                    cursor: "pointer" 
                  }}
                >
                  {(appData?.boosting || []).includes(viewingAthlete.uid) ? "⚡ Boosting" : "⚡ Boost Athlete"}
                </button>
              )}
            </div>

            <div style={{ fontSize: "12px", fontWeight: 800, marginBottom: "8px", color: "#0f172a" }}>Public Fitness Posts</div>
            <div>
              {posts.filter(p => p.userId === viewingAthlete.uid && p.visibility === "public" && !p.isHidden).length === 0 ? (
                <p style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "center", padding: "16px 0" }}>No public fitness posts shared yet.</p>
              ) : (
                posts.filter(p => p.userId === viewingAthlete.uid && p.visibility === "public" && !p.isHidden).map(p => (
                  <div key={p.id} style={{ background: "#f8fafc", padding: "10px", borderRadius: "12px", marginBottom: "8px", border: "1px solid #e2e8f0" }}>
                    <ExpandableText text={p.text} maxChars={100} />
                    {p.imageUrl && (
                      <img src={p.imageUrl} alt="Post" style={{ width: "100%", height: "110px", objectFit: "cover", borderRadius: "8px", marginTop: "4px" }} />
                    )}
                    <span style={{ fontSize: "8px", color: "var(--text-muted)", display: "block", marginTop: "4px" }}>{formatPostTime(p.createdAt)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* FULL-SCREEN LIGHTBOX IMAGE VIEWER MODAL */}
      {viewingImage && (
        <div 
          onClick={() => setViewingImage(null)} 
          style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.9)", backdropFilter: "blur(6px)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
        >
          <div style={{ position: "relative", maxWidth: "100%", maxHeight: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <button 
              onClick={() => setViewingImage(null)} 
              style={{ position: "absolute", top: "-40px", right: "0", background: "rgba(255,255,255,0.2)", color: "white", border: "none", borderRadius: "50%", width: "32px", height: "32px", fontSize: "16px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              X
            </button>
            <img src={viewingImage} alt="Full View" style={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain", borderRadius: "12px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }} />
          </div>
        </div>
      )}

      {/* 1. EDIT POST MODAL */}
      {editingPost && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div className="card" style={{ width: "100%", maxWidth: "360px", padding: "20px", borderRadius: "24px", background: "#ffffff", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h4 style={{ fontSize: "15px", fontWeight: 900 }}>Edit Post</h4>
              <button onClick={() => setEditingPost(null)} style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer" }}>X</button>
            </div>

            <label style={{ fontSize: "11px", fontWeight: 700, display: "block", marginBottom: "4px" }}>Post Privacy</label>
            <select 
              value={editVisibility} 
              onChange={e => setEditVisibility(e.target.value)}
              className="form-select" 
              style={{ marginBottom: "12px" }}
            >
              <option value="public">🌐 Public Feed</option>
              <option value="boosters">👥 Boosters Only</option>
              <option value="private">🔒 Private (Profile Only)</option>
            </select>

            <label style={{ fontSize: "11px", fontWeight: 700, display: "block", marginBottom: "4px" }}>Post Content</label>
            <textarea 
              className="form-input" 
              style={{ height: "80px", borderRadius: "14px", padding: "12px", fontSize: "12px", border: "1px solid #e2e8f0", resize: "none", marginBottom: "14px" }} 
              value={editText}
              onChange={e => setEditText(e.target.value)}
            />

            <button className="btn-block" onClick={saveEditedPost} disabled={isSavingEditPost}>
              {isSavingEditPost ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* 2. PROFILE SETTINGS MODAL WITH ABOUT DUAL-ACCESS */}
      {showSettingsModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div className="card" style={{ width: "100%", maxWidth: "360px", padding: "20px", borderRadius: "24px", background: "#ffffff", maxHeight: "80vh", overflowY: "auto", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h4 style={{ fontSize: "15px", fontWeight: 900 }}>Profile Settings</h4>
              <button onClick={() => setShowSettingsModal(false)} style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer" }}>X</button>
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "11px", fontWeight: 700, display: "block", marginBottom: "4px" }}>Profile Avatar</label>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {avatarPreview ? (
                  <div style={{ width: "42px", height: "42px", borderRadius: "50%", overflow: "hidden", border: "2px solid #10b981", flexShrink: 0 }}>
                    <img src={avatarPreview} alt="Avatar Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ) : null}
                <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 14px", background: avatarPreview ? "#f0fdf4" : "#f1f5f9", borderRadius: "12px", fontSize: "11px", fontWeight: 700, color: avatarPreview ? "#10b981" : "var(--primary)", cursor: "pointer", border: avatarPreview ? "1px solid #a7f3d0" : "1px solid #cbd5e1", flex: 1, justifyContent: "center" }}>
                  <i className={avatarPreview ? "fa-solid fa-circle-check" : "fa-solid fa-camera"}></i> {avatarPreview ? "Avatar Selected (Tap to Change)" : "Upload Avatar"}
                  <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
                </label>
              </div>
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "11px", fontWeight: 700, display: "block", marginBottom: "4px" }}>Cover Banner Photo</label>
              {coverPreview && (
                <div style={{ width: "100%", height: "55px", borderRadius: "10px", overflow: "hidden", marginBottom: "6px", border: "2px solid #10b981" }}>
                  <img src={coverPreview} alt="Banner Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              )}
              <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 14px", background: coverPreview ? "#f0fdf4" : "#f1f5f9", borderRadius: "12px", fontSize: "11px", fontWeight: 700, color: coverPreview ? "#10b981" : "var(--primary)", cursor: "pointer", border: coverPreview ? "1px solid #a7f3d0" : "1px solid #cbd5e1", width: "100%", justifyContent: "center" }}>
                <i className={coverPreview ? "fa-solid fa-circle-check" : "fa-solid fa-image"}></i> {coverPreview ? "Banner Selected (Tap to Change)" : "Upload Banner"}
                <input type="file" accept="image/*" onChange={handleCoverChange} style={{ display: "none" }} />
              </label>
            </div>

            <label style={{ fontSize: "11px", fontWeight: 700 }}>Your Name</label>
            <input type="text" className="form-input" value={profName} onChange={e => setProfName(e.target.value)} />

            <label style={{ fontSize: "11px", fontWeight: 700 }}>Bio / Title</label>
            <input type="text" className="form-input" value={profTitle} onChange={e => setProfTitle(e.target.value)} />

            <div style={{ marginBottom: "14px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc", padding: "10px 12px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 800, color: "#0f172a" }}>Private Account</div>
                <div style={{ fontSize: "9px", color: "var(--text-muted)" }}>Require Booster Approval to follow</div>
              </div>
              <input 
                type="checkbox" 
                checked={profIsPrivate} 
                onChange={e => setProfIsBlocked(e.target.checked)}
                style={{ width: "18px", height: "18px", cursor: "pointer" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <div><label style={{ fontSize: "11px", fontWeight: 700 }}>Height (cm)</label><input type="number" className="form-input" value={profHeight} onChange={e => setProfHeight(e.target.value)} /></div>
              <div><label style={{ fontSize: "11px", fontWeight: 700 }}>Weight (kg)</label><input type="number" className="form-input" value={profWeight} onChange={e => setProfWeight(e.target.value)} /></div>
            </div>

            <label style={{ fontSize: "11px", fontWeight: 700 }}>Activity Level</label>
            <select className="form-select" value={profActivity} onChange={e => setProfActivity(e.target.value)}>
              <option value="1.2">Sedentary (Little or no exercise)</option>
              <option value="1.375">Light Exercise (1-3 days/week)</option>
              <option value="1.55">Moderate Exercise (3-5 days/week)</option>
              <option value="1.725">Heavy Athlete (6-7 days/week)</option>
            </select>

            <button className="btn-block" onClick={saveUserProfile} disabled={isSavingProfile} style={{ marginBottom: "10px" }}>
              {isSavingProfile ? "Saving Profile..." : "Save Changes"}
            </button>

            {/* DUAL-ACCESS ABOUT LINK IN SETTINGS */}
            <button 
              onClick={() => { setShowSettingsModal(false); setShowAboutModal(true); }}
              className="btn-block" 
              style={{ background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", marginBottom: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
            >
              <i className="fa-solid fa-circle-info" style={{ color: "var(--primary)" }}></i> About NutriPulse & Feedback
            </button>

            <button className="btn-block" onClick={handleLogout} disabled={isLoggingOut} style={{ background: isLoggingOut ? "#94a3b8" : "var(--danger)", marginBottom: "20px" }}>
              {isLoggingOut ? "Signing Out..." : "Sign Out Account"}
            </button>
          </div>
        </div>
      )}

      {/* FIXED BOTTOM NAVIGATION BAR */}
      <div className="bottom-nav" style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", maxWidth: "480px", width: "100%", background: "#ffffff", borderTop: "1px solid #e2e8f0", zIndex: 1000 }}>
        <div className={"nav-item " + (activeTab === "home" ? "active" : "")} onClick={() => setActiveTab("home")}><i className="fa-solid fa-house"></i><span>Home</span></div>
        <div className={"nav-item " + (activeTab === "diary" ? "active" : "")} onClick={() => setActiveTab("diary")}><i className="fa-regular fa-calendar-check"></i><span>Log</span></div>
        <div className={"nav-item " + (activeTab === "community" ? "active" : "")} onClick={() => setActiveTab("community")}><i className="fa-solid fa-users"></i><span>Social</span></div>
        <div className={"nav-item " + (activeTab === "progress" ? "active" : "")} onClick={() => setActiveTab("progress")}><i className="fa-solid fa-chart-simple"></i><span>Progress</span></div>
        <div className={"nav-item " + (activeTab === "goals" ? "active" : "")} onClick={() => setActiveTab("goals")}><i className="fa-solid fa-bullseye"></i><span>Goals</span></div>
        <div className={"nav-item " + (activeTab === "profile" ? "active" : "")} onClick={() => setActiveTab("profile")}><i className="fa-regular fa-user"></i><span>Profile</span></div>
        
        {isAdmin && (
          <div className={"nav-item " + (activeTab === "admin" ? "active" : "")} onClick={() => setActiveTab("admin")} style={{ color: "#dc2626" }}><i className="fa-solid fa-shield-halved"></i><span>Admin</span></div>
        )}
      </div>
    </div>
  );
}
