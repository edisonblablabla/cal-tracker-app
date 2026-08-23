import React, { useState, useEffect } from 'react';
import { 
  Flame, GlassWater, Plus, Trash2, RotateCcw, 
  Camera, Barcode, ShieldAlert, Dumbbell, Award, 
  ChevronRight, ArrowLeft, Check, Sparkles, User, Utensils
} from 'lucide-react';

const PINOY_FOODS = [
  { id: '1', name: 'Chicken Adobo (1 serving)', cal: 320, p: 28, c: 6, f: 20 },
  { id: '2', name: 'Sinangag Garlic Rice (1 cup)', cal: 220, p: 4, c: 42, f: 5 },
  { id: '3', name: 'Tapsilog Complete Meal', cal: 540, p: 32, c: 48, f: 24 },
  { id: '4', name: 'Saging na Saba (2 pcs)', cal: 180, p: 2, c: 45, f: 0 },
  { id: '5', name: 'Sinigang na Baboy (1 bowl)', cal: 310, p: 22, c: 12, f: 18 },
  { id: '6', name: 'Tokwa\'t Baboy (1 plate)', cal: 280, p: 20, c: 8, f: 16 },
  { id: '7', name: 'Pritong Tilapia (1 medium)', cal: 240, p: 26, c: 0, f: 12 }
];

export default function App() {
  const [appData, setAppData] = useState(() => {
    const saved = localStorage.getItem('calTrackerV2');
    return saved ? JSON.parse(saved) : {
      onboarded: false,
      userName: '',
      gender: 'male',
      birthDate: '',
      height: 165,
      weight: 65,
      goal: 'cut',
      activity: '1.55',
      dailyCalorieGoal: 2000,
      pGoal: 140, cGoal: 200, fGoal: 60,
      dayMode: 'workout',
      waterMl: 0,
      fastingPlan: 16,
      fastingActive: false,
      fastStartTime: null,
      disclaimerAccepted: false,
      meals: []
    };
  });

  const [activeTab, setActiveTab] = useState('home');
  const [onboardStep, setOnboardStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanType, setScanType] = useState('ai');
  const [fastingTimeLeft, setFastingTimeLeft] = useState('00:00:00');

  const [form, setForm] = useState({
    userName: appData.userName || '',
    gender: appData.gender || 'male',
    birthDate: appData.birthDate || '',
    height: appData.height || 165,
    weight: appData.weight || 65,
    goal: appData.goal || 'cut',
    activity: appData.activity || '1.55'
  });

  useEffect(() => {
    localStorage.setItem('calTrackerV2', JSON.stringify(appData));
  }, [appData]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!appData.fastingActive || !appData.fastStartTime) {
        setFastingTimeLeft('00:00:00');
        return;
      }
      const elapsed = Date.now() - appData.fastStartTime;
      const targetMs = appData.fastingPlan * 3600 * 1000;
      const remaining = targetMs - elapsed;

      if (remaining <= 0) {
        setFastingTimeLeft('00:00:00');
      } else {
        const sec = Math.floor(remaining / 1000);
        const h = String(Math.floor(sec / 3600)).padStart(2, '0');
        const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
        const s = String(sec % 60).padStart(2, '0');
        setFastingTimeLeft(`${h}:${m}:${s}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [appData.fastingActive, appData.fastStartTime, appData.fastingPlan]);

  const calculateTargets = (w, h, act, goalType) => {
    let bmr = (10 * w) + (6.25 * h) - (5 * 25) + 5;
    let tdee = Math.round(bmr * parseFloat(act));
    let targetCal = tdee;

    if (goalType === 'cut') targetCal = tdee - 400;
    if (goalType === 'bulk') targetCal = tdee + 300;
    if (goalType === 'maintenance') targetCal = tdee;

    return {
      cal: Math.max(1200, targetCal),
      p: Math.round(w * 2.0),
      c: Math.round(w * 3.0),
      f: Math.round(w * 0.8)
    };
  };

  const handleOnboardFinish = () => {
    const targets = calculateTargets(form.weight, form.height, form.activity, form.goal);
    setAppData(prev => ({
      ...prev,
      ...form,
      dailyCalorieGoal: targets.cal,
      pGoal: targets.p,
      cGoal: targets.c,
      fGoal: targets.f,
      onboarded: true,
      disclaimerAccepted: true
    }));
  };

  const logMeal = (food) => {
    const newMeal = { ...food, id: Date.now().toString(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setAppData(prev => ({ ...prev, meals: [newMeal, ...prev.meals] }));
    setActiveTab('diary');
  };

  const deleteMeal = (id) => {
    setAppData(prev => ({ ...prev, meals: prev.meals.filter(m => m.id !== id) }));
  };

  const toggleFast = () => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
    setAppData(prev => ({
      ...prev,
      fastingActive: !prev.fastingActive,
      fastStartTime: !prev.fastingActive ? Date.now() : null
    }));
  };

  const eatenCal = appData.meals.reduce((acc, m) => acc + m.cal, 0);
  const eatenP = appData.meals.reduce((acc, m) => acc + m.p, 0);
  const eatenC = appData.meals.reduce((acc, m) => acc + m.c, 0);
  const eatenF = appData.meals.reduce((acc, m) => acc + m.f, 0);
  const activeGoal = appData.dayMode === 'workout' ? appData.dailyCalorieGoal + 200 : appData.dailyCalorieGoal;

  if (!appData.onboarded) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 max-w-md mx-auto">
        <div>
          <div className="flex gap-2 mb-6">
            {[1, 2, 3, 4].map(step => (
              <div key={step} className={`h-1.5 flex-1 rounded-full ${step <= onboardStep ? 'bg-emerald-400' : 'bg-slate-800'}`} />
            ))}
          </div>

          {onboardStep === 1 && (
            <div className="space-y-4 animate-fade-in">
              <h1 className="text-2xl font-black text-emerald-400">Track. Fuel. Achieve.</h1>
              <p className="text-xs text-slate-400">Tell us about you so we can calculate your daily calorie and macro targets.</p>
              
              <div>
                <label className="text-xs font-bold text-slate-300">Name</label>
                <input type="text" className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm mt-1 focus:outline-none focus:border-emerald-400" value={form.userName} onChange={e => setForm({...form, userName: e.target.value})} placeholder="e.g. Juan" />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300">Birth Date</label>
                <input type="date" className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm mt-1 text-slate-300 focus:outline-none focus:border-emerald-400" value={form.birthDate} onChange={e => setForm({...form, birthDate: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300">Height (cm)</label>
                  <input type="number" className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm mt-1 focus:outline-none focus:border-emerald-400" value={form.height} onChange={e => setForm({...form, height: parseFloat(e.target.value) || 0})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300">Weight (kg)</label>
                  <input type="number" className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm mt-1 focus:outline-none focus:border-emerald-400" value={form.weight} onChange={e => setForm({...form, weight: parseFloat(e.target.value) || 0})} />
                </div>
              </div>
            </div>
          )}

          {onboardStep === 2 && (
            <div className="space-y-4 animate-fade-in">
              <h1 className="text-2xl font-black">What's your goal?</h1>
              <p className="text-xs text-slate-400">Your goal helps us personalize your calorie and macro targets.</p>
              
              {[
                { id: 'cut', title: '🔥 Lose Weight (Cut)', desc: 'Create a deficit & reduce body fat.' },
                { id: 'maintenance', title: '⚖️ Maintain Weight', desc: 'Stay balanced at your current weight.' },
                { id: 'bulk', title: '💪 Lean Bulk', desc: 'Build muscle while keeping body fat low.' }
              ].map(item => (
                <div key={item.id} onClick={() => setForm({...form, goal: item.id})} className={`p-4 rounded-2xl border cursor-pointer transition ${form.goal === item.id ? 'border-emerald-400 bg-emerald-950/20' : 'border-slate-800 bg-slate-900'}`}>
                  <h3 className="font-bold text-sm">{item.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          )}

          {onboardStep === 3 && (
            <div className="space-y-4 animate-fade-in">
              <h1 className="text-2xl font-black">How active are you?</h1>
              <p className="text-xs text-slate-400">This helps us fine-tune your calorie needs.</p>
              
              {[
                { id: '1.2', title: '🪑 Sedentary', desc: 'Little or no exercise.' },
                { id: '1.375', title: '👟 Lightly Active', desc: 'Light exercise 1-3 days/week.' },
                { id: '1.55', title: '🏋️ Moderately Active', desc: 'Moderate exercise 3-5 days/week.' },
                { id: '1.725', title: '🏅 Very Active', desc: 'Hard exercise 6-7 days/week.' }
              ].map(item => (
                <div key={item.id} onClick={() => setForm({...form, activity: item.id})} className={`p-4 rounded-2xl border cursor-pointer transition ${form.activity === item.id ? 'border-emerald-400 bg-emerald-950/20' : 'border-slate-800 bg-slate-900'}`}>
                  <h3 className="font-bold text-sm">{item.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          )}

          {onboardStep === 4 && (
            <div className="space-y-4 text-center animate-fade-in py-6">
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-2xl font-black">🎉</div>
              <h1 className="text-2xl font-black">Your plan is ready!</h1>
              <p className="text-xs text-slate-400">Here are your personalized daily estimates:</p>
              
              {(() => {
                const t = calculateTargets(form.weight, form.height, form.activity, form.goal);
                return (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-left space-y-3">
                    <div className="text-center pb-3 border-b border-slate-800">
                      <p className="text-xs text-slate-400 font-bold">DAILY CALORIE TARGET</p>
                      <h2 className="text-3xl font-extrabold text-emerald-400 mt-1">{t.cal} kcal</h2>
                    </div>
                    <div className="flex justify-between text-xs font-bold"><span>Protein</span><span>{t.p}g</span></div>
                    <div className="flex justify-between text-xs font-bold"><span>Carbs</span><span>{t.c}g</span></div>
                    <div className="flex justify-between text-xs font-bold"><span>Fats</span><span>{t.f}g</span></div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          {onboardStep > 1 && (
            <button onClick={() => setOnboardStep(s => s - 1)} className="p-4 bg-slate-900 rounded-xl text-slate-400 font-bold border border-slate-800">Back</button>
          )}
          <button 
            onClick={() => onboardStep < 4 ? setOnboardStep(s => s + 1) : handleOnboardFinish()} 
            className="flex-1 bg-emerald-400 text-slate-950 py-4 rounded-xl font-extrabold text-sm hover:bg-emerald-300 transition flex items-center justify-center gap-2"
          >
            {onboardStep === 4 ? 'Let\'s Go!' : 'Next'} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 max-w-md mx-auto pb-24 relative font-sans">
      
      <div className="p-5 flex justify-between items-center bg-slate-900/50 backdrop-blur sticky top-0 z-40 border-b border-slate-800/50">
        <div>
          <p className="text-[10px] font-extrabold text-slate-400 tracking-wider">FITNESS DASHBOARD</p>
          <h2 className="text-lg font-black text-white">Kumusta, {appData.userName || 'Athlete'}! 👋</h2>
        </div>
        <div className="bg-amber-400/10 border border-amber-400/20 text-amber-400 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 fill-amber-400" /> 1 Day
        </div>
      </div>

      <div className="p-5 space-y-4">

        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 border border-indigo-500/20 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex justify-between items-center mb-2">
            <div>
              <span className="text-[10px] font-extrabold text-indigo-400 tracking-wider">⏱️ INTERMITTENT FASTING</span>
              <h3 className="text-xs font-extrabold">{appData.fastingActive ? '🔥 Fasting Window' : 'Eating Window'}</h3>
            </div>
            <select 
              className="bg-slate-950 text-xs border border-slate-800 rounded-lg px-2 py-1 font-bold focus:outline-none"
              value={appData.fastingPlan}
              onChange={e => setAppData({...appData, fastingPlan: parseInt(e.target.value)})}
            >
              <option value={16}>16:8 Fast</option>
              <option value={18}>18:6 Fast</option>
              <option value={20}>20:4 Fast</option>
            </select>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <div className="text-2xl font-black font-mono tracking-widest text-emerald-400">{fastingTimeLeft}</div>
              <p className="text-[10px] text-slate-400 mt-0.5">Target: {appData.fastingPlan} Hours Fasting</p>
            </div>
            <button 
              onClick={toggleFast}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${appData.fastingActive ? 'bg-rose-500 hover:bg-rose-600 text-white' : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950'}`}
            >
              {appData.fastingActive ? 'End Fast' : 'Start Fast'}
            </button>
          </div>
        </div>

        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button 
            onClick={() => setAppData({...appData, dayMode: 'rest'})} 
            className={`flex-1 py-2 rounded-lg text-xs font-black transition ${appData.dayMode === 'rest' ? 'bg-slate-800 text-emerald-400 shadow' : 'text-slate-400'}`}
          >
            🛋️ Rest Day
          </button>
          <button 
            onClick={() => setAppData({...appData, dayMode: 'workout'})} 
            className={`flex-1 py-2 rounded-lg text-xs font-black transition ${appData.dayMode === 'workout' ? 'bg-slate-800 text-emerald-400 shadow' : 'text-slate-400'}`}
          >
            🏋️ Active Day
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-extrabold text-slate-400">TODAY OVERVIEW</span>
            <span className="text-xs font-extrabold text-emerald-400">{Math.round((eatenCal / activeGoal) * 100)}%</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path className="text-slate-800" strokeWidth="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="text-emerald-400 transition-all duration-500 stroke-current" strokeWidth="3.5" strokeDasharray={`${Math.min(100, Math.round((eatenCal / activeGoal) * 100))}, 100`} strokeLinecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div className="absolute text-center">
                <span className="text-sm font-black text-white">{eatenCal}</span>
                <span className="block text-[9px] text-slate-500 font-bold">kcal</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-extrabold">Target Calories</p>
              <h3 className="text-xl font-black text-white">{activeGoal} <span className="text-xs font-normal text-slate-400">kcal</span></h3>
              <p className="text-[11px] text-emerald-400 font-bold mt-0.5">{Math.max(0, activeGoal - eatenCal)} kcal remaining</p>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <div>
              <div className="flex justify-between text-[11px] font-extrabold mb-1">
                <span className="text-blue-400">Protein</span>
                <span className="text-slate-400">{eatenP} / {appData.pGoal}g</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${Math.min(100, (eatenP / appData.pGoal) * 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[11px] font-extrabold mb-1">
                <span className="text-emerald-400">Carbs</span>
                <span className="text-slate-400">{eatenC} / {appData.cGoal}g</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${Math.min(100, (eatenC / appData.cGoal) * 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[11px] font-extrabold mb-1">
                <span className="text-amber-400">Fats</span>
                <span className="text-slate-400">{eatenF} / {appData.fGoal}g</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${Math.min(100, (eatenF / appData.fGoal) * 100)}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => { setScanType('ai'); setShowScanModal(true); }}
            className="p-4 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl flex items-center gap-3 transition group text-left"
          >
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl group-hover:bg-emerald-400 group-hover:text-slate-950 transition">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black">AI Meal Scan</h4>
              <p className="text-[10px] text-slate-500 font-bold">Snap photo</p>
            </div>
          </button>

          <button 
            onClick={() => { setScanType('barcode'); setShowScanModal(true); }}
            className="p-4 bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl flex items-center gap-3 transition group text-left"
          >
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl group-hover:bg-indigo-400 group-hover:text-slate-950 transition">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black">Barcode Scan</h4>
              <p className="text-[10px] text-slate-500 font-bold">Packaged item</p>
            </div>
          </button>
        </div>

        {activeTab === 'add' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 animate-fade-in">
            <h3 className="text-xs font-black text-slate-300">🇵🇭 PINOY FOOD DATABASE</h3>
            <input 
              type="text" 
              placeholder="Search food (e.g., Adobo, Rice)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-emerald-400"
            />
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {PINOY_FOODS.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase())).map(food => (
                <div key={food.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-extrabold text-white">{food.name}</h4>
                    <p className="text-[10px] text-slate-500 font-bold">{food.cal} kcal • P:{food.p}g C:{food.c}g F:{food.f}g</p>
                  </div>
                  <button onClick={() => logMeal(food)} className="p-2 bg-emerald-400 text-slate-950 rounded-lg hover:bg-emerald-300 transition">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'diary' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 animate-fade-in">
            <h3 className="text-xs font-black text-slate-300">TODAY'S LOGGED MEALS</h3>
            {appData.meals.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4 font-bold">No meals logged yet today.</p>
            ) : (
              appData.meals.map(meal => (
                <div key={meal.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-extrabold text-white">{meal.name}</h4>
                    <p className="text-[10px] text-slate-500 font-bold">{meal.cal} kcal • P:{meal.p}g C:{meal.c}g F:{meal.f}g</p>
                  </div>
                  <button onClick={() => deleteMeal(meal.id)} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

      </div>

      {showScanModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 text-center">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              {scanType === 'ai' ? <Camera className="w-8 h-8" /> : <Barcode className="w-8 h-8" />}
            </div>
            <h3 className="text-lg font-black">{scanType === 'ai' ? 'AI Food Camera' : 'Barcode Reader'}</h3>
            <p className="text-xs text-slate-400">Position your {scanType === 'ai' ? 'Filipino meal' : 'packaged food'} inside the camera frame.</p>
            <div className="aspect-square bg-slate-950 border-2 border-dashed border-emerald-400/50 rounded-2xl flex items-center justify-center text-xs text-slate-500 font-mono">
              [ Camera Viewfinder ]
            </div>
            <button 
              onClick={() => {
                logMeal({ name: 'Scanned Meal (Auto-Detected)', cal: 450, p: 25, c: 50, f: 15 });
                setShowScanModal(false);
              }} 
              className="w-full bg-emerald-400 text-slate-950 py-3 rounded-xl font-extrabold text-xs"
            >
              Simulate Scan Log
            </button>
            <button onClick={() => setShowScanModal(false)} className="text-xs font-bold text-slate-500">Cancel</button>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-slate-900/90 backdrop-blur-md border-t border-slate-800 h-16 flex justify-around items-center px-2 z-40">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 text-[10px] font-bold ${activeTab === 'home' ? 'text-emerald-400' : 'text-slate-500'}`}>
          <Flame className="w-4 h-4" /> Home
        </button>
        <button onClick={() => setActiveTab('diary')} className={`flex flex-col items-center gap-1 text-[10px] font-bold ${activeTab === 'diary' ? 'text-emerald-400' : 'text-slate-500'}`}>
          <Utensils className="w-4 h-4" /> Diary
        </button>
        <button onClick={() => setActiveTab('add')} className="w-10 h-10 bg-emerald-400 text-slate-950 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition">
          <Plus className="w-5 h-5 font-black" />
        </button>
        <button onClick={() => setAppData({...appData, onboarded: false})} className="flex flex-col items-center gap-1 text-[10px] font-bold text-slate-500">
          <User className="w-4 h-4" /> Profile
        </button>
      </div>

    </div>
  );
}