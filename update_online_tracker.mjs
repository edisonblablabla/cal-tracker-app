import fs from 'fs';

let code = fs.readFileSync('src/App.jsx', 'utf8');

// Linisin ang hidden spaces
code = code.replace(/[\u00a0\xa0]/g, ' ');

// 1. Maglagay ng Heartbeat Presence Effect sa User Auth
const oldAuthEffect = `if (docSnap.exists()) {
          const data = docSnap.data();
          setAppData(data);`;

const newAuthEffect = `if (docSnap.exists()) {
          const data = docSnap.data();
          setAppData(data);
          // Heartbeat presence update
          setDoc(userDocRef, { lastSeen: Date.now() }, { merge: true });`;

if (!code.includes('lastSeen: Date.now()')) {
  code = code.replace(oldAuthEffect, newAuthEffect);
}

// 2. I-update ang User Card UI sa Admin Tab para sa Online Badge & Summary
const oldAdminUserTab = `{adminSubTab === "posts" ? (`;

const newAdminUserSummary = `
            {/* ONLINE SUMMARY CARD */}
            {adminSubTab === "users" && (
              <div style={{ background: "linear-gradient(135deg, #0f172a, #1e293b)", color: "white", padding: "14px", borderRadius: "16px", marginBottom: "14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", textAlign: "center" }}>
                <div style={{ background: "rgba(255,255,255,0.08)", padding: "10px", borderRadius: "12px" }}>
                  <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700 }}>🟢 ONLINE NOW</div>
                  <div style={{ fontSize: "20px", fontWeight: 900, color: "#10b981", marginTop: "2px" }}>
                    {userList.filter(u => u.lastSeen && (Date.now() - u.lastSeen < 300000)).length} Users
                  </div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.08)", padding: "10px", borderRadius: "12px" }}>
                  <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700 }}>👥 TOTAL USERS</div>
                  <div style={{ fontSize: "20px", fontWeight: 900, color: "#38bdf8", marginTop: "2px" }}>
                    {userList.length} Accounts
                  </div>
                </div>
              </div>
            )}

            {adminSubTab === "posts" ? (`;

if (!code.includes('ONLINE NOW')) {
  code = code.replace(oldAdminUserTab, newAdminUserSummary);
}

// 3. Status Badge sa Bawat User Card
const oldUserCardName = `<div style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a" }}>
                            {u.userName || "Athlete"} `;

const newUserCardName = `<div style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
                            {u.userName || "Athlete"} 
                            {u.lastSeen && (Date.now() - u.lastSeen < 300000) ? (
                              <span style={{ fontSize: "9px", background: "#10b981", color: "white", padding: "2px 6px", borderRadius: "6px", fontWeight: 800 }}>🟢 Online</span>
                            ) : (
                              <span style={{ fontSize: "9px", background: "#94a3b8", color: "white", padding: "2px 6px", borderRadius: "6px", fontWeight: 800 }}>⚪ Offline</span>
                            )}`;

if (!code.includes('🟢 Online')) {
  code = code.replace(oldUserCardName, newUserCardName);
}

fs.writeFileSync('src/App.jsx', code);
console.log('✅ Online Presence & Status Tracker successfully added to Admin Tab!');
