import glob, re

target_files = glob.glob("**/App.jsx", recursive=True) + glob.glob("**/App.js", recursive=True)

if not target_files:
    print("❌ Hindi mahanap ang App.jsx!")
    exit()

file_path = target_files[0]
print(f"📁 Applying Uniform Slide-over Panel Engine to: {file_path}")

with open(file_path, "r") as f:
    code = f.read()

# 1. Slide-over Panel Engine Styles & Helpers
panel_states = """
  // UNIFORM SLIDE-OVER PANEL STATES
  const [activePanel, setActivePanel] = useState(null); // 'notif', 'post_detail', 'boosters', 'boosting', 'settings', 'visitor_profile'
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
"""

if "const [activePanel, setActivePanel]" not in code:
    code = code.replace("function App() {", "function App() {\n" + panel_states)
    code = code.replace("export default function App() {", "export default function App() {\n" + panel_states)

# 2. Universal Panel Shell Injector
panel_shell_component = """
      {/* UNIFORM SLIDE-OVER PANEL CONTAINER */}
      {activePanel && (
        <div style={{
          position: "fixed",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          maxWidth: "480px",
          width: "100%",
          height: "100vh",
          background: "#ffffff",
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
        }}>
          {/* Universal Panel Header */}
          <div style={{
            padding: "16px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#ffffff"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button onClick={() => setActivePanel(null)} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#334155" }}>
                <i className="fa-solid fa-arrow-left"></i>
              </button>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
                {activePanel === 'notif' && 'Notifications'}
                {activePanel === 'post_detail' && 'Post Detail'}
                {activePanel === 'boosters' && 'Boosters'}
                {activePanel === 'boosting' && 'Boosting'}
                {activePanel === 'settings' && 'Profile Settings'}
                {activePanel === 'visitor_profile' && (selectedVisitor?.userName || 'Athlete Profile')}
              </h3>
            </div>
            {activePanel === 'notif' && (
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#0284c7", background: "#e0f2fe", padding: "4px 10px", borderRadius: "12px" }}>
                {allUserNotifs.length} New
              </span>
            )}
          </div>

          {/* Panel Content Body */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
            {/* NOTIFICATION PANEL */}
            {activePanel === 'notif' && (
              allUserNotifs.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8", fontSize: "13px" }}>
                  <i className="fa-regular fa-bell-slash" style={{ fontSize: "32px", marginBottom: "10px", display: "block" }}></i>
                  No notifications yet.
                </div>
              ) : (
                allUserNotifs.map(notif => (
                  <div key={notif.id} onClick={() => {
                    if (notif.postId) {
                      const found = posts.find(p => p.id === notif.postId);
                      if (found) { setSelectedPost(found); setActivePanel('post_detail'); }
                    }
                  }} style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px",
                    borderRadius: "12px",
                    background: "#f8fafc",
                    marginBottom: "8px",
                    border: "1px solid #f1f5f9",
                    cursor: "pointer"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                      {notif.avatar ? (
                        <img src={notif.avatar} alt="" style={{ width: "38px", height: "38px", borderRadius: "50%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#0284c7", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "14px" }}>
                          {notif.title.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "12px", color: "#0f172a" }}>
                          <strong>{notif.title}</strong> {notif.text}
                        </div>
                        <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "3px", fontWeight: 600 }}>
                          {formatPostTime(notif.timestamp)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )
            )}

            {/* SINGLE POST DETAIL PANEL */}
            {activePanel === 'post_detail' && selectedPost && (
              <div style={{ background: "#ffffff" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                  <img src={selectedPost.userAvatar || "https://via.placeholder.com/40"} alt="" style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }} />
                  <div>
                    <strong style={{ fontSize: "14px", color: "#0f172a", display: "block" }}>{selectedPost.userName || "Athlete"}</strong>
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>{formatPostTime(selectedPost.createdAt)}</span>
                  </div>
                </div>
                {selectedPost.text && <p style={{ fontSize: "14px", color: "#334155", lineHeight: "1.5", marginBottom: "12px" }}>{selectedPost.text}</p>}
                {selectedPost.imageUrl && <img src={selectedPost.imageUrl} alt="" style={{ width: "100%", borderRadius: "12px", marginBottom: "12px" }} />}
                <div style={{ display: "flex", gap: "16px", padding: "12px 0", borderTop: "1px solid #f1f5f9", borderBottom: "1px solid #f1f5f9" }}>
                  <button onClick={() => handleLike(selectedPost.id, selectedPost.likedBy || [])} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 700, color: (selectedPost.likedBy || []).includes(user?.uid) ? "#ef4444" : "#64748b" }}>
                    <i className="fa-solid fa-heart" style={{ marginRight: "4px" }}></i> Pulse ({selectedPost.likedBy?.length || 0})
                  </button>
                </div>
              </div>
            )}

            {/* PROFILE SETTINGS PANEL */}
            {activePanel === 'settings' && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "6px" }}>Display Name</label>
                  <input type="text" defaultValue={appData?.userName || ""} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "6px" }}>Bio / Fitness Quote</label>
                  <textarea defaultValue={appData?.bio || ""} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", height: "80px", boxSizing: "border-box" }}></textarea>
                </div>
                <button onClick={() => { showToast("Profile settings updated!"); setActivePanel(null); }} style={{ padding: "12px", background: "#0284c7", color: "white", border: "none", borderRadius: "10px", fontWeight: 800, cursor: "pointer", marginTop: "10px" }}>
                  Save Changes
                </button>
              </div>
            )}

            {/* BOOSTERS LIST PANEL */}
            {activePanel === 'boosters' && (
              <div>
                <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#64748b" }}>Athletes boosting you</h4>
                {/* List mapping placeholder */}
                <div style={{ fontSize: "13px", color: "#94a3b8", textAlign: "center", padding: "20px" }}>Your boosters will appear here.</div>
              </div>
            )}

            {/* BOOSTING LIST PANEL */}
            {activePanel === 'boosting' && (
              <div>
                <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#64748b" }}>Athletes you are boosting</h4>
                {/* List mapping placeholder */}
                <div style={{ fontSize: "13px", color: "#94a3b8", textAlign: "center", padding: "20px" }}>Athletes you boost will appear here.</div>
              </div>
            )}
          </div>
        </div>
      )}
"""

# Clean old modals and bind triggers
lines = code.splitlines()
clean_lines = []
skip = False
for line in lines:
    if "UNIFORM SLIDE-OVER PANEL CONTAINER" in line or "showNotifModal && (" in line:
        skip = True
        continue
    if skip and "{/* FIXED BOTTOM NAVIGATION BAR */}" in line:
        skip = False
    if not skip:
        clean_lines.append(line)

code = "\n".join(clean_lines)

# Inject triggers
code = code.replace("setShowNotifModal(true)", "setActivePanel('notif')")
code = code.replace("setShowNotifModal(!showNotifModal)", "setActivePanel(activePanel === 'notif' ? null : 'notif')")

# Bind Profile Settings Gear Icon
code = re.sub(r'(<i[^>]*fa-gear[^>]*>.*?</i>|<button[^>]*>.*?gear.*?</button>)', lambda m: f'<span onClick={() => setActivePanel("settings")} style={{{{cursor: "pointer"}}}>{m.group(0)}</span>', code)

# Insert Slide-over Panel Engine before bottom nav
code = code.replace("      {/* FIXED BOTTOM NAVIGATION BAR */}", panel_shell_component + "\n      {/* FIXED BOTTOM NAVIGATION BAR */}")

with open(file_path, "w") as f:
    f.write(code)

print("🚀 Uniform Slide-over Panel System successfully integrated!")
