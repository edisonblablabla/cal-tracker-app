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
  signupName,
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

  // ─── HERO CAROUSEL VIEW ──────────────────────────────────────────
  if (!showAuthForm) {
    const currentSlide = ONBOARDING_SLIDES[onboardSlideIdx] || ONBOARDING_SLIDES[0];

    const previewBadges = [
      { icon: "fa-solid fa-fire", label: "2,200 kcal", sub: "Daily Target", bg: "#fef3c7", text: "#d97706" },
      { icon: "fa-solid fa-drumstick-bite", label: "150g Protein", sub: "Muscle Fuel", bg: "#e0e7ff", text: "#4338ca" },
      { icon: "fa-solid fa-person-running", label: "8.5 km", sub: "GPS Tracked", bg: "#e0f2fe", text: "#0369a1" }
    ];

    return (
      <div className="mobile-frame" style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "clamp(24px, 5vw, 36px) clamp(18px, 4vw, 28px)",
        background: "linear-gradient(180deg, #090d16 0%, #0f172a 100%)",
        color: "#ffffff",
        minHeight: "100dvh",
        boxSizing: "border-box"
      }}>
        {/* Top Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "linear-gradient(135deg, #6366f1, #38bdf8)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(99, 102, 241, 0.4)" }}>
              <i className="fa-solid fa-bolt" style={{ color: "#ffffff", fontSize: "16px" }}></i>
            </div>
            <span style={{ fontSize: "18px", fontWeight: 900, letterSpacing: "-0.5px", background: "linear-gradient(135deg, #ffffff, #cbd5e1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              NUTRIPULSE
            </span>
          </div>
          <button
            onClick={() => { setAuthMode("login"); setShowAuthForm(true); }}
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "#e2e8f0",
              fontWeight: 800,
              fontSize: "12px",
              padding: "6px 14px",
              borderRadius: "20px",
              cursor: "pointer",
              backdropFilter: "blur(6px)"
            }}
          >
            Sign In
          </button>
        </div>

        {/* Dynamic Center Hero Card */}
        <div style={{ textAlign: "center", margin: "auto 0", padding: "10px 0" }}>
          {/* Animated Glowing Orb / Icon */}
          <div style={{ position: "relative", width: "120px", height: "120px", margin: "0 auto 26px auto" }}>
            <div style={{
              position: "absolute",
              inset: "-10px",
              borderRadius: "50%",
              background: `radial-gradient(circle, ${currentSlide.color}50 0%, transparent 70%)`,
              filter: "blur(14px)",
              animation: "pulse 3s infinite alternate"
            }}></div>
            <div style={{
              position: "relative",
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              background: "linear-gradient(145deg, #1e293b, #0f172a)",
              border: `2px solid ${currentSlide.color}80`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "44px",
              color: currentSlide.color,
              boxShadow: `0 10px 30px ${currentSlide.color}30`
            }}>
              <i className={currentSlide.icon}></i>
            </div>
          </div>

          <h1 style={{
            fontSize: "clamp(22px, 5.5vw, 26px)",
            fontWeight: 900,
            color: "#ffffff",
            marginBottom: "10px",
            lineHeight: 1.25,
            letterSpacing: "-0.5px"
          }}>
            {currentSlide.title}
          </h1>

          <p style={{
            fontSize: "clamp(12.5px, 3.2vw, 14px)",
            color: "#94a3b8",
            lineHeight: 1.6,
            maxWidth: "310px",
            margin: "0 auto 22px auto"
          }}>
            {currentSlide.desc}
          </p>

          {/* Interactive Metric Preview Pills */}
          <div style={{ display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap", marginBottom: "26px" }}>
            {previewBadges.map((badge, idx) => (
              <div key={idx} style={{
                background: "rgba(30, 41, 59, 0.7)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "12px",
                padding: "6px 12px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                backdropFilter: "blur(8px)"
              }}>
                <i className={badge.icon} style={{ color: badge.text, fontSize: "11px" }}></i>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: "11px", fontWeight: 800, color: "#f8fafc", lineHeight: 1 }}>{badge.label}</div>
                  <div style={{ fontSize: "8.5px", color: "#94a3b8", fontWeight: 600 }}>{badge.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Carousel Slide Indicators */}
          <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
            {ONBOARDING_SLIDES.map((_, idx) => (
              <div
                key={idx}
                onClick={() => setOnboardSlideIdx(idx)}
                style={{
                  width: onboardSlideIdx === idx ? "28px" : "8px",
                  height: "7px",
                  borderRadius: "4px",
                  background: onboardSlideIdx === idx ? "linear-gradient(90deg, #6366f1, #38bdf8)" : "rgba(255, 255, 255, 0.2)",
                  cursor: "pointer",
                  transition: "all 0.3s ease"
                }}
              ></div>
            ))}
          </div>
        </div>

        {/* Bottom Action Section */}
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
            style={{
              width: "100%",
              height: "50px",
              borderRadius: "14px",
              border: "none",
              background: "linear-gradient(135deg, #6366f1 0%, #38bdf8 100%)",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "0 8px 24px rgba(99, 102, 241, 0.35)",
              marginBottom: "12px",
              transition: "transform 0.15s ease"
            }}
          >
            <span>{onboardSlideIdx < ONBOARDING_SLIDES.length - 1 ? "Next Step" : "Start Your Athlete Journey ⚡"}</span>
            <i className="fa-solid fa-arrow-right" style={{ fontSize: "12px" }}></i>
          </button>

          <button
            onClick={() => { setAuthMode("login"); setShowAuthForm(true); }}
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              fontWeight: 700,
              fontSize: "12.5px",
              cursor: "pointer",
              padding: "8px 0"
            }}
          >
            Already an athlete? <span style={{ color: "#38bdf8", fontWeight: 800 }}>Sign In</span>
          </button>
        </div>
      </div>
    );
  }

  // ─── AUTH FORM VIEW (SIGN IN / SIGN UP) ──────────────────────────
  return (
    <div className="mobile-frame" style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "clamp(16px, 4vw, 24px)",
      minHeight: "100dvh",
      background: "#090d16",
      boxSizing: "border-box"
    }}>
      <div style={{
        background: "#0f172a",
        borderRadius: "24px",
        width: "100%",
        maxWidth: "380px",
        padding: "26px 22px",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 20px 50px rgba(0, 0, 0, 0.4)",
        boxSizing: "border-box",
        color: "#ffffff"
      }}>
        {/* Header Bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <button
            type="button"
            onClick={() => { setShowAuthForm(false); setErrorMessage(""); }}
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "none",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              color: "#cbd5e1",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px"
            }}
          >
            <i className="fa-solid fa-arrow-left"></i>
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <i className="fa-solid fa-bolt" style={{ color: "#38bdf8", fontSize: "14px" }}></i>
            <span style={{ fontSize: "16px", fontWeight: 900, letterSpacing: "-0.5px" }}>NUTRIPULSE</span>
          </div>

          <div style={{ width: "32px" }}></div>
        </div>

        {/* Tab Switcher: Sign In vs Sign Up */}
        <div style={{
          display: "flex",
          background: "rgba(255, 255, 255, 0.06)",
          padding: "4px",
          borderRadius: "12px",
          marginBottom: "20px"
        }}>
          <button
            type="button"
            onClick={() => { setAuthMode("login"); setErrorMessage(""); }}
            style={{
              flex: 1,
              padding: "9px 0",
              borderRadius: "9px",
              border: "none",
              fontWeight: 800,
              fontSize: "12.5px",
              cursor: "pointer",
              background: authMode === "login" ? "linear-gradient(135deg, #6366f1, #4f46e5)" : "transparent",
              color: authMode === "login" ? "#ffffff" : "#94a3b8",
              boxShadow: authMode === "login" ? "0 4px 12px rgba(99, 102, 241, 0.3)" : "none",
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
              padding: "9px 0",
              borderRadius: "9px",
              border: "none",
              fontWeight: 800,
              fontSize: "12.5px",
              cursor: "pointer",
              background: authMode === "signup" ? "linear-gradient(135deg, #6366f1, #4f46e5)" : "transparent",
              color: authMode === "signup" ? "#ffffff" : "#94a3b8",
              boxShadow: authMode === "signup" ? "0 4px 12px rgba(99, 102, 241, 0.3)" : "none",
              transition: "all 0.2s ease"
            }}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div style={{
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.35)",
            color: "#fca5a5",
            borderRadius: "10px",
            padding: "10px 12px",
            fontSize: "11.5px",
            lineHeight: 1.4,
            marginBottom: "16px",
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
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#cbd5e1", marginBottom: "5px" }}>
                Full Name / Athlete Alias
              </label>
              <div style={{ position: "relative" }}>
                <i className="fa-solid fa-user" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b", fontSize: "12px" }}></i>
                <input
                  type="text"
                  required
                  placeholder="e.g. Edison Valerio"
                  value={signupName || ""}
                  onChange={(e) => setSignupName && setSignupName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "11px 12px 11px 36px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "10px",
                    color: "#ffffff",
                    fontSize: "12.5px",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
              </div>
            </div>
          )}

          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#cbd5e1", marginBottom: "5px" }}>
              Email Address
            </label>
            <div style={{ position: "relative" }}>
              <i className="fa-solid fa-envelope" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b", fontSize: "12px" }}></i>
              <input
                type="email"
                required
                placeholder="athlete@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: "100%",
                  padding: "11px 12px 11px 36px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "10px",
                  color: "#ffffff",
                  fontSize: "12.5px",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: "18px" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#cbd5e1", marginBottom: "5px" }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <i className="fa-solid fa-lock" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b", fontSize: "12px" }}></i>
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "11px 38px 11px 36px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "10px",
                  color: "#ffffff",
                  fontSize: "12.5px",
                  outline: "none",
                  boxSizing: "border-box"
                }}
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
            style={{
              width: "100%",
              height: "46px",
              borderRadius: "12px",
              border: "none",
              background: "linear-gradient(135deg, #6366f1 0%, #38bdf8 100%)",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 800,
              cursor: isAuthLoading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "0 4px 16px rgba(99, 102, 241, 0.35)",
              transition: "transform 0.15s ease"
            }}
          >
            {isAuthLoading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                <span>Processing...</span>
              </>
            ) : (
              <span>{authMode === "login" ? "Sign In ⚡" : "Create Athlete Account ⚡"}</span>
            )}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", margin: "20px 0", gap: "10px" }}>
          <div style={{ flex: 1, height: "1px", background: "rgba(255, 255, 255, 0.1)" }}></div>
          <span style={{ fontSize: "10px", color: "#64748b", fontWeight: 700 }}>OR CONTINUE WITH</span>
          <div style={{ flex: 1, height: "1px", background: "rgba(255, 255, 255, 0.1)" }}></div>
        </div>

        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={onGoogleButtonClick}
          style={{
            width: "100%",
            height: "44px",
            borderRadius: "12px",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            background: "#ffffff",
            color: "#0f172a",
            fontSize: "12.5px",
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
          }}
        >
          <i className="fa-brands fa-google" style={{ color: "#ea4335", fontSize: "15px" }}></i>
          <span>Continue with Google</span>
        </button>
      </div>
    </div>
  );
}
