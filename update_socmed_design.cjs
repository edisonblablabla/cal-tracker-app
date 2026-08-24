const fs = require('fs');

const code = `import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  limit
} from 'firebase/firestore';

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

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [appData, setAppData] = useState(null);
  const [activeTab, setActiveTab] = useState('home');

  const [onboardStep, setOnboardStep] = useState(0);
  const [setupName, setSetupName] = useState('');
  const [setupHeight, setSetupHeight] = useState('165');
  const [setupWeight, setSetupWeight] = useState('60');
  const [setupActivity, setSetupActivity] = useState('1.55');
  const [setupGoalType, setSetupGoalType] = useState('jogger');

  const [quote, setQuote] = useState(FITNESS_QUOTES[0]);
  const [clockText, setClockText] = useState('00:00:00');
  const [clockTitle, setClockTitle] = useState('Eating Window');
  const [clockSubtext, setClockSubtext] = useState('Target: 16 Hours Fasting');

  const [customName, setCustomName] = useState('');
  const [customCal, setCustomCal] = useState('');
  const [customP, setCustomP] = useState('');
  const [customC, setCustomC] = useState('');
  const [customF, setCustomF] = useState('');

  const [profName, setProfName] = useState('');
  const [profTitle, setProfTitle] = useState('');
  const [profHeight, setProfHeight] = useState(160);
  const [profWeight, setProfWeight] = useState(60);
  const [profActivity, setProfActivity] = useState(1.55);

  const [newLogWeight, setNewLogWeight] = useState('');
  
  // SOCMED & COMMUNITY STATES
  const [posts, setPosts] = useState([]);
  const [postText, setPostText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [profileViewMode, setProfileViewMode] = useState('grid');

  useEffect(() => {
    document.title = "NutriPulse - Calorie, Fasting & Fitness Tracker";
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(userDocRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          const todayStr = new Date().toDateString();
          if (data.lastWaterDate !== todayStr) {
            data.waterMl = 0;
            data.lastWaterDate = todayStr;
            await setDoc(userDocRef, { waterMl: 0, lastWaterDate: todayStr }, { merge: true });
          }

          setAppData(data);
          setProfName(data.userName || currentUser.displayName || 'Athlete');
          setProfTitle(data.userTitle || 'Fitness Enthusiast');
          setProfHeight(data.height || 160);
          setProfWeight(data.weight || 60);
          setProfActivity(data.activityLevel || 1.55);
          setNewLogWeight(data.weight || 60);

          if (!data.onboardingCompleted) {
            setOnboardStep(1);
          } else {
            setOnboardStep(0);
          }
        } else {
          setSetupName(currentUser.displayName || 'Athlete');
          setOnboardStep(1);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (activeTab === 'community' || activeTab === 'profile') {
      fetchPosts();
    }
  }, [activeTab]);

  const fetchPosts = async () => {
    try {
      const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(30));
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const createPost = async () => {
    if (!postText && !imagePreview) return alert('Please enter some text or select an image!');
    try {
      const newPost = {
        userId: user.uid,
        userName: appData.userName || 'Athlete',
        userTitle: appData.userTitle || 'Fitness Enthusiast',
        text: postText,
        imageUrl: imagePreview || '', 
        likes: 0,
        likedBy: [],
        createdAt: Date.now()
      };
      await addDoc(collection(db, 'posts'), newPost);
      setPostText('');
      setSelectedImage(null);
      setImagePreview(null);
      fetchPosts();
      alert('Post Published successfully!');
    } catch (err) {
      console.error("Error creating post:", err);
    }
  };

  const handleLike = async (postId, currentLikes, likedBy = []) => {
    if (likedBy.includes(user.uid)) return;
    try {
      const postRef = doc(db, 'posts', postId);
      await setDoc(postRef, { 
        likes: currentLikes + 1, 
        likedBy: [...likedBy, user.uid] 
      }, { merge: true });
      fetchPosts();
    } catch (err) {
      console.error("Error liking post:", err);
    }
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('Delete this post permanently?')) {
      try {
        await deleteDoc(doc(db, 'posts', postId));
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
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, newData, { merge: true });
      } catch (err) {
        console.error("Cloud sync error:", err);
      }
    }
  };

  const completeOnboarding = async () => {
    const w = parseFloat(setupWeight) || 60;
    const h = parseFloat(setupHeight) || 160;
    const act = parseFloat(setupActivity) || 1.55;
    const todayStr = new Date().toDateString();

    let bmr = (10 * w) + (6.25 * h) - (5 * 25) + 5;
    let tdee = Math.round(bmr * act);

    let baseGoal = tdee;
    let pGoal = Math.round(w * 2.0);
    let cGoal = Math.round(w * 3.2);
    let fGoal = Math.round(w * 0.9);

    if (setupGoalType === 'jogger') baseGoal = tdee + 100;
    else if (setupGoalType === 'marathon') baseGoal = tdee + 400;
    else if (setupGoalType === 'steps') baseGoal = Math.max(1200, tdee - 250);
    else if (setupGoalType === 'bulk') baseGoal = tdee + 250;
    else if (setupGoalType === 'cut') baseGoal = Math.max(1200, tdee - 450);

    const initialData = {
      userName: setupName || user.displayName || 'Athlete',
      userTitle: 'Fitness Enthusiast',
      height: h,
      weight: w,
      prevWeight: w,
      activityLevel: act,
      dayMode: 'workout',
      streakDays: 1,
      lastLogDate: '',
      lastWaterDate: todayStr,
      activeGoalType: setupGoalType,
      baseGoal, goal: baseGoal, pGoal, cGoal, fGoal, waterMl: 0,
      fastingPlan: 16,
      fastingActive: false,
      fastStartTime: null,
      onboardingCompleted: true,
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
  };

  useEffect(() => {
    if (!appData) return;
    const interval = setInterval(() => {
      if (!appData.fastingActive || !appData.fastStartTime) {
        setClockText('00:00:00');
        setClockTitle('Eating Window');
        setClockSubtext("Target: " + (appData.fastingPlan || 16) + " Hours Fasting");
        return;
      }

      const elapsedMs = Date.now() - appData.fastStartTime;
      const targetMs = (appData.fastingPlan || 16) * 3600 * 1000;
      const remainingMs = targetMs - elapsedMs;

      if (remainingMs <= 0) {
        setClockText('00:00:00');
        setClockTitle('Fast Complete');
        setClockSubtext('Goal reached. You can now eat.');
      } else {
        setClockTitle('Fasting Window');
        const totalSec = Math.floor(remainingMs / 1000);
        const hrs = String(Math.floor(totalSec / 3600)).padStart(2, '0');
        const mins = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
        const secs = String(totalSec % 60).padStart(2, '0');

        setClockText(hrs + ":" + mins + ":" + secs);
        setClockSubtext('Time Remaining Until Eating Window');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [appData]);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!email || !password) {
      setErrorMessage('Please enter your email and password.');
      return;
    }
    try {
      if (authMode === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setErrorMessage('Invalid email or password. Please try again.');
      } else if (error.code === 'auth/email-already-in-use') {
        setErrorMessage('An account is already registered with this email.');
      } else if (error.code === 'auth/weak-password') {
        setErrorMessage('Password must be at least 6 characters long.');
      } else {
        setErrorMessage(error.message);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      setErrorMessage("Google Login Error: " + error.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setAppData(null);
    setOnboardStep(0);
    setActiveTab('home');
  };

  const shuffleQuote = () => {
    const randomIndex = Math.floor(Math.random() * FITNESS_QUOTES.length);
    setQuote(FITNESS_QUOTES[randomIndex]);
  };

  const setDayMode = (mode) => {
    saveToCloud({ ...appData, dayMode: mode });
  };

  const addWater = () => {
    const todayStr = new Date().toDateString();
    saveToCloud({ 
      ...appData, 
      waterMl: (appData.waterMl || 0) + 250,
      lastWaterDate: todayStr 
    });
  };

  const toggleFast = () => {
    if (!appData.fastingActive) {
      saveToCloud({ ...appData, fastingActive: true, fastStartTime: Date.now() });
    } else {
      saveToCloud({ ...appData, fastingActive: false, fastStartTime: null });
    }
  };

  const addPreset = (name, cal, p, c, f) => {
    logMealEntry({ name, cal, p, c, f, id: Date.now() });
  };

  const addCustomMeal = () => {
    const cal = parseInt(customCal) || 0;
    if (!customName || cal <= 0) return alert('Please enter a meal name and calorie value.');

    logMealEntry({
      name: customName,
      cal,
      p: parseInt(customP) || 0,
      c: parseInt(customC) || 0,
      f: parseInt(customF) || 0,
      id: Date.now()
    });

    setCustomName(''); setCustomCal(''); setCustomP(''); setCustomC(''); setCustomF('');
  };

  const logMealEntry = (mealObj) => {
    const todayStr = new Date().toDateString();
    let streak = appData.streakDays || 1;
    if (appData.lastLogDate !== todayStr) streak += 1;

    saveToCloud({
      ...appData,
      meals: [mealObj, ...(appData.meals || [])],
      streakDays: streak,
      lastLogDate: todayStr
    });
  };

  const deleteMeal = (id) => {
    saveToCloud({ ...appData, meals: appData.meals.filter(m => m.id !== id) });
  };

  const handleUpdateWeight = () => {
    const updatedWeight = parseFloat(newLogWeight);
    if (!updatedWeight || updatedWeight <= 0) return alert('Please enter a valid weight.');

    const w = updatedWeight;
    const h = appData.height || 160;
    const act = parseFloat(appData.activityLevel) || 1.55;

    let bmr = (10 * w) + (6.25 * h) - (5 * 25) + 5;
    let tdee = Math.round(bmr * act);

    saveToCloud({
      ...appData,
      prevWeight: appData.weight || w,
      weight: w,
      baseGoal: tdee
    });

    setProfWeight(w);
    alert('Weight entry logged & goals auto-adjusted!');
  };

  const setGoalPreset = (type) => {
    const w = appData.weight || 60;
    const h = appData.height || 160;
    const act = parseFloat(appData.activityLevel) || 1.55;

    let bmr = (10 * w) + (6.25 * h) - (5 * 25) + 5;
    let tdee = Math.round(bmr * act);

    let baseGoal = tdee;
    let pGoal = Math.round(w * 2.0);
    let cGoal = Math.round(w * 3.2);
    let fGoal = Math.round(w * 0.9);

    if (type === 'jogger') {
      baseGoal = tdee + 100; pGoal = Math.round(w * 1.8); cGoal = Math.round(w * 4.5); fGoal = Math.round(w * 0.9);
    } else if (type === 'marathon') {
      baseGoal = tdee + 400; pGoal = Math.round(w * 1.8); cGoal = Math.round(w * 6.0); fGoal = Math.round(w * 1.0);
    } else if (type === 'steps') {
      baseGoal = Math.max(1200, tdee - 250); pGoal = Math.round(w * 2.0); cGoal = Math.round(w * 3.2); fGoal = Math.round(w * 0.8);
    } else if (type === 'bulk') {
      baseGoal = tdee + 250; pGoal = Math.round(w * 2.2); cGoal = Math.round(w * 4.0); fGoal = Math.round(w * 1.0);
    } else if (type === 'cut') {
      baseGoal = Math.max(1200, tdee - 450); pGoal = Math.round(w * 2.4); cGoal = Math.round(w * 2.0); fGoal = Math.round(w * 0.8);
    } else if (type === 'recomp') {
      baseGoal = tdee; pGoal = Math.round(w * 2.2); cGoal = Math.round(w * 3.0); fGoal = Math.round(w * 0.9);
    } else if (type === 'dirty') {
      baseGoal = tdee + 600; pGoal = Math.round(w * 2.0); cGoal = Math.round(w * 5.0); fGoal = Math.round(w * 1.2);
    }

    saveToCloud({ ...appData, activeGoalType: type, baseGoal, pGoal, cGoal, fGoal });
  };

  const saveUserProfile = () => {
    const w = parseFloat(profWeight) || 60;
    const h = parseFloat(profHeight) || 160;
    const act = parseFloat(profActivity) || 1.55;

    let bmr = (10 * w) + (6.25 * h) - (5 * 25) + 5;
    let tdee = Math.round(bmr * act);

    saveToCloud({
      ...appData,
      userName: profName || 'Athlete',
      userTitle: profTitle || 'Fitness Enthusiast',
      height: h,
      weight: w,
      activityLevel: act,
      baseGoal: tdee
    });
    alert('Profile updated & synced to Cloud!');
    setActiveTab('home');
  };

  if (loading) {
    return (
      <div className="mobile-frame" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontWeight: 800, color: 'var(--primary)' }}>Loading NutriPulse...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mobile-frame" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div className="card" style={{ maxWidth: '360px', width: '100%', padding: '24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--primary)', letterSpacing: '0.5px' }}>NUTRIPULSE</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {authMode === 'login' ? 'Log in to sync your fitness data' : 'Create an account to start tracking'}
            </p>
          </div>

          {errorMessage && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '12px', padding: '10px 12px', fontSize: '11px', fontWeight: 700, marginBottom: '14px', textAlign: 'center' }}>
              <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '6px' }}></i>
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleEmailAuth}>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700 }}>Email Address</label>
              <input type="email" className="form-input" placeholder="athlete@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700 }}>Password</label>
              <input type="password" className="form-input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
            </div>

            <button type="submit" className="btn-block" style={{ height: '44px', fontSize: '13px' }}>
              {authMode === 'login' ? 'Log In with Email' : 'Sign Up with Email'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', margin: '18px 0', gap: '8px' }}>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700 }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
          </div>

          <button onClick={handleGoogleSignIn} className="btn-block" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', height: '44px', fontSize: '12px', background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1' }}>
            <i className="fa-brands fa-google" style={{ color: '#ea4335', fontSize: '15px' }}></i>
            Sign in with Google (Optional)
          </button>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button onClick={() => { setErrorMessage(''); setAuthMode(authMode === 'login' ? 'signup' : 'login'); }} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
              {authMode === 'login' ? 'No account yet? Sign up here' : 'Already have an account? Log in'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (onboardStep === 1) {
    return (
      <div className="mobile-frame" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div className="card" style={{ maxWidth: '360px', width: '100%', padding: '24px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '12px' }}>Health & Safety Notice</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '20px' }}>
            This app is designed for informational and fitness tracking purposes only. It does <strong>not</strong> provide medical advice, diagnosis, or treatment. Always consult a physician before starting any diet or exercise program.
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
      <div className="mobile-frame" style={{ padding: '20px', overflowY: 'auto' }}>
        <div className="card" style={{ maxWidth: '360px', margin: '0 auto', padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, textAlign: 'center', marginBottom: '6px' }}>Setup Your Fitness Profile</h3>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '16px' }}>Customize your physical metrics for accurate calorie calculation.</p>

          <label style={{ fontSize: '11px', fontWeight: 700 }}>Your Name</label>
          <input type="text" className="form-input" placeholder="e.g. Edison" value={setupName} onChange={e => setSetupName(e.target.value)} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700 }}>Height (cm)</label>
              <input type="number" className="form-input" value={setupHeight} onChange={e => setSetupHeight(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700 }}>Weight (kg)</label>
              <input type="number" className="form-input" value={setupWeight} onChange={e => setSetupWeight(e.target.value)} />
            </div>
          </div>

          <label style={{ fontSize: '11px', fontWeight: 700 }}>Activity Level</label>
          <select className="form-select" value={setupActivity} onChange={e => setSetupActivity(e.target.value)}>
            <option value="1.2">Sedentary (Little or no exercise)</option>
            <option value="1.375">Light Jogger / Active Walker (1-3 days/week)</option>
            <option value="1.55">Regular Runner / Gym Goer (3-5 days/week)</option>
            <option value="1.725">Marathon Runner / Heavy Lifter (6-7 days/week)</option>
          </select>

          <label style={{ fontSize: '11px', fontWeight: 700 }}>Primary Objective</label>
          <select className="form-select" value={setupGoalType} onChange={e => setSetupGoalType(e.target.value)}>
            <option value="jogger">Daily Jogger / Casual Runner</option>
            <option value="marathon">Endurance & Marathon Prep</option>
            <option value="steps">Daily 10k Steps / Fat Loss</option>
            <option value="bulk">Lean Bulk (Clean Muscle Gain)</option>
            <option value="cut">Aggressive Cut (Fast Fat Loss)</option>
            <option value="recomp">Body Recomposition</option>
            <option value="dirty">Heavy Mass Gain</option>
          </select>

          <button className="btn-block" onClick={completeOnboarding} style={{ marginTop: '10px' }}>
            Save & Continue to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!appData) return null;

  let totalCal = 0, totalP = 0, totalC = 0, totalF = 0;
  (appData.meals || []).forEach(m => {
    totalCal += m.cal; totalP += m.p; totalC += m.c; totalF += m.f;
  });

  const activeGoal = appData.dayMode === 'workout' ? (appData.baseGoal || 2200) + 200 : (appData.baseGoal || 2200);
  const pct = Math.min(Math.round((totalCal / activeGoal) * 100), 100);
  const strokeOffset = 283 - (283 * (pct / 100));

  const baseWaterMl = (appData.weight || 60) * 30;
  let bonusWaterMl = 250;
  if (appData.activeGoalType === 'marathon') bonusWaterMl = 500;
  else if (appData.activeGoalType === 'bulk' || appData.activeGoalType === 'dirty') bonusWaterMl = 400;

  const calculatedWater = baseWaterMl + bonusWaterMl;
  const targetWaterMl = Math.max(1500, Math.min(calculatedWater, 2500));
  const targetWaterLiters = (targetWaterMl / 1000).toFixed(1);
  const waterLiters = ((appData.waterMl || 0) / 1000).toFixed(1);

  const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const todayKey = dayNames[new Date().getDay()];

  const goalTitles = {
    'jogger': 'Daily Jogger',
    'marathon': 'Endurance & Marathon',
    'steps': 'Daily 10k Steps',
    'bulk': 'Lean Bulk',
    'cut': 'Aggressive Cut',
    'recomp': 'Body Recomposition',
    'dirty': 'Heavy Mass Gain',
    'maint': 'Maintenance'
  };

  const heightM = (appData.height || 160) / 100;
  const currentWeight = appData.weight || 60;
  const bmiScore = (currentWeight / (heightM * heightM)).toFixed(1);

  let bmiCategory = 'Healthy Weight';
  let bmiColor = '#10b981';
  let bmiBarPct = 50;

  if (bmiScore < 18.5) {
    bmiCategory = 'Underweight';
    bmiColor = '#3b82f6';
    bmiBarPct = 20;
  } else if (bmiScore >= 18.5 && bmiScore <= 24.9) {
    bmiCategory = 'Healthy Weight';
    bmiColor = '#10b981';
    bmiBarPct = 50;
  } else if (bmiScore >= 25 && bmiScore <= 29.9) {
    bmiCategory = 'Overweight';
    bmiColor = '#f59e0b';
    bmiBarPct = 75;
  } else {
    bmiCategory = 'Obese Range';
    bmiColor = '#ef4444';
    bmiBarPct = 95;
  }

  const dailyDeficitOrSurplus = activeGoal - (appData.baseGoal || 2000);
  const weeklyKgPace = ((dailyDeficitOrSurplus * 7) / 7700).toFixed(2);
  const monthWeightProjected = (currentWeight + parseFloat(weeklyKgPace) * 4.3).toFixed(1);

  const weightChange = (appData.prevWeight) ? (currentWeight - appData.prevWeight).toFixed(1) : 0;

  const myPosts = posts.filter(p => p.userId === user.uid);

  return (
    <div className="mobile-frame">
      <div className="screen-container">
        {activeTab === 'home' && (
          <div className="screen active">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>NutriPulse Dashboard</span>
                <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Welcome, {appData.userName}!</h2>
              </div>
              <div className="streak-badge"><i className="fa-solid fa-fire"></i> <span>{appData.streakDays || 1}</span> Day Streak</div>
            </div>

            <div className="motivation-card" onClick={shuffleQuote}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', opacity: 0.7, fontWeight: 800 }}>Daily Motivation</span>
                <i className="fa-solid fa-rotate" style={{ fontSize: '12px', opacity: 0.6 }}></i>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700 }}>"{quote}"</div>
            </div>

            <div className="fasting-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div>
                  <span style={{ fontSize: '11px', opacity: 0.7, textTransform: 'uppercase', fontWeight: 800 }}>Intermittent Fasting</span>
                  <div style={{ fontSize: '13px', fontWeight: 800 }}>{clockTitle}</div>
                </div>
                <select 
                  style={{ background: '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '8px', padding: '4px 8px', fontSize: '11px', fontWeight: 700 }}
                  value={appData.fastingPlan || 16}
                  onChange={e => saveToCloud({ ...appData, fastingPlan: parseInt(e.target.value) || 16 })}
                >
                  <option value="16">16:8 Fast</option>
                  <option value="18">18:6 Fast</option>
                  <option value="20">20:4 Fast</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="fasting-timer-display">{clockText}</div>
                  <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '2px' }}>{clockSubtext}</div>
                </div>
                <button className={"btn-fast " + (appData.fastingActive ? "btn-fast-stop" : "btn-fast-start")} onClick={toggleFast}>
                  {appData.fastingActive ? 'End Fast' : 'Start Fast'}
                </button>
              </div>
            </div>

            <div className="mode-toggle">
              <button className={"mode-btn " + (appData.dayMode === 'rest' ? 'active' : '')} onClick={() => setDayMode('rest')}>Rest Day</button>
              <button className={"mode-btn " + (appData.dayMode === 'workout' ? 'active' : '')} onClick={() => setDayMode('workout')}>Active Day</button>
            </div>

            <div className="card">
              <div style={{ fontSize: '14px', fontWeight: 800, marginBottom: '10px' }}>Today Overview</div>
              <div className="overview-grid">
                <div className="ring-box">
                  <svg viewBox="0 0 100 100">
                    <circle className="ring-bg" cx="50" cy="50" r="45"></circle>
                    <circle className="ring-progress" cx="50" cy="50" r="45" style={{ strokeDashoffset: strokeOffset }}></circle>
                  </svg>
                  <div className="ring-text"><span>{pct}%</span></div>
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Calories Target</p>
                  <h3 style={{ fontSize: '22px', fontWeight: 800 }}><span>{totalCal}</span> / <span>{activeGoal}</span> kcal</h3>
                </div>
              </div>

              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700 }}><span>Protein</span><span>{totalP} / {appData.pGoal}g</span></div>
                <div className="macro-bar-bg"><div className="macro-bar-fill" style={{ background: 'var(--protein)', width: Math.min((totalP / appData.pGoal) * 100, 100) + '%' }}></div></div>
              </div>
              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700 }}><span>Carbs</span><span>{totalC} / {appData.cGoal}g</span></div>
                <div className="macro-bar-bg"><div className="macro-bar-fill" style={{ background: 'var(--carbs)', width: Math.min((totalC / appData.cGoal) * 100, 100) + '%' }}></div></div>
              </div>
              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700 }}><span>Fats</span><span>{totalF} / {appData.fGoal}g</span></div>
                <div className="macro-bar-bg"><div className="macro-bar-fill" style={{ background: 'var(--fats)', width: Math.min((totalF / (appData.fGoal || 70)) * 100, 100) + '%' }}></div></div>
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize: '14px', fontWeight: 800, marginBottom: '10px' }}>Hydration Goal</div>
              <div className="water-box">
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--water)' }}><i className="fa-solid fa-glass-water"></i> Safe Daily Target</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, marginTop: '2px' }}><span>{waterLiters}</span> / {targetWaterLiters} L</div>
                </div>
                <button className="btn-water" onClick={addWater}>+ 250ml</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'diary' && (
          <div className="screen active">
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '14px' }}>Food Diary & Logger</h3>

            <div className="diary-summary" style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', padding: '12px 0', background: '#f1f5f9', borderRadius: '16px', marginBottom: '16px' }}>
              <div><h4>{totalCal}</h4><p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Eaten</p></div>
              <div><h4>{activeGoal}</h4><p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Goal</p></div>
              <div style={{ color: 'var(--success)' }}><h4>{Math.max(0, activeGoal - totalCal)}</h4><p style={{ fontSize: '11px' }}>Left</p></div>
            </div>

            <div className="card">
              <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: '10px' }}>Pinoy Food Presets</div>
              <div className="preset-chip" onClick={() => addPreset('Chicken Adobo (1 serving)', 320, 28, 6, 20)}>
                <div><span>Chicken Adobo</span><br /><small style={{ color: 'var(--text-muted)', fontSize: '10px' }}>320 kcal • P:28g C:6g F:20g</small></div>
                <i className="fa-solid fa-plus" style={{ color: 'var(--primary)' }}></i>
              </div>
              <div className="preset-chip" onClick={() => addPreset('Sinangag Garlic Rice (1 cup)', 220, 4, 42, 5)}>
                <div><span>Sinangag Garlic Rice</span><br /><small style={{ color: 'var(--text-muted)', fontSize: '10px' }}>220 kcal • P:4g C:42g F:5g</small></div>
                <i className="fa-solid fa-plus" style={{ color: 'var(--primary)' }}></i>
              </div>
              <div className="preset-chip" onClick={() => addPreset('Tapsilog Complete Meal', 540, 32, 48, 24)}>
                <div><span>Tapsilog Meal</span><br /><small style={{ color: 'var(--text-muted)', fontSize: '10px' }}>540 kcal • P:32g C:48g F:24g</small></div>
                <i className="fa-solid fa-plus" style={{ color: 'var(--primary)' }}></i>
              </div>
              <div className="preset-chip" onClick={() => addPreset('Saging na Saba (2 pcs - Pre-run fuel)', 180, 2, 45, 0)}>
                <div><span>Saging na Saba (Pre-Run Snack)</span><br /><small style={{ color: 'var(--text-muted)', fontSize: '10px' }}>180 kcal • P:2g C:45g F:0g</small></div>
                <i className="fa-solid fa-plus" style={{ color: 'var(--primary)' }}></i>
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: '10px' }}>Custom Meal Input</div>
              <label style={{ fontSize: '11px', fontWeight: 700 }}>Food Name</label>
              <input type="text" className="form-input" placeholder="e.g. Tuna Canned" value={customName} onChange={e => setCustomName(e.target.value)} />
              
              <label style={{ fontSize: '11px', fontWeight: 700 }}>Calories (kcal)</label>
              <input type="number" className="form-input" placeholder="e.g. 180" value={customCal} onChange={e => setCustomCal(e.target.value)} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                <div><label style={{ fontSize: '10px', fontWeight: 700 }}>Protein (g)</label><input type="number" className="form-input" placeholder="0" value={customP} onChange={e => setCustomP(e.target.value)} /></div>
                <div><label style={{ fontSize: '10px', fontWeight: 700 }}>Carbs (g)</label><input type="number" className="form-input" placeholder="0" value={customC} onChange={e => setCustomC(e.target.value)} /></div>
                <div><label style={{ fontSize: '10px', fontWeight: 700 }}>Fats (g)</label><input type="number" className="form-input" placeholder="0" value={customF} onChange={e => setCustomF(e.target.value)} /></div>
              </div>

              <button className="btn-block" onClick={addCustomMeal}>Add Custom Meal</button>
            </div>

            <div className="card">
              <div style={{ fontSize: '14px', fontWeight: 800, marginBottom: '8px' }}>Today's Logged Meals</div>
              <div>
                {(!appData.meals || appData.meals.length === 0) ? (
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>No meals logged yet today.</p>
                ) : (
                  appData.meals.map(m => (
                    <div key={m.id} className="food-entry">
                      <div>
                        <div>{m.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{m.cal} kcal • P:{m.p}g C:{m.c}g F:{m.f}g</div>
                      </div>
                      <i className="fa-solid fa-trash" style={{ color: 'var(--danger)', cursor: 'pointer' }} onClick={() => deleteMeal(m.id)}></i>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="screen active">
            <h3 style={{ fontSize: '18px', fontWeight: 800, textAlign: 'center', marginBottom: '14px' }}>Biometrics & Analytics</h3>
            
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>BMI Status</span>
                <span style={{ fontSize: '12px', fontWeight: 800, color: bmiColor }}>{bmiCategory} ({bmiScore})</span>
              </div>
              <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                <div style={{ height: '100%', width: bmiBarPct + '%', background: bmiColor, borderRadius: '4px' }}></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 700 }}>
                <span>Underweight</span>
                <span>Normal</span>
                <span>Overweight</span>
                <span>Obese</span>
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: '10px' }}>Body Fat & Weight Projection</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', textAlign: 'center' }}>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700 }}>Est. Fat Loss Rate</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--primary)', marginTop: '2px' }}>{weeklyKgPace} kg/wk</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '12px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700 }}>30-Day Goal Forecast</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--success)', marginTop: '2px' }}>{monthWeightProjected} kg</div>
                </div>
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: '8px' }}>Log New Weight</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="number" className="form-input" style={{ marginBottom: 0 }} placeholder="New Weight (kg)" value={newLogWeight} onChange={e => setNewLogWeight(e.target.value)} />
                <button className="btn-block" style={{ width: '120px' }} onClick={handleUpdateWeight}>Update</button>
              </div>
              {weightChange !== 0 && (
                <div style={{ fontSize: '11px', fontWeight: 700, color: weightChange < 0 ? 'var(--success)' : 'var(--danger)', marginTop: '6px' }}>
                  {weightChange < 0 ? '📉 Decreased by ' + Math.abs(weightChange) + ' kg since last log' : '📈 Increased by ' + weightChange + ' kg since last log'}
                </div>
              )}
            </div>

            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '13px', fontWeight: 800 }}>Weekly Calorie History</div>
                <span style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: 800 }}>Live Logs</span>
              </div>

              <div className="chart-bars">
                {dayNames.map(d => {
                  const dayCal = d === todayKey ? totalCal : (appData.weeklyLogs?.[d] || 0);
                  const heightPct = Math.min(Math.round((dayCal / activeGoal) * 100), 100);
                  const isToday = d === todayKey;
                  return (
                    <div key={d} className="chart-col">
                      <div className="bar-wrapper">
                        <div className={"bar-fill " + (isToday ? "active-day" : "")} style={{ height: heightPct + '%' }}></div>
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'capitalize' }}>{d}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: '10px' }}>Unlocked Badges & Milestones</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ background: '#f1f5f9', padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, color: 'var(--primary)' }}><i className="fa-solid fa-fire"></i> {appData.streakDays || 1}-Day Streak</div>
                <div style={{ background: '#f1f5f9', padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, color: 'var(--water)' }}><i className="fa-solid fa-droplet"></i> Hydration Hero</div>
                <div style={{ background: '#f1f5f9', padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, color: '#8b5cf6' }}><i className="fa-solid fa-clock"></i> Fasting Master</div>
              </div>
            </div>
          </div>
        )}

        {/* MODERN SOCMED COMMUNITY FEED */}
        {activeTab === 'community' && (
          <div className="screen active" style={{ paddingBottom: '70px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a' }}>Community Feed</h3>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Inspire & get inspired by fellow athletes</span>
              </div>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e0e7ff', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                <i className="fa-solid fa-users-viewfinder"></i>
              </div>
            </div>

            {/* CREATE POST CARD */}
            <div className="card" style={{ padding: '16px', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #4f46e5, #818cf8)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '16px' }}>
                  {(appData.userName || 'A').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800 }}>{appData.userName}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Share a transformation or daily win</div>
                </div>
              </div>

              <textarea 
                className="form-input" 
                style={{ height: '70px', borderRadius: '14px', padding: '12px', fontSize: '12px', border: '1px solid #e2e8f0', resize: 'none', marginBottom: '10px' }} 
                placeholder="What's your workout win today?"
                value={postText}
                onChange={e => setPostText(e.target.value)}
              />

              {imagePreview && (
                <div style={{ position: 'relative', marginBottom: '10px' }}>
                  <img src={imagePreview} alt="Preview" style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: '14px' }} />
                  <button 
                    onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                    style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--primary)', cursor: 'pointer', background: '#f0fdf4', padding: '8px 14px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                  <i className="fa-solid fa-image" style={{ fontSize: '14px' }}></i> Add Photo
                  <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                </label>

                <button 
                  onClick={createPost} 
                  style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '12px', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}
                >
                  Publish Post
                </button>
              </div>
            </div>

            {/* POSTS FEED */}
            <div>
              {posts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  <i className="fa-regular fa-newspaper" style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.5 }}></i>
                  <p style={{ fontSize: '12px', fontWeight: 600 }}>No posts yet in the feed.<br />Be the first athlete to share your progress!</p>
                </div>
              ) : (
                posts.map(p => {
                  const isLiked = p.likedBy && p.likedBy.includes(user.uid);
                  return (
                    <div key={p.id} className="card" style={{ padding: '16px', borderRadius: '20px', marginBottom: '14px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#4f46e5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px' }}>
                            {(p.userName || 'A').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>{p.userName}</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{p.userTitle || 'Athlete'} • {new Date(p.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </div>

                      {p.text && <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.5, marginBottom: '10px' }}>{p.text}</p>}

                      {p.imageUrl && (
                        <div style={{ borderRadius: '14px', overflow: 'hidden', marginBottom: '10px', border: '1px solid #f1f5f9' }}>
                          <img src={p.imageUrl} alt="Transformation Post" style={{ width: '100%', maxHeight: '280px', objectFit: 'cover' }} />
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '10px', marginTop: '6px' }}>
                        <button 
                          onClick={() => handleLike(p.id, p.likes || 0, p.likedBy || [])}
                          style={{ 
                            background: isLiked ? '#fef2f2' : '#f8fafc', 
                            border: isLiked ? '1px solid #fecaca' : '1px solid #e2e8f0', 
                            color: isLiked ? '#ef4444' : '#64748b', 
                            borderRadius: '20px', 
                            padding: '6px 14px', 
                            fontSize: '11px', 
                            fontWeight: 800, 
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <i className={isLiked ? "fa-solid fa-heart" : "fa-regular fa-heart"} style={{ fontSize: '13px', color: isLiked ? '#ef4444' : '#64748b' }}></i>
                          {p.likes || 0} Likes
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="screen active">
            <h3 style={{ fontSize: '18px', fontWeight: 800, textAlign: 'center', marginBottom: '14px' }}>Fitness Objectives</h3>
            
            <div className="card" style={{ background: 'linear-gradient(135deg, #4f46e5, #3730a3)', color: 'white', marginBottom: '14px' }}>
              <p style={{ fontSize: '11px', opacity: 0.8 }}>Active Goal Plan</p>
              <h2 style={{ fontSize: '20px', fontWeight: 800 }}>{goalTitles[appData.activeGoalType || 'jogger']}</h2>
              <p style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}><span>{activeGoal}</span> kcal/day</p>
            </div>

            <div className="goal-section-header">Running & Cardio Goals</div>

            <div className={"goal-card-option " + (appData.activeGoalType === 'jogger' ? 'selected' : '')} onClick={() => setGoalPreset('jogger')}>
              <div style={{ fontSize: '13px', fontWeight: 800 }}>Daily Jogger / Casual Runner</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Moderate calories + High carbs fuel for daily 3k-5k runs.</div>
            </div>

            <div className={"goal-card-option " + (appData.activeGoalType === 'marathon' ? 'selected' : '')} onClick={() => setGoalPreset('marathon')}>
              <div style={{ fontSize: '13px', fontWeight: 800 }}>Endurance & Marathon Prep</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>High calorie surplus + Extra high carbs loading.</div>
            </div>

            <div className={"goal-card-option " + (appData.activeGoalType === 'steps' ? 'selected' : '')} onClick={() => setGoalPreset('steps')}>
              <div style={{ fontSize: '13px', fontWeight: 800 }}>Daily 10k Steps / Active Walker</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Slight deficit for steady fat loss through everyday walking.</div>
            </div>

            <div className="goal-section-header">Gym & Weightlifting Goals</div>

            <div className={"goal-card-option " + (appData.activeGoalType === 'bulk' ? 'selected' : '')} onClick={() => setGoalPreset('bulk')}>
              <div style={{ fontSize: '13px', fontWeight: 800 }}>Lean Bulk (Clean Muscle)</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Slight surplus for muscle growth with minimal fat.</div>
            </div>

            <div className={"goal-card-option " + (appData.activeGoalType === 'cut' ? 'selected' : '')} onClick={() => setGoalPreset('cut')}>
              <div style={{ fontSize: '13px', fontWeight: 800 }}>Aggressive Cut (Fast Fat Loss)</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>High deficit + High Protein to preserve muscle.</div>
            </div>

            <div className={"goal-card-option " + (appData.activeGoalType === 'recomp' ? 'selected' : '')} onClick={() => setGoalPreset('recomp')}>
              <div style={{ fontSize: '13px', fontWeight: 800 }}>Body Recomposition</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Build muscle & lose fat simultaneously.</div>
            </div>

            <div className={"goal-card-option " + (appData.activeGoalType === 'dirty' ? 'selected' : '')} onClick={() => setGoalPreset('dirty')}>
              <div style={{ fontSize: '13px', fontWeight: 800 }}>Heavy Mass Gain (Hardgainer)</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>High calorie + High carbs for rapid weight gain.</div>
            </div>
          </div>
        )}

        {/* MODERN SOCMED PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="screen active" style={{ paddingBottom: '70px' }}>
            {/* PROFILE HEADER / BANNER */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: '24px', marginBottom: '16px' }}>
              <div style={{ height: '90px', background: 'linear-gradient(135deg, #4f46e5, #818cf8)' }}></div>
              <div style={{ padding: '0 16px 16px 16px', marginTop: '-40px', textAlign: 'center' }}>
                <div style={{ width: '76px', height: '76px', borderRadius: '50%', background: '#ffffff', padding: '4px', margin: '0 auto 8px auto', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                  <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#4f46e5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 900 }}>
                    {(appData.userName || 'A').charAt(0).toUpperCase()}
                  </div>
                </div>

                <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>{appData.userName}</h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>{appData.userTitle || 'Fitness Enthusiast'}</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', background: '#f8fafc', padding: '12px', borderRadius: '16px', marginTop: '14px' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 900, color: 'var(--primary)' }}>{myPosts.length}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700 }}>Posts</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 900, color: '#f59e0b' }}>{appData.streakDays || 1}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700 }}>Streak</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 900, color: 'var(--success)' }}>{appData.weight} kg</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700 }}>Weight</div>
                  </div>
                </div>
              </div>
            </div>

            {/* MY POSTS ARCHIVE GALLERY */}
            <div className="card" style={{ padding: '16px', borderRadius: '20px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>My Posts & Transformation Gallery</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => setProfileViewMode('grid')} style={{ background: profileViewMode === 'grid' ? '#e0e7ff' : '#f1f5f9', border: 'none', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', color: profileViewMode === 'grid' ? 'var(--primary)' : '#64748b' }}>
                    <i className="fa-solid fa-border-all"></i>
                  </button>
                  <button onClick={() => setProfileViewMode('list')} style={{ background: profileViewMode === 'list' ? '#e0e7ff' : '#f1f5f9', border: 'none', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', color: profileViewMode === 'list' ? 'var(--primary)' : '#64748b' }}>
                    <i className="fa-solid fa-list"></i>
                  </button>
                </div>
              </div>

              {myPosts.length === 0 ? (
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>You haven't posted anything to the community yet.</p>
              ) : profileViewMode === 'grid' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                  {myPosts.map(p => (
                    <div key={p.id} style={{ position: 'relative', aspectRatio: '1/1', borderRadius: '10px', overflow: 'hidden', background: '#f1f5f9' }}>
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt="Post" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', padding: '6px', fontSize: '9px', fontWeight: 700, color: '#475569', overflow: 'hidden' }}>
                          {p.text}
                        </div>
                      )}
                      <button 
                        onClick={() => handleDeletePost(p.id)} 
                        style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(239, 68, 68, 0.8)', color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '9px', cursor: 'pointer' }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                myPosts.map(p => (
                  <div key={p.id} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>{p.text}</p>
                      <button onClick={() => handleDeletePost(p.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '12px', cursor: 'pointer' }}>
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                    {p.imageUrl && <img src={p.imageUrl} alt="Post" style={{ width: '100%', maxHeight: '140px', objectFit: 'cover', borderRadius: '10px', marginTop: '6px' }} />}
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>❤️ {p.likes || 0} Likes</div>
                  </div>
                ))
              )}
            </div>

            {/* SETTINGS CARD */}
            <div className="card" style={{ padding: '16px', borderRadius: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: 800, marginBottom: '12px' }}>User Profile & Physical Metrics</div>
              
              <label style={{ fontSize: '11px', fontWeight: 700 }}>Your Name</label>
              <input type="text" className="form-input" value={profName} onChange={e => setProfName(e.target.value)} />

              <label style={{ fontSize: '11px', fontWeight: 700 }}>Bio / Title</label>
              <input type="text" className="form-input" value={profTitle} onChange={e => setProfTitle(e.target.value)} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div><label style={{ fontSize: '11px', fontWeight: 700 }}>Height (cm)</label><input type="number" className="form-input" value={profHeight} onChange={e => setProfHeight(e.target.value)} /></div>
                <div><label style={{ fontSize: '11px', fontWeight: 700 }}>Weight (kg)</label><input type="number" className="form-input" value={profWeight} onChange={e => setProfWeight(e.target.value)} /></div>
              </div>

              <label style={{ fontSize: '11px', fontWeight: 700 }}>Activity Level (For TDEE Auto-Calc)</label>
              <select className="form-select" value={profActivity} onChange={e => setProfActivity(e.target.value)}>
                <option value="1.2">Sedentary (Little or no exercise)</option>
                <option value="1.375">Light Jogger / Active Walker (1-3 days/week)</option>
                <option value="1.55">Regular Runner / Gym Goer (3-5 days/week)</option>
                <option value="1.725">Marathon Runner / Heavy Lifter (6-7 days/week)</option>
              </select>

              <button className="btn-block" onClick={saveUserProfile} style={{ marginBottom: '10px' }}>
                Auto-Calculate & Save Profile
              </button>

              <button className="btn-block" onClick={handleLogout} style={{ background: 'var(--danger)' }}>
                Sign Out Account
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bottom-nav">
        <div className={"nav-item " + (activeTab === 'home' ? 'active' : '')} onClick={() => setActiveTab('home')}><i className="fa-solid fa-house"></i><span>Home</span></div>
        <div className={"nav-item " + (activeTab === 'diary' ? 'active' : '')} onClick={() => setActiveTab('diary')}><i className="fa-regular fa-calendar-check"></i><span>Diary</span></div>
        <div className={"nav-item " + (activeTab === 'progress' ? 'active' : '')} onClick={() => setActiveTab('progress')}><i className="fa-solid fa-chart-simple"></i><span>Progress</span></div>
        <div className={"nav-item " + (activeTab === 'community' ? 'active' : '')} onClick={() => setActiveTab('community')}><i className="fa-solid fa-users"></i><span>Social</span></div>
        <div className={"nav-item " + (activeTab === 'goals' ? 'active' : '')} onClick={() => setActiveTab('goals')}><i className="fa-solid fa-bullseye"></i><span>Goals</span></div>
        <div className={"nav-item " + (activeTab === 'profile' ? 'active' : '')} onClick={() => setActiveTab('profile')}><i className="fa-regular fa-user"></i><span>Profile</span></div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/App.jsx', code);
console.log('Social Media Style design applied to Community and Profile tabs!');
