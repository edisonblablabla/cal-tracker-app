with open("src/App.jsx", "r") as f:
    code = f.read()

# 1. Dagdag ng states para sa custom Comment Edit at Delete Modals
state_add = """  const [commentToEdit, setCommentToEdit] = useState(null);
  const [commentEditText, setCommentEditText] = useState("");
  const [commentToDelete, setCommentToDelete] = useState(null);"""

if "const [commentToEdit, setCommentToEdit]" not in code:
    code = code.replace(
        "const [activeCommentMenuId, setActiveCommentMenuId] = useState(null);",
        "const [activeCommentMenuId, setActiveCommentMenuId] = useState(null);\n" + state_add
    )

# 2. Palitan ang lumang window.confirm at window.prompt functions ng React State Triggers
old_funcs = """  // REALTIME DELETE COMMENT FUNCTION
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
  };"""

new_funcs = """  // MODERN REALTIME DELETE COMMENT FUNCTION
  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;
    const { commentId, postId } = commentToDelete;
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
    } finally {
      setCommentToDelete(null);
    }
  };

  // MODERN REALTIME EDIT COMMENT FUNCTION
  const saveEditedComment = async () => {
    if (!commentToEdit || !commentEditText.trim()) return;
    const { commentId, postId } = commentToEdit;
    try {
      const commentRef = doc(db, "posts", postId, "comments", commentId);
      await updateDoc(commentRef, {
        text: commentEditText.trim(),
        isEdited: true
      });
      showToast("Comment updated!");
    } catch (err) {
      console.error("Error editing comment:", err);
    } finally {
      setCommentToEdit(null);
      setCommentEditText("");
    }
  };"""

code = code.replace(old_funcs, new_funcs)

# 3. Palitan ang button triggers sa dropdown para gumamit ng state triggers imbes na direct prompt
old_triggers = """                                        <button 
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
                                        </button>"""

new_triggers = """                                        <button 
                                          onClick={() => { setActiveCommentMenuId(null); setCommentToEdit({ commentId: c.id, postId: liveSelectedPost.id }); setCommentEditText(c.text); }} 
                                          style={{ width: "100%", padding: "7px 10px", background: "transparent", border: "none", borderRadius: "8px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#334155", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                                        >
                                          <i className="fa-solid fa-pen" style={{ color: "#0284c7", fontSize: "11px" }}></i> Edit
                                        </button>
                                        <button 
                                          onClick={() => { setActiveCommentMenuId(null); setCommentToDelete({ commentId: c.id, postId: liveSelectedPost.id }); }} 
                                          style={{ width: "100%", padding: "7px 10px", background: "transparent", border: "none", borderRadius: "8px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                                        >
                                          <i className="fa-solid fa-trash" style={{ fontSize: "11px" }}></i> Delete
                                        </button>"""

code = code.replace(old_triggers, new_triggers)

# 4. Dagdag ng Modern UI Modals sa dulo bago ang closing nav
modals_jsx = """      {/* CUSTOM MODERN EDIT COMMENT MODAL */}
      {commentToEdit && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(6px)", zIndex: 999999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div className="card" style={{ width: "100%", maxWidth: "360px", padding: "20px", borderRadius: "20px", background: "#ffffff", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h4 style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a", margin: 0 }}>Edit Comment</h4>
              <button onClick={() => setCommentToEdit(null)} style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: "26px", height: "26px", cursor: "pointer", fontWeight: 800, fontSize: "11px" }}>X</button>
            </div>
            <textarea 
              className="form-input" 
              style={{ width: "100%", height: "70px", borderRadius: "10px", padding: "10px", fontSize: "12px", border: "1px solid #cbd5e1", resize: "none", marginBottom: "12px", boxSizing: "border-box" }}
              value={commentEditText}
              onChange={(e) => setCommentEditText(e.target.value)}
            />
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => setCommentToEdit(null)} style={{ flex: 1, padding: "10px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "10px", fontWeight: 800, fontSize: "11px", cursor: "pointer" }}>Cancel</button>
              <button onClick={saveEditedComment} style={{ flex: 1, padding: "10px", background: "#0284c7", color: "white", border: "none", borderRadius: "10px", fontWeight: 800, fontSize: "11px", cursor: "pointer" }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM MODERN DELETE COMMENT CONFIRM MODAL */}
      {commentToDelete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(6px)", zIndex: 999999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div className="card" style={{ width: "100%", maxWidth: "340px", padding: "20px", borderRadius: "20px", background: "#ffffff", textAlign: "center", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#fef2f2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", margin: "0 auto 12px auto" }}>
              <i className="fa-solid fa-trash"></i>
            </div>
            <h4 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", margin: "0 0 6px 0" }}>Delete Comment?</h4>
            <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 16px 0" }}>Are you sure you want to delete this comment? This action cannot be undone.</p>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => setCommentToDelete(null)} style={{ flex: 1, padding: "10px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "10px", fontWeight: 800, fontSize: "11px", cursor: "pointer" }}>Cancel</button>
              <button onClick={confirmDeleteComment} style={{ flex: 1, padding: "10px", background: "#dc2626", color: "white", border: "none", borderRadius: "10px", fontWeight: 800, fontSize: "11px", cursor: "pointer" }}>Delete</button>
            </div>
          </div>
        </div>
      )}"""

code = code.replace("{/* FIXED BOTTOM NAVIGATION BAR */}", modals_jsx + "\n\n      {/* FIXED BOTTOM NAVIGATION BAR */}")

with open("src/App.jsx", "w") as f:
    f.write(code)

print("✅ Replaced native browser alerts with custom modern React modals!")
