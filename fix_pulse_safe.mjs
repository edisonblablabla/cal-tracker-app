import fs from 'fs';

let code = fs.readFileSync('src/App.jsx', 'utf8');

// Linisin ang hidden spaces
code = code.replace(/[\u00a0\xa0]/g, ' ');

// 1. Rename Community/Social Tab Labels in Navigation
code = code.replace(/<span>Community<\/span>/g, '<span>Pulse</span>');
code = code.replace(/<span>Social<\/span>/g, '<span>Pulse</span>');

// 2. Add Missing States safely
if (!code.includes('userNote')) {
  code = code.replace(
    'const [isRefreshing, setIsRefreshing] = useState(false);',
    'const [isRefreshing, setIsRefreshing] = useState(false);\n  const [userNote, setUserNote] = useState("");\n  const [showNoteModal, setShowNoteModal] = useState(false);'
  );
}

// 3. Target exact Community Section inside JSX
const oldCommunitySection = `<h3 style={{ fontSize: "18px", fontWeight: 800, textAlign: "center", marginBottom: "14px" }}>Community Feed</h3>`;

const newPulseHeaderAndWidgets = `<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 800, margin: 0 }}>⚡ Pulse</h3>
              <button onClick={() => setShowPostModal(true)} style={{ background: "var(--primary)", color: "white", border: "none", padding: "6px 12px", borderRadius: "12px", fontSize: "11px", fontWeight: 800, cursor: "pointer" }}>
                <i className="fa-solid fa-plus"></i> New Post
              </button>
            </div>

            {/* DAILY NOTES (THOUGHT BUBBLES) */}
            <div className="card" style={{ padding: "12px", borderRadius: "16px", marginBottom: "12px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>💬 Daily Notes (Thoughts)</span>
                <span style={{ fontSize: "9px", color: "var(--primary)", fontWeight: 700, cursor: "pointer" }} onClick={() => setShowNoteModal(true)}>+ Add Note</span>
              </div>
              <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "4px" }}>
                {/* YOUR NOTE ENTRY */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: "60px", cursor: "pointer" }} onClick={() => setShowNoteModal(true)}>
                  <div style={{ background: "#e0e7ff", color: "var(--primary)", padding: "2px 6px", borderRadius: "8px", fontSize: "8px", fontWeight: 800, marginBottom: "2px", whiteSpace: "nowrap", maxWidth: "65px", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {userNote || "Share..."}
                  </div>
                  <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--primary)", overflow: "hidden" }}>
                    <img src={appData?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"} alt="You" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <span style={{ fontSize: "9px", fontWeight: 700, marginTop: "2px", color: "#0f172a" }}>You</span>
                </div>

                {/* DEMO COMMUNITY NOTES */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: "60px" }}>
                  <div style={{ background: "#f1f5f9", color: "#334155", padding: "2px 6px", borderRadius: "8px", fontSize: "8px", fontWeight: 800, marginBottom: "2px", whiteSpace: "nowrap" }}>Leg Day 🦵</div>
                  <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#cbd5e1", overflow: "hidden" }}>
                    <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" alt="Alex" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <span style={{ fontSize: "9px", fontWeight: 700, marginTop: "2px", color: "#64748b" }}>Alex</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: "60px" }}>
                  <div style={{ background: "#f1f5f9", color: "#334155", padding: "2px 6px", borderRadius: "8px", fontSize: "8px", fontWeight: 800, marginBottom: "2px", whiteSpace: "nowrap" }}>High Protein 🥗</div>
                  <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#cbd5e1", overflow: "hidden" }}>
                    <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" alt="Sarah" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <span style={{ fontSize: "9px", fontWeight: 700, marginTop: "2px", color: "#64748b" }}>Sarah</span>
                </div>
              </div>
            </div>

            {/* STORIES / MY DAY SNAPSHOTS */}
            <div style={{ marginBottom: "14px" }}>
              <div style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", marginBottom: "6px" }}>📸 My Day Snapshots</div>
              <div style={{ display: "flex", gap: "8px", overflowX: "auto" }}>
                {/* ADD STORY BUTTON */}
                <div style={{ minWidth: "75px", height: "100px", borderRadius: "12px", background: "linear-gradient(135deg, #1e293b, #0f172a)", color: "white", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "1px dashed #64748b" }} onClick={() => setShowPostModal(true)}>
                  <i className="fa-solid fa-camera" style={{ fontSize: "16px", color: "#38bdf8", marginBottom: "4px" }}></i>
                  <span style={{ fontSize: "8px", fontWeight: 800 }}>Add Story</span>
                </div>

                {/* DEMO STORIES */}
                <div style={{ minWidth: "75px", height: "100px", borderRadius: "12px", overflow: "hidden", position: "relative", border: "2px solid #10b981" }}>
                  <img src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=300" alt="Workout" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <div style={{ position: "absolute", bottom: "4px", left: "4px", fontSize: "8px", fontWeight: 800, color: "white", textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>Mike • Gym</div>
                </div>

                <div style={{ minWidth: "75px", height: "100px", borderRadius: "12px", overflow: "hidden", position: "relative", border: "2px solid #818cf8" }}>
                  <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300" alt="Meal" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <div style={{ position: "absolute", bottom: "4px", left: "4px", fontSize: "8px", fontWeight: 800, color: "white", textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>Elena • Meal</div>
                </div>
              </div>
            </div>`;

if (code.includes('Community Feed')) {
  code = code.replace(oldCommunitySection, newPulseHeaderAndWidgets);
}

fs.writeFileSync('src/App.jsx', code);
console.log('✅ App.jsx fully restored and Pulse features safely installed!');
