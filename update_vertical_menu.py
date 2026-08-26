with open("src/App.jsx", "r") as f:
    code = f.read()

# 1. Dagdag ng activeCommentMenu state
if "const [activeCommentMenuId, setActiveCommentMenuId] = useState(null);" not in code:
    code = code.replace(
        "const [activeMenuPostId, setActiveMenuPostId] = useState(null);",
        "const [activeMenuPostId, setActiveMenuPostId] = useState(null);\n  const [activeCommentMenuId, setActiveCommentMenuId] = useState(null);"
    )

# 2. Palitan ang lumang comments render ng Vertical Three Dots Dropdown
old_render = """                      postComments.map(c => {
                        const isCommentOwner = c.userName === (appData?.userName || user?.displayName) || isAdmin;
                        return (
                          <div key={c.id} style={{ background: "#f8fafc", padding: "8px 10px", borderRadius: "10px", border: "1px solid #f1f5f9", position: "relative" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <strong style={{ fontSize: "11px", color: "#0f172a" }}>{c.userName}</strong>
                                {c.isEdited && <span style={{ fontSize: "8px", color: "#94a3b8", fontStyle: "italic" }}>(edited)</span>}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ fontSize: "9px", color: "#94a3b8" }}>{formatPostTime(c.createdAt)}</span>
                                {isCommentOwner && (
                                  <div style={{ display: "flex", gap: "4px" }}>
                                    <button 
                                      onClick={() => handleEditComment(c.id, liveSelectedPost.id, c.text)} 
                                      style={{ background: "none", border: "none", color: "#0284c7", fontSize: "10px", cursor: "pointer", padding: "1px 3px" }}
                                      title="Edit Comment"
                                    >
                                      <i className="fa-solid fa-pen"></i>
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteComment(c.id, liveSelectedPost.id)} 
                                      style={{ background: "none", border: "none", color: "#ef4444", fontSize: "10px", cursor: "pointer", padding: "1px 3px" }}
                                      title="Delete Comment"
                                    >
                                      <i className="fa-solid fa-trash"></i>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                            <p style={{ fontSize: "11px", color: "#334155", margin: 0, wordBreak: "break-word" }}>{c.text}</p>
                          </div>
                        );
                      })"""

new_render = """                      postComments.map(c => {
                        const isCommentOwner = c.userName === (appData?.userName || user?.displayName) || isAdmin;
                        return (
                          <div key={c.id} style={{ background: "#f8fafc", padding: "8px 10px", borderRadius: "10px", border: "1px solid #f1f5f9", position: "relative" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <strong style={{ fontSize: "11px", color: "#0f172a" }}>{c.userName}</strong>
                                {c.isEdited && <span style={{ fontSize: "8px", color: "#94a3b8", fontStyle: "italic" }}>(edited)</span>}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ fontSize: "9px", color: "#94a3b8" }}>{formatPostTime(c.createdAt)}</span>
                                {isCommentOwner && (
                                  <div style={{ position: "relative" }}>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); setActiveCommentMenuId(activeCommentMenuId === c.id ? null : c.id); }} 
                                      style={{ background: "none", border: "none", color: "#64748b", fontSize: "12px", cursor: "pointer", padding: "2px 4px" }}
                                    >
                                      <i className="fa-solid fa-ellipsis-vertical"></i>
                                    </button>

                                    {activeCommentMenuId === c.id && (
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
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            <p style={{ fontSize: "11px", color: "#334155", margin: 0, wordBreak: "break-word" }}>{c.text}</p>
                          </div>
                        );
                      })"""

code = code.replace(old_render, new_render)

with open("src/App.jsx", "w") as f:
    f.write(code)

print("✅ Updated comment actions to vertical three-dot menu!")
