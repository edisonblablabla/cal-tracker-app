import fs from 'fs';

let code = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Linisin ang hidden space characters
code = code.replace(/[\u00a0\xa0]/g, ' ');

// 2. Magdagdag ng isLoggingOut state sa App component
if (!code.includes('isLoggingOut')) {
  code = code.replace(
    'const [isSavingOnboarding, setIsSavingOnboarding] = useState(false);',
    'const [isSavingOnboarding, setIsSavingOnboarding] = useState(false);\n  const [isLoggingOut, setIsLoggingOut] = useState(false);'
  );
}

// 3. I-update ang handleLogout para i-toggle ang isLoggingOut state
code = code.replace(
  /const handleLogout = async \(\) => \{[\s\S]*?setActiveTab\("home"\);\n\s*\};/,
  `const handleLogout = async () => {
    setIsLoggingOut(true);
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
    setIsLoggingOut(false);
  };`
);

// 4. Update the Sign Out button UI to show active loading state
code = code.replace(
  'Sign Out Account',
  '{isLoggingOut ? "Signing Out..." : "Sign Out Account"}'
);

code = code.replace(
  '<button className="btn-block" onClick={handleLogout} style={{ background: "var(--danger)", marginBottom: "20px" }}>',
  '<button className="btn-block" onClick={handleLogout} disabled={isLoggingOut} style={{ background: isLoggingOut ? "#94a3b8" : "var(--danger)", marginBottom: "20px" }}>'
);

fs.writeFileSync('src/App.jsx', code);
console.log('✅ Visual feedback and double-tap prevention added to Sign Out button!');
