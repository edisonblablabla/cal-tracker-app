import fs from 'fs';

let code = fs.readFileSync('src/App.jsx', 'utf8');

// Linisin ang hidden spaces
code = code.replace(/[\u00a0\xa0]/g, ' ');

// 1. Siguraduhing may createdAt kapag nagse-set ng user document sa Auth Listener
const oldAuthSetDoc = `const initData = {
            userName: currentUser.displayName || "Athlete",
            weight: 60,
            height: 165,
            baseGoal: 2000,
            streakDays: 1,
            meals: []
          };`;

const newAuthSetDoc = `const initData = {
            userName: currentUser.displayName || "Athlete",
            userEmail: currentUser.email || "",
            weight: 60,
            height: 165,
            baseGoal: 2000,
            streakDays: 1,
            createdAt: Date.now(),
            lastSeen: Date.now(),
            meals: []
          };`;

if (code.includes('baseGoal: 2000,')) {
  code = code.replace(oldAuthSetDoc, newAuthSetDoc);
}

// 2. Aayusin ang fetchUsers Sorting (Bagong user ay laging sa pinakataas)
const oldFetchUsersFunc = `const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const list = [];
      querySnapshot.forEach((docSnap) => {
        list.push({ uid: docSnap.id, ...docSnap.data() });
      });
      list.sort((a, b) => (b.createdAt || Date.now()) - (a.createdAt || Date.now()));
      setUserList(list);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };`;

const newFetchUsersFunc = `const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const list = [];
      querySnapshot.forEach((docSnap) => {
        list.push({ uid: docSnap.id, ...docSnap.data() });
      });
      // Correct Descending Sort: Put users with highest/latest createdAt on top
      list.sort((a, b) => {
        const timeA = a.createdAt || 0;
        const timeB = b.createdAt || 0;
        return timeB - timeA;
      });
      setUserList(list);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };`;

if (code.includes('const fetchUsers = async () => {')) {
  code = code.replace(oldFetchUsersFunc, newFetchUsersFunc);
}

fs.writeFileSync('src/App.jsx', code);
console.log('✅ Admin New User Sorting Fix Applied Successfully!');
