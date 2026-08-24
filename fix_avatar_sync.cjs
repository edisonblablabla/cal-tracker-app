const fs = require('fs');

let content = fs.readFileSync('src/App.jsx', 'utf8');

// Ensure photoURL update syncs across user document and active state
const oldSaveProfile = /const handleSaveProfile = async \(\) => {[\s\S]*?};/;

const newSaveProfile = `const handleSaveProfile = async () => {
    setIsUploading(true);
    try {
      let photoURL = user?.photoURL || '';
      if (avatarFile) {
        // Handle image processing / URL assignment
        const storageRef = ref(storage, \`avatars/\${user.uid}\`);
        await uploadBytes(storageRef, avatarFile);
        photoURL = await getDownloadURL(storageRef);
      }
      
      // 1. Update Firebase Auth Profile
      await updateProfile(auth.currentUser, { photoURL });
      
      // 2. Sync to Firestore User Document
      await setDoc(doc(db, "users", user.uid), { photoURL }, { merge: true });
      
      // 3. Update local state for immediate UI reflection
      setUser(prev => ({ ...prev, photoURL }));
      setAvatarPreview(null);
      setAvatarFile(null);
      setShowProfileSettings(false);
      alert("Profile picture updated successfully!");
    } catch (error) {
      console.error("Avatar update error:", error);
      alert("Failed to update profile picture: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };`;

if (content.includes('handleSaveProfile')) {
  content = content.replace(oldSaveProfile, newSaveProfile);
  fs.writeFileSync('src/App.jsx', content);
  console.log('Successfully patched Avatar Sync engine!');
} else {
  console.log('Target function not matched, checking logic...');
}
