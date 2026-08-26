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
                  {/* MODERN ATHLETIC VISITOR PROFILE PANEL */}
            {activePanel === 'visitor_profile' && selectedVisitor && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {/* Hero Profile Card */}
                <div style={{ background: "#ffffff", borderRadius: "16px", overflow: "hidden", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                  <div style={{ height: "70px", background: selectedVisitor.coverUrl ? "url(" + selectedVisitor.coverUrl + ") center/cover" : "linear-gradient(135deg, #0284c7, #4f46e5)" }}></div>
                  
                  <div style={{ padding: "0 16px 14px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "-28px", marginBottom: "8px" }}>
                      {selectedVisitor.avatarUrl ? (
                        <img src={selectedVisitor.avatarUrl} alt="" style={{ width: "56px", height: "56px", borderRadius: "50%", objectFit: "cover", border: "3px solid #ffffff", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }} />
                      ) : (
                        <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#0284c7", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: 800, border: "3px solid #ffffff", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
                          {(selectedVisitor.userName || "A").charAt(0).toUpperCase()}
                        </div>
                      )}

                      {/* COMPACT PILL ACTION BUTTONS (BOOST / UNBOOST & MESSAGE) */}
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button onClick={() => toggleBoostAthlete(selectedVisitor.uid, selectedVisitor.isPrivateAccount)} style={{
                          padding: "6px 14px",
                          borderRadius: "20px",
                          border: (appData?.boosting || []).includes(selectedVisitor.uid) ? "1px solid #cbd5e1" : "none",
                          fontSize: "11px",
                          fontWeight: 700,
                          cursor: "pointer",
                          background: (appData?.boosting || []).includes(selectedVisitor.uid) ? "#f1f5f9" : "#0284c7",
                          color: (appData?.boosting || []).includes(selectedVisitor.uid) ? "#334155" : "#ffffff"
                        }}>
                          {(appData?.boosting || []).includes(selectedVisitor.uid) ? "Unboost" : "Boost"}
                        </button>

                        <button onClick={() => showToast("Direct Messaging coming soon.")} style={{
                          padding: "6px 12px",
                          borderRadius: "20px",
                          background: "#ffffff",
                          border: "1px solid #cbd5e1",
                          color: "#334155",
                          fontSize: "11px",
                          cursor: "pointer",
                          fontWeight: 700
                        }}>
                          Message
                        </button>
                      </div>
                    </div>

                    <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "#0f172a" }}>{selectedVisitor.userName || "Athlete"}</h3>
                    <p style={{ margin: "1px 0 10px 0", fontSize: "10px", color: "#64748b", fontWeight: 600 }}>{selectedVisitor.userTitle || "Fitness Enthusiast"}</p>

                    {/* ATHLETE STATS BAR */}
                    <div style={{ display: "flex", gap: "16px", borderTop: "1px solid #f1f5f9", paddingTop: "8px", fontSize: "11px" }}>
                      <div><strong style={{ color: "#0f172a" }}>{(posts.filter(p => p.userId === selectedVisitor.uid) || []).length}</strong> <span style={{ color: "#94a3b8", fontSize: "10px" }}>Posts</span></div>
                      <div><strong style={{ color: "#0f172a" }}>{(userList.filter(u => (u.boosting || []).includes(selectedVisitor.uid)) || []).length}</strong> <span style={{ color: "#94a3b8", fontSize: "10px" }}>Boosters</span></div>
                      <div><strong style={{ color: "#0f172a" }}>{(selectedVisitor.boosting || []).length}</strong> <span style={{ color: "#94a3b8", fontSize: "10px" }}>Boosting</span></div>
                    </div>
                  </div>
                </div>

                {/* ATHLETE'S RECENT POSTS FEED */}
                <div style={{ background: "#ffffff", borderRadius: "16px", padding: "14px", border: "1px solid #e2e8f0" }}>
                  <h4 style={{ margin: "0 0 10px 0", fontSize: "12px", color: "#0f172a", fontWeight: 800 }}>Athlete Posts</h4>
                  {posts.filter(p => p.userId === selectedVisitor.uid).length === 0 ? (
                    <div style={{ textAlign: "center", padding: "20px", color: "#94a3b8", fontSize: "11px" }}>No posts published yet.</div>
                  ) : (
                    posts.filter(p => p.userId === selectedVisitor.uid).map(p => (
                      <div key={p.id} onClick={() => { setSelectedPost(p); setActivePanel('post_detail'); }} style={{ padding: "10px", borderRadius: "12px", background: "#f8fafc", marginBottom: "8px", border: "1px solid #f1f5f9", cursor: "pointer" }}>
                        <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#334155" }}>{p.text}</p>
                        {p.imageUrl && <img src={p.imageUrl} alt="" style={{ width: "100%", borderRadius: "8px", maxHeight: "140px", objectFit: "cover" }} />}
                        <span style={{ fontSize: "9px", color: "#94a3b8", display: "block", marginTop: "4px" }}>{formatPostTime(p.createdAt)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
      {/* FIXED BOTTOM NAVIGATION BAR */}
      <div className="bottom-nav" style={{ boxSizing: "border-box", margin: "0 auto",  position: "fixed", bottom: 0, left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",  maxWidth: "480px", width: "100%", background: "#ffffff", borderTop: "1px solid #e2e8f0", zIndex: 1000 }}>
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