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
          setIsOpen(false);
          return;
        }
      }
      setIsOpen(true);
    } catch {
      setIsOpen(true);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleEnter = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
      localStorage.setItem(TIMESTAMP_KEY, Date.now().toString());
      document.cookie = `yorumuse_age_verified=true; path=/; max-age=${EXPIRY_DAYS * 24 * 60 * 60}; SameSite=Lax`;
    } catch (e) {
      console.warn("Could not save age verification to storage", e);
    }
    setIsOpen(false);
  };

  const handleExit = () => {
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
        backgroundColor: "rgba(10, 10, 12, 0.88)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          backgroundColor: "var(--bg-surface-elevated, #1c0e18)",
          border: "1px solid rgba(212, 175, 55, 0.3)",
          borderRadius: "20px",
          padding: "44px 36px",
          textAlign: "center",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.75), 0 0 35px rgba(212, 175, 55, 0.08)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle Gold Accent Bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: "linear-gradient(90deg, transparent, var(--accent-gold), transparent)",
          }}
        />

        {/* Brand Logo */}
        <div style={{ marginBottom: "28px", display: "flex", justifyContent: "center" }}>
          <Logo size="lg" linkToHome={false} />
        </div>

        {/* Badge */}
        <div
          style={{
            display: "inline-block",
            padding: "5px 14px",
            borderRadius: "9999px",
            backgroundColor: "rgba(212, 175, 55, 0.12)",
            border: "1px solid rgba(212, 175, 55, 0.35)",
            color: "var(--accent-gold)",
            fontSize: "0.75rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: "18px",
          }}
        >
          18+ Audience Verification
        </div>

        {/* Title */}
        <h2
          id="age-gate-title"
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "1.75rem",
            color: "var(--text-primary)",
            marginBottom: "12px",
            fontWeight: 700,
            lineHeight: 1.25,
          }}
        >
          Age Confirmation
        </h2>

        {/* Description */}
        <p
          id="age-gate-desc"
          style={{
            color: "var(--text-secondary)",
            fontSize: "0.95rem",
            lineHeight: 1.6,
            marginBottom: "32px",
          }}
        >
          This platform features mature cinematic productions and serialized narratives intended for viewers aged 18 and older. Please confirm that you meet the age requirement to proceed.
        </p>

        {/* Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <button
            id="age-gate-confirm-btn"
            onClick={handleEnter}
            className="btn btn-primary"
            style={{
              width: "100%",
              padding: "14px 20px",
              fontSize: "0.95rem",
              fontWeight: 600,
              letterSpacing: "0.03em",
              borderRadius: "10px",
            }}
          >
            I am 18 or older &mdash; Enter
          </button>

          <button
            id="age-gate-decline-btn"
            onClick={handleExit}
            className="btn btn-secondary"
            style={{
              width: "100%",
              padding: "12px 20px",
              fontSize: "0.9rem",
              borderRadius: "10px",
            }}
          >
            I am under 18 &mdash; Exit
          </button>
        </div>

        {/* Subtle Disclaimer */}
        <div
          style={{
            marginTop: "24px",
            fontSize: "0.72rem",
            color: "var(--text-muted)",
            lineHeight: 1.4,
          }}
        >
          By proceeding, you verify that you are at least 18 years old or the legal age of majority in your jurisdiction.
        </div>
      </div>
    </div>
  );
}
