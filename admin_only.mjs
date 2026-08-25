import fs from 'fs';

let code = fs.readFileSync('src/App.jsx', 'utf8');

// Linisin lang ang hidden space characters na galing sa clipboard
code = code.replace(/[\u00a0\xa0]/g, ' ');

// 1. Aayusin ang fetchUsers para LAGING bago ang nasa taas
const oldFetch = `const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const list = [];
      querySnapshot.forEach((docSnap) => {
        list.push({ uid: docSnap.id, ...docSnap.data() });
      });
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setUserList(list);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };`;

const newFetch = `const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const list = [];
      querySnapshot.forEach((docSnap) => {
        list.push({ uid: docSnap.id, ...docSnap.data() });
      });
      // Sort: Bagong gawa muna sa pinakataas
      list.sort((a, b) => (b.createdAt || Date.now()) - (a.createdAt || Date.now()));
      setUserList(list);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };`;

if (code.includes('const fetchUsers = async () => {')) {
  code = code.replace(oldFetch, newFetch);
}

// 2. Tiyaking lalabas ang Time and Date ng pagkakagawa sa User Card
code = code.replace(
  'Joined: {u.createdAt ? formatPostTime(u.createdAt) : "Earlier user"}',
  'Joined: {u.createdAt ? formatPostTime(u.createdAt) : "Date & Time Unrecorded"}'
);

fs.writeFileSync('src/App.jsx', code);
console.log('✅ Admin Tab updated: Newest users on top with Date & Time!');
