import React from "react";
import Link from "next/link";

export default function GuidelinesPage() {
  return (
    <div style={{ paddingTop: "var(--header-height)", minHeight: "100vh" }}>
      <section
        style={{
          padding: "60px 0 40px",
          background: "var(--bg-surface)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div className="container" style={{ maxWidth: "800px", textAlign: "center" }}>
          <span className="section-subtitle">ETHICAL NOIR</span>
          <h1 style={{ fontSize: "2.8rem", color: "var(--text-primary)", marginBottom: "14px" }}>
            Community Standards & Guidelines
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem" }}>
            YoruMuse operates on unequivocal principles of consent, adult maturity, and mutual dignity.
          </p>
        </div>
      </section>

      <div className="container" style={{ maxWidth: "800px", padding: "48px 24px 80px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "36px" }}>
          {/* Zero Tolerance Box */}
          <div
            style={{
              padding: "24px 32px",
              borderRadius: "16px",
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
            }}
          >
            <h3 style={{ color: "#dc2626", fontSize: "1.25rem", marginBottom: "8px" }}>
              1. Strict Zero-Tolerance: Protection of Minors
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.6 }}>
              YoruMuse is exclusively for adults aged 18 and over. Any depiction, depiction attempt, depiction suggestion, or discourse involving individuals under the age of majority is strictly prohibited. Any violation results in immediate account termination, device blocking, and formal reporting to the National Center for Missing & Exploited Children (NCMEC) and relevant international law enforcement agencies.
            </p>
          </div>

          <div>
            <h3 style={{ color: "var(--text-primary)", fontSize: "1.3rem", marginBottom: "10px" }}>
              2. Absolute Consent & Non-Exploitation
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.6 }}>
              All material produced and hosted on YoruMuse features fully consenting adult performers verified pursuant to 18 U.S.C. § 2257. Community members must not upload or disseminate non-consensual content, hidden camera material, revenge pornography, or unauthorized private media.
            </p>
          </div>

          <div>
            <h3 style={{ color: "var(--text-primary)", fontSize: "1.3rem", marginBottom: "10px" }}>
              3. Mutual Respect & Constructive Adult Discourse
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.6 }}>
              We encourage sophisticated, nuanced discussions surrounding cinematic art, romance, and human intimacy. Defamation, hate speech, threats of violence, non-consensual sexual harassment, and doxxing are grounds for immediate suspension or permanent expulsion.
            </p>
          </div>

          <div>
            <h3 style={{ color: "var(--text-primary)", fontSize: "1.3rem", marginBottom: "10px" }}>
              4. Member Privacy & Anonymity
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.6 }}>
              Respect the confidentiality of fellow patrons. Never reveal personal identifying information, real names, addresses, or social media handles without explicit written authorization.
            </p>
          </div>

          <div>
            <h3 style={{ color: "var(--text-primary)", fontSize: "1.3rem", marginBottom: "10px" }}>
              5. Moderation Queue & Enforcement
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.6 }}>
              Our dedicated human compliance team reviews flagged items 24/7. Community members can report any post or comment using the flag icon located on each card. Reported items with safety concerns are immediately quarantined pending investigation.
            </p>
          </div>

          <div style={{ paddingTop: "24px", borderTop: "1px solid var(--border-subtle)" }}>
            <Link href="/community" className="btn btn-secondary">
              ← Return to Community Lounge
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
