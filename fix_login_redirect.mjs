import fs from 'fs';

let code = fs.readFileSync('src/App.jsx', 'utf8');

// Linisin ang hidden spaces
code = code.replace(/[\u00a0\xa0]/g, ' ');

// 1. Siguraduhing activeTab = "home" tuwing matatapos ang Auth Check sa useEffect
const oldAuthCheck = `if (!data.onboardingCompleted) {
            setOnboardStep(1);
          } else {
            setOnboardStep(0);
          }`;

const newAuthCheck = `if (!data.onboardingCompleted) {
            setOnboardStep(1);
          } else {
            setOnboardStep(0);
            setActiveTab("home");
          }`;

if (code.includes('setOnboardStep(0);')) {
  code = code.replace(oldAuthCheck, newAuthCheck);
}

// 2. I-reset ang Active Tab sa "home" at isara ang Modals sa handleEmailAuth
const oldEmailAuth = `await signInWithEmailAndPassword(auth, email, password);`;
const newEmailAuth = `await signInWithEmailAndPassword(auth, email, password);
        setActiveTab("home");
        setShowSettingsModal(false);`;

if (code.includes('signInWithEmailAndPassword(')) {
  code = code.replace(oldEmailAuth, newEmailAuth);
}

fs.writeFileSync('src/App.jsx', code);
console.log('✅ Login redirect fixed! User now always lands on Home Tab.');
