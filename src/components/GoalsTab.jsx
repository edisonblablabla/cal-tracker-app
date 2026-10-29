import React from "react";

const DEFAULT_GOAL_TITLES = {
  "jogger": "Daily Jogger",
  "marathon": "Endurance & Marathon",
  "steps": "Daily 10k Steps",
  "bulk": "Lean Bulk",
  "cut": "Aggressive Cut",
  "recomp": "Body Recomposition",
  "dirty": "Heavy Mass Gain",
  "maint": "Maintenance"
};

export default function GoalsTab({
  appData,
  activeGoal,
  goalTitles = DEFAULT_GOAL_TITLES,
  setGoalPreset
}) {
  const titles = goalTitles || DEFAULT_GOAL_TITLES;

  return (
    <div className="screen active">
      <h3 style={{ fontSize: "18px", fontWeight: 800, textAlign: "center", marginBottom: "14px" }}>Fitness Objectives & Strategies</h3>
      
      <div className="card" style={{ background: "linear-gradient(135deg, #4f46e5, #3730a3)", color: "white", marginBottom: "14px" }}>
        <p style={{ fontSize: "11px", opacity: 0.8 }}>Active Strategy Plan</p>
        <h2 style={{ fontSize: "20px", fontWeight: 800 }}>{titles[appData?.activeGoalType || 'jogger']}</h2>
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
  );
}
