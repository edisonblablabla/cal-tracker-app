const fs = require("fs");

console.log("🎨 Inaayos ang slide-over header: Tumpak na Messenger layout at inalis ang lahat ng X icons...");

let content = fs.readFileSync("src/components/ModalsLayer.jsx", "utf8");

// 1. Hanapin ang panel drawer container: {activePanel && ( ... onClick={e => e.stopPropagation()}
const panelMatch = content.match(/\{activePanel\s*&&\s*\([\s\S]*?<div[^>]*onClick=\{(?:\(e\)|e)\s*=>\s*e\.stopPropagation\(\)\}[^>]*>/);

if (!panelMatch) {
  console.error("❌ Hindi nahanap ang slide-over container sa ModalsLayer.jsx");
  process.exit(1);
}

const startPos = panelMatch.index + panelMatch[0].length;

// 2. Hanapin kung saan nag-uumpisa ang content scroll container (ang unang div na may overflowY pagkatapos ng panel container)
const afterStart = content.slice(startPos);
const contentMatch = afterStart.match(/<div[^>]*overflowY[^>]*>/);

if (!contentMatch) {
  console.error("❌ Hindi nahanap ang content scroll container");
  process.exit(1);
}

const endPos = startPos + contentMatch.index;

// 3. Ang bagong malinis na Messenger-style top bar na WALANG X ICON (Pure Back Navigation):
const cleanMessengerTopBar = `
            {/* MESSENGER STYLE SLIDE-OVER TOP BAR (WALANG X ICON, PURE BACK ARROW) */}
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              padding: "10px 16px", 
              borderBottom: "1px solid #e2e8f0", 
              background: "#ffffff", 
              minHeight: "56px", 
              boxSizing: "border-box", 
              position: "sticky", 
              top: 0, 
              zIndex: 100 
            }}>
              {/* BACK BUTTON (<) */}
              <button 
                onClick={() => {
                  if (activePanel === "chat") setActivePanel("inbox");
                  else setActivePanel(null);
                }} 
                style={{ 
                  background: "none", 
                  border: "none", 
                  color: "#0f172a", 
                  fontSize: "18px", 
                  cursor: "pointer", 
                  padding: "6px 12px 6px 0", 
                  display: "flex", 
                  alignItems: "center",
                  marginRight: "4px"
                }} 
                title="Back"
              >
                <i className="fa-solid fa-arrow-left"></i>
              </button>

              {/* IF CHAT: Messenger Horizontal Header (Avatar + Name + Status sa iisang linya) */}
              {activePanel === "chat" ? (
                <div 
                  onClick={() => {
                    if (activeChatPartner && typeof setSelectedVisitor === "function") {
                      setSelectedVisitor(activeChatPartner);
                      setActivePanel("visitor_profile");
                    }
                  }} 
                  style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", flex: 1, minWidth: 0 }}
                >
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#4f46e5", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "14px", overflow: "hidden", flexShrink: 0 }}>
                    {activeChatPartner?.avatarUrl ? (
                      <img src={activeChatPartner.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      (activeChatPartner?.userName || "A").charAt(0).toUpperCase()
                    )}
                  </div>
                  <div style={{ minWidth: 0, lineHeight: 1.2 }}>
                    <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {activeChatPartner?.userName || "Athlete"}
                    </div>
                    <div style={{ fontSize: "10px", color: "#10b981", fontWeight: 600 }}>
                      ● Active now
                    </div>
                  </div>
                </div>
              ) : (
                /* IF INBOX, PROFILE, NOTIFS, ETC. (Malinis na Title, Walang X Icon) */
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 900, color: "#0f172a", flex: 1 }}>
                  {activePanel === "inbox" && "Messages"}
                  {activePanel === "notif" && "Notifications"}
                  {activePanel === "post_detail" && "Post Pulse"}
                  {activePanel === "visitor_profile" && (selectedVisitor?.userName || "Athlete Profile")}
                  {activePanel === "profile_settings" && "Profile Settings"}
                  {activePanel === "boosters_list" && "Boosters"}
                  {activePanel === "boosting_list" && "Boosting"}
                </h3>
              )}
            </div>
`;

content = content.slice(0, startPos) + cleanMessengerTopBar + content.slice(endPos);

fs.writeFileSync("src/components/ModalsLayer.jsx", content);
console.log("✅ Matagumpay! Na-replace ang buong lumang header ng sleek Messenger top bar na WALANG X icon!");
