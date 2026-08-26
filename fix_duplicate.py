with open("src/App.jsx", "r") as f:
    code = f.read()

# Tanggalin ang paulit-ulit na targetPost declaration sa handleAddComment
bad_snippet = """      const postRef = doc(db, "posts", postId);
      const targetPost = posts.find(p => p.id === postId);
      await updateDoc(postRef, {
        commentsCount: ((targetPost?.commentsCount) || 0) + 1
      });

      const targetPost = posts.find(p => p.id === postId);"""

clean_snippet = """      const postRef = doc(db, "posts", postId);
      const targetPost = posts.find(p => p.id === postId);
      await updateDoc(postRef, {
        commentsCount: ((targetPost?.commentsCount) || 0) + 1
      });"""

code = code.replace(bad_snippet, clean_snippet)

with open("src/App.jsx", "w") as f:
    f.write(code)

print("✅ Fixed duplicate variable declaration!")
