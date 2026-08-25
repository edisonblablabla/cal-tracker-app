import fs from 'fs';

let code = fs.readFileSync('src/App.jsx', 'utf8');

// Linisin ang hidden space characters
code = code.replace(/[\u00a0\xa0]/g, ' ');

// 1. Compact Summary Card (Online & Total Users Box)
const oldSummaryCard = `<div style={{ background: "linear-gradient(135deg, #0f172a, #1e293b)", color: "white", padding: "14px", borderRadius: "16px", marginBottom: "14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", textAlign: "center" }}>
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
              </div>`;

const compactSummaryCard = `<div style={{ background: "linear-gradient(135deg, #0f172a, #1e293b)", color: "white", padding: "8px 12px", borderRadius: "12px", marginBottom: "10px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", textAlign: "center" }}>
                <div style={{ background: "rgba(255,255,255,0.08)", padding: "6px 8px", borderRadius: "8px" }}>
                  <div style={{ fontSize: "9px", color: "#94a3b8", fontWeight: 700 }}>🟢 ONLINE NOW</div>
                  <div style={{ fontSize: "15px", fontWeight: 900, color: "#10b981", marginTop: "1px" }}>
                    {userList.filter(u => u.lastSeen && (Date.now() - u.lastSeen < 300000)).length} Users
                  </div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.08)", padding: "6px 8px", borderRadius: "8px" }}>
                  <div style={{ fontSize: "9px", color: "#94a3b8", fontWeight: 700 }}>👥 TOTAL USERS</div>
                  <div style={{ fontSize: "15px", fontWeight: 900, color: "#38bdf8", marginTop: "1px" }}>
                    {userList.length} Accounts
                  </div>
                </div>
              </div>`;

if (code.includes('🟢 ONLINE NOW')) {
  code = code.replace(oldSummaryCard, compactSummaryCard);
}

// 2. Compact User Card Items (Dense List Item View)
const oldUserCard = `userList.map(u => (
                    <div key={u.uid} className="card" style={{ padding: "14px", borderRadius: "18px", marginBottom: "10px", border: u.isBanned ? "1px solid #ef4444" : "1px solid #e2e8f0", background: u.isBanned ? "#fef2f2" : "#ffffff" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
                            {u.userName || "Athlete"} 
                            {u.lastSeen && (Date.now() - u.lastSeen < 300000) ? (
                              <span style={{ fontSize: "9px", background: "#10b981", color: "white", padding: "2px 6px", borderRadius: "6px", fontWeight: 800 }}>🟢 Online</span>
                            ) : (
                              <span style={{ fontSize: "9px", background: "#94a3b8", color: "white", padding: "2px 6px", borderRadius: "6px", fontWeight: 800 }}>⚪ Offline</span>
                            )}
                            {u.isBanned && <span style={{ fontSize: "9px", background: "#ef4444", color: "white", padding: "2px 6px", borderRadius: "6px", marginLeft: "6px" }}>Banned</span>}
                          </div>
                          <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>{u.userEmail || "No email log"}</div>
                          <div style={{ fontSize: "9px", color: "#64748b", marginTop: "2px" }}>UID: {u.uid}</div>
                          <div style={{ fontSize: "9px", color: "var(--primary)", fontWeight: 700, marginTop: "2px" }}>
                            Joined: {u.createdAt ? formatPostTime(u.createdAt) : "Date & Time Unrecorded"}
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: "6px" }}>
                          <button 
                            onClick={() => toggleBanUser(u.uid, u.isBanned)}
                            style={{ background: u.isBanned ? "#10b981" : "#f59e0b", color: "white", border: "none", borderRadius: "10px", padding: "5px 10px", fontSize: "10px", fontWeight: 800, cursor: "pointer" }}
                          >
                            {u.isBanned ? "Unban" : "Ban User"}
                          </button>
                          <button 
                            onClick={() => deleteUserData(u.uid)}
                            style={{ background: "#dc2626", color: "white", border: "none", borderRadius: "10px", padding: "5px 10px", fontSize: "10px", fontWeight: 800, cursor: "pointer" }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))`;

const compactUserCard = `userList.map(u => (
                    <div key={u.uid} className="card" style={{ padding: "8px 12px", borderRadius: "12px", marginBottom: "6px", border: u.isBanned ? "1px solid #ef4444" : "1px solid #e2e8f0", background: u.isBanned ? "#fef2f2" : "#ffffff" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ flex: 1, minWidth: 0, paddingRight: "8px" }}>
                          <div style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "120px" }}>{u.userName || "Athlete"}</span>
                            {u.lastSeen && (Date.now() - u.lastSeen < 300000) ? (
                              <span style={{ fontSize: "8px", background: "#10b981", color: "white", padding: "1px 5px", borderRadius: "4px", fontWeight: 800 }}>🟢 Online</span>
                            ) : (
                              <span style={{ fontSize: "8px", background: "#94a3b8", color: "white", padding: "1px 5px", borderRadius: "4px", fontWeight: 800 }}>⚪ Offline</span>
                            )}
                            {u.isBanned && <span style={{ fontSize: "8px", background: "#ef4444", color: "white", padding: "1px 5px", borderRadius: "4px" }}>Banned</span>}
                          </div>
                          <div style={{ fontSize: "9px", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.userEmail || "No email"}</div>
                          <div style={{ fontSize: "8px", color: "#64748b", display: "flex", gap: "8px", marginTop: "1px" }}>
                            <span>UID: {u.uid.slice(0, 8)}...</span>
                            <span style={{ color: "var(--primary)", fontWeight: 700 }}>
                              {u.createdAt ? formatPostTime(u.createdAt) : "No Date"}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                          <button 
                            onClick={() => toggleBanUser(u.uid, u.isBanned)}
                            style={{ background: u.isBanned ? "#10b981" : "#f59e0b", color: "white", border: "none", borderRadius: "6px", padding: "4px 8px", fontSize: "9px", fontWeight: 800, cursor: "pointer" }}
                          >
                            {u.isBanned ? "Unban" : "Ban"}
                          </button>
                          <button 
                            onClick={() => deleteUserData(u.uid)}
                            style={{ background: "#dc2626", color: "white", border: "none", borderRadius: "6px", padding: "4px 8px", fontSize: "9px", fontWeight: 800, cursor: "pointer" }}
                          >
                            Del
                          </button>
                        </div>
                      </div>
                    </div>
                  ))`;

if (code.includes('Delete')) {
  code = code.replace(oldUserCard, compactUserCard);
}

fs.writeFileSync('src/App.jsx', code);
console.log('✅ Compact Admin Dashboard list view applied successfully!');
