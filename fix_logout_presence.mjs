import fs from 'fs';

let code = fs.readFileSync('src/App.jsx', 'utf8');

// Linisin ang hidden spaces
code = code.replace(/[\u00a0\xa0]/g, ' ');

// I-update ang handleLogout para mag-write ng lastSeen: 0 sa Firestore bago mag-signOut
code = code.replace(
  /const handleLogout = async \(\) => \{[\s\S]*?setActiveTab\("home"\);\n\s*\};/,
  `const handleLogout = async () => {
    if (user) {
      try {
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, { lastSeen: 0 }, { merge: true });
      } catch (err) {
        console.error("Logout presence error:", err);
      }
    }
    await signOut(auth);
    setAppData(null);
    setOnboardStep(0);
    setActiveTab("home");
  };`
);

fs.writeFileSync('src/App.jsx', code);
console.log('✅ Logout status reset fix applied!');
