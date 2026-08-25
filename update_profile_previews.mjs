import fs from 'fs';

let code = fs.readFileSync('src/App.jsx', 'utf8');

// Linisin ang hidden spaces
code = code.replace(/[\u00a0\xa0]/g, ' ');

// Old Profile Avatar Upload Box
const oldAvatarBox = `<div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "11px", fontWeight: 700, display: "block", marginBottom: "4px" }}>Profile Avatar</label>
              <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 14px", background: "#f1f5f9", borderRadius: "12px", fontSize: "11px", fontWeight: 700, color: "var(--primary)", cursor: "pointer", border: "1px solid #cbd5e1", width: "100%", justifyContent: "center" }}>
                <i className="fa-solid fa-camera"></i> {avatarPreview ? "Change Avatar" : "Upload Avatar"}
                <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
              </label>
            </div>`;

// New Profile Avatar Upload Box with Live Image Preview & Badge
const newAvatarBox = `<div style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "11px", fontWeight: 700, display: "block", marginBottom: "4px" }}>Profile Avatar</label>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {avatarPreview ? (
                  <div style={{ width: "42px", height: "42px", borderRadius: "50%", overflow: "hidden", border: "2px solid #10b981", flexShrink: 0 }}>
                    <img src={avatarPreview} alt="Avatar Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ) : null}
                <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 14px", background: avatarPreview ? "#f0fdf4" : "#f1f5f9", borderRadius: "12px", fontSize: "11px", fontWeight: 700, color: avatarPreview ? "#10b981" : "var(--primary)", cursor: "pointer", border: avatarPreview ? "1px solid #a7f3d0" : "1px solid #cbd5e1", flex: 1, justifyContent: "center" }}>
                  <i className={avatarPreview ? "fa-solid fa-circle-check" : "fa-solid fa-camera"}></i> {avatarPreview ? "✅ Avatar Selected (Tap to Change)" : "Upload Avatar"}
                  <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
                </label>
              </div>
            </div>`;

if (code.includes('Upload Avatar')) {
  code = code.replace(oldAvatarBox, newAvatarBox);
}

// Old Cover Banner Photo Box
const oldCoverBox = `<div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "11px", fontWeight: 700, display: "block", marginBottom: "4px" }}>Cover Banner Photo</label>
              <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 14px", background: "#f1f5f9", borderRadius: "12px", fontSize: "11px", fontWeight: 700, color: "var(--primary)", cursor: "pointer", border: "1px solid #cbd5e1", width: "100%", justifyContent: "center" }}>
                <i className="fa-solid fa-image"></i> {coverPreview ? "Change Banner" : "Upload Banner"}
                <input type="file" accept="image/*" onChange={handleCoverChange} style={{ display: "none" }} />
              </label>
            </div>`;

// New Cover Banner Photo Box with Live Image Preview & Badge
const newCoverBox = `<div style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "11px", fontWeight: 700, display: "block", marginBottom: "4px" }}>Cover Banner Photo</label>
              {coverPreview && (
                <div style={{ width: "100%", height: "55px", borderRadius: "10px", overflow: "hidden", marginBottom: "6px", border: "2px solid #10b981" }}>
                  <img src={coverPreview} alt="Banner Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              )}
              <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 14px", background: coverPreview ? "#f0fdf4" : "#f1f5f9", borderRadius: "12px", fontSize: "11px", fontWeight: 700, color: coverPreview ? "#10b981" : "var(--primary)", cursor: "pointer", border: coverPreview ? "1px solid #a7f3d0" : "1px solid #cbd5e1", width: "100%", justifyContent: "center" }}>
                <i className={coverPreview ? "fa-solid fa-circle-check" : "fa-solid fa-image"}></i> {coverPreview ? "✅ Banner Selected (Tap to Change)" : "Upload Banner"}
                <input type="file" accept="image/*" onChange={handleCoverChange} style={{ display: "none" }} />
              </label>
            </div>`;

if (code.includes('Upload Banner')) {
  code = code.replace(oldCoverBox, newCoverBox);
}

fs.writeFileSync('src/App.jsx', code);
console.log('✅ Live Image Indicators for Profile Avatar & Banner successfully added!');
