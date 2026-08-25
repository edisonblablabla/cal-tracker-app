import fs from 'fs';

let code = fs.readFileSync('src/App.jsx', 'utf8');

// Linisin ang hidden spaces
code = code.replace(/[\u00a0\xa0]/g, ' ');

// 1. Add States for Pulse Check Modal and User Bio Fields
if (!code.includes('selectedAthlete')) {
  code = code.replace(
    'const [showNoteModal, setShowNoteModal] = useState(false);',
    'const [showNoteModal, setShowNoteModal] = useState(false);\n  const [selectedAthlete, setSelectedAthlete] = useState(null);\n  const [profBirthday, setProfBirthday] = useState("");\n  const [profGender, setProfGender] = useState("Unspecified");'
  );
}

// 2. Add Age Calculation Helper
if (!code.includes('function getAge')) {
  code = code.replace(
    'export default function App() {',
    `function getAge(birthDateStr) {
  if (!birthDateStr) return "N/A";
  const birthDate = new Date(birthDateStr);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age || "N/A";
}

export default function App() {`
  );
}

// 3. Inject Selected Athlete Pulse Check Modal in Modal Layer
const modalLayerMarker = '{/* ALL MODALS LAYER */}';
const pulseCheckModalHTML = `{/* PULSE CHECK ATHLETE MODAL */}
      {selectedAthlete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)', zIndex: 2200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '360px', padding: '20px', borderRadius: '24px', background: '#ffffff', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)', textAlign: 'center', position: 'relative' }}>
            <button onClick={() => setSelectedAthlete(null)} style={{ position: 'absolute', top: '14px', right: '14px', background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', fontWeight: 800 }}>✕</button>

            <div style={{ width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 10px auto', border: '3px solid var(--primary)', overflow: 'hidden', background: '#cbd5e1' }}>
              <img src={selectedAthlete.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', margin: 0 }}>{selectedAthlete.userName || 'Athlete'}</h3>
            <p style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 800, marginTop: '2px' }}>{selectedAthlete.userTitle || 'Fitness Enthusiast'}</p>

            {/* BIO DETAILS GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: '#f8fafc', padding: '12px', borderRadius: '16px', margin: '14px 0', border: '1px solid #e2e8f0', textAlign: 'left', fontSize: '11px' }}>
              <div><strong style={{ color: '#64748b' }}>🎂 Birthday:</strong> <div style={{ fontWeight: 800, color: '#0f172a' }}>{selectedAthlete.birthday || "Not set"}</div></div>
              <div><strong style={{ color: '#64748b' }}>🎈 Age:</strong> <div style={{ fontWeight: 800, color: '#0f172a' }}>{getAge(selectedAthlete.birthday)} yrs old</div></div>
              <div><strong style={{ color: '#64748b' }}>👤 Gender:</strong> <div style={{ fontWeight: 800, color: '#0f172a' }}>{selectedAthlete.gender || "Unspecified"}</div></div>
              <div><strong style={{ color: '#64748b' }}>🎯 Primary Goal:</strong> <div style={{ fontWeight: 800, color: 'var(--primary)' }}>{selectedAthlete.activeGoalType || "Fitness"}</div></div>
            </div>

            {/* ATHLETE STATS */}
            <div style={{ display: 'flex', justifyContent: 'space-around', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px', borderRadius: '14px', marginBottom: '14px' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#16a34a' }}>⚡ {selectedAthlete.boostersCount || 1}</div>
                <div style={{ fontSize: '9px', fontWeight: 800, color: '#15803d' }}>Boosters</div>
              </div>
              <div style={{ width: '1px', background: '#bbf7d0' }}></div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#f59e0b' }}>🔥 {selectedAthlete.streakDays || 1}</div>
                <div style={{ fontSize: '9px', fontWeight: 800, color: '#b45309' }}>Day Streak</div>
              </div>
            </div>

            <button className="btn-block" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }} onClick={() => alert("⚡ You boosted " + selectedAthlete.userName + "!")}>
              ⚡ Give Boost
            </button>
          </div>
        </div>
      )}\n\n      `;

if (code.includes(modalLayerMarker)) {
  code = code.replace(modalLayerMarker, modalLayerMarker + "\n" + pulseCheckModalHTML);
}

// 4. Connect Click Handler on Avatars in Pulse Feed to open Pulse Check
code = code.replace(
  `onClick={() => setShowNoteModal(true)}>`,
  `onClick={() => setSelectedAthlete({ userName: appData.userName, userTitle: appData.userTitle, avatarUrl: appData.avatarUrl, birthday: appData.birthday, gender: appData.gender, activeGoalType: appData.activeGoalType, streakDays: appData.streakDays })}>`
);

fs.writeFileSync('src/App.jsx', code);
console.log('✅ Pulse Check modal and Age/Birthday fields added!');
