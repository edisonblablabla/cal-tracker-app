import React, { useState, useEffect } from "react";
import { db } from "../services/firebase";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, increment } from "firebase/firestore";

export default function CommunityTab({ draftSocialPost, setDraftSocialPost, user, showToast }) {
  // ─── TABS & PANELS STATE ───
  const [activeTab, setActiveTab] = useState("leaderboard"); // 'leaderboard' or 'feed'
  const [showSearch, setShowSearch] = useState(false);
  const [showMessages, setShowMessages] = useState(false);

  // ─── POST COMPOSER STATE ───
  const [showComposer, setShowComposer] = useState(false);
  const [postText, setPostText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [posts, setPosts] = useState([]);

  // ─── DUMMY DATA FOR LEADERBOARD (To be connected to DB later) ───
  const leaderboardData = [
    { rank: 1, name: "James K.", km: 45.8, avatar: "https://i.pravatar.cc/150?u=james", badge: "APEX ELITE" },
    { rank: 2, name: "Sarah M.", km: 38.2, avatar: "https://i.pravatar.cc/150?u=sarah", badge: "ENDURANCE" },
    { rank: 3, name: "Emma L.", km: 35.4, avatar: "https://i.pravatar.cc/150?u=emma", badge: "PACER" },
    { rank: 4, name: "David P.", km: 31.4, avatar: "https://i.pravatar.cc/150?u=david" },
    { rank: 5, name: "Aisha T.", km: 29.8, avatar: "https://i.pravatar.cc/150?u=aisha" },
    { rank: 6, name: "Marcus V.", km: 25.0, avatar: "https://i.pravatar.cc/150?u=marcus" },
  ];

  // ─── EFFECTS ───
  // Auto-load draft from HomeTab GPS Share
  useEffect(() => {
    if (draftSocialPost) {
      setActiveTab("feed");
      setPostText(draftSocialPost.caption || "");
      setImagePreview(draftSocialPost.image || null);
      setShowComposer(true);
      if (typeof setDraftSocialPost === "function") setDraftSocialPost(null);
    }
  }, [draftSocialPost]);

  // Fetch Feed Posts
  useEffect(() => {
    const q = query(collection(db, "communityPosts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPosts(fetched);
    });
    return () => unsub();
  }, []);

  // ─── HANDLERS ───
  const handlePublish = async () => {
    if (!postText && !imagePreview) return;
    try {
      await addDoc(collection(db, "communityPosts"), {
        authorName: user?.displayName || "NutriPulse Athlete",
        authorPhoto: user?.photoURL || "https://i.pravatar.cc/150?u=guest",
        category: "Workout",
        caption: postText,
        image: imagePreview,
        boosts: 0,
        createdAt: serverTimestamp(),
      });
      setPostText("");
      setImagePreview(null);
      setShowComposer(false);
      if (showToast) showToast("🎉 Post published to Pulse Feed!");
    } catch (err) {
      console.error(err);
      if (showToast) showToast("⚠️ Error publishing post.");
    }
  };

  const handleBoost = async (postId) => {
    try {
      const ref = doc(db, "communityPosts", postId);
      await updateDoc(ref, { boosts: increment(1) });
    } catch (e) {
      console.error("Boost error", e);
    }
  };

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh", paddingBottom: "80px", fontFamily: "sans-serif" }}>
      
      {/* ─── SLIDE-OVER MESSAGES PANEL ─── */}
      <div style={{
        position: "fixed", top: 0, right: showMessages ? "0" : "-100%", width: "100%", maxWidth: "350px", height: "100vh",
        backgroundColor: "#ffffff", zIndex: 4000, transition: "right 0.3s ease", boxShadow: "-4px 0 15px rgba(0,0,0,0.1)",
        display: "flex", flexDirection: "column"
      }}>
        <div style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0" }}>
          <h3 style={{ margin: 0, color: "#0f172a", fontSize: "18px", fontWeight: 800 }}>💬 Huddles (Inbox)</h3>
          <button onClick={() => setShowMessages(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ padding: "20px", color: "#64748b", textAlign: "center", marginTop: "20px" }}>
          <i className="fa-solid fa-inbox" style={{ fontSize: "40px", marginBottom: "10px", color: "#cbd5e1" }}></i>
          <p>No new messages. Start a huddle with your squad!</p>
        </div>
      </div>

      {/* ─── SEARCH OVERLAY ─── */}
      {showSearch && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100vh", backgroundColor: "rgba(15, 23, 42, 0.6)", zIndex: 3500, padding: "20px" }}>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
            <i className="fa-solid fa-magnifying-glass" style={{ color: "#94a3b8", marginLeft: "10px" }}></i>
            <input type="text" placeholder="Search athletes, routes, or clubs..." autoFocus style={{ border: "none", outline: "none", width: "100%", padding: "10px", fontSize: "16px" }} />
            <button onClick={() => setShowSearch(false)} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#64748b", paddingRight: "10px" }}>✕</button>
          </div>
        </div>
      )}

      {/* ─── TOP BRAND HEADER ─── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", backgroundColor: "#ffffff", borderBottom: "1px solid #f1f5f9", position: "sticky", top: 0, zIndex: 1000 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "36px", height: "36px", background: "linear-gradient(135deg, #1e1b4b, #4338ca)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <i className="fa-solid fa-heart-pulse" style={{ color: "#38bdf8", fontSize: "20px" }}></i>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "20px", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.5px" }}>NUTRIPULSE</h1>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "#38bdf8", letterSpacing: "1px" }}>COMMUNITY</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <i className="fa-solid fa-magnifying-glass" onClick={() => setShowSearch(true)} style={{ fontSize: "20px", color: "#0f172a", cursor: "pointer" }}></i>
          <div style={{ position: "relative", cursor: "pointer" }} onClick={() => setShowMessages(true)}>
            <i className="fa-solid fa-comment-dots" style={{ fontSize: "20px", color: "#0f172a" }}></i>
            <span style={{ position: "absolute", top: "-5px", right: "-5px", background: "#ef4444", color: "white", fontSize: "9px", fontWeight: 800, padding: "2px 5px", borderRadius: "10px" }}>3</span>
          </div>
          <i className="fa-regular fa-bell" style={{ fontSize: "20px", color: "#0f172a" }}></i>
          <img src={user?.photoURL || "https://i.pravatar.cc/150"} alt="User" style={{ width: "28px", height: "28px", borderRadius: "50%", border: "2px solid #38bdf8" }} />
        </div>
      </div>

      {/* ─── TAB SWITCHER ─── */}
      <div style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", background: "#e2e8f0", borderRadius: "20px", padding: "4px" }}>
          <button onClick={() => setActiveTab("leaderboard")} style={{ flex: 1, padding: "10px", borderRadius: "16px", border: "none", fontWeight: 800, fontSize: "13px", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "6px", background: activeTab === "leaderboard" ? "#ffffff" : "transparent", color: activeTab === "leaderboard" ? "#0f172a" : "#64748b", boxShadow: activeTab === "leaderboard" ? "0 2px 8px rgba(0,0,0,0.05)" : "none", transition: "all 0.2s" }}>
            <i className="fa-solid fa-trophy" style={{ color: activeTab === "leaderboard" ? "#eab308" : "#94a3b8" }}></i> LEADERBOARD
          </button>
          <button onClick={() => setActiveTab("feed")} style={{ flex: 1, padding: "10px", borderRadius: "16px", border: "none", fontWeight: 800, fontSize: "13px", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "6px", background: activeTab === "feed" ? "#ffffff" : "transparent", color: activeTab === "feed" ? "#0f172a" : "#64748b", boxShadow: activeTab === "feed" ? "0 2px 8px rgba(0,0,0,0.05)" : "none", transition: "all 0.2s" }}>
            <i className="fa-solid fa-bolt" style={{ color: activeTab === "feed" ? "#38bdf8" : "#94a3b8" }}></i> PULSE FEED
          </button>
        </div>
      </div>

      {/* ========================================== */}
      {/* 🏆 LEADERBOARD VIEW */}
      {/* ========================================== */}
      {activeTab === "leaderboard" && (
        <div style={{ padding: "0 20px" }}>
          {/* Community Goal */}
          <div style={{ background: "#ffffff", borderRadius: "16px", padding: "20px", boxShadow: "0 4px 15px rgba(0,0,0,0.02)", marginBottom: "20px" }}>
            <h3 style={{ margin: "0 0 10px 0", fontSize: "16px", color: "#0f172a" }}>Weekly Community Challenge 🏃</h3>
            <p style={{ margin: "0 0 12px 0", fontSize: "13px", color: "#64748b" }}>Run 50,000 km together!</p>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 800, marginBottom: "8px" }}>
              <span style={{ color: "#0f172a" }}>32,450 km / 50,000 km</span>
              <span style={{ color: "#38bdf8" }}>65%</span>
            </div>
            <div style={{ height: "8px", background: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{ width: "65%", height: "100%", background: "linear-gradient(90deg, #4f46e5, #38bdf8)", borderRadius: "4px" }}></div>
            </div>
            <p style={{ margin: "8px 0 0 0", fontSize: "11px", color: "#94a3b8", textAlign: "right" }}>5 days left</p>
          </div>

          {/* Podium */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: "10px", marginTop: "30px", marginBottom: "30px" }}>
            {/* Rank 2 */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <img src={leaderboardData[1].avatar} style={{ width: "50px", height: "50px", borderRadius: "50%", border: "3px solid #cbd5e1", zIndex: 2 }} />
              <div style={{ background: "linear-gradient(180deg, #e2e8f0, #cbd5e1)", width: "80px", height: "70px", borderTopLeftRadius: "10px", borderTopRightRadius: "10px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginTop: "-10px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#475569" }}>{leaderboardData[1].name.split(" ")[0]}</span>
                <span style={{ fontSize: "14px", fontWeight: 900, color: "#0f172a" }}>{leaderboardData[1].km}km</span>
              </div>
            </div>
            {/* Rank 1 */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <i className="fa-solid fa-crown" style={{ color: "#eab308", fontSize: "20px", marginBottom: "-5px", zIndex: 3 }}></i>
              <img src={leaderboardData[0].avatar} style={{ width: "65px", height: "65px", borderRadius: "50%", border: "4px solid #fde047", zIndex: 2 }} />
              <div style={{ background: "linear-gradient(180deg, #fef08a, #eab308)", width: "90px", height: "90px", borderTopLeftRadius: "10px", borderTopRightRadius: "10px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginTop: "-10px", boxShadow: "0 -4px 15px rgba(234, 179, 8, 0.4)" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#713f12" }}>{leaderboardData[0].name.split(" ")[0]}</span>
                <span style={{ fontSize: "16px", fontWeight: 900, color: "#422006" }}>{leaderboardData[0].km}km</span>
              </div>
            </div>
            {/* Rank 3 */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <img src={leaderboardData[2].avatar} style={{ width: "45px", height: "45px", borderRadius: "50%", border: "3px solid #fbcfe8", zIndex: 2 }} />
              <div style={{ background: "linear-gradient(180deg, #fcd34d, #d97706)", width: "75px", height: "60px", borderTopLeftRadius: "10px", borderTopRightRadius: "10px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginTop: "-10px" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "#78350f" }}>{leaderboardData[2].name.split(" ")[0]}</span>
                <span style={{ fontSize: "13px", fontWeight: 900, color: "#451a03" }}>{leaderboardData[2].km}km</span>
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "15px", overflowX: "auto", paddingBottom: "5px" }}>
            <button style={{ background: "#1e293b", color: "#ffffff", border: "none", padding: "8px 16px", borderRadius: "20px", fontSize: "12px", fontWeight: 700, display: "flex", alignItems: "center", gap: "5px" }}><i className="fa-solid fa-person-running" style={{color: "#38bdf8"}}></i> Distance</button>
            <button style={{ background: "#e2e8f0", color: "#475569", border: "none", padding: "8px 16px", borderRadius: "20px", fontSize: "12px", fontWeight: 700, display: "flex", alignItems: "center", gap: "5px" }}><i className="fa-solid fa-fire" style={{color: "#ef4444"}}></i> Calories</button>
            <button style={{ background: "#e2e8f0", color: "#475569", border: "none", padding: "8px 16px", borderRadius: "20px", fontSize: "12px", fontWeight: 700, display: "flex", alignItems: "center", gap: "5px" }}><i className="fa-solid fa-bolt" style={{color: "#f59e0b"}}></i> Streak</button>
          </div>

          {/* List */}
          <div style={{ background: "#ffffff", borderRadius: "16px", padding: "10px", boxShadow: "0 4px 15px rgba(0,0,0,0.02)" }}>
            {leaderboardData.slice(3).map((u, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", padding: "12px", borderBottom: i !== 2 ? "1px solid #f1f5f9" : "none" }}>
                <span style={{ width: "20px", fontWeight: 800, color: "#64748b", fontSize: "14px" }}>{u.rank}</span>
                <img src={u.avatar} style={{ width: "36px", height: "36px", borderRadius: "50%", margin: "0 12px" }} />
                <span style={{ flex: 1, fontWeight: 700, color: "#0f172a", fontSize: "14px" }}>{u.name}</span>
                <span style={{ fontWeight: 900, color: "#0f172a", fontSize: "14px" }}>{u.km.toFixed(1)} km</span>
              </div>
            ))}
          </div>

          {/* Sticky Your Rank */}
          <div style={{ position: "fixed", bottom: "70px", left: "20px", right: "20px", background: "linear-gradient(90deg, #f0f9ff, #e0f2fe)", borderRadius: "12px", padding: "12px 16px", display: "flex", alignItems: "center", border: "1px solid #bae6fd", boxShadow: "0 4px 12px rgba(56, 189, 248, 0.15)", zIndex: 100 }}>
            <img src={user?.photoURL || "https://i.pravatar.cc/150"} style={{ width: "40px", height: "40px", borderRadius: "50%", border: "2px solid #38bdf8", marginRight: "12px" }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "14px", fontWeight: 900, color: "#0369a1" }}>Your Rank: #8</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "15px", fontWeight: 900, color: "#0f172a" }}>18.2 km</div>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#0284c7" }}>📈 You're doing great!</div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* ⚡ PULSE FEED VIEW */}
      {/* ========================================== */}
      {activeTab === "feed" && (
        <div style={{ padding: "0 20px" }}>
          
          {/* Composer Trigger */}
          <div style={{ background: "#ffffff", borderRadius: "16px", padding: "16px", boxShadow: "0 4px 15px rgba(0,0,0,0.02)", marginBottom: "20px" }}>
            <h3 style={{ margin: "0 0 10px 0", fontSize: "15px", color: "#0f172a" }}>What's Your Activity?</h3>
            {!showComposer ? (
              <div onClick={() => setShowComposer(true)} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                <img src={user?.photoURL || "https://i.pravatar.cc/150"} style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
                <span style={{ color: "#94a3b8", fontSize: "14px", flex: 1 }}>Share your latest sweat session... 🏃🚴</span>
                <i className="fa-solid fa-image" style={{ color: "#4f46e5", fontSize: "20px" }}></i>
                <i className="fa-solid fa-location-dot" style={{ color: "#38bdf8", fontSize: "20px", marginLeft: "5px" }}></i>
              </div>
            ) : (
              <div>
                <textarea
                  autoFocus
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  placeholder="How was your workout?"
                  style={{ width: "100%", minHeight: "80px", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "12px", fontSize: "14px", outline: "none", resize: "none" }}
                />
                {imagePreview && (
                  <div style={{ position: "relative", marginTop: "10px" }}>
                    <img src={imagePreview} style={{ width: "100%", borderRadius: "12px", maxHeight: "200px", objectFit: "cover" }} />
                    <button onClick={() => setImagePreview(null)} style={{ position: "absolute", top: "5px", right: "5px", background: "rgba(0,0,0,0.6)", color: "white", border: "none", borderRadius: "50%", width: "24px", height: "24px" }}>✕</button>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                  <button onClick={() => { setShowComposer(false); setPostText(""); setImagePreview(null); }} style={{ padding: "8px 16px", background: "transparent", color: "#64748b", border: "none", fontWeight: 700, borderRadius: "8px", cursor: "pointer" }}>Cancel</button>
                  <button onClick={handlePublish} style={{ padding: "8px 20px", background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "white", border: "none", fontWeight: 800, borderRadius: "8px", cursor: "pointer" }}>Post ⚡</button>
                </div>
              </div>
            )}
          </div>

          {/* Posts List */}
          {posts.map((post) => (
            <div key={post.id} style={{ background: "#ffffff", borderRadius: "16px", padding: "16px", boxShadow: "0 4px 15px rgba(0,0,0,0.02)", marginBottom: "20px" }}>
              
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <img src={post.authorPhoto || "https://i.pravatar.cc/150"} style={{ width: "40px", height: "40px", borderRadius: "50%", border: "2px solid #e2e8f0" }} />
                  <div>
                    <div style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a" }}>{post.authorName}</div>
                    <div style={{ display: "inline-block", background: "linear-gradient(90deg, #6366f1, #4f46e5)", color: "white", fontSize: "9px", fontWeight: 800, padding: "2px 6px", borderRadius: "4px", marginTop: "2px" }}>APEX ELITE 🟡</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>Just now</div>
                  <div style={{ display: "inline-block", background: "#dcfce7", color: "#166534", fontSize: "10px", fontWeight: 800, padding: "3px 8px", borderRadius: "10px", marginTop: "4px" }}>🏃 OUTDOOR RUN</div>
                </div>
              </div>

              {/* Caption */}
              {post.caption && (
                <p style={{ fontSize: "14px", color: "#334155", lineHeight: "1.5", margin: "0 0 12px 0", whiteSpace: "pre-wrap" }}>{post.caption}</p>
              )}

              {/* Image / Route Map */}
              {post.image && (
                <div style={{ borderRadius: "12px", overflow: "hidden", marginBottom: "12px", border: "1px solid #f1f5f9" }}>
                  <img src={post.image} style={{ width: "100%", display: "block" }} />
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}>
                <button onClick={() => handleBoost(post.id)} style={{ background: "transparent", border: "none", color: "#0284c7", fontSize: "13px", fontWeight: 800, display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                  <i className="fa-solid fa-bolt" style={{ color: "#38bdf8", fontSize: "16px" }}></i> Pulse Boost ({post.boosts || 0})
                </button>
                <button style={{ background: "transparent", border: "none", color: "#64748b", fontSize: "13px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                  <i className="fa-regular fa-comment-dots" style={{ fontSize: "16px" }}></i> Huddle (0)
                </button>
                <button style={{ background: "transparent", border: "none", color: "#64748b", fontSize: "13px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                  <i className="fa-solid fa-link" style={{ fontSize: "15px" }}></i> Share
                </button>
              </div>
            </div>
          ))}
          
          {posts.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
              <i className="fa-solid fa-shoe-prints" style={{ fontSize: "40px", marginBottom: "10px", color: "#cbd5e1" }}></i>
              <p style={{ fontWeight: 700 }}>No activities yet. Be the first to share your workout!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
