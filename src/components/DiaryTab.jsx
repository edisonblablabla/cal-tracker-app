import React from "react";

export default function DiaryTab({
  totalCal,
  activeGoal,
  customName,
  setCustomName,
  customPortion,
  setCustomPortion,
  customCal,
  setCustomCal,
  customP,
  setCustomP,
  customC,
  setCustomC,
  customF,
  setCustomF,
  addCustomMeal,
  isAddingMeal,
  todayMeals,
  deleteMeal
}) {
  return (
    <div className="screen active">
      <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "14px" }}>Food & Nutrition Log</h3>

      <div className="diary-summary" style={{ display: "flex", justifyContent: "space-around", textAlign: "center", padding: "12px 0", background: "#f1f5f9", borderRadius: "16px", marginBottom: "16px" }}>
        <div><h4>{totalCal}</h4><p style={{ fontSize: "11px", color: "var(--text-muted)" }}>Eaten</p></div>
        <div><h4>{activeGoal}</h4><p style={{ fontSize: "11px", color: "var(--text-muted)" }}>Goal</p></div>
        <div style={{ color: "var(--success)" }}><h4>{Math.max(0, activeGoal - totalCal)}</h4><p style={{ fontSize: "11px" }}>Left</p></div>
      </div>

      <div className="card">
        <div style={{ fontSize: "14px", fontWeight: 800, marginBottom: "10px" }}>Log Food Entry</div>
        
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "8px" }}>
          <div>
            <label style={{ fontSize: "11px", fontWeight: 700 }}>Food / Dish Name</label>
            <input type="text" className="form-input" placeholder="e.g. Chicken Adobo" value={customName} onChange={e => setCustomName(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: "11px", fontWeight: 700 }}>Portion Size</label>
            <input type="text" className="form-input" placeholder="e.g. 1 plate / 1 cup" value={customPortion} onChange={e => setCustomPortion(e.target.value)} />
          </div>
        </div>
        
        <label style={{ fontSize: "11px", fontWeight: 700 }}>Calories (kcal)</label>
        <input type="number" className="form-input" placeholder="e.g. 350" value={customCal} onChange={e => setCustomCal(e.target.value)} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
          <div><label style={{ fontSize: "10px", fontWeight: 700 }}>Protein (g)</label><input type="number" className="form-input" placeholder="0" value={customP} onChange={e => setCustomP(e.target.value)} /></div>
          <div><label style={{ fontSize: "10px", fontWeight: 700 }}>Carbs (g)</label><input type="number" className="form-input" placeholder="0" value={customC} onChange={e => setCustomC(e.target.value)} /></div>
          <div><label style={{ fontSize: "10px", fontWeight: 700 }}>Fats (g)</label><input type="number" className="form-input" placeholder="0" value={customF} onChange={e => setCustomF(e.target.value)} /></div>
        </div>

        <button className="btn-block" onClick={addCustomMeal} disabled={isAddingMeal}>
          {isAddingMeal ? "Adding Meal..." : "Add to Today's Log"}
        </button>
      </div>

      <div className="card">
        <div style={{ fontSize: "14px", fontWeight: 800, marginBottom: "8px" }}>Today's Logged Meals</div>
        <div>
          {(todayMeals.length === 0) ? (
            <p style={{ fontSize: "12px", color: "var(--text-muted)", textAlign: "center", padding: "16px 0" }}>No meals logged yet today.</p>
          ) : (
            todayMeals.map((m, idx) => (
              <div key={m.id} className="food-entry" style={{ borderLeft: idx === 0 ? "3px solid var(--primary)" : "none", paddingLeft: idx === 0 ? "8px" : "0" }}>
                <div>
                  <div style={{ fontWeight: 800, display: "flex", alignItems: "center", gap: "6px" }}>
                    {m.name} 
                    <small style={{ fontWeight: 600, color: "var(--primary)" }}>({m.portion || "1 serving"})</small>
                    {idx === 0 && <span style={{ fontSize: "9px", background: "var(--primary)", color: "white", padding: "1px 5px", borderRadius: "4px" }}>Last Meal</span>}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{m.cal} kcal • P:{m.p}g C:{m.c}g F:{m.f}g</div>
                </div>
                <i className="fa-solid fa-trash" style={{ color: "var(--danger)", cursor: "pointer" }} onClick={() => deleteMeal(m.id)}></i>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
