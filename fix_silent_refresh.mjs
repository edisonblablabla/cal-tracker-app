import fs from 'fs';

let code = fs.readFileSync('src/App.jsx', 'utf8');

// Linisin ang hidden spaces
code = code.replace(/[\u00a0\xa0]/g, ' ');

// 1. Maglagay ng isRefreshing state kung wala pa
if (!code.includes('isRefreshing')) {
  code = code.replace(
    'const [isLoggingOut, setIsLoggingOut] = useState(false);',
    'const [isLoggingOut, setIsLoggingOut] = useState(false);\n  const [isRefreshing, setIsRefreshing] = useState(false);'
  );
}

// 2. Palitan ang Admin Refresh button para maging SILENT (Walang Alert Pop-up)
const oldRefresh = `<button onClick={async () => { await fetchPosts(); await fetchUsers(); setAppData(prev => ({ ...prev })); alert("Admin Dashboard Refreshed!"); }} style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", padding: "6px 12px", borderRadius: "12px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                <i className="fa-solid fa-rotate-right" style={{ marginRight: "4px" }}></i> Refresh
              </button>`;

const silentRefresh = `<button onClick={async () => { setIsRefreshing(true); await fetchPosts(); await fetchUsers(); setAppData(prev => ({ ...prev })); setIsRefreshing(false); }} disabled={isRefreshing} style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", padding: "6px 12px", borderRadius: "12px", fontSize: "11px", fontWeight: 700, cursor: "pointer", opacity: isRefreshing ? 0.6 : 1 }}>
                <i className={"fa-solid fa-rotate-right " + (isRefreshing ? "fa-spin" : "")} style={{ marginRight: "4px" }}></i> {isRefreshing ? "Refreshing..." : "Refresh"}
              </button>`;

if (code.includes('alert("Admin Dashboard Refreshed!")')) {
  code = code.replace(oldRefresh, silentRefresh);
}

fs.writeFileSync('src/App.jsx', code);
console.log('✅ Silent Admin Refresh applied successfully!');
