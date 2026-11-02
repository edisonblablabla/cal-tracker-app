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

  const goals = [
    { id: "cut", title: "Fat Loss & Cut", icon: "fa-solid fa-fire", color: "#ef4444", desc: "Burn body fat while preserving lean muscle.", calDelta: -400 },
    { id: "bulk", title: "Muscle Build & Bulk", icon: "fa-solid fa-dumbbell", color: "#3b82f6", desc: "Clean surplus to gain strength and muscle.", calDelta: 300 },
    { id: "recomp", title: "Body Recomposition", icon: "fa-solid fa-arrows-rotate", color: "#10b981", desc: "Tone physique and trim fat at maintenance.", calDelta: 0 },
    { id: "marathon", title: "Athletic Endurance", icon: "fa-solid fa-person-running", color: "#f59e0b", desc: "Sustained fuel for runners and cardio athletes.", calDelta: 350 }
  ];

  const activities = [
    { mult: 1.2, title: "Sedentary", desc: "Desk job, little to no workout" },
    { mult: 1.375, title: "Light Activity", desc: "1-3 workout days per week" },
    { mult: 1.55, title: "Moderate Athlete", desc: "3-5 active workout sessions per week" },
    { mult: 1.725, title: "High Performer", desc: "6-7 intense days or hard physical labor" }
  ];

  // Mifflin-St Jeor Precision Macro Calculation
  const calculateMacros = () => {
    const w = parseFloat(currentWeightKg) || 65;
    const h = parseFloat(heightCm) || 168;
    const a = parseInt(age, 10) || 25;
    const act = parseFloat(activityMultiplier) || 1.55;

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
      padding: "20px",
      minHeight: "100dvh",
      background: "linear-gradient(180deg, #f8fafc 0%, #edf2f7 100%)",
      boxSizing: "border-box"
    }}>
      <div className="card" style={{
        maxWidth: "420px",
        width: "100%",
        padding: "24px 22px",
        borderRadius: "20px",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.06), 0 8px 10px -6px rgba(0, 0, 0, 0.04)"
      }}>
        {/* Header & Step Progress Bar */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 900, color: "var(--primary)", letterSpacing: "-0.5px", margin: 0 }}>
              NUTRIPULSE
            </h2>
            <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--primary)" }}>
              Step {step} of 4
            </span>
          </div>
          <div style={{ height: "6px", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
            <div style={{
              width: `${(step / 4) * 100}%`,
              height: "100%",
              background: "var(--primary)",
              transition: "width 0.3s ease"
            }}></div>
          </div>
        </div>

        {/* ─── STEP 1: PRIMARY OBJECTIVE ─── */}
        {step === 1 && (
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: 900, color: "#0f172a", marginBottom: "4px" }}>
              What is your primary fitness goal?
            </h3>
            <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "16px" }}>
              This helps personalize your calorie and macro nutrition targets.
            </p>

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
                      border: isSelected ? "2px solid var(--primary)" : "1px solid #e2e8f0",
                      background: isSelected ? "#eef2ff" : "#ffffff",
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
                      background: g.color + "15",
                      color: g.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "16px",
                      flexShrink: 0
                    }}>
                      <i className={g.icon}></i>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a" }}>{g.title}</div>
                      <div style={{ fontSize: "11px", color: "#64748b", lineHeight: 1.3 }}>{g.desc}</div>
                    </div>
                    {isSelected && <i className="fa-solid fa-circle-check" style={{ color: "var(--primary)", fontSize: "16px" }}></i>}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="btn-block"
              style={{ height: "46px", fontSize: "13px", fontWeight: 800 }}
            >
              Continue to Vitals ➜
            </button>
          </div>
        )}

        {/* ─── STEP 2: BODY METRICS & VITALS ─── */}
        {step === 2 && (
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: 900, color: "#0f172a", marginBottom: "4px" }}>
              Athlete Vitals & Metrics
            </h3>
            <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "16px" }}>
              Accurate vitals ensure scientific caloric precision.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
              <div>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "#334155" }}>Athlete Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Your Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{ marginTop: "4px" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "11px", fontWeight: 700, color: "#334155" }}>Biological Gender</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "4px" }}>
                  <button
                    type="button"
                    onClick={() => setGender("male")}
                    style={{
                      padding: "9px",
                      borderRadius: "10px",
                      border: gender === "male" ? "2px solid var(--primary)" : "1px solid #e2e8f0",
                      background: gender === "male" ? "#eef2ff" : "#ffffff",
                      color: gender === "male" ? "var(--primary)" : "#334155",
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
                      border: gender === "female" ? "2px solid #ec4899" : "1px solid #e2e8f0",
                      background: gender === "female" ? "#fdf2f8" : "#ffffff",
                      color: gender === "female" ? "#ec4899" : "#334155",
                      fontWeight: 800,
                      fontSize: "12px",
                      cursor: "pointer"
                    }}
                  >
                    ♀ Female
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#334155" }}>Age (Years)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    style={{ marginTop: "4px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#334155" }}>Height (cm)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    style={{ marginTop: "4px" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#334155" }}>Current Wt (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    value={currentWeightKg}
                    onChange={(e) => setCurrentWeightKg(e.target.value)}
                    style={{ marginTop: "4px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#334155" }}>Target Wt (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    value={targetWeightKg}
                    onChange={(e) => setTargetWeightKg(e.target.value)}
                    style={{ marginTop: "4px" }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{ flex: 1, height: "46px", borderRadius: "10px", border: "1px solid #cbd5e1", background: "#ffffff", color: "#64748b", fontWeight: 800, fontSize: "12.5px", cursor: "pointer" }}
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="btn-block"
                style={{ flex: 2, height: "46px", fontSize: "13px", fontWeight: 800 }}
              >
                Next: Activity Level ➜
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 3: DAILY ACTIVITY LEVEL ─── */}
        {step === 3 && (
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: 900, color: "#0f172a", marginBottom: "4px" }}>
              Daily Activity & Training
            </h3>
            <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "16px" }}>
              How active is your lifestyle outside of tracking?
            </p>

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
                      border: isSelected ? "2px solid var(--primary)" : "1px solid #e2e8f0",
                      background: isSelected ? "#eef2ff" : "#ffffff",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a" }}>{act.title}</div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>{act.desc}</div>
                    </div>
                    {isSelected && <i className="fa-solid fa-circle-check" style={{ color: "var(--primary)", fontSize: "16px" }}></i>}
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setStep(2)}
                style={{ flex: 1, height: "46px", borderRadius: "10px", border: "1px solid #cbd5e1", background: "#ffffff", color: "#64748b", fontWeight: 800, fontSize: "12.5px", cursor: "pointer" }}
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="btn-block"
                style={{ flex: 2, height: "46px", fontSize: "13px", fontWeight: 800 }}
              >
                Calculate Targets ➜
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 4: CALCULATED MACRO BLUEPRINT ─── */}
        {step === 4 && (
          <div>
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#eef2ff", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px auto", fontSize: "18px" }}>
                <i className="fa-solid fa-calculator"></i>
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: 900, color: "#0f172a", marginBottom: "4px" }}>
                Your Calibrated Targets
              </h3>
              <p style={{ fontSize: "12px", color: "#64748b" }}>
                Scientific targets calculated specifically from your vitals.
              </p>
            </div>

            {/* Daily Calorie Box */}
            <div style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              padding: "14px",
              textAlign: "center",
              marginBottom: "12px"
            }}>
              <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--primary)", textTransform: "uppercase" }}>Daily Energy Target</div>
              <div style={{ fontSize: "28px", fontWeight: 900, color: "#0f172a", lineHeight: 1.1, margin: "4px 0" }}>
                {calculated.targetCalories.toLocaleString()} <span style={{ fontSize: "13px", fontWeight: 700, color: "#64748b" }}>kcal</span>
              </div>
              <div style={{ fontSize: "10.5px", color: "#64748b" }}>
                BMR: {Math.round(calculated.bmr)} kcal • TDEE: {calculated.tdee} kcal
              </div>
            </div>

            {/* 3 Macro Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "12px" }}>
              <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "10px", padding: "8px 4px", textAlign: "center" }}>
                <div style={{ fontSize: "14px", fontWeight: 900, color: "#2563eb" }}>{calculated.pG}g</div>
                <div style={{ fontSize: "9px", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>Protein</div>
              </div>
              <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "10px", padding: "8px 4px", textAlign: "center" }}>
                <div style={{ fontSize: "14px", fontWeight: 900, color: "#059669" }}>{calculated.cG}g</div>
                <div style={{ fontSize: "9px", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>Carbs</div>
              </div>
              <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "10px", padding: "8px 4px", textAlign: "center" }}>
                <div style={{ fontSize: "14px", fontWeight: 900, color: "#d97706" }}>{calculated.fG}g</div>
                <div style={{ fontSize: "9px", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>Fats</div>
              </div>
            </div>

            {/* Water Target */}
            <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "10px", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <i className="fa-solid fa-droplet" style={{ color: "#0284c7" }}></i>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#0369a1" }}>Hydration Target</span>
              </div>
              <span style={{ fontSize: "12.5px", fontWeight: 900, color: "#0284c7" }}>{(calculated.waterMl / 1000).toFixed(1)} Liters</span>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={isSaving}
                style={{ flex: 1, height: "46px", borderRadius: "10px", border: "1px solid #cbd5e1", background: "#ffffff", color: "#64748b", fontWeight: 800, fontSize: "12.5px", cursor: "pointer" }}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleFinish}
                disabled={isSaving}
                className="btn-block"
                style={{
                  flex: 2,
                  height: "46px",
                  fontSize: "13px",
                  fontWeight: 800,
                  cursor: isSaving ? "not-allowed" : "pointer"
                }}
              >
                {isSaving ? "Saving Profile..." : "Save & Enter App"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
