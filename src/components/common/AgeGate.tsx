"use client";

import React, { useState, useEffect } from "react";
import Logo from "./Logo";

const STORAGE_KEY = "yorumuse_age_verified";
const TIMESTAMP_KEY = "yorumuse_age_verified_at";
const EXPIRY_DAYS = 30; // Re-verify after 30 days

export default function AgeGate() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    try {
      const verified = localStorage.getItem(STORAGE_KEY);
      const verifiedAt = localStorage.getItem(TIMESTAMP_KEY);

      if (verified === "true" && verifiedAt) {
        const elapsedDays = (Date.now() - parseInt(verifiedAt, 10)) / (1000 * 60 * 60 * 24);
        if (elapsedDays < EXPIRY_DAYS) {
          // Still valid
          setIsOpen(false);
          return;
        }
      }
      // Needs verification
      setIsOpen(true);
    } catch {
      // In case localStorage is blocked/disabled in private mode
      setIsOpen(true);
    }
  }, []);

  const handleEnter = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
      localStorage.setItem(TIMESTAMP_KEY, Date.now().toString());
      document.cookie = `yorumuse_age_verified=true; path=/; max-age=${EXPIRY_DAYS * 24 * 60 * 60}; SameSite=Lax`;
    } catch (e) {
      console.warn("Could not save age verification to localStorage", e);
    }
    setIsOpen(false);
  };

  const handleExit = () => {
    // Redirect away gracefully to a standard safe destination
    window.location.href = "https://www.google.com";
  };

  if (!isMounted || !isOpen) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
      aria-describedby="age-gate-desc"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        backgroundColor: "rgba(5, 5, 7, 0.96)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        animation: "fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          backgroundColor: "#ffffff",
          border: "1px solid var(--border-medium)",
          borderRadius: "18px",
          padding: "44px 36px",
          textAlign: "center",
          boxShadow: "0 24px 64px rgba(0, 0, 0, 0.15), 0 0 40px rgba(166, 124, 30, 0.1)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle Ambient Gold Glow Top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "280px",
            height: "2px",
            background: "linear-gradient(90deg, transparent, var(--accent-gold), transparent)",
          }}
        />

        {/* Brand Monogram */}
        <div style={{ marginBottom: "28px" }}>
          <Logo size="lg" linkToHome={false} />
        </div>

        {/* Age Restriction Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 14px",
            borderRadius: "9999px",
            background: "rgba(166, 124, 30, 0.08)",
            border: "1px solid rgba(166, 124, 30, 0.3)",
            color: "var(--accent-gold)",
            fontSize: "0.8rem",
            fontWeight: 700,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginBottom: "20px",
          }}
        >
          <span>18+ ADULTS ONLY</span>
        </div>

        {/* Primary Prompt */}
        <h2
          id="age-gate-title"
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "2rem",
            color: "var(--text-primary)",
            marginBottom: "14px",
            lineHeight: 1.2,
          }}
        >
          Are you 18 or older?
        </h2>

        <p
          id="age-gate-desc"
          style={{
            color: "var(--text-secondary)",
            fontSize: "1rem",
            lineHeight: 1.6,
            marginBottom: "36px",
            maxWidth: "420px",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          This website is intended for adults aged 18 and over. By entering, you certify that you have reached the age of majority in your jurisdiction and consent to viewing sexually explicit material.
        </p>

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            gap: "14px",
            justifyContent: "center",
            flexDirection: "column",
          }}
        >
          <button
            id="age-gate-enter-btn"
            onClick={handleEnter}
            className="btn btn-primary btn-lg"
            style={{ width: "100%", fontSize: "1.05rem", letterSpacing: "0.06em" }}
          >
            Enter
          </button>

          <button
            id="age-gate-exit-btn"
            onClick={handleExit}
            className="btn btn-secondary btn-lg"
            style={{ width: "100%", fontSize: "1rem", color: "var(--text-secondary)" }}
          >
            Exit
          </button>
        </div>

        {/* Compliance Footer Note */}
        <div
          style={{
            marginTop: "28px",
            fontSize: "0.75rem",
            color: "var(--text-muted)",
            lineHeight: 1.4,
          }}
        >
          18 U.S.C. § 2257 Record-Keeping Requirements Compliance Statement
        </div>
      </div>
    </div>
  );
}
