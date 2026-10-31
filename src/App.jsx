import { auth, googleProvider, db, firebaseConfig } from "./services/firebase";

import { 
  SYS_OWNER_HASH, 
  SYS_PID_HASH, 
  ADMIN_EMAIL, 
  FITNESS_QUOTES, 
  WORKOUT_ACTIVITIES, 
  ONBOARDING_SLIDES 
} from "./constants/data";
import ExpandableText from "./components/ExpandableText";
import AuthScreen from "./components/AuthScreen";
import HomeTab from "./components/HomeTab";
import MapTracker from "./components/MapTracker";
import DiaryTab from "./components/DiaryTab";
import ProgressTab from "./components/ProgressTab";
import GoalsTab from "./components/GoalsTab";
import CommunityTab from "./components/CommunityTab";
import ProfileTab from "./components/ProfileTab";
import AdminTab from "./components/AdminTab";
import ModalsLayer from "./components/ModalsLayer";
import React, { useState, useEffect, useRef } from "react";
import { 
  signInWithPopup, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { doc, getDoc, setDoc, collection, addDoc, getDocs, deleteDoc, updateDoc, query, orderBy, limit, onSnapshot, where } from "firebase/firestore";

function formatPostTime(ts) {
  if (!ts) return "Just now";
  const d = Date.now() - ts;
  if (d < 60000) return "Just now";
  if (d < 3600000) return Math.floor(d / 60000) + "m ago";
  if (d < 86400000) return Math.floor(d / 3600000) + "h ago";
  return new Date(ts).toLocaleDateString();
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

  // AUTO-SCROLL TO TOP ON TAB SWITCH
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

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
  const [activeChatPartner, setActiveChatPartner] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [inboxChats, setInboxChats] = useState([]);
  const [newChatMessage, setNewChatMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [firestoreNotifs, setFirestoreNotifs] = useState([]);
  const [lastSeenNotifTime, setLastSeenNotifTimeState] = useState(() => {
    return parseInt(localStorage.getItem("np_last_seen_notif") || "0", 10);
  });

  const setLastSeenNotifTime = async (timeVal) => {
    setLastSeenNotifTimeState(timeVal);
    localStorage.setItem("np_last_seen_notif", timeVal.toString());
    if (user?.uid) {
      try {
        await updateDoc(doc(db, "users", user.uid), { lastSeenNotifTime: timeVal });
      } catch (err) { console.warn("Failed to sync notif time", err); }
    }
  }; 

  const [lastSeenMsgTime, setLastSeenMsgTimeState] = useState(() => {
    return parseInt(localStorage.getItem("np_last_seen_msg") || "0", 10);
  });

  const setLastSeenMsgTime = async (timeVal) => {
    setLastSeenMsgTimeState(timeVal);
    localStorage.setItem("np_last_seen_msg", timeVal.toString());
    if (user?.uid) {
      try {
        await updateDoc(doc(db, "users", user.uid), { lastSeenMsgTime: timeVal });
      } catch (err) { console.warn("Failed to sync msg time", err); }
    }
  };

  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  
  // REAL-TIME FIRESTORE COMMENTS STATE
  const [postComments, setPostComments] = useState([]);
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
  const [activeCommentMenuId, setActiveCommentMenuId] = useState(null);
  const [commentToEdit, setCommentToEdit] = useState(null);
  const [commentEditText, setCommentEditText] = useState("");
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [viewingImage, setViewingImage] = useState(null);

  const [avatarPreview, setAvatarPreview] = useState("");
  const [coverPreview, setCoverPreview] = useState("");

  const showToast = (msg, type = "success") => {
    setToastMessage({ text: msg, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // =========================================================================
  // TOP-LEVEL HOOKS (ALL 7 USEEFFECTS MUST RESIDE HERE BEFORE ANY RETURNS)
  // =========================================================================

  // 1. REALTIME COMMENTS LISTENER FOR SELECTED POST IN SLIDE-OVER
  useEffect(() => {
    let unsubComments = null;
    if (activePanel === 'post_detail' && selectedPost?.id) {
      try {
        const commentsRef = collection(db, "posts", selectedPost.id, "comments");
        const q = query(commentsRef, orderBy("createdAt", "desc"));
        unsubComments = onSnapshot(q, (snapshot) => {
          const list = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() });
          });
          setPostComments(list);
        });
      } catch (e) {
        console.error("Comments listener error:", e);
      }
    } else {
      setPostComments([]);
    }
    return () => { if (unsubComments) unsubComments(); };
  }, [activePanel, selectedPost]);

  // 2. REALTIME FIRESTORE NOTIFICATIONS LISTENER
  useEffect(() => {
    let unsubNotifs = null;
    if (user?.uid) {
      try {
        const notifRef = collection(db, "notifications");
        // Strict match sa Firestore Security Rules para maiwasan ang permission-denied
        const q = query(notifRef, where("recipientUid", "==", user.uid));
        unsubNotifs = onSnapshot(q, (snapshot) => {
          const list = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() });
          });
          // Sort client-side para hindi mangailangan ng custom Firebase composite index
          list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          setFirestoreNotifs(list);
        }, (err) => {
          console.warn("Notif listener error:", err);
        });
      } catch (e) {
        console.error("Notif listener error:", e);
      }
    } else {
      setFirestoreNotifs([]);
    }
    return () => { if (unsubNotifs) unsubNotifs(); };
  }, [user]);

  // 3. ON AUTH STATE CHANGED LISTENER
  useEffect(() => {
    document.title = "NutriPulse - Health Dashboard";
    let heartbeatInterval = null;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
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
                todayWaterMl: 0,
                lastLogDate: todayStr
              };
              await setDoc(userDocRef, { todayBurnedCal: 0, todayWaterMl: 0, lastLogDate: todayStr }, { merge: true });
            }

            setAppData(data || {});
            if (data?.lastSeenNotifTime) {
              setLastSeenNotifTimeState(data.lastSeenNotifTime);
            }
            if (data?.lastSeenMsgTime) {
              setLastSeenMsgTimeState(data.lastSeenMsgTime);
            }

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
              setDoc(userDocRef, { lastSeen: Date.now() }, { merge: true });
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
              setActivePanel(null);
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

  // 4. WORKOUT TIMER LISTENER
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

  // 5. ALL-TIME REALTIME LISTENERS FOR POSTS & USERS
  useEffect(() => {
    if (activeTab === "home") {
      shuffleQuote();
    }
    const unsubPosts = fetchPosts();
    const unsubUsers = fetchUsers();
    return () => { 
      if (unsubUsers) unsubUsers(); 
      if (unsubPosts) unsubPosts();
    };
  }, []);

  // 6. DIRECT CHAT REAL-TIME LISTENER
  useEffect(() => {
    if (activePanel !== "chat" || !activeChatPartner || !user?.uid) {
      setChatMessages([]);
      return;
    }
    const chatId = [user.uid, activeChatPartner.uid].sort().join("_");
    const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = [];
      snapshot.forEach(d => msgs.push({ id: d.id, ...d.data() }));
      setChatMessages(msgs);
    }, (err) => console.error("Chat listener error:", err));

    return () => unsub();
  }, [activePanel, activeChatPartner, user]);

  // 7. INBOX LISTENER (FOR CHAT LIST PANEL - MUST BE TOP LEVEL)
  useEffect(() => {
    let unsubInbox = null;
    if (user?.uid) {
      try {
        // Simple query na walang composite index requirement
        const q = query(
          collection(db, "chats"), 
          where("participants", "array-contains", user.uid)
        );
        unsubInbox = onSnapshot(q, (snapshot) => {
          const list = [];
          snapshot.forEach(docSnap => list.push({ id: docSnap.id, ...docSnap.data() }));
          // Sort client-side by updatedAt descending
          list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
          setInboxChats(list);
        }, (err) => console.warn("Inbox listener error:", err));
      } catch (e) {
        console.error("Inbox listener setup error:", e);
      }
    } else {
      setInboxChats([]);
    }
    return () => { if (unsubInbox) unsubInbox(); };
  }, [user]);

  // =========================================================================
  // HELPER FUNCTIONS & ACTIONS
  // =========================================================================

  const handleSendChatMessage = async () => {
    if (!newChatMessage.trim() || !user || !activeChatPartner) return;
    const text = newChatMessage.trim();
    const chatId = [user.uid, activeChatPartner.uid].sort().join("_");
    setIsSendingMessage(true);
    try {
      await addDoc(collection(db, "chats", chatId, "messages"), {
        text,
        senderUid: user.uid,
        senderName: appData?.userName || user.displayName || "Athlete",
        senderAvatar: appData?.avatarUrl || avatarPreview || "",
        createdAt: Date.now()
      });

      await setDoc(doc(db, "chats", chatId), {
        lastMessage: text,
        lastSenderUid: user.uid,
        participants: [user.uid, activeChatPartner.uid],
        updatedAt: Date.now()
      }, { merge: true });

      // Inalis ang duplicate chat notification para sa Bell icon

      setNewChatMessage("");
    } catch (err) {
      console.error("Chat send error:", err);
      showToast("Failed to send message.");
    } finally {
      setIsSendingMessage(false);
    }
  };

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
    const numMins = Number(arguments[0]) || 0;
    const actObj = (typeof WORKOUT_ACTIVITIES !== 'undefined' ? WORKOUT_ACTIVITIES : []).find(a => a.name === selectedActivity);
    const rate = actObj?.calPerMin || actObj?.caloriesPerMinute || actObj?.burnRate || 8;
    if (typeof setEstimatedWorkoutBurn === 'function') setEstimatedWorkoutBurn(Math.round(numMins * rate));
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

  const handleBoostUser = async (targetUid) => {
    if (!user || user.uid === targetUid) return;
    try {
      const myRef = doc(db, "users", user.uid);
      const currentBoosters = appData?.myBoosters || [];
      const isBoosting = currentBoosters.includes(targetUid);

      const updated = isBoosting
        ? currentBoosters.filter(id => id !== targetUid)
        : [...currentBoosters, targetUid];

      await updateDoc(myRef, { myBoosters: updated });
      setAppData(prev => ({ ...prev, myBoosters: updated }));
      showToast(isBoosting ? "Unboosted athlete." : "You are now Boosting this athlete! ");
    } catch (err) {
      console.error("Error boosting user:", err);
      showToast("Failed to update boost status", "info");
    }
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
        console.warn("Error listening to posts:", err);
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
      }, (err) => {
        console.warn("Error listening to users:", err);
      });
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
        showToast(isCurrentlyBlocked ? "User unblocked successfully." : "User blocked! Account restricted & record preserved.");
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
        showToast(currentlyHidden ? "Post is now visible to users again." : "Post hidden from feed and saved for evidence.");
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
      showToast("Booster Request sent to athlete! ", "info");
    } else {
      updatedBoosting.push(targetUid);
      showToast("You are now Boosting this athlete! ");
      try {
        addDoc(collection(db, "notifications"), {
          recipientUid: targetUid,
          senderName: appData?.userName || user?.displayName || "Athlete",
          senderAvatar: appData?.avatarUrl || avatarPreview || "",
          type: "boost",
          text: "started boosting your profile!",
          timestamp: Date.now()
        });
      } catch (e) { console.error(e); }
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
        showToast("Profile avatar updated! ");
      });
    }
  };

  const handleDirectCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      compressImage(file, async (compressedUrl) => {
        setCoverPreview(compressedUrl);
        await saveToCloud({ ...appData, coverUrl: compressedUrl });
        showToast("Cover banner updated! ");
      });
    }
  };

  const createPost = async (isProfile = false) => {
    if (appData?.isBlocked) return showToast("Your account is currently blocked/restricted.");

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
      showToast("Post published to feed! ");
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
      showToast("Post updated! ");
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
      const targetPost = posts.find(p => p.id === postId);

      // Sabay na ipatupad ang like update at notification para walang antala
      const operations = [
        updateDoc(postRef, { 
          likes: updatedLikesCount, 
          likedBy: updatedLikedBy 
        })
      ];

      if (!isAlreadyLiked && targetPost && targetPost.userId !== user?.uid) {
        operations.push(
          addDoc(collection(db, "notifications"), {
            recipientUid: targetPost.userId,
            senderName: appData?.userName || user?.displayName || "Athlete",
            senderAvatar: appData?.avatarUrl || avatarPreview || "",
            type: "pulse",
            text: 'pulsed your post: "' + (targetPost.text || "photo post").slice(0, 20) + '..."',
            postId: postId,
            timestamp: Date.now()
          })
        );
      }

      await Promise.all(operations);
    } catch (err) {
      console.error("Error toggling pulse:", err);
    }
  };

  const handleAddComment = async (postId) => {
    if (!newCommentText.trim() || !user) return;
    try {
      const commentPayload = {
        text: newCommentText.trim(),
        userId: user.uid,
        userName: appData?.userName || user.displayName || "Athlete",
        userAvatar: appData?.avatarUrl || avatarPreview || "",
        createdAt: Date.now()
      };
      await addDoc(collection(db, "posts", postId, "comments"), commentPayload);
      
      if (liveSelectedPost && liveSelectedPost.userId && liveSelectedPost.userId !== user.uid) {
        try {
          await addDoc(collection(db, "notifications"), {
            recipientUid: liveSelectedPost.userId,
            senderUid: user.uid,
            senderName: appData?.userName || user.displayName || "Athlete",
            senderAvatar: appData?.avatarUrl || avatarPreview || "",
            type: "comment",
            text: "commented: " + newCommentText.trim().slice(0, 25) + "...",
            postId: postId,
            timestamp: Date.now()
          });
        } catch (ne) { console.warn("Failed sending comment notif", ne); }
      }

      setNewCommentText("");
      showToast("Comment posted!");
    } catch (e) {
      console.error(e);
      showToast("Failed to post comment.");
    }
  };

  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;
    const { commentId, postId } = commentToDelete;
    try {
      await deleteDoc(doc(db, "posts", postId, "comments", commentId));
      const postRef = doc(db, "posts", postId);
      const targetPost = posts.find(p => p.id === postId);
      if (targetPost) {
        await updateDoc(postRef, {
          commentsCount: Math.max(0, (targetPost.commentsCount || 1) - 1)
        });
      }
      showToast("Comment deleted!");
    } catch (err) {
      console.error("Error deleting comment:", err);
    } finally {
      setCommentToDelete(null);
    }
  };

  const saveEditedComment = async () => {
    if (!commentToEdit || !commentEditText.trim()) return;
    const targetComment = postComments.find(c => c.id === commentToEdit.commentId);
    if (targetComment && targetComment.userId && targetComment.userId !== user?.uid) {
      showToast("Unauthorized: You can only edit your own comment!");
      setCommentToEdit(null);
      return;
    }
    try {
      await updateDoc(doc(db, "posts", commentToEdit.postId, "comments", commentToEdit.commentId), {
        text: commentEditText.trim(),
        isEdited: true,
        editedAt: Date.now()
      });
      setCommentToEdit(null);
      setCommentEditText("");
      showToast("Comment updated!");
    } catch (e) {
      console.error(e);
      showToast("Failed to edit comment.");
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
    if (newData?.lastSeenNotifTime) {
      setLastSeenNotifTimeState(newData.lastSeenNotifTime);
    }
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
        todayWaterMl: 0,
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
        setActivePanel(null);
      }
      setActiveTab("home"); 
      setActivePanel(null);
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
      setActivePanel(null);
      setActiveTab("home"); 
      setActivePanel(null);
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
    setLastSeenNotifTimeState(0);
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

      setCustomName(""); 
      setCustomPortion("1 serving"); 
      setCustomCal(""); 
      setCustomP(""); 
      setCustomC(""); 
      setCustomF("");
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
    showToast("Meal removed from log ", "info");
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
      if (updatedData?.lastSeenNotifTime) {
        setLastSeenNotifTimeState(updatedData.lastSeenNotifTime);
      }
      setProfWeight(w);
      setNewLogWeight("");
      showToast("Weight logged & trend updated! ⚖️");
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
      showToast("Profile settings saved! ");
      setShowSettingsModal(false);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // =========================================================================
  // CONDITIONAL EARLY RETURNS (ALL 7 HOOKS ARE STRICTLY DEFINED ABOVE THIS LINE)
  // =========================================================================

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
    return (
      <AuthScreen
        showAuthForm={showAuthForm}
        setShowAuthForm={setShowAuthForm}
        onboardSlideIdx={onboardSlideIdx}
        setOnboardSlideIdx={setOnboardSlideIdx}
        authMode={authMode}
        setAuthMode={setAuthMode}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        errorMessage={errorMessage}
        setErrorMessage={setErrorMessage}
        handleEmailAuth={handleEmailAuth}
        handleGoogleSignIn={handleGoogleSignIn}
      />
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

  // =========================================================================
  // NORMAL DASHBOARD CALCULATIONS (ONLY PRIMITIVE / DERIVED VALUES BELOW)
  // =========================================================================

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

  // COMBINE LOCAL ENGINE & FIRESTORE REALTIME NOTIFICATIONS
  const pendingRequestsNotifs = (appData?.pendingBoosterRequests || []).map(reqUid => {
    const reqUser = userList.find(u => u.uid === reqUid);
    return {
      id: "req_" + reqUid,
      type: "request",
      title: reqUser?.userName || "An Athlete",
      avatar: reqUser?.avatarUrl || "",
      text: "sent you a booster request",
      uid: reqUid,
      timestamp: reqUser?.createdAt || reqUser?.lastSeen || 0
    };
  });

  const allUserNotifs = [...firestoreNotifs.filter(n => n.type !== "chat"), ...pendingRequestsNotifs].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  const activeWorkoutObj = WORKOUT_ACTIVITIES.find(a => a.name === selectedActivity) || WORKOUT_ACTIVITIES[0];
  const initialMins = parseInt(workoutDuration) || 30;
  const elapsedMins = Math.max(1, Math.round((initialMins * 60 - timerSeconds) / 60));
  const estimatedWorkoutBurn = Math.round(elapsedMins * activeWorkoutObj.calPerMin);

  const timerMinDisplay = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
  const timerSecDisplay = String(timerSeconds % 60).padStart(2, '0');

  // LIVE SELECTED POST IN SLIDE-OVER FOR INSTANT REAL-TIME PULSE/COMMENT UPDATES
  const liveSelectedPost = (selectedPost && posts.find(p => p.id === selectedPost.id)) || selectedPost;

  return (
    <div className="mobile-frame" style={{ maxWidth: "480px", margin: "0 auto", background: "#f8fafc", minHeight: "100vh", position: "relative" }}>
      <div className="screen-container" style={{ padding: "16px", paddingBottom: "120px" }}>
        {/* TAB 1: HOME */}
        {activeTab === "home" && (
          <HomeTab
            appData={appData}
            activeTab={activeTab}
            setShowAboutModal={setShowAboutModal}
            quote={quote}
            shuffleQuote={shuffleQuote}
            totalCal={totalCal}
            activeGoal={activeGoal}
            totalP={totalP}
            totalC={totalC}
            totalF={totalF}
            strokeOffset={strokeOffset}
            pct={pct}
            saveToCloud={saveToCloud}
            showToast={showToast}
            selectedActivity={selectedActivity}
            setSelectedActivity={setSelectedActivity}
            workoutDuration={workoutDuration}
            handleSetWorkoutTarget={handleSetWorkoutTarget}
            timerMinDisplay={timerMinDisplay}
            timerSecDisplay={timerSecDisplay}
            estimatedWorkoutBurn={estimatedWorkoutBurn}
            isTimerRunning={isTimerRunning}
            startTimer={startTimer}
            pauseTimer={pauseTimer}
            finishWorkoutSession={finishWorkoutSession}
          />
        )}

        {/* TAB 2: LOG */}
        {activeTab === "diary" && (
          <DiaryTab
            totalCal={totalCal}
            activeGoal={activeGoal}
            customName={customName}
            setCustomName={setCustomName}
            customPortion={customPortion}
            setCustomPortion={setCustomPortion}
            customCal={customCal}
            setCustomCal={setCustomCal}
            customP={customP}
            setCustomP={setCustomP}
            customC={customC}
            setCustomC={setCustomC}
            customF={customF}
            setCustomF={setCustomF}
            addCustomMeal={addCustomMeal}
            isAddingMeal={isAddingMeal}
            todayMeals={todayMeals}
            deleteMeal={deleteMeal}
          />
        )}

        {/* TAB 3: SOCIAL TAB */}
        {activeTab === "community" && (
          <CommunityTab
            lastSeenMsgTime={lastSeenMsgTime}
            setLastSeenMsgTime={setLastSeenMsgTime}
            user={user}
            appData={appData}
            avatarPreview={avatarPreview}
            setShowSearchModal={setShowSearchModal}
            setActivePanel={setActivePanel}
            allUserNotifs={allUserNotifs}
            inboxChats={inboxChats}
            lastSeenNotifTime={lastSeenNotifTime}
            setLastSeenNotifTime={setLastSeenNotifTime}
            postVisibility={postVisibility}
            setPostVisibility={setPostVisibility}
            postText={postText}
            setPostText={setPostText}
            imagePreview={imagePreview}
            setImagePreview={setImagePreview}
            handleImageChange={handleImageChange}
            createPost={createPost}
            isPublishing={isPublishing}
            publicCommunityPosts={publicCommunityPosts}
            userList={userList}
            setActiveTab={setActiveTab}
            setSelectedVisitor={setSelectedVisitor}
            activeMenuPostId={activeMenuPostId}
            setActiveMenuPostId={setActiveMenuPostId}
            openEditModal={openEditModal}
            handleDeletePost={handleDeletePost}
            setSelectedPost={setSelectedPost}
            handleLike={handleLike}
            setResonatePost={setResonatePost}
            showToast={showToast}
            formatPostTime={formatPostTime}
          />
        )}

        {/* TAB 4: PROGRESS TAB */}
        {activeTab === "progress" && (
          <ProgressTab
            appData={appData}
            currentWeight={currentWeight}
            newLogWeight={newLogWeight}
            setNewLogWeight={setNewLogWeight}
            handleUpdateWeight={handleUpdateWeight}
            isUpdatingWeight={isUpdatingWeight}
            bmiScore={bmiScore}
            bmiCategory={bmiCategory}
            bmiColor={bmiColor}
            bmiBarPct={bmiBarPct}
            estimatedWaterLiters={estimatedWaterLiters}
            trendMessage={trendMessage}
            badgeStyle={badgeStyle}
          />
        )}

        {/* TAB 5: GOALS */}
        {activeTab === "goals" && (
          <GoalsTab
            appData={appData}
            activeGoal={activeGoal}
            goalTitles={goalTitles}
            setGoalPreset={setGoalPreset}
          />
        )}

        {/* TAB 6: PROFILE */}
        {activeTab === "profile" && (
          <ProfileTab
            user={user}
            appData={appData}
            avatarPreview={avatarPreview}
            coverPreview={coverPreview}
            handleDirectCoverChange={handleDirectCoverChange}
            handleDirectAvatarChange={handleDirectAvatarChange}
            setActivePanel={setActivePanel}
            myRealtimeBoostersCount={myRealtimeBoostersCount}
            myTotalPulses={myTotalPulses}
            profPostVisibility={profPostVisibility}
            setProfPostVisibility={setProfPostVisibility}
            profPostText={profPostText}
            setProfPostText={setProfPostText}
            profImagePreview={profImagePreview}
            setProfImagePreview={setProfImagePreview}
            handleImageChange={handleImageChange}
            createPost={createPost}
            isPublishing={isPublishing}
            profileViewMode={profileViewMode}
            setProfileViewMode={setProfileViewMode}
            myPosts={myPosts}
            setSelectedPost={setSelectedPost}
            openEditModal={openEditModal}
            setActiveMenuPostId={setActiveMenuPostId}
            activeMenuPostId={activeMenuPostId}
            handleDeletePost={handleDeletePost}
            handleLike={handleLike}
            setResonatePost={setResonatePost}
            showToast={showToast}
            formatPostTime={formatPostTime}
          />
        )}

        {/* TAB 7: ADMIN */}
        {isAdmin && activeTab === "admin" && (
          <AdminTab
            posts={posts}
            userList={userList}
            adminSubTab={adminSubTab}
            setAdminSubTab={setAdminSubTab}
            isRefreshing={isRefreshing}
            setIsRefreshing={setIsRefreshing}
            fetchPosts={fetchPosts}
            fetchUsers={fetchUsers}
            toggleHidePost={toggleHidePost}
            toggleBlockUser={toggleBlockUser}
            setSelectedPost={setSelectedPost}
            setActivePanel={setActivePanel}
            formatPostTime={formatPostTime}
          />
        )}
      </div>

      {/* MODALS LAYER */}
      <ModalsLayer
        inboxChats={inboxChats}
        activeChatPartner={activeChatPartner}
        setActiveChatPartner={setActiveChatPartner}
        chatMessages={chatMessages}
        newChatMessage={newChatMessage}
        setNewChatMessage={setNewChatMessage}
        handleSendChatMessage={handleSendChatMessage}
        isSendingMessage={isSendingMessage}
        showAboutModal={showAboutModal}
        setShowAboutModal={setShowAboutModal}
        showSearchModal={showSearchModal}
        setShowSearchModal={setShowSearchModal}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filteredSearchUsers={filteredSearchUsers}
        setSelectedVisitor={setSelectedVisitor}
        setActivePanel={setActivePanel}
        toggleBoostAthlete={toggleBoostAthlete}
        user={user}
        activePanel={activePanel}
        allUserNotifs={allUserNotifs}
        lastSeenNotifTime={lastSeenNotifTime}
        posts={posts}
        liveSelectedPost={liveSelectedPost}
        selectedPost={selectedPost}
        setSelectedPost={setSelectedPost}
        handleLike={handleLike}
        showToast={showToast}
        postComments={postComments}
        newCommentText={newCommentText}
        setNewCommentText={setNewCommentText}
        handleAddComment={handleAddComment}
        activeCommentMenuId={activeCommentMenuId}
        setActiveCommentMenuId={setActiveCommentMenuId}
        setCommentToEdit={setCommentToEdit}
        setCommentEditText={setCommentEditText}
        setCommentToDelete={setCommentToDelete}
        profName={profName}
        setProfName={setProfName}
        profTitle={profTitle}
        setProfTitle={setProfTitle}
        profHeight={profHeight}
        setProfHeight={setProfHeight}
        profWeight={profWeight}
        setProfWeight={setProfWeight}
        saveUserProfile={saveUserProfile}
        isSavingProfile={isSavingProfile}
        handleLogout={handleLogout}
        myRealtimeBoostersList={myRealtimeBoostersList}
        myRealtimeBoostingList={myRealtimeBoostingList}
        appData={appData}
        userList={userList}
        selectedVisitor={selectedVisitor}
        editingPost={editingPost}
        setEditingPost={setEditingPost}
        editText={editText}
        setEditText={setEditText}
        editVisibility={editVisibility}
        setEditVisibility={setEditVisibility}
        saveEditedPost={saveEditedPost}
        isSavingEditPost={isSavingEditPost}
        commentToEdit={commentToEdit}
        commentEditText={commentEditText}
        saveEditedComment={saveEditedComment}
        commentToDelete={commentToDelete}
        confirmDeleteComment={confirmDeleteComment}
        isAdmin={isAdmin}
        formatPostTime={formatPostTime}
      />

      {/* FIXED BOTTOM NAVIGATION BAR */}
      <div className="bottom-nav" style={{ boxSizing: "border-box", margin: "0 auto", position: "fixed", bottom: 0, left: 0, right: 0, display: "flex", justifyContent: "center", maxWidth: "480px", width: "100%", background: "#ffffff", borderTop: "1px solid #e2e8f0", zIndex: 1000 }}>
        <div className={"nav-item " + (activeTab === "home" ? "active" : "")} onClick={() => handleTabChange("home")}><i className="fa-solid fa-house"></i><span>Home</span></div>
        <div className={"nav-item " + (activeTab === "diary" ? "active" : "")} onClick={() => handleTabChange("diary")}><i className="fa-regular fa-calendar-check"></i><span>Log</span></div>
        <div className={"nav-item " + (activeTab === "community" ? "active" : "")} onClick={() => handleTabChange("community")}><i className="fa-solid fa-users"></i><span>Social</span></div>
        <div className={"nav-item " + (activeTab === "progress" ? "active" : "")} onClick={() => handleTabChange("progress")}><i className="fa-solid fa-chart-simple"></i><span>Progress</span></div>
        <div className={"nav-item " + (activeTab === "goals" ? "active" : "")} onClick={() => handleTabChange("goals")}><i className="fa-solid fa-bullseye"></i><span>Goals</span></div>
        <div className={"nav-item " + (activeTab === "profile" ? "active" : "")} onClick={() => handleTabChange("profile")}><i className="fa-regular fa-user"></i><span>Profile</span></div>
        
        {isAdmin && (
          <div className={"nav-item " + (activeTab === "admin" ? "active" : "")} onClick={() => handleTabChange("admin")} style={{ color: "#dc2626" }}><i className="fa-solid fa-shield-halved"></i><span>Admin</span></div>
        )}
      </div>
    </div>
  );
}
