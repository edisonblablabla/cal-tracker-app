import React, { useState } from "react";

export default function AthleteOnboardingWizard({
  user,
  initialName = "",
  onComplete,
  isSaving = false
}) {
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState(initialName || user?.displayName || "");
  const [gender, setGender] = useState("male");
  const [age, setAge] = useState(25);
  const [heightCm, setHeightCm] = useState(168);
  const [currentWeightKg, setCurrentWeightKg] = useState(65);
  const [targetWeightKg, setTargetWeightKg] = useState(62);
  const [goalType, setGoalType] = useState("cut");
  const [activityMultiplier, setActivityMultiplier] = useState(1.55);

  // Goal options
  const goals = [
    { id: "cut", title: "Fat Loss & Cut", icon: "fa-solid fa-fire", desc: "Burn stubborn fat while protecting athletic muscle mass.", calDelta: -400 },
    { id: "bulk", title: "Muscle Build & Bulk", icon: "fa-solid fa-dumbbell", desc: "Clean lean surplus to accelerate muscle growth and strength.", calDelta: 300 },
    { id: "recomp", title: "Body Recomposition", icon: "fa-solid fa-arrows-rotate", desc: "Tone physique and trim body fat at balanced maintenance.", calDelta: 0 },
    { id: "marathon", title: "Athletic Endurance", icon: "fa-solid fa-person-running", desc: "High carbohydrate fueling for runners and sustained stamina.", calDelta: 350 }
  ];

  // Activity levels
  const activities = [
    { mult: 1.2, title: "Sedentary", desc: "Desk job, little to no scheduled workout" },
    { mult: 1.375, title: "Light Activity", desc: "1-3 workout days per week" },
    { mult: 1.55, title: "Moderate Athlete", desc: "3-5 high-intensity sessions per week" },
    { mult: 1.725, title: "Extreme Performer", desc: "6-7 intense days or heavy physical work" }
  ];

  // Precision Mifflin-St Jeor Formula
  const calculateMacros = () => {
    const w = parseFloat(currentWeightKg) || 65;
    const h = parseFloat(heightCm) || 168;
    const a = parseInt(age, 10) || 25;
    const act = parseFloat(activityMultiplier) || 1.55;

    // BMR Calculation
    let bmr = (10 * w) + (6.25 * h) - (5 * a);
    bmr += (gender === "male" ? 5 : -161);

    const tdee = Math.round(bmr * act);
    const selectedGoal = goals.find(g => g.id === goalType) || goals[0];
    const targetCalories = Math.max(1300, tdee + selectedGoal.calDelta);

    let pG = Math.round(w * (goalType === "cut" ? 2.2 : (goalType === "bulk" ? 2.0 : 1.8)));
    let fG = Math.round((targetCalories * 0.25) / 9);
    let remainingCal = targetCalories - (pG * 4) - (fG * 9);
    let cG = Math.max(80, Math.round(remainingCal / 4));
    let waterMl = Math.round(w * 35);

    return { bmr, tdee, targetCalories, pG, cG, fG, waterMl };
  };

  const calculated = calculateMacros();

  const handleFinish = () => {
    onComplete({
      userName: fullName.trim() || user?.displayName || "Athlete",
      gender,
      age: parseInt(age, 10) || 25,
      height: parseFloat(heightCm) || 168,
      weight: parseFloat(currentWeightKg) || 65,
      targetWeight: parseFloat(targetWeightKg) || 62,
      activeGoalType: goalType,
      activityLevel: parseFloat(activityMultiplier) || 1.55,
      baseGoal: calculated.targetCalories,
      goal: calculated.targetCalories,
      pGoal: calculated.pG,
      cGoal: calculated.cG,
      fGoal: calculated.fG,
      waterTargetMl: calculated.waterMl
    });
  };

  return (
    <div className="mobile-frame" style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "clamp(12px, 3.5vw, 20px)",
      minHeight: "100dvh",
      background: "#090d16",
      boxSizing: "border-box"
    }}>
      <div style={{
        background: "#0f172a",
        borderRadius: "24px",
        width: "100%",
        maxWidth: "420px",
        padding: "clamp(18px, 4vw, 24px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
        boxSizing: "border-box",
        color: "#ffffff"
      }}>
        {/* Progress Bar & Header */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "11px", fontWeight: 800, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Athlete Onboarding • Step {step} of 4
            </span>
            <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 700 }}>
              {Math.round((step / 4) * 100)}%
            </span>
          </div>
          <div style={{ height: "6px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "3px", overflow: "hidden" }}>
            <div style={{
              width: `${(step / 4) * 100}%`,
              height: "100%",
              background: "linear-gradient(90deg, #6366f1, #38bdf8)",
              transition: "width 0.3s ease"
            }}></div>
          </div>
        </div>

        {/* ─── STEP 1: PRIMARY OBJECTIVE ─── */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 900, marginBottom: "4px" }}>What's your main target?</h2>
            <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "16px" }}>Choose your goal to tailor your optimal caloric fuel.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
              {goals.map((g) => {
                const isSelected = goalType === g.id;
                return (
                  <div
                    key={g.id}
                    onClick={() => setGoalType(g.id)}
                    style={{
                      padding: "12px 14px",
                      borderRadius: "14px",
                      border: isSelected ? "2px solid #38bdf8" : "1px solid rgba(255, 255, 255, 0.1)",
                      background: isSelected ? "rgba(56, 189, 248, 0.12)" : "rgba(255, 255, 255, 0.03)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <div style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "10px",
                      background: isSelected ? "#38bdf8" : "rgba(255, 255, 255, 0.08)",
                      color: isSelected ? "#0f172a" : "#cbd5e1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "16px",
                      flexShrink: 0
                    }}>
                      <i className={g.icon}></i>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "13px", fontWeight: 800, color: isSelected ? "#ffffff" : "#e2e8f0" }}>{g.title}</div>
                      <div style={{ fontSize: "11px", color: "#94a3b8", lineHeight: 1.3 }}>{g.desc}</div>
                    </div>
                    {isSelected && <i className="fa-solid fa-circle-check" style={{ color: "#38bdf8", fontSize: "16px" }}></i>}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              style={{
                width: "100%",
                height: "46px",
                borderRadius: "12px",
                border: "none",
                background: "linear-gradient(135deg, #6366f1, #38bdf8)",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: "13px",
                cursor: "pointer"
              }}
            >
              Continue to Body Metrics ➜
            </button>
          </div>
        )}

        {/* ─── STEP 2: BODY METRICS & VITALS ─── */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 900, marginBottom: "4px" }}>Body Vitals & Metrics</h2>
            <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "16px" }}>We calculate your biological energy burn with precision.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
              {/* Name */}
              <div>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "#cbd5e1" }}>Athlete Name</label>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "10px", color: "#ffffff", fontSize: "13px", marginTop: "4px", boxSizing: "border-box" }}
                />
              </div>

              {/* Gender Switcher */}
              <div>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "#cbd5e1" }}>Biological Gender</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "4px" }}>
                  <button
                    type="button"
                    onClick={() => setGender("male")}
                    style={{
                      padding: "9px",
                      borderRadius: "10px",
                      border: gender === "male" ? "2px solid #38bdf8" : "1px solid rgba(255,255,255,0.1)",
                      background: gender === "male" ? "rgba(56, 189, 248, 0.15)" : "rgba(255,255,255,0.03)",
                      color: "#ffffff",
                      fontWeight: 800,
                      fontSize: "12px",
                      cursor: "pointer"
                    }}
                  >
                    ♂ Male
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender("female")}
                    style={{
                      padding: "9px",
                      borderRadius: "10px",
                      border: gender === "female" ? "2px solid #ec4899" : "1px solid rgba(255,255,255,0.1)",
                      background: gender === "female" ? "rgba(236, 72, 153, 0.15)" : "rgba(255,255,255,0.03)",
                      color: "#ffffff",
                      fontWeight: 800,
                      fontSize: "12px",
                      cursor: "pointer"
                    }}
                  >
                    ♀ Female
                  </button>
                </div>
              </div>

              {/* Age & Height */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#cbd5e1" }}>Age (Years)</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "10px", color: "#ffffff", fontSize: "13px", marginTop: "4px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#cbd5e1" }}>Height (cm)</label>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "10px", color: "#ffffff", fontSize: "13px", marginTop: "4px", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              {/* Current Weight & Target Weight */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#cbd5e1" }}>Current Wt (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={currentWeightKg}
                    onChange={(e) => setCurrentWeightKg(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "10px", color: "#ffffff", fontSize: "13px", marginTop: "4px", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#cbd5e1" }}>Target Wt (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={targetWeightKg}
                    onChange={(e) => setTargetWeightKg(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "10px", color: "#ffffff", fontSize: "13px", marginTop: "4px", boxSizing: "border-box" }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{ flex: 1, height: "46px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "#cbd5e1", fontWeight: 700, fontSize: "12.5px", cursor: "pointer" }}
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                style={{ flex: 2, height: "46px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #6366f1, #38bdf8)", color: "#ffffff", fontWeight: 800, fontSize: "13px", cursor: "pointer" }}
              >
                Next: Activity Level ➜
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 3: DAILY ACTIVITY LEVEL ─── */}
        {step === 3 && (
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 900, marginBottom: "4px" }}>Daily Training Routine</h2>
            <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "16px" }}>How active is your lifestyle outside of tracking?</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
              {activities.map((act) => {
                const isSelected = activityMultiplier === act.mult;
                return (
                  <div
                    key={act.mult}
                    onClick={() => setActivityMultiplier(act.mult)}
                    style={{
                      padding: "12px 14px",
                      borderRadius: "14px",
                      border: isSelected ? "2px solid #38bdf8" : "1px solid rgba(255, 255, 255, 0.1)",
                      background: isSelected ? "rgba(56, 189, 248, 0.12)" : "rgba(255, 255, 255, 0.03)",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 800, color: isSelected ? "#ffffff" : "#e2e8f0" }}>{act.title}</div>
                      <div style={{ fontSize: "11px", color: "#94a3b8" }}>{act.desc}</div>
                    </div>
                    {isSelected && <i className="fa-solid fa-circle-check" style={{ color: "#38bdf8", fontSize: "16px" }}></i>}
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setStep(2)}
                style={{ flex: 1, height: "46px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "#cbd5e1", fontWeight: 700, fontSize: "12.5px", cursor: "pointer" }}
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                style={{ flex: 2, height: "46px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #6366f1, #38bdf8)", color: "#ffffff", fontWeight: 800, fontSize: "13px", cursor: "pointer" }}
              >
                Calculate My Blueprint ⚡
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 4: CALCULATED MACRO BLUEPRINT ─── */}
        {step === 4 && (
          <div>
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px auto", fontSize: "18px" }}>
                <i className="fa-solid fa-award"></i>
              </div>
              <h2 style={{ fontSize: "20px", fontWeight: 900, marginBottom: "4px" }}>Your Athlete Blueprint</h2>
              <p style={{ fontSize: "12px", color: "#94a3b8" }}>Scientific targets calibrated for your goal.</p>
            </div>

            {/* Calories Hero Card */}
            <div style={{
              background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(56, 189, 248, 0.2))",
              border: "1px solid rgba(56, 189, 248, 0.4)",
              borderRadius: "16px",
              padding: "16px",
              textAlign: "center",
              marginBottom: "14px"
            }}>
              <div style={{ fontSize: "11px", fontWeight: 800, color: "#38bdf8", textTransform: "uppercase" }}>Target Daily Energy</div>
              <div style={{ fontSize: "32px", fontWeight: 900, color: "#ffffff", lineHeight: 1.1, margin: "4px 0" }}>
                {calculated.targetCalories.toLocaleString()} <span style={{ fontSize: "14px", fontWeight: 700, color: "#94a3b8" }}>kcal</span>
              </div>
              <div style={{ fontSize: "10.5px", color: "#cbd5e1" }}>
                BMR: {Math.round(calculated.bmr)} kcal • TDEE: {calculated.tdee} kcal
              </div>
            </div>

            {/* Macros 3-Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "14px" }}>
              <div style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "12px", padding: "10px 6px", textAlign: "center" }}>
                <div style={{ fontSize: "14px", fontWeight: 900, color: "#818cf8" }}>{calculated.pG}g</div>
                <div style={{ fontSize: "9.5px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", marginTop: "2px" }}>Protein</div>
              </div>
              <div style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "12px", padding: "10px 6px", textAlign: "center" }}>
                <div style={{ fontSize: "14px", fontWeight: 900, color: "#38bdf8" }}>{calculated.cG}g</div>
                <div style={{ fontSize: "9.5px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", marginTop: "2px" }}>Carbs</div>
              </div>
              <div style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "12px", padding: "10px 6px", textAlign: "center" }}>
                <div style={{ fontSize: "14px", fontWeight: 900, color: "#fbbf24" }}>{calculated.fG}g</div>
                <div style={{ fontSize: "9.5px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", marginTop: "2px" }}>Fats</div>
              </div>
            </div>

            {/* Water Target */}
            <div style={{ background: "rgba(56, 189, 248, 0.08)", border: "1px solid rgba(56, 189, 248, 0.2)", borderRadius: "12px", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <i className="fa-solid fa-droplet" style={{ color: "#38bdf8" }}></i>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#e2e8f0" }}>Daily Hydration Target</span>
              </div>
              <span style={{ fontSize: "13px", fontWeight: 900, color: "#38bdf8" }}>{(calculated.waterMl / 1000).toFixed(1)} Liters</span>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={isSaving}
                style={{ flex: 1, height: "48px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "#cbd5e1", fontWeight: 700, fontSize: "12.5px", cursor: "pointer" }}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleFinish}
                disabled={isSaving}
                style={{
                  flex: 2,
                  height: "48px",
                  borderRadius: "12px",
                  border: "none",
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  color: "#ffffff",
                  fontWeight: 900,
                  fontSize: "13px",
                  cursor: isSaving ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: "0 4px 16px rgba(16, 185, 129, 0.4)"
                }}
              >
                {isSaving ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <>
                    <span>Enter NutriPulse</span>
                    <i className="fa-solid fa-bolt"></i>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
