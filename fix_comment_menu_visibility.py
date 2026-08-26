with open("src/App.jsx", "r") as f:
    code = f.read()

# 1. Dagdagan ang handleAddComment para mag-save din ng userId/uid
old_add_comment = """      await addDoc(collection(db, "posts", postId, "comments"), {
        userName: commentAuthorName,
        avatarUrl: commentAuthorAvatar,
        text: newCommentText.trim(),
        createdAt: Date.now()
      });"""

new_add_comment = """      await addDoc(collection(db, "posts", postId, "comments"), {
        userId: user?.uid,
        userName: commentAuthorName,
        avatarUrl: commentAuthorAvatar,
        text: newCommentText.trim(),
        createdAt: Date.now()
      });"""

code = code.replace(old_add_comment, new_add_comment)

# 2. Ayusin ang renders ng comment list para siguradong lalabas ang vertical dots menu (gumamit ng UID comparison o Name fallback)
old_comment_render_block = """                      postComments.map(c => {
                        const isCommentOwner = c.userName === (appData?.userName || user?.displayName) || isAdmin;
                        return ("""

new_comment_render_block = """                      postComments.map(c => {
                        const isCommentOwner = (c.userId && c.userId === user?.uid) || 
                                              (c.userName && c.userName.toLowerCase() === (appData?.userName || user?.displayName || "").toLowerCase()) || 
                                              isAdmin;
                        return ("""

code = code.replace(old_comment_render_block, new_comment_render_block)

with open("src/App.jsx", "w") as f:
    f.write(code)

print("✅ Fixed comment ownership matching and forced three-dot visibility!")
