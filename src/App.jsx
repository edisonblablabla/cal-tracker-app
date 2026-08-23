import React, { useState, useEffect } from 'react';

export default function App() {
  const [appData, setAppData] = useState(() => {
    const saved = localStorage.getItem('calTrackerData');
    return saved ? JSON.parse(saved) : {
      userName: 'Jowel',
      userTitle: 'Gymrat • Developer',
      height: 161,
      weight: 60.2,
      activityLevel: 1.55,
      dayMode: 'workout',
      streakDays: 1,
      lastLogDate: '',
      activeGoalType: 'bulk',
      baseGoal: 2200, goal: 2200, pGoal: 150, cGoal: 250, fGoal: 70, waterMl: 0,
      weeklyLogs: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 },
      meals: []
    };
  });

  const [activeTab, setActiveTab] = useState('home');
  const [customName, setCustomName] = useState('');
  const [customCal, setCustomCal] = useState('');
  const [customP, setCustomP] = useState('');
  const [customC, setCustomC] = useState('');
  const [customF, setCustomF] = useState('');

  const [profName, setProfName] = useState(appData.userName);
  const [profTitle, setProfTitle] = useState(appData.userTitle);
  const [profHeight, setProfHeight] = useState(appData.height);
  const [profWeight, setProfWeight] = useState(appData.weight);
  const [profActivity, setProfActivity] = useState(appData.activityLevel);

  useEffect(() => {
    localStorage.setItem('calTrackerData', JSON.stringify(appData));
  }, [appData]);

  const setDayMode = (mode) => {
    setAppData(prev => ({ ...prev, dayMode: mode }));
  };

  const addWater = () => {
    setAppData(prev => ({ ...prev, waterMl: (prev.waterMl || 0) + 250 }));
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
    setAppData(prev => {
      let streak = prev.streakDays || 1;
      if (prev.lastLogDate !== todayStr) {
        streak += 1;
      }
      return {
        ...prev,
        meals: [mealObj, ...prev.meals],
        streakDays: streak,
        lastLogDate: todayStr
      };
    });
  };

  const deleteMeal = (id) => {
    setAppData(prev => ({
      ...prev,
      meals: prev.meals.filter(m => m.id !== id)
    }));
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

    if (type === 'bulk') {
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
    } else if (type === 'jogging') {
      baseGoal = tdee + 400;
      pGoal = Math.round(w * 1.8);
      cGoal = Math.round(w * 5.0);
      fGoal = Math.round(w * 1.0);
    } else if (type === 'athlete') {
      baseGoal = tdee + 300;
      pGoal = Math.round(w * 1.8);
      cGoal = Math.round(w * 5.5);
      fGoal = Math.round(w * 0.9);
    }

    setAppData(prev => ({
      ...prev,
      activeGoalType: type,
      baseGoal,
      pGoal,
      cGoal,
      fGoal
    }));
  };

  const saveUserProfile = () => {
    setAppData(prev => ({
      ...prev,
      userName: profName || 'User',
      userTitle: profTitle || 'Gym Enthusiast',
      height: parseFloat(profHeight) || 160,
      weight: parseFloat(profWeight) || 60,
      activityLevel: profActivity
    }));
    alert('Profile updated!');
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
    'bulk': '1. Lean Bulk (Clean Muscle)',
    'cut': '2. Aggressive Cut (Fat Loss)',
    'recomp': '3. Body Recomposition',
    'dirty': '4. Heavy Mass Gain',
    'jogging': '5. Jogging & Cardio Endurance',
    'athlete': '6. Athletic Performance',
    'maint': '7. Weight Maintenance'
  };

  const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const todayKey = dayNames[new Date().getDay()];

  return (
    <div className="mobile-frame">
      <div className="screen-container">
        
        {/* SCREEN 1: HOME */}
        {activeTab === 'home' && (
          <div className="screen active">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '800' }}>Hello, {appData.userName}!</h2>
                <div className="streak-badge"><i className="fa-solid fa-fire"></i> <span>{appData.streakDays || 1}</span> Day Streak</div>
              </div>
              <i className="fa-regular fa-bell" style={{ fontSize: '18px' }}></i>
            </div>

            <div className="mode-toggle">
              <button className={`mode-btn ${appData.dayMode === 'rest' ? 'active' : ''}`} onClick={() => setDayMode('rest')}>Rest Day</button>
              <button className={`mode-btn ${appData.dayMode === 'workout' ? 'active' : ''}`} onClick={() => setDayMode('workout')}>Workout / Active Day</button>
            </div>

            <div className="card">
              <div style={{ fontSize: '14px', fontWeight: '800', marginBottom: '10px' }}>Today Overview</div>
              <div className="overview-grid">
                <div className="ring-box">
                  <svg viewBox="0 0 100 100">
                    <circle className="ring-bg" cx="50" cy="50" r="45"></circle>
                    <circle className="ring-progress" cx="50" cy="50" r="45" style={{ strokeDashoffset: strokeOffset }}></circle>
                  </svg>
                  <div className="ring-text"><span>{pct}%</span></div>
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Calories Target</p>
                  <h3 style={{ fontSize: '22px', fontWeight: '800' }}><span>{totalCal}</span> / <span>{activeGoal}</span> kcal</h3>
                </div>
              </div>

              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '700' }}><span>Protein</span><span>{totalP} / {appData.pGoal}g</span></div>
                <div className="macro-bar-bg"><div className="macro-bar-fill" style={{ background: 'var(--protein)', width: `${Math.min((totalP / appData.pGoal) * 100, 100)}%` }}></div></div>
              </div>
              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '700' }}><span>Carbs</span><span>{totalC} / {appData.cGoal}g</span></div>
                <div className="macro-bar-bg"><div className="macro-bar-fill" style={{ background: 'var(--carbs)', width: `${Math.min((totalC / appData.cGoal) * 100, 100)}%` }}></div></div>
              </div>
              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '700' }}><span>Fats</span><span>{totalF} / {appData.fGoal}g</span></div>
                <div className="macro-bar-bg"><div className="macro-bar-fill" style={{ background: 'var(--fats)', width: `${Math.min((totalF / (appData.fGoal || 70)) * 100, 100)}%` }}></div></div>
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize: '14px', fontWeight: '800', marginBottom: '10px' }}>Hydration Goal</div>
              <div className="water-box">
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--water)' }}><i className="fa-solid fa-glass-water"></i> Water Intake</div>
                  <div style={{ fontSize: '14px', fontWeight: '800', marginTop: '2px' }}><span>{waterLiters}</span> / 2.5 L</div>
                </div>
                <button className="btn-water" onClick={addWater}>+ 250ml</button>
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 2: FOOD DIARY */}
        {activeTab === 'diary' && (
          <div className="screen active">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Today's Log</h3>
              <button style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--primary)', color: 'white', border: 'none' }} onClick={() => setActiveTab('add')}><i className="fa-solid fa-plus"></i></button>
            </div>

            <div className="diary-summary" style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', padding: '12px 0', background: '#f1f5f9', borderRadius: '16px', marginBottom: '16px' }}>
              <div><h4>{totalCal}</h4><p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Eaten</p></div>
              <div><h4>{activeGoal}</h4><p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Goal</p></div>
              <div style={{ color: 'var(--success)' }}><h4>{Math.max(0, activeGoal - totalCal)}</h4><p style={{ fontSize: '11px' }}>Left</p></div>
            </div>

            <div className="card">
              <div style={{ fontSize: '14px', fontWeight: '800', marginBottom: '8px' }}>Logged Meals (Latest First)</div>
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

        {/* SCREEN 3: ADD FOOD */}
        {activeTab === 'add' && (
          <div className="screen active">
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '14px' }}>Add Food</h3>
            
            <div className="card">
              <div style={{ fontSize: '13px', fontWeight: '800', marginBottom: '10px' }}>Pinoy Food Presets</div>
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
            </div>

            <div className="card">
              <div style={{ fontSize: '13px', fontWeight: '800', marginBottom: '10px' }}>Custom Meal Input</div>
              <label style={{ fontSize: '11px', fontWeight: '700' }}>Food Name</label>
              <input type="text" className="form-input" placeholder="e.g. Tuna Canned" value={customName} onChange={e => setCustomName(e.target.value)} />
              
              <label style={{ fontSize: '11px', fontWeight: '700' }}>Calories (kcal)</label>
              <input type="number" className="form-input" placeholder="e.g. 180" value={customCal} onChange={e => setCustomCal(e.target.value)} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                <div><label style={{ fontSize: '10px', fontWeight: '700' }}>Protein (g)</label><input type="number" className="form-input" placeholder="0" value={customP} onChange={e => setCustomP(e.target.value)} /></div>
                <div><label style={{ fontSize: '10px', fontWeight: '700' }}>Carbs (g)</label><input type="number" className="form-input" placeholder="0" value={customC} onChange={e => setCustomC(e.target.value)} /></div>
                <div><label style={{ fontSize: '10px', fontWeight: '700' }}>Fats (g)</label><input type="number" className="form-input" placeholder="0" value={customF} onChange={e => setCustomF(e.target.value)} /></div>
              </div>

              <button className="btn-block" onClick={addCustomMeal}>Add Custom Meal</button>
            </div>
          </div>
        )}

        {/* SCREEN 4: PROGRESS */}
        {activeTab === 'progress' && (
          <div className="screen active">
            <h3 style={{ fontSize: '18px', fontWeight: '800', textAlign: 'center', marginBottom: '14px' }}>Weekly Progress</h3>
            
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '13px', fontWeight: '800' }}>Calories Intake (This Week)</div>
                <span style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: '800' }}>Live Tracker</span>
              </div>

              <div className="chart-bars">
                {dayNames.map(d => {
                  const dayCal = d === todayKey ? totalCal : (appData.weeklyLogs?.[d] || 0);
                  const heightPct = Math.min(Math.round((dayCal / activeGoal) * 100), 100);
                  const isToday = d === todayKey;
                  return (
                    <div key={d} className="chart-col">
                      <div className="bar-wrapper">
                        <div className={`bar-fill ${isToday ? 'active-day' : ''}`} style={{ height: `${heightPct}%` }}></div>
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'capitalize' }}>{d}</span>
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

        {/* SCREEN 5: GOALS */}
        {activeTab === 'goals' && (
          <div className="screen active">
            <h3 style={{ fontSize: '18px', fontWeight: '800', textAlign: 'center', marginBottom: '14px' }}>Gym & Fitness Goals</h3>
            
            <div className="card" style={{ background: 'linear-gradient(135deg, #4f46e5, #3730a3)', color: 'white', marginBottom: '14px' }}>
              <p style={{ fontSize: '11px', opacity: 0.8 }}>Active Goal Plan</p>
              <h2 style={{ fontSize: '20px', fontWeight: '800' }}>{goalTitles[appData.activeGoalType || 'bulk']}</h2>
              <p style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}><span>{activeGoal}</span> kcal/day</p>
            </div>

            <div style={{ fontSize: '13px', fontWeight: '800', marginBottom: '10px' }}>Select Fitness Target:</div>

            <div className={`goal-card-option ${appData.activeGoalType === 'bulk' ? 'selected' : ''}`} onClick={() => setGoalPreset('bulk')}>
              <div style={{ fontSize: '13px', fontWeight: '800' }}>1. Lean Bulk (Clean Muscle)</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Slight surplus for muscle growth with minimal fat.</div>
            </div>

            <div className={`goal-card-option ${appData.activeGoalType === 'cut' ? 'selected' : ''}`} onClick={() => setGoalPreset('cut')}>
              <div style={{ fontSize: '13px', fontWeight: '800' }}>2. Aggressive Cut (Fast Fat Loss)</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>High deficit + High Protein to preserve muscle.</div>
            </div>

            <div className={`goal-card-option ${appData.activeGoalType === 'recomp' ? 'selected' : ''}`} onClick={() => setGoalPreset('recomp')}>
              <div style={{ fontSize: '13px', fontWeight: '800' }}>3. Body Recomposition</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Build muscle & lose fat simultaneously.</div>
            </div>

            <div className={`goal-card-option ${appData.activeGoalType === 'dirty' ? 'selected' : ''}`} onClick={() => setGoalPreset('dirty')}>
              <div style={{ fontSize: '13px', fontWeight: '800' }}>4. Heavy Mass Gain (Hardgainer)</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>High calorie + High carbs for rapid weight gain.</div>
            </div>

            <div className={`goal-card-option ${appData.activeGoalType === 'jogging' ? 'selected' : ''}`} onClick={() => setGoalPreset('jogging')}>
              <div style={{ fontSize: '13px', fontWeight: '800' }}>5. Jogging & Cardio Endurance</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Higher carbs + Calorie cushion to fuel long runs.</div>
            </div>

            <div className={`goal-card-option ${appData.activeGoalType === 'athlete' ? 'selected' : ''}`} onClick={() => setGoalPreset('athlete')}>
              <div style={{ fontSize: '13px', fontWeight: '800' }}>6. Athletic Performance</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>High carbs fuel for intense sports and agility.</div>
            </div>

            <div className={`goal-card-option ${appData.activeGoalType === 'maint' ? 'selected' : ''}`} onClick={() => setGoalPreset('maint')}>
              <div style={{ fontSize: '13px', fontWeight: '800' }}>7. Weight Maintenance</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Balanced calories to stay fit and healthy.</div>
            </div>

            <div className="card" style={{ marginTop: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: '800', marginBottom: '8px' }}>Calculated Target Breakdown:</div>
              <div className="stat-row"><span>Calories</span><span>{activeGoal} kcal</span></div>
              <div className="stat-row"><span>Protein Target</span><span>{appData.pGoal} g</span></div>
              <div className="stat-row"><span>Carbs Target</span><span>{appData.cGoal} g</span></div>
              <div className="stat-row"><span>Fats Target</span><span>{appData.fGoal} g</span></div>
            </div>
          </div>
        )}

        {/* SCREEN 6: PROFILE */}
        {activeTab === 'profile' && (
          <div className="screen active">
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'var(--primary)', margin: '0 auto 8px auto', display: 'flex', alignItems: 'center', justify-content: 'center', color: 'white', fontSize: '28px' }}><i className="fa-solid fa-user"></i></div>
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>{appData.userName}</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{appData.userTitle}</p>
            </div>

            <div className="card">
              <div style={{ fontSize: '14px', fontWeight: '800', marginBottom: '12px' }}>User & Activity Profile</div>
              
              <label style={{ fontSize: '11px', fontWeight: '700' }}>Your Name</label>
              <input type="text" className="form-input" value={profName} onChange={e => setProfName(e.target.value)} />

              <label style={{ fontSize: '11px', fontWeight: '700' }}>Bio / Title</label>
              <input type="text" className="form-input" value={profTitle} onChange={e => setProfTitle(e.target.value)} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div><label style={{ fontSize: '11px', fontWeight: '700' }}>Height (cm)</label><input type="number" className="form-input" value={profHeight} onChange={e => setProfHeight(e.target.value)} /></div>
                <div><label style={{ fontSize: '11px', fontWeight: '700' }}>Weight (kg)</label><input type="number" className="form-input" value={profWeight} onChange={e => setProfWeight(e.target.value)} /></div>
              </div>

              <label style={{ fontSize: '11px', fontWeight: '700' }}>Activity Level (For TDEE Auto-Calc)</label>
              <select className="form-select" value={profActivity} onChange={e => setProfActivity(e.target.value)}>
                <option value="1.2">Sedentary (Little or no exercise)</option>
                <option value="1.375">Lightly Active (1-3 days gym/week)</option>
                <option value="1.55">Moderately Active (3-5 days gym/week)</option>
                <option value="1.725">Heavy Lifter (6-7 days intense gym)</option>
              </select>

              <button className="btn-block" onClick={saveUserProfile}>Auto-Calculate & Save Profile</button>
            </div>
          </div>
        )}

      </div>

      {/* BOTTOM NAV */}
      <div className="bottom-nav">
        <div className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}><i className="fa-solid fa-house"></i><span>Home</span></div>
        <div className={`nav-item ${activeTab === 'diary' ? 'active' : ''}`} onClick={() => setActiveTab('diary')}><i className="fa-regular fa-calendar-check"></i><span>Diary</span></div>
        <div className={`nav-item ${activeTab === 'add' ? 'active' : ''}`} onClick={() => setActiveTab('add')}><i className="fa-solid fa-plus-circle"></i><span>Add</span></div>
        <div className={`nav-item ${activeTab === 'progress' ? 'active' : ''}`} onClick={() => setActiveTab('progress')}><i className="fa-solid fa-chart-simple"></i><span>Progress</span></div>
        <div className={`nav-item ${activeTab === 'goals' ? 'active' : ''}`} onClick={() => setActiveTab('goals')}><i className="fa-solid fa-bullseye"></i><span>Goals</span></div>
        <div className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}><i className="fa-regular fa-user"></i><span>Profile</span></div>
      </div>
    </div>
  );
}