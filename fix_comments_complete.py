with open("src/App.jsx", "r") as f:
    code = f.read()

# 1. Dagdag ng Edit at Delete functions para sa Comments
comment_funcs = """  // REALTIME DELETE COMMENT FUNCTION
  const handleDeleteComment = async (commentId, postId) => {
    if (!window.confirm("Delete this comment permanently?")) return;
    try {
      await deleteDoc(doc(db, "posts", postId, "comments", commentId));
      const postRef = doc(db, "posts", postId);
      const targetPost = posts.find(p => p.id === postId);
      if (targetPost) {
        await updateDoc(postRef, {
          commentsCount: Math.max(0, (targetPost.commentsCount || 1) - 1)
        });
      }
      showToast("Comment deleted!");
    } catch (err) {
      console.error("Error deleting comment:", err);
    }
  };

  // REALTIME EDIT COMMENT FUNCTION
  const handleEditComment = async (commentId, postId, currentText) => {
    const updatedText = window.prompt("Edit your comment:", currentText);
    if (!updatedText || !updatedText.trim() || updatedText === currentText) return;
    try {
      const commentRef = doc(db, "posts", postId, "comments", commentId);
      await updateDoc(commentRef, {
        text: updatedText.trim(),
        isEdited: true
      });
      showToast("Comment updated!");
    } catch (err) {
      console.error("Error editing comment:", err);
    }
  };

  const handleDeletePost = async (postId) => {"""

if "const handleDeleteComment" not in code:
    code = code.replace("  const handleDeletePost = async (postId) => {", comment_funcs)

# 2. Palitan ang lumang plain text render ng Comments ng Vertical Three Dots Dropdown Menu
old_comment_map = """                    ) : (
                      postComments.map(c => (
                        <div key={c.id} style={{ background: "#f8fafc", padding: "8px 10px", borderRadius: "10px", border: "1px solid #f1f5f9" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                            <strong style={{ fontSize: "11px", color: "#0f172a" }}>{c.userName}</strong>
                            <span style={{ fontSize: "9px", color: "#94a3b8" }}>{formatPostTime(c.createdAt)}</span>
                          </div>
                          <p style={{ fontSize: "11px", color: "#334155", margin: 0 }}>{c.text}</p>
                        </div>
                      ))
                    )}"""

new_comment_map = """                    ) : (
                      postComments.map(c => {
                        const isCommentOwner = (c.userId && c.userId === user?.uid) || 
                                              (c.userName && c.userName.toLowerCase() === (appData?.userName || user?.displayName || "").toLowerCase()) || 
                                              isAdmin;
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
                      })
                    )}"""

code = code.replace(old_comment_map, new_comment_map)

with open("src/App.jsx", "w") as f:
    f.write(code)

print("✅ Added complete Edit and Delete functionality with Vertical Three-Dots Menu for comments!")
