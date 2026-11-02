import React, { useState } from "react";
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
  signupName = "",
  setSignupName,
  errorMessage,
  setErrorMessage,
  handleEmailAuth,
  handleGoogleSignIn,
  isAuthLoading = false
}) {
  const [showPassword, setShowPassword] = useState(false);

  // In-app browser detection (Messenger, Facebook, Instagram)
  const isMessengerBrowser = typeof navigator !== "undefined" && (
    /FBAN|FBAV|Instagram|Line/i.test(navigator.userAgent || navigator.vendor || window.opera)
  );

  const onGoogleButtonClick = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isMessengerBrowser) {
      const cleanUrl = window.location.href.replace(/^https?:\/\//, '');
      window.location.href = "intent://" + cleanUrl + "#Intent;scheme=https;package=com.android.chrome;end";
      return;
    }
    if (typeof handleGoogleSignIn === "function") {
      handleGoogleSignIn();
    }
  };

  // ─── 1. HERO CAROUSEL VIEW (CLEAN, NO FAKE BADGES) ───────────────
  if (!showAuthForm) {
    const currentSlide = ONBOARDING_SLIDES[onboardSlideIdx] || ONBOARDING_SLIDES[0];

    return (
      <div className="mobile-frame" style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "36px 24px",
        background: "linear-gradient(180deg, #f8fafc 0%, #edf2f7 100%)",
        minHeight: "100dvh",
        boxSizing: "border-box"
      }}>
        {/* Official Brand Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 900, color: "var(--primary)", letterSpacing: "-0.5px", margin: 0 }}>
            NUTRIPULSE
          </h2>
          <button
            onClick={() => { setAuthMode("login"); setShowAuthForm(true); }}
            style={{
              background: "transparent",
              border: "none",
              color: "#64748b",
              fontWeight: 800,
              fontSize: "12.5px",
              cursor: "pointer",
              padding: "4px 8px"
            }}
          >
            Sign In
          </button>
        </div>

        {/* Clean Center Feature Focus */}
        <div style={{ textAlign: "center", margin: "auto 0" }}>
          {/* Authentic Icon Badge */}
          <div style={{
            width: "96px",
            height: "96px",
            borderRadius: "50%",
            background: (currentSlide.color || "var(--primary)") + "18",
            color: currentSlide.color || "var(--primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px auto",
            fontSize: "40px"
          }}>
            <i className={currentSlide.icon}></i>
          </div>

          <h3 style={{
            fontSize: "22px",
            fontWeight: 900,
            color: "#0f172a",
            marginBottom: "10px",
            lineHeight: 1.25,
            letterSpacing: "-0.4px"
          }}>
            {currentSlide.title}
          </h3>

          <p style={{
            fontSize: "13.5px",
            color: "#64748b",
            lineHeight: 1.6,
            maxWidth: "290px",
            margin: "0 auto"
          }}>
            {currentSlide.desc}
          </p>

          {/* Dots Indicator */}
          <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginTop: "26px" }}>
            {ONBOARDING_SLIDES.map((_, idx) => (
              <div
                key={idx}
                onClick={() => setOnboardSlideIdx(idx)}
                style={{
                  width: onboardSlideIdx === idx ? "22px" : "6px",
                  height: "6px",
                  borderRadius: "3px",
                  background: onboardSlideIdx === idx ? "var(--primary)" : "#cbd5e1",
                  cursor: "pointer",
                  transition: "all 0.3s ease"
                }}
              ></div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div>
          <button
            onClick={() => {
              if (onboardSlideIdx < ONBOARDING_SLIDES.length - 1) {
                setOnboardSlideIdx(onboardSlideIdx + 1);
              } else {
                setAuthMode("signup");
                setShowAuthForm(true);
              }
            }}
            className="btn-block"
            style={{ height: "48px", fontSize: "13.5px", fontWeight: 800, marginBottom: "10px" }}
          >
            {onboardSlideIdx < ONBOARDING_SLIDES.length - 1 ? "Next Step" : "Get Started"}
          </button>

          <button
            onClick={() => { setAuthMode("login"); setShowAuthForm(true); }}
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              color: "#0f172a",
              fontWeight: 800,
              fontSize: "12.5px",
              cursor: "pointer",
              padding: "8px 0"
            }}
          >
            Already an athlete? <span style={{ color: "var(--primary)" }}>Sign In</span>
          </button>
        </div>
      </div>
    );
  }

  // ─── 2. AUTH FORM VIEW (CLEAN WHITE CARD, SYSTEM COMPATIBLE) ─────
  return (
    <div className="mobile-frame" style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      minHeight: "100dvh",
      background: "linear-gradient(180deg, #f8fafc 0%, #edf2f7 100%)",
      boxSizing: "border-box"
    }}>
      <div className="card" style={{
        maxWidth: "380px",
        width: "100%",
        padding: "26px 22px",
        borderRadius: "20px",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.06), 0 8px 10px -6px rgba(0, 0, 0, 0.04)"
      }}>
        {/* Header Bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
          <button
            type="button"
            onClick={() => { setShowAuthForm(false); setErrorMessage(""); }}
            style={{
              background: "#f1f5f9",
              border: "none",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 800,
              color: "#334155",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <i className="fa-solid fa-arrow-left"></i>
          </button>

          <h2 style={{ fontSize: "19px", fontWeight: 900, color: "var(--primary)", letterSpacing: "-0.5px", margin: 0 }}>
            NUTRIPULSE
          </h2>

          <div style={{ width: "32px" }}></div>
        </div>

        {/* Tab Switcher: Sign In vs Sign Up */}
        <div style={{
          display: "flex",
          background: "#f1f5f9",
          padding: "4px",
          borderRadius: "12px",
          marginBottom: "18px"
        }}>
          <button
            type="button"
            onClick={() => { setAuthMode("login"); setErrorMessage(""); }}
            style={{
              flex: 1,
              padding: "8px 0",
              borderRadius: "9px",
              border: "none",
              fontWeight: 800,
              fontSize: "12px",
              cursor: "pointer",
              background: authMode === "login" ? "#ffffff" : "transparent",
              color: authMode === "login" ? "var(--primary)" : "#64748b",
              boxShadow: authMode === "login" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
              transition: "all 0.2s ease"
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode("signup"); setErrorMessage(""); }}
            style={{
              flex: 1,
              padding: "8px 0",
              borderRadius: "9px",
              border: "none",
              fontWeight: 800,
              fontSize: "12px",
              cursor: "pointer",
              background: authMode === "signup" ? "#ffffff" : "transparent",
              color: authMode === "signup" ? "var(--primary)" : "#64748b",
              boxShadow: authMode === "signup" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
              transition: "all 0.2s ease"
            }}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#dc2626",
            borderRadius: "10px",
            padding: "10px 12px",
            fontSize: "12px",
            lineHeight: 1.4,
            marginBottom: "14px",
            display: "flex",
            alignItems: "flex-start",
            gap: "8px"
          }}>
            <i className="fa-solid fa-circle-exclamation" style={{ marginTop: "2px", flexShrink: 0 }}></i>
            <div>{errorMessage}</div>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleEmailAuth}>
          {authMode === "signup" && (
            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                Full Name / Alias
              </label>
              <input
                type="text"
                className="form-input"
                required
                placeholder="e.g. Edison Valerio"
                value={signupName}
                onChange={(e) => setSignupName && setSignupName(e.target.value)}
              />
            </div>
          )}

          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
              Email Address
            </label>
            <input
              type="email"
              className="form-input"
              required
              placeholder="athlete@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: "18px" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                className="form-input"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingRight: "38px" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  fontSize: "13px"
                }}
              >
                <i className={showPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"}></i>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isAuthLoading}
            className="btn-block"
            style={{
              height: "44px",
              fontSize: "13px",
              fontWeight: 800,
              cursor: isAuthLoading ? "not-allowed" : "pointer"
            }}
          >
            {isAuthLoading ? (
              <span><i className="fa-solid fa-spinner fa-spin"></i> Processing...</span>
            ) : (
              <span>{authMode === "login" ? "Sign In" : "Create Account"}</span>
            )}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", margin: "18px 0", gap: "8px" }}>
          <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }}></div>
          <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 700 }}>OR</span>
          <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }}></div>
        </div>

        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={onGoogleButtonClick}
          className="btn-block"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            height: "44px",
            fontSize: "12.5px",
            background: "#ffffff",
            color: "#0f172a",
            border: "1px solid #cbd5e1",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
          }}
        >
          <i className="fa-brands fa-google" style={{ color: "#ea4335", fontSize: "15px" }}></i>
          <span>Continue with Google</span>
        </button>
      </div>
    </div>
  );
}
