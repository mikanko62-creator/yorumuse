import React from "react";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div style={{ paddingTop: "var(--header-height)", minHeight: "100vh" }}>
      <section
        style={{
          padding: "60px 0 40px",
          background: "var(--bg-surface)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div className="container" style={{ maxWidth: "840px" }}>
          <span className="section-subtitle">CONFIDENTIALITY</span>
          <h1 style={{ fontSize: "2.4rem", color: "var(--text-primary)", marginBottom: "12px" }}>
            Privacy & Cookie Policy
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1rem" }}>
            How YoruMuse protects your identity, security, and discreet access.
          </p>
        </div>
      </section>

      <div className="container" style={{ maxWidth: "840px", padding: "48px 24px 80px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "28px", fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>
          <h3 style={{ color: "var(--text-primary)", fontSize: "1.3rem" }}>1. Anonymous Architecture</h3>
          <p>
            We adhere to data minimization. We only collect essential information required to maintain your account authentication (email, hashed password, and confirmed age). We never sell, rent, or trade your private information to third-party ad networks or data brokers.
          </p>

          <h3 style={{ color: "var(--text-primary)", fontSize: "1.3rem" }}>2. Financial Discretion</h3>
          <p>
            Payment transactions are tokenized through PCI-DSS Level 1 compliant processors. Your raw credit card details are never stored on YoruMuse servers. Billing descriptors are discreet and anonymized.
          </p>

          <h3 style={{ color: "var(--text-primary)", fontSize: "1.3rem" }}>3. Cookies & Local Storage</h3>
          <p>
            We utilize essential HTTP-only cookies to preserve secure authentication sessions and local storage solely to retain your interface preferences and playback configurations. No invasive tracking beacons or cross-site tracking scripts are loaded.
          </p>

          <div style={{ paddingTop: "20px", borderTop: "1px solid var(--border-subtle)" }}>
            <Link href="/" className="btn btn-secondary">
              ← Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
