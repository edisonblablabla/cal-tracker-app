import React, { useState, useMemo } from "react";

// Standard Filipino & Fitness Food Database
const VERIFIED_FOOD_DATABASE = [
  { id: "lib_white_rice", name: "White Rice (Cooked)", cal: 205, serving: "1.0 cup", p: 4, c: 45, f: 0.4 },
  { id: "lib_brown_rice", name: "Brown Rice (Cooked)", cal: 216, serving: "1.0 cup", p: 5, c: 45, f: 1.8 },
  { id: "lib_boiled_egg", name: "Boiled egg", cal: 72, serving: "1.0 egg", p: 6, c: 0.6, f: 5 },
  { id: "lib_fried_egg", name: "Fried egg", cal: 83, serving: "1.0 large", p: 6, c: 0.4, f: 7 },
  { id: "lib_chicken_breast", name: "Chicken Breast (Cooked, Skinless)", cal: 165, serving: "100.0 gram", p: 31, c: 0, f: 3.6 },
  { id: "lib_chicken_adobo", name: "Chicken Adobo", cal: 260, serving: "1 serving (150g)", p: 28, c: 4, f: 14 },
  { id: "lib_pork_sinigang", name: "Pork Sinigang", cal: 220, serving: "1 bowl (200g)", p: 18, c: 6, f: 14 },
  { id: "lib_fried_tilapia", name: "Fried Tilapia", cal: 180, serving: "1 medium fish", p: 26, c: 0, f: 8 },
  { id: "lib_canned_tuna", name: "Canned Tuna (in Water)", cal: 110, serving: "1 can (100g)", p: 25, c: 0, f: 1 },
  { id: "lib_banana", name: "Banana (Lakatan/Latundan)", cal: 105, serving: "1 medium", p: 1.3, c: 27, f: 0.3 },
  { id: "lib_oatmeal", name: "Oatmeal (Cooked)", cal: 150, serving: "1 bowl", p: 5, c: 27, f: 3 },
  { id: "lib_wheat_bread", name: "Whole Wheat Bread", cal: 80, serving: "1 slice", p: 4, c: 14, f: 1 },
  { id: "lib_pandesal", name: "Pandesal", cal: 120, serving: "1 medium pc", p: 3, c: 24, f: 1.5 },
  { id: "lib_monggo", name: "Ginisang Monggo", cal: 190, serving: "1 bowl", p: 12, c: 28, f: 3 },
  { id: "lib_tinola", name: "Chicken Tinola", cal: 210, serving: "1 bowl", p: 24, c: 5, f: 9 }
];

export default function DiaryTab({
  user,
  appData,
  saveToCloud,
  showToast,
  totalCal = 0,
  activeGoal = 2416,
  todayMeals = [],
  deleteMeal
}) {
  const getTodayISO = () => new Date().toLocaleDateString("en-CA");
  const todayISO = getTodayISO();

  // 1. MACRONUTRIENTS COMPUTATION PARA SA ARAW
  const { totalP, totalC, totalF } = useMemo(() => {
    return (todayMeals || []).reduce(
      (acc, m) => ({
        totalP: acc.totalP + (Number(m.p || m.protein) || 0),
        totalC: acc.totalC + (Number(m.c || m.carbs) || 0),
        totalF: acc.totalF + (Number(m.f || m.fat || m.fats) || 0)
      }),
      { totalP: 0, totalC: 0, totalF: 0 }
    );
  }, [todayMeals]);

  const calorieGoal = Number(activeGoal || appData?.dailyCalorieTarget || 2416);
  const targetProtein = Math.round((calorieGoal * 0.3) / 4);
  const targetCarbs = Math.round((calorieGoal * 0.45) / 4);
  const targetFat = Math.round((calorieGoal * 0.25) / 9);

  // 2. MEAL BUCKET SEGREGATION (Breakfast, Lunch, Dinner, Snacks)
  // Fallback: Kapag walang mealType ang lumang tala, inilalagay ito batay sa oras o sa "snacks"
  const mealBuckets = useMemo(() => {
    const buckets = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: []
    };

    (todayMeals || []).forEach((m) => {
      let type = m.mealType;
      if (!type) {
        // Alamin ayon sa oras kung may timestamp
        if (m.timestamp) {
          const hour = new Date(m.timestamp).getHours();
          if (hour >= 4 && hour < 11) type = "breakfast";
          else if (hour >= 11 && hour < 15) type = "lunch";
          else if (hour >= 17 && hour < 22) type = "dinner";
          else type = "snack";
        } else {
          type = "snack";
        }
      }
      if (buckets[type]) {
        buckets[type].push(m);
      } else {
        buckets.snack.push(m);
      }
    });

    return buckets;
  }, [todayMeals]);

  // Subtotal ng bawat bucket
  const getBucketCalories = (items) => {
    return items.reduce((sum, item) => sum + (Number(item.cal || item.calories) || 0), 0);
  };

  // 3. SMART MODAL & SEARCH STATE
  const [activeModalBucket, setActiveModalBucket] = useState(null); // 'breakfast' | 'lunch' | 'dinner' | 'snack' | null
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState(null);
  const [multiplier, setMultiplier] = useState(1);
  const [isManualFormOpen, setIsManualFormOpen] = useState(false);

  // Manual Form States
  const [customName, setCustomName] = useState("");
  const [customPortion, setCustomPortion] = useState("1 serving");
  const [customCal, setCustomCal] = useState("");
  const [customP, setCustomP] = useState("");
  const [customC, setCustomC] = useState("");
  const [customF, setCustomF] = useState("");

  // Pagsamahin ang Verified Database at Custom Quick Staples ng user
  const combinedDatabase = useMemo(() => {
    const userCustoms = (appData?.customQuickStaples || []).map((c) => ({
      ...c,
      isUserCustom: true
    }));
    return [...VERIFIED_FOOD_DATABASE, ...userCustoms];
  }, [appData?.customQuickStaples]);

  const filteredFoods = useMemo(() => {
    if (!searchQuery.trim()) return combinedDatabase;
    const q = searchQuery.toLowerCase().trim();
    return combinedDatabase.filter(
      (f) => f.name.toLowerCase().includes(q) || (f.serving && f.serving.toLowerCase().includes(q))
    );
  }, [combinedDatabase, searchQuery]);

  // Scaled values batay sa napiling multiplier
  const scaledValues = useMemo(() => {
    if (!selectedFood) return { cal: 0, p: 0, c: 0, f: 0 };
    return {
      cal: Math.round(Number(selectedFood.cal) * multiplier),
      p: Number((Number(selectedFood.p || 0) * multiplier).toFixed(1)),
      c: Number((Number(selectedFood.c || 0) * multiplier).toFixed(1)),
      f: Number((Number(selectedFood.f || 0) * multiplier).toFixed(1))
    };
  }, [selectedFood, multiplier]);

  // SAVE FOOD TO FIRESTORE VIA saveToCloud
  const handleConfirmAddFood = () => {
    if (!selectedFood || !activeModalBucket) return;

    const newMeal = {
      id: Date.now(),
      name: selectedFood.name,
      mealType: activeModalBucket,
      portion: multiplier === 1 ? selectedFood.serving : `${multiplier}x (${selectedFood.serving})`,
      cal: scaledValues.cal,
      calories: scaledValues.cal,
      p: scaledValues.p,
      c: scaledValues.c,
      f: scaledValues.f,
      dateLogged: todayISO,
      timestamp: Date.now()
    };

    const updatedMeals = [newMeal, ...(appData?.meals || [])];
    if (saveToCloud) {
      saveToCloud({
        ...appData,
        meals: updatedMeals
      });
    }

    if (showToast) {
      showToast(`🍽️ Logged to ${getBucketLabel(activeModalBucket)}: ${selectedFood.name} (+${scaledValues.cal} kcal)!`);
    }

    closeModal();
  };

  // MANUAL CUSTOM SAVE
  const handleManualSave = (e) => {
    e.preventDefault();
    const cNum = parseInt(customCal, 10);
    if (!customName.trim() || isNaN(cNum) || cNum <= 0) {
      if (showToast) showToast("Pakilagay ang pangalan at wastong calories!");
      return;
    }

    const newMeal = {
      id: Date.now(),
      name: customName.trim(),
      mealType: activeModalBucket || "snack",
      portion: customPortion.trim() || "1 serving",
      cal: cNum,
      calories: cNum,
      p: Number(customP) || 0,
      c: Number(customC) || 0,
      f: Number(customF) || 0,
      dateLogged: todayISO,
      timestamp: Date.now()
    };

    const updatedMeals = [newMeal, ...(appData?.meals || [])];
    if (saveToCloud) {
      saveToCloud({ ...appData, meals: updatedMeals });
    }

    if (showToast) {
      showToast(`🍽️ Logged: ${customName} (+${cNum} kcal)!`);
    }

    closeModal();
  };

  const closeModal = () => {
    setActiveModalBucket(null);
    setSelectedFood(null);
    setSearchQuery("");
    setMultiplier(1);
    setIsManualFormOpen(false);
    setCustomName("");
    setCustomPortion("1 serving");
    setCustomCal("");
    setCustomP("");
    setCustomC("");
    setCustomF("");
  };

  const getBucketLabel = (type) => {
    switch (type) {
      case "breakfast": return "Breakfast";
      case "lunch": return "Lunch";
      case "dinner": return "Dinner";
      case "snack": return "Snacks";
      default: return "Meal";
    }
  };

  const getBucketIcon = (type) => {
    switch (type) {
      case "breakfast": return { icon: "fa-sun", color: "#f59e0b", bg: "#fef3c7" };
      case "lunch": return { icon: "fa-cloud-sun", color: "#0ea5e9", bg: "#e0f2fe" };
      case "dinner": return { icon: "fa-moon", color: "#6366f1", bg: "#e0e7ff" };
      case "snack": return { icon: "fa-apple-whole", color: "#10b981", bg: "#d1fae5" };
      default: return { icon: "fa-utensils", color: "#64748b", bg: "#f1f5f9" };
    }
  };

  return (
    <div className="screen active" style={{ maxWidth: "420px", margin: "0 auto", padding: "0 10px 40px 10px" }}>
      
      {/* ─── 1. TOP HEADER & MACRO PROGRESS CARD ─── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", paddingTop: "4px" }}>
        <div>
          <h2 style={{ fontSize: "17px", fontWeight: 900, color: "#0f172a", margin: 0 }}>
            Nutrition & Diary
          </h2>
          <span style={{ fontSize: "10px", fontWeight: 700, color: "#64748b" }}>
            Daily Command Center & Meal Buckets
          </span>
        </div>
        <span style={{ fontSize: "10px", fontWeight: 800, color: "#4f46e5", background: "#eef2ff", padding: "3px 8px", borderRadius: "8px" }}>
          Today's Log
        </span>
      </div>

      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "18px", padding: "14px", marginBottom: "14px", boxShadow: "0 4px 14px rgba(15, 23, 42, 0.04)" }}>
        
        {/* Calories Overview */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", textAlign: "center", gap: "6px", marginBottom: "12px" }}>
          <div style={{ background: "#f8fafc", padding: "8px", borderRadius: "10px", border: "1px solid #f1f5f9" }}>
            <span style={{ fontSize: "9px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Eaten</span>
            <div style={{ fontSize: "16px", fontWeight: 900, color: "#0f172a", marginTop: "1px" }}>
              {totalCal.toLocaleString()}
            </div>
            <span style={{ fontSize: "8.5px", color: "#94a3b8" }}>kcal</span>
          </div>

          <div style={{ background: "#f8fafc", padding: "8px", borderRadius: "10px", border: "1px solid #f1f5f9" }}>
            <span style={{ fontSize: "9px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Target</span>
            <div style={{ fontSize: "16px", fontWeight: 900, color: "#4f46e5", marginTop: "1px" }}>
              {calorieGoal.toLocaleString()}
            </div>
            <span style={{ fontSize: "8.5px", color: "#94a3b8" }}>kcal</span>
          </div>

          <div style={{ background: "#f8fafc", padding: "8px", borderRadius: "10px", border: "1px solid #f1f5f9" }}>
            <span style={{ fontSize: "9px", fontWeight: 700, color: "#10b981", textTransform: "uppercase" }}>Remaining</span>
            <div style={{ fontSize: "16px", fontWeight: 900, color: "#10b981", marginTop: "1px" }}>
              {Math.max(0, calorieGoal - totalCal).toLocaleString()}
            </div>
            <span style={{ fontSize: "8.5px", color: "#94a3b8" }}>kcal</span>
          </div>
        </div>

        {/* Live Macro Progress Bars */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9.5px", fontWeight: 800, marginBottom: "2px" }}>
              <span style={{ color: "#0f172a" }}>Protein</span>
              <span style={{ color: "#6366f1" }}>{Math.round(totalP)}/{targetProtein}g</span>
            </div>
            <div style={{ height: "4px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
              <div style={{ width: `${Math.min(Math.round((totalP / targetProtein) * 100), 100)}%`, height: "100%", background: "#6366f1", borderRadius: "999px" }}></div>
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9.5px", fontWeight: 800, marginBottom: "2px" }}>
              <span style={{ color: "#0f172a" }}>Carbs</span>
              <span style={{ color: "#0ea5e9" }}>{Math.round(totalC)}/{targetCarbs}g</span>
            </div>
            <div style={{ height: "4px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
              <div style={{ width: `${Math.min(Math.round((totalC / targetCarbs) * 100), 100)}%`, height: "100%", background: "#0ea5e9", borderRadius: "999px" }}></div>
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9.5px", fontWeight: 800, marginBottom: "2px" }}>
              <span style={{ color: "#0f172a" }}>Fats</span>
              <span style={{ color: "#f59e0b" }}>{Math.round(totalF)}/{targetFat}g</span>
            </div>
            <div style={{ height: "4px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
              <div style={{ width: `${Math.min(Math.round((totalF / targetFat) * 100), 100)}%`, height: "100%", background: "#f59e0b", borderRadius: "999px" }}></div>
            </div>
          </div>
        </div>

      </div>

      {/* ─── 2. MEAL CATEGORY BUCKETS (Breakfast, Lunch, Dinner, Snacks) ─── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        
        {["breakfast", "lunch", "dinner", "snack"].map((bucketKey) => {
          const items = mealBuckets[bucketKey] || [];
          const bucketCal = getBucketCalories(items);
          const meta = getBucketIcon(bucketKey);

          return (
            <div
              key={bucketKey}
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "16px",
                padding: "12px 14px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
              }}
            >
              {/* Bucket Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: items.length > 0 ? "10px" : "4px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: meta.bg, color: meta.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>
                    <i className={`fa-solid ${meta.icon}`}></i>
                  </div>
                  <div>
                    <span style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a", display: "block", lineHeight: 1.1 }}>
                      {getBucketLabel(bucketKey)}
                    </span>
                    <span style={{ fontSize: "9.5px", fontWeight: 700, color: "#64748b" }}>
                      {bucketCal} kcal
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setActiveModalBucket(bucketKey)}
                  style={{
                    background: "#f1f5f9",
                    border: "none",
                    color: "#4f46e5",
                    padding: "5px 10px",
                    borderRadius: "8px",
                    fontSize: "11px",
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  <i className="fa-solid fa-plus" style={{ fontSize: "9px" }}></i>
                  <span>Add Food</span>
                </button>
              </div>

              {/* Bucket Items List */}
              {items.length === 0 ? (
                <div style={{ padding: "6px 0 2px 0", fontSize: "10.5px", color: "#94a3b8", fontStyle: "italic" }}>
                  No food logged for {getBucketLabel(bucketKey).toLowerCase()} yet.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {items.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        background: "#f8fafc",
                        border: "1px solid #f1f5f9",
                        borderRadius: "10px",
                        padding: "8px 10px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a" }}>
                            {m.name}
                          </span>
                          <span style={{ fontSize: "10px", fontWeight: 600, color: "#6366f1" }}>
                            ({m.portion || "1 serving"})
                          </span>
                        </div>
                        <span style={{ fontSize: "10px", color: "#64748b", fontWeight: 700, display: "block", marginTop: "1px" }}>
                          {m.cal} kcal • P:{m.p || 0}g • C:{m.c || 0}g • F:{m.f || 0}g
                        </span>
                      </div>

                      <button
                        onClick={() => deleteMeal(m.id)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#94a3b8",
                          fontSize: "12px",
                          cursor: "pointer",
                          padding: "4px"
                        }}
                        title="Delete entry"
                      >
                        <i className="fa-solid fa-trash" style={{ color: "#ef4444" }}></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

      </div>

      {/* ─── 3. SMART FOOD SEARCH & PORTION SCALER MODAL ─── */}
      {activeModalBucket && (
        <div
          onClick={closeModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.5)",
            backdropFilter: "blur(3px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "420px",
              maxHeight: "88vh",
              display: "flex",
              flexDirection: "column",
              background: "#ffffff",
              borderTopLeftRadius: "22px",
              borderTopRightRadius: "22px",
              padding: "16px",
              boxShadow: "0 -10px 30px rgba(0,0,0,0.15)",
              animation: "slideUp 0.2s ease-out"
            }}
          >
            {/* Modal Handle */}
            <div style={{ width: "36px", height: "4px", background: "#cbd5e1", borderRadius: "2px", margin: "0 auto 12px auto" }}></div>

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div>
                <h3 style={{ fontSize: "15px", fontWeight: 800, margin: 0, color: "#0f172a" }}>
                  Add to {getBucketLabel(activeModalBucket)}
                </h3>
                <span style={{ fontSize: "10px", color: "#64748b", fontWeight: 700 }}>
                  Search library or enter manual food
                </span>
              </div>
              <button onClick={closeModal} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "16px", cursor: "pointer" }}>✕</button>
            </div>

            {/* If a food is selected: Show the Portion & Scaler Confirmation View */}
            {selectedFood ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <div>
                      <h4 style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                        {selectedFood.name}
                      </h4>
                      <span style={{ fontSize: "10.5px", color: "#64748b", fontWeight: 700 }}>
                        Base: {selectedFood.serving} ({selectedFood.cal} kcal)
                      </span>
                    </div>
                    <button
                      onClick={() => { setSelectedFood(null); setMultiplier(1); }}
                      style={{ background: "#f1f5f9", border: "none", color: "#64748b", padding: "3px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: 800, cursor: "pointer" }}
                    >
                      Change
                    </button>
                  </div>

                  {/* Multiplier Pills */}
                  <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                    Select Serving Multiplier:
                  </span>
                  <div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
                    {[0.5, 1, 1.5, 2].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setMultiplier(num)}
                        style={{
                          flex: 1,
                          padding: "6px 0",
                          borderRadius: "8px",
                          border: multiplier === num ? "2px solid #4f46e5" : "1px solid #cbd5e1",
                          background: multiplier === num ? "#eef2ff" : "#ffffff",
                          color: multiplier === num ? "#4f46e5" : "#475569",
                          fontSize: "11px",
                          fontWeight: 800,
                          cursor: "pointer"
                        }}
                      >
                        {num}x
                      </button>
                    ))}
                  </div>

                  {/* Real-time Scaled Nutrition Card */}
                  <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "10px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", textAlign: "center" }}>
                    <div>
                      <span style={{ fontSize: "8.5px", fontWeight: 700, color: "#64748b" }}>CALORIES</span>
                      <div style={{ fontSize: "14px", fontWeight: 900, color: "#0f172a" }}>{scaledValues.cal}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: "8.5px", fontWeight: 700, color: "#6366f1" }}>PROTEIN</span>
                      <div style={{ fontSize: "14px", fontWeight: 900, color: "#6366f1" }}>{scaledValues.p}g</div>
                    </div>
                    <div>
                      <span style={{ fontSize: "8.5px", fontWeight: 700, color: "#0ea5e9" }}>CARBS</span>
                      <div style={{ fontSize: "14px", fontWeight: 900, color: "#0ea5e9" }}>{scaledValues.c}g</div>
                    </div>
                    <div>
                      <span style={{ fontSize: "8.5px", fontWeight: 700, color: "#f59e0b" }}>FAT</span>
                      <div style={{ fontSize: "14px", fontWeight: 900, color: "#f59e0b" }}>{scaledValues.f}g</div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleConfirmAddFood}
                  style={{
                    width: "100%",
                    background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
                    color: "white",
                    border: "none",
                    padding: "11px",
                    borderRadius: "10px",
                    fontSize: "12px",
                    fontWeight: 800,
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(79, 70, 229, 0.25)"
                  }}
                >
                  Confirm & Add to {getBucketLabel(activeModalBucket)}
                </button>
              </div>
            ) : (
              <>
                {/* Search Bar */}
                <div style={{ position: "relative", marginBottom: "10px" }}>
                  <i className="fa-solid fa-magnifying-glass" style={{ position: "absolute", left: "12px", top: "11px", color: "#94a3b8", fontSize: "12px" }}></i>
                  <input
                    type="text"
                    placeholder="Search food (e.g. Rice, Adobo, Egg)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px 12px 9px 34px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      fontSize: "12px",
                      fontWeight: 700,
                      outline: "none",
                      background: "#f8fafc"
                    }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      style={{ position: "absolute", right: "10px", top: "9px", background: "none", border: "none", color: "#94a3b8", fontSize: "12px", cursor: "pointer" }}
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Scrollable Food Library */}
                <div style={{ flex: 1, overflowY: "auto", maxHeight: "240px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  {filteredFoods.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "20px 10px", color: "#94a3b8", fontSize: "11px" }}>
                      Walang nakitang pagkain para sa "{searchQuery}".
                    </div>
                  ) : (
                    filteredFoods.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => { setSelectedFood(item); setMultiplier(1); }}
                        style={{
                          background: "#1e293b",
                          borderRadius: "10px",
                          padding: "9px 12px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          color: "#ffffff",
                          cursor: "pointer"
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                            <span style={{ fontSize: "12px", fontWeight: 800, color: "#f8fafc" }}>
                              {item.name}
                            </span>
                            <i className="fa-solid fa-circle-check" style={{ color: "#10b981", fontSize: "10px" }}></i>
                            {item.isUserCustom && (
                              <span style={{ fontSize: "8px", fontWeight: 900, background: "#334155", color: "#93c5fd", padding: "1px 4px", borderRadius: "4px" }}>
                                MY PRESET
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: "10.5px", color: "#94a3b8", fontWeight: 600 }}>
                            {item.cal} cal • {item.serving} (P:{item.p || 0}g C:{item.c || 0}g F:{item.f || 0}g)
                          </span>
                        </div>

                        <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: "#334155", color: "#38bdf8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>
                          <i className="fa-solid fa-plus"></i>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Manual Fallback Accordion */}
                <div style={{ marginTop: "10px", borderTop: "1px solid #f1f5f9", paddingTop: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setIsManualFormOpen(!isManualFormOpen)}
                    style={{ width: "100%", background: "transparent", border: "none", color: "#64748b", fontSize: "11px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
                  >
                    <span>{isManualFormOpen ? "Hide Manual Form" : "Wala sa listahan? Click for Manual Entry"}</span>
                    <i className={`fa-solid ${isManualFormOpen ? "fa-chevron-up" : "fa-chevron-down"}`} style={{ fontSize: "9px" }}></i>
                  </button>

                  {isManualFormOpen && (
                    <form onSubmit={handleManualSave} style={{ marginTop: "8px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "6px", marginBottom: "6px" }}>
                        <input
                          type="text"
                          placeholder="Food Name"
                          required
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value)}
                          style={{ padding: "7px 9px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "11px", fontWeight: 700 }}
                        />
                        <input
                          type="text"
                          placeholder="Portion (1 plate)"
                          value={customPortion}
                          onChange={(e) => setCustomPortion(e.target.value)}
                          style={{ padding: "7px 9px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "11px", fontWeight: 700 }}
                        />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "6px", marginBottom: "8px" }}>
                        <input
                          type="number"
                          placeholder="Cal*"
                          required
                          value={customCal}
                          onChange={(e) => setCustomCal(e.target.value)}
                          style={{ padding: "7px 6px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "11px", fontWeight: 700 }}
                        />
                        <input
                          type="number"
                          placeholder="P (g)"
                          value={customP}
                          onChange={(e) => setCustomP(e.target.value)}
                          style={{ padding: "7px 6px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "11px", fontWeight: 700 }}
                        />
                        <input
                          type="number"
                          placeholder="C (g)"
                          value={customC}
                          onChange={(e) => setCustomC(e.target.value)}
                          style={{ padding: "7px 6px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "11px", fontWeight: 700 }}
                        />
                        <input
                          type="number"
                          placeholder="F (g)"
                          value={customF}
                          onChange={(e) => setCustomF(e.target.value)}
                          style={{ padding: "7px 6px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "11px", fontWeight: 700 }}
                        />
                      </div>
                      <button
                        type="submit"
                        style={{ width: "100%", background: "#4f46e5", color: "white", border: "none", padding: "8px", borderRadius: "8px", fontSize: "11px", fontWeight: 800, cursor: "pointer" }}
                      >
                        Log to {getBucketLabel(activeModalBucket)}
                      </button>
                    </form>
                  )}
                </div>
              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
