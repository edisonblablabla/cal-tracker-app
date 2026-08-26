with open("src/App.jsx", "r") as f:
    code = f.read()

# Palitan ang lumang makalumang dropdown menu styling ng modern sleek mobile popover
old_dropdown_jsx = """                                    {activeCommentMenuId === c.id && (
                                      <div style={{ position: "absolute", right: 0, top: "20px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 100, minWidth: "90px", overflow: "hidden" }}>
                                        <button 
                                          onClick={() => { setActiveCommentMenuId(null); handleEditComment(c.id, liveSelectedPost.id, c.text); }} 
                                          style={{ width: "100%", padding: "6px 8px", background: "transparent", border: "none", textAlign: "left", fontSize: "10px", fontWeight: 700, color: "#334155", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}
                                        >
                                          <i className="fa-solid fa-pen" style={{ color: "#0284c7" }}></i> Edit
                                        </button>
                                        <button 
                                          onClick={() => { setActiveCommentMenuId(null); handleDeleteComment(c.id, liveSelectedPost.id); }} 
                                          style={{ width: "100%", padding: "6px 8px", background: "transparent", border: "none", textAlign: "left", fontSize: "10px", fontWeight: 700, color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", borderTop: "1px solid #f1f5f9" }}
                                        >
                                          <i className="fa-solid fa-trash"></i> Delete
                                        </button>
                                      </div>
                                    )}"""

new_dropdown_jsx = """                                    {activeCommentMenuId === c.id && (
                                      <div style={{ 
                                        position: "absolute", 
                                        right: 0, 
                                        top: "22px", 
                                        background: "#ffffff", 
                                        border: "1px solid rgba(226, 232, 240, 0.8)", 
                                        borderRadius: "12px", 
                                        boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.04)", 
                                        zIndex: 999, 
                                        minWidth: "110px", 
                                        padding: "4px",
                                        backdropFilter: "blur(8px)"
                                      }}>
                                        <button 
                                          onClick={() => { setActiveCommentMenuId(null); handleEditComment(c.id, liveSelectedPost.id, c.text); }} 
                                          style={{ width: "100%", padding: "7px 10px", background: "transparent", border: "none", borderRadius: "8px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#334155", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                                        >
                                          <i className="fa-solid fa-pen" style={{ color: "#0284c7", fontSize: "11px" }}></i> Edit
                                        </button>
                                        <button 
                                          onClick={() => { setActiveCommentMenuId(null); handleDeleteComment(c.id, liveSelectedPost.id); }} 
                                          style={{ width: "100%", padding: "7px 10px", background: "transparent", border: "none", borderRadius: "8px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                                        >
                                          <i className="fa-solid fa-trash" style={{ fontSize: "11px" }}></i> Delete
                                        </button>
                                      </div>
                                    )}"""

code = code.replace(old_dropdown_jsx, new_dropdown_jsx)

with open("src/App.jsx", "w") as f:
    f.write(code)

print("✅ Upgraded comment popup menu to modern iOS/Android style!")
