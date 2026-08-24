const fs = require('fs');

const code = `import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc 
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
  "You do not have to be extreme, just consistent.",
  "Champions train when no one is watching.",
  "Fuel your body, empower your mind, conquer your day.",
  "Run when you can, walk if you have to, crawl if you must; just never give up.",
  "Discipline is choosing between what you want now and what you want most.",
  "Your body can stand almost anything. It is your mind that you have to convince."
];

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [appData, setAppData] = useState({
    userName: 'Athlete',
    userTitle: 'Fitness Enthusiast',
    height: 161,
    weight: 60.2,
    activityLevel: 1.55,
    dayMode: 'workout',
    streakDays: 1,
    lastLogDate: '',
    activeGoalType: 'jogger',
    baseGoal: 2200, goal: 2200, pGoal: 120, cGoal: 300, fGoal: 60, waterMl: 0,
    fastingPlan: 16,
    fastingActive: false,
    fastStartTime: null,
    disclaimerAccepted: false,
    notifiedComplete: false,
    weeklyLogs: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 },
    meals: []
  });

  const [activeTab, setActiveTab] = useState('home');
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setAppData(data);
          setProfName(data.userName || currentUser.displayName || 'Athlete');
          setProfTitle(data.userTitle || 'Fitness Enthusiast');
          setProfHeight(data.height || 160);
          setProfWeight(data.weight || 60);
          setProfActivity(data.activityLevel || 1.55);
        } else {
          const initialData = {
            userName: currentUser.displayName || 'Athlete',
            userTitle: 'Fitness Enthusiast',
            height: 161,
            weight: 60.2,
            activityLevel: 1.55,
            dayMode: 'workout',
            streakDays: 1,
            lastLogDate: '',
            activeGoalType: 'jogger',
            baseGoal: 2200, goal: 2200, pGoal: 120, cGoal: 300, fGoal: 60, waterMl: 0,
            fastingPlan: 16,
            fastingActive: false,
            fastStartTime: null,
            disclaimerAccepted: false,
            notifiedComplete: false,
            weeklyLogs: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 },
            meals: []
          };
          await setDoc(userDocRef, initialData);
          setAppData(initialData);
          setProfName(initialData.userName);
          setProfTitle(initialData.userTitle);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
        setClockTitle('Fast Complete!');
        setClockSubtext('Goal reached! You can now eat.');

        if (!appData.notifiedComplete) {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Cal Tracker', {
              body: 'Fast Complete! Nakarating ka na sa target fasting window mo. Pwede ka nang kumain!'
            });
          }
          saveToCloud({ ...appData, notifiedComplete: true });
        }
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

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      alert("Sign in failed: " + error.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setActiveTab('home');
  };

  if (loading) {
    return (
      <div className="mobile-frame" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontWeight: 800, color: 'var(--primary)' }}>Loading Cal Tracker Cloud...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mobile-frame" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div className="card" style={{ maxWidth: '360px', width: '100%', padding: '28px', textAlign: 'center' }}>
          <div style={{ fontSize: '42px', marginBottom: '8px' }}>🔥</div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>CAL TRACKER</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px' }}>
            Track calories, macro goals, and intermittent fasting synced across all your devices.
          </p>

          <button 
            onClick={handleGoogleSignIn} 
            className="btn-block" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '10px', 
              height: '48px', 
              fontSize: '13px', 
              background: '#ffffff', 
              color: '#0f172a', 
              border: '2px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}
          >
            <i className="fa-brands fa-google" style={{ color: '#ea4335', fontSize: '16px' }}></i>
            Sign in with Google
          </button>

          <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '20px' }}>
            🔒 Powered by Google Cloud Firebase. Your fitness data is safe and private.
          </p>
        </div>
      </div>
    );
  }

  const shuffleQuote = () => {
    const randomIndex = Math.floor(Math.random() * FITNESS_QUOTES.length);
    setQuote(FITNESS_QUOTES[randomIndex]);
  };

  const setDayMode = (mode) => {
    saveToCloud({ ...appData, dayMode: mode });
  };

  const addWater = () => {
    saveToCloud({ ...appData, waterMl: (appData.waterMl || 0) + 250 });
  };

  const toggleFast = () => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
    if (!appData.fastingActive) {
      saveToCloud({ ...appData, fastingActive: true, fastStartTime: Date.now(), notifiedComplete: false });
    } else {
      saveToCloud({ ...appData, fastingActive: false, fastStartTime: null, notifiedComplete: false });
    }
  };

  const addPreset = (name, cal, p, c, f) => {
    logMealEntry({ name, cal, p, c, f, id: Date.now() });
    setActiveTab('diary');
  };

  const addCustomMeal = () => {
    const cal = parseInt(customCal) || 0;
    if (!customName || cal <= 0) return alert('Lagyan ng name at calories!');

    logMealEntry({
      name: customName,
      cal,
      p: parseInt(customP) || 0,
      c: parseInt(customC) || 0,
      f: parseInt(customF) || 0,
      id: Date.now()
    });

    setCustomName('');
    setCustomCal('');
    setCustomP('');
    setCustomC('');
    setCustomF('');
    setActiveTab('diary');
  };

  const logMealEntry = (mealObj) => {
    const todayStr = new Date().toDateString();
    let streak = appData.streakDays || 1;
    if (appData.lastLogDate !== todayStr) {
      streak += 1;
    }
    saveToCloud({
      ...appData,
      meals: [mealObj, ...appData.meals],
      streakDays: streak,
      lastLogDate: todayStr
    });
  };

  const deleteMeal = (id) => {
    saveToCloud({
      ...appData,
      meals: appData.meals.filter(m => m.id !== id)
    });
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
      baseGoal = tdee + 100;
      pGoal = Math.round(w * 1.8);
      cGoal = Math.round(w * 4.5);
      fGoal = Math.round(w * 0.9);
    } else if (type === 'marathon') {
      baseGoal = tdee + 400;
      pGoal = Math.round(w * 1.8);
      cGoal = Math.round(w * 6.0);
      fGoal = Math.round(w * 1.0);
    } else if (type === 'steps') {
      baseGoal = Math.max(1200, tdee - 250);
      pGoal = Math.round(w * 2.0);
      cGoal = Math.round(w * 3.2);
      fGoal = Math.round(w * 0.8);
    } else if (type === 'bulk') {
      baseGoal = tdee + 250;
      pGoal = Math.round(w * 2.2);
      cGoal = Math.round(w * 4.0);
      fGoal = Math.round(w * 1.0);
    } else if (type === 'cut') {
      baseGoal = Math.max(1200, tdee - 450);
      pGoal = Math.round(w * 2.4);
      cGoal = Math.round(w * 2.0);
      fGoal = Math.round(w * 0.8);
    } else if (type === 'recomp') {
      baseGoal = tdee;
      pGoal = Math.round(w * 2.2);
      cGoal = Math.round(w * 3.0);
      fGoal = Math.round(w * 0.9);
    } else if (type === 'dirty') {
      baseGoal = tdee + 600;
      pGoal = Math.round(w * 2.0);
      cGoal = Math.round(w * 5.0);
      fGoal = Math.round(w * 1.2);
    }

    saveToCloud({
      ...appData,
      activeGoalType: type,
      baseGoal,
      pGoal,
      cGoal,
      fGoal
    });
  };

  const saveUserProfile = () => {
    saveToCloud({
      ...appData,
      userName: profName || 'Athlete',
      userTitle: profTitle || 'Fitness Enthusiast',
      height: parseFloat(profHeight) || 160,
      weight: parseFloat(profWeight) || 60,
      activityLevel: profActivity
    });
    alert('Profile updated to Cloud!');
    setActiveTab('home');
  };

  let totalCal = 0, totalP = 0, totalC = 0, totalF = 0;
  appData.meals.forEach(m => {
    totalCal += m.cal;
    totalP += m.p;
    totalC += m.c;
    totalF += m.f;
  });

  const activeGoal = appData.dayMode === 'workout' ? (appData.baseGoal || 2200) + 200 : (appData.baseGoal || 2200);
  const pct = Math.min(Math.round((totalCal / activeGoal) * 100), 100);
  const strokeOffset = 283 - (283 * (pct / 100));
  const waterLiters = ((appData.waterMl || 0) / 1000).toFixed(1);

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

  const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const todayKey = dayNames[new Date().getDay()];

  return (
    <div className="mobile-frame">
      {!appData.disclaimerAccepted && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div style={{ fontSize: '28px', textAlign: 'center', marginBottom: '8px' }}>⚠️</div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, textAlign: 'center', marginBottom: '10px' }}>Health & Safety Notice</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '16px', textAlign: 'center' }}>
              This app is designed for informational and fitness tracking purposes only. It does <strong>not</strong> provide medical advice, diagnosis, or treatment. Always consult a physician before starting any diet, intermittent fasting, or exercise program.
            </p>
            <button className="btn-block" onClick={() => saveToCloud({ ...appData, disclaimerAccepted: true })}>
              I Understand & Agree
            </button>
          </div>
        </div>
      )}

      <div className="screen-container">
        {activeTab === 'home' && (
          <div className="screen active">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fitness Dashboard</span>
                <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Welcome, {appData.userName}!</h2>
              </div>
              <div className="streak-badge"><i className="fa-solid fa-fire"></i> <span>{appData.streakDays || 1}</span> Day Streak</div>
            </div>

            <div className="motivation-card" onClick={shuffleQuote}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', opacity: 0.7, fontWeight: 800, letterSpacing: '0.5px' }}>Daily Motivation</span>
                <i className="fa-solid fa-rotate" style={{ fontSize: '12px', opacity: 0.6 }}></i>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, lineHeight: 1.4 }}>"{quote}"</div>
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
                  <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--water)' }}><i className="fa-solid fa-glass-water"></i> Water Intake</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, marginTop: '2px' }}><span>{waterLiters}</span> / 2.5 L</div>
                </div>
                <button className="btn-water" onClick={addWater}>+ 250ml</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'diary' && (
          <div className="screen active">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Today's Log</h3>
              <button style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--primary)', color: 'white', border: 'none' }} onClick={() => setActiveTab('add')}><i className="fa-solid fa-plus"></i></button>
            </div>

            <div className="diary-summary" style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', padding: '12px 0', background: '#f1f5f9', borderRadius: '16px', marginBottom: '16px' }}>
              <div><h4>{totalCal}</h4><p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Eaten</p></div>
              <div><h4>{activeGoal}</h4><p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Goal</p></div>
              <div style={{ color: 'var(--success)' }}><h4>{Math.max(0, activeGoal - totalCal)}</h4><p style={{ fontSize: '11px' }}>Left</p></div>
            </div>

            <div className="card">
              <div style={{ fontSize: '14px', fontWeight: 800, marginBottom: '8px' }}>Logged Meals (Latest First)</div>
              <div>
                {appData.meals.length === 0 ? (
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

        {activeTab === 'add' && (
          <div className="screen active">
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '14px' }}>Add Food</h3>

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
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="screen active">
            <h3 style={{ fontSize: '18px', fontWeight: 800, textAlign: 'center', marginBottom: '14px' }}>Weekly Progress</h3>

            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '13px', fontWeight: 800 }}>Calories Intake (This Week)</div>
                <span style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: 800 }}>Live Tracker</span>
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
              <div className="stat-row"><span>Today's Total</span><span style={{ color: 'var(--primary)' }}>{totalCal} kcal</span></div>
              <div className="stat-row"><span>Weight</span><span>{appData.weight} kg</span></div>
              <div className="stat-row"><span>Height</span><span>{appData.height} cm</span></div>
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
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Moderate calories + High carbs fuel for daily 3k-5k runs & fat burning.</div>
            </div>

            <div className={"goal-card-option " + (appData.activeGoalType === 'marathon' ? 'selected' : '')} onClick={() => setGoalPreset('marathon')}>
              <div style={{ fontSize: '13px', fontWeight: 800 }}>Endurance & Long Distance Running</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>High calorie surplus + Extra high carbs loading for 10k/21k marathon prep.</div>
            </div>

            <div className={"goal-card-option " + (appData.activeGoalType === 'steps' ? 'selected' : '')} onClick={() => setGoalPreset('steps')}>
              <div style={{ fontSize: '13px', fontWeight: 800 }}>Daily 10k Steps / Active Walker</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Slight deficit for steady fat loss through everyday active walking.</div>
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

            <div className={"goal-card-option " + (appData.activeGoalType === 'maint' ? 'selected' : '')} onClick={() => setGoalPreset('maint')}>
              <div style={{ fontSize: '13px', fontWeight: 800 }}>Weight Maintenance</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Balanced calories to stay fit and healthy.</div>
            </div>

            <div className="card" style={{ marginTop: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: '800', marginBottom: '8px' }}>Calculated Target Breakdown:</div>
              <div className="stat-row"><span>Calories</span><span>{activeGoal} kcal</span></div>
              <div className="stat-row"><span>Protein Target</span><span>{appData.pGoal} g</span></div>
              <div className="stat-row"><span>Carbs Target</span><span>{appData.cGoal} g</span></div>
              <div className="stat-row"><span>Fats Target</span><span>{appData.fGoal} g</span></div>
            </div>

            <div className="disclaimer-card">
              <strong>Health Disclaimer:</strong> Calorie and macronutrient goals are informational estimates only and do not replace professional medical advice. Consult a healthcare provider before attempting aggressive calorie deficits or new fitness regimens.
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="screen active">
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              {user.photoURL ? (
                <img src={user.photoURL} alt="Profile" style={{ width: '70px', height: '70px', borderRadius: '50%', margin: '0 auto 8px auto' }} />
              ) : (
                <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'var(--primary)', margin: '0 auto 8px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '28px' }}><i className="fa-solid fa-user"></i></div>
              )}
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>{appData.userName}</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user.email}</p>
            </div>

            <div className="card">
              <div style={{ fontSize: '14px', fontWeight: 800, marginBottom: '12px' }}>User & Activity Profile</div>

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

            <div className="disclaimer-card">
              <strong>Cloud Account Active:</strong> Your food logs and goals automatically sync to Firebase Cloud whenever you make changes.
            </div>
          </div>
        )}

      </div>

      <div className="bottom-nav">
        <div className={"nav-item " + (activeTab === 'home' ? 'active' : '')} onClick={() => setActiveTab('home')}><i className="fa-solid fa-house"></i><span>Home</span></div>
        <div className={"nav-item " + (activeTab === 'diary' ? 'active' : '')} onClick={() => setActiveTab('diary')}><i className="fa-regular fa-calendar-check"></i><span>Diary</span></div>
        <div className={"nav-item " + (activeTab === 'add' ? 'active' : '')} onClick={() => setActiveTab('add')}><i className="fa-solid fa-plus-circle"></i><span>Add</span></div>
        <div className={"nav-item " + (activeTab === 'progress' ? 'active' : '')} onClick={() => setActiveTab('progress')}><i className="fa-solid fa-chart-simple"></i><span>Progress</span></div>
        <div className={"nav-item " + (activeTab === 'goals' ? 'active' : '')} onClick={() => setActiveTab('goals')}><i className="fa-solid fa-bullseye"></i><span>Goals</span></div>
        <div className={"nav-item " + (activeTab === 'profile' ? 'active' : '')} onClick={() => setActiveTab('profile')}><i className="fa-regular fa-user"></i><span>Profile</span></div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/App.jsx', code);
console.log('App.jsx successfully integrated with Firebase!');
