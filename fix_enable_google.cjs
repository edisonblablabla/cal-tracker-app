const fs = require('fs');

let content = fs.readFileSync('src/App.jsx', 'utf8');

// Replace the temporary email-only warning with the actual Google Sign-In request
const oldHandler = /const handleGoogleSignIn = async \(\) => {[\s\S]*?};/;

const newHandler = `const handleGoogleSignIn = async () => {
    setErrorMessage('');
    try {
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

content = content.replace(oldHandler, newHandler);
fs.writeFileSync('src/App.jsx', content);
console.log('Successfully enabled Native Google Auth!');
