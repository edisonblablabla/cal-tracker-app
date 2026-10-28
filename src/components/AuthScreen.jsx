import React from "react";
import { ONBOARDING_SLIDES } from "../constants/data";

export default function AuthScreen({
  showAuthForm,
  setShowAuthForm,
  onboardSlideIdx,
  setOnboardSlideIdx,
  authMode,
  setAuthMode,
  email,
  setEmail,
  password,
  setPassword,
  errorMessage,
  setErrorMessage,
  handleEmailAuth,
  handleGoogleSignIn
}) {
  
    if (!showAuthForm) {
      const currentSlide = ONBOARDING_SLIDES[onboardSlideIdx];
      return (
        <div className="mobile-frame" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "32px 24px", background: "linear-gradient(180deg, #f8fafc 0%, #edf2f7 100%)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 900, color: "var(--primary)", letterSpacing: "-0.5px" }}>NUTRIPULSE</h2>
            <button onClick={() => setShowAuthForm(true)} style={{ background: "transparent", border: "none", color: "#64748b", fontWeight: 800, fontSize: "12px", cursor: "pointer" }}>Skip</button>
          </div>

          <div style={{ textAlign: "center", margin: "auto 0" }}>
            <div style={{ width: "90px", height: "90px", borderRadius: "50%", background: currentSlide.color + "15", color: currentSlide.color, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px auto", fontSize: "38px" }}>
              <i className={currentSlide.icon}></i>
            </div>
            <h3 style={{ fontSize: "20px", fontWeight: 900, color: "#0f172a", marginBottom: "8px" }}>{currentSlide.title}</h3>
            <p style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.6, maxWidth: "280px", margin: "0 auto" }}>{currentSlide.desc}</p>

            <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginTop: "24px" }}>
              {ONBOARDING_SLIDES.map((_, idx) => (
                <div key={idx} onClick={() => setOnboardSlideIdx(idx)} style={{ width: onboardSlideIdx === idx ? "20px" : "6px", height: "6px", borderRadius: "3px", background: onboardSlideIdx === idx ? "var(--primary)" : "#cbd5e1", cursor: "pointer", transition: "all 0.3s ease" }}></div>
              ))}
            </div>
          </div>

          <div>
            <button 
              onClick={() => {
                if (onboardSlideIdx < ONBOARDING_SLIDES.length - 1) {
                  setOnboardSlideIdx(onboardSlideIdx + 1);
                } else {
                  setShowAuthForm(true);
                }
              }} 
              className="btn-block" 
              style={{ height: "46px", fontSize: "13px", marginBottom: "10px" }}
            >
              {onboardSlideIdx < ONBOARDING_SLIDES.length - 1 ? "Next Step" : "Get Started"}
            </button>

            <button onClick={() => { setAuthMode("login"); setShowAuthForm(true); }} style={{ width: "100%", background: "transparent", border: "none", color: "#0f172a", fontWeight: 800, fontSize: "12px", cursor: "pointer", padding: "8px 0" }}>
              Already have an account? <span style={{ color: "var(--primary)" }}>Sign In</span>
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="mobile-frame" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div className="card" style={{ maxWidth: "360px", width: "100%", padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
            <button onClick={() => setShowAuthForm(false)} style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", fontSize: "12px", fontWeight: 800, color: "#334155" }}>
              <i className="fa-solid fa-arrow-left"></i>
            </button>
            <h2 style={{ fontSize: "18px", fontWeight: 900, color: "var(--primary)", letterSpacing: "0.5px", margin: "0 auto 0 auto" }}>NUTRIPULSE</h2>
          </div>

          {errorMessage && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: "12px", padding: "10px 12px", fontSize: "11px", fontWeight: 700, marginBottom: "14px", textAlign: "center" }}>
              <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: "6px" }}></i>
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleEmailAuth}>
            <div style={{ marginBottom: "10px" }}>
              <label style={{ fontSize: "11px", fontWeight: 700 }}>Email Address</label>
              <input type="email" className="form-input" placeholder="athlete@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "11px", fontWeight: 700 }}>Password</label>
              <input type="password" className="form-input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
            </div>

            <button type="submit" className="btn-block" style={{ height: "44px", fontSize: "13px" }}>
              {authMode === "login" ? "Sign In with Email" : "Sign Up with Email"}
            </button>
          </form>

          <div style={{ display: "flex", alignItems: "center", margin: "18px 0", gap: "8px" }}>
            <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }}></div>
            <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 700 }}>OR</span>
            <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }}></div>
          </div>

          <button onClick={handleGoogleSignIn} className="btn-block" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", height: "44px", fontSize: "12px", background: "#ffffff", color: "#0f172a", border: "1px solid #cbd5e1" }}>
            <i className="fa-brands fa-google" style={{ color: "#ea4335", fontSize: "15px" }}></i>
            Sign in with Google
          </button>

          <div style={{ textAlign: "center", marginTop: "16px" }}>
            <button onClick={() => { setErrorMessage(""); setAuthMode(authMode === "login" ? "signup" : "login"); }} style={{ background: "none", border: "none", color: "var(--primary)", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
              {authMode === "login" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    );
  
}
