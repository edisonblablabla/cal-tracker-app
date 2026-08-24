const fs = require('fs');

let content = fs.readFileSync('src/App.jsx', 'utf8');

// Replace signInWithPopup logic to handle redirect/fallback gracefully for Android
const oldGoogleAuth = `const handleGoogleSignIn = async () => {
    setErrorMessage('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      setErrorMessage("Google Login Error: " + error.message);
    }
  };`;

const newGoogleAuth = `const handleGoogleSignIn = async () => {
    setErrorMessage('');
    try {
      // Check if running inside Capacitor Android WebView
      if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        const { signInWithRedirect } = await import('firebase/auth');
        await signInWithRedirect(auth, googleProvider);
      } else {
        await signInWithPopup(auth, googleProvider);
      }
    } catch (error) {
      setErrorMessage("Google Login Error: " + error.message);
    }
  };`;

content = content.replace(oldGoogleAuth, newGoogleAuth);
fs.writeFileSync('src/App.jsx', content);
console.log('Successfully updated Google Sign-In handler for Mobile APK!');
