with open("src/App.jsx", "r") as f:
    code = f.read()

# 1. Dagdag ng Boost Notification sa toggleBoostAthlete
old_boost_code = """    } else {
      updatedBoosting.push(targetUid);
      showToast("You are now Boosting this athlete! ");
    }"""

new_boost_code = """    } else {
      updatedBoosting.push(targetUid);
      showToast("You are now Boosting this athlete! ");
      try {
        addDoc(collection(db, "notifications"), {
          recipientUid: targetUid,
          senderName: appData?.userName || user?.displayName || "Athlete",
          senderAvatar: appData?.avatarUrl || avatarPreview || "",
          type: "boost",
          text: "started boosting your profile!",
          timestamp: Date.now()
        });
      } catch (e) { console.error(e); }
    }"""

# 2. Dagdag ng comment counter increment sa handleAddComment
old_comment_code = """      await addDoc(collection(db, "posts", postId, "comments"), {
        userName: commentAuthorName,
        avatarUrl: commentAuthorAvatar,
        text: newCommentText.trim(),
        createdAt: Date.now()
      });"""

new_comment_code = """      await addDoc(collection(db, "posts", postId, "comments"), {
        userName: commentAuthorName,
        avatarUrl: commentAuthorAvatar,
        text: newCommentText.trim(),
        createdAt: Date.now()
      });

      const postRef = doc(db, "posts", postId);
      const targetPost = posts.find(p => p.id === postId);
      await updateDoc(postRef, {
        commentsCount: ((targetPost?.commentsCount) || 0) + 1
      });"""

# Replace in code
code = code.replace(old_boost_code, new_boost_code)
code = code.replace(old_comment_code, new_comment_code)

# Replace static Comment label with live counter
code = code.replace('<i className="fa-regular fa-comment" style={{ fontSize: "12px" }}></i> Comment', '<i className="fa-regular fa-comment" style={{ fontSize: "12px" }}></i> {p.commentsCount || 0}')

with open("src/App.jsx", "w") as f:
    f.write(code)

print("✅ Updated App.jsx with Boost Notifications and Live Comment Counts!")
