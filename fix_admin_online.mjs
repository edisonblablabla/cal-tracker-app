import fs from 'fs';

let code = fs.readFileSync('src/App.jsx', 'utf8');

// Linisin ang hidden spaces
code = code.replace(/[\u00a0\xa0]/g, ' ');

// 1. Maglagay ng Active Heartbeat Loop (Updates every 2 mins while active)
const oldHeartbeat = `// Heartbeat presence update
          setDoc(userDocRef, { lastSeen: Date.now() }, { merge: true });`;

const newHeartbeat = `// Heartbeat presence update
          setDoc(userDocRef, { lastSeen: Date.now() }, { merge: true });
          const heartbeatInterval = setInterval(() => {
            setDoc(userDocRef, { lastSeen: Date.now() }, { merge: true }).catch(console.error);
          }, 120000);`;

if (!code.includes('heartbeatInterval')) {
  code = code.replace(oldHeartbeat, newHeartbeat);
}

// 2. Aayusin ang Admin Refresh Button Function
const oldRefreshBtn = `<button onClick={() => { fetchPosts(); fetchUsers(); }} style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", padding: "6px 12px", borderRadius: "12px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                Refresh
              </button>`;

const newRefreshBtn = `<button onClick={async () => { await fetchPosts(); await fetchUsers(); setAppData(prev => ({ ...prev })); alert("Admin Dashboard Refreshed!"); }} style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", padding: "6px 12px", borderRadius: "12px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                <i className="fa-solid fa-rotate-right" style={{ marginRight: "4px" }}></i> Refresh
              </button>`;

if (code.includes('Refresh')) {
  code = code.replace(oldRefreshBtn, newRefreshBtn);
}

fs.writeFileSync('src/App.jsx', code);
console.log('✅ Heartbeat loop and Admin Refresh button fixed!');
