import React from "react";
import Link from "next/link";

export default function RecordKeeping2257Page() {
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
          <span className="section-subtitle">STATUTORY COMPLIANCE</span>
          <h1 style={{ fontSize: "2.4rem", color: "var(--text-primary)", marginBottom: "12px" }}>
            18 U.S.C. § 2257 Compliance Statement
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1rem" }}>
            Notice regarding records keeping requirements for depictions of actual sexual conduct.
          </p>
        </div>
      </section>

      <div className="container" style={{ maxWidth: "840px", padding: "48px 24px 80px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "28px", fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>
          <p>
            All visual depictions of actual sexually explicit conduct displayed on YoruMuse comply with the record-keeping requirements mandated by Title 18 of the United States Code, Section 2257 and Section 2257A, as well as Part 75 of Title 28 of the Code of Federal Regulations.
          </p>

          <div
            style={{
              padding: "24px",
              backgroundColor: "var(--bg-surface)",
              borderRadius: "12px",
              border: "1px solid var(--border-subtle)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <h4 style={{ color: "var(--accent-gold)", marginBottom: "8px", textTransform: "uppercase", fontSize: "0.85rem", letterSpacing: "0.1em" }}>
              Custodian of Records
            </h4>
            <p style={{ color: "var(--text-primary)", fontWeight: 600 }}>
              YM Media LLC Records Department
            </p>
            <p>1000 Brickell Avenue, Suite 700</p>
            <p>Miami, FL 33131, United States</p>
            <p style={{ marginTop: "6px" }}>Email: compliance@yorumuse.com</p>
          </div>

          <h3 style={{ color: "var(--text-primary)", fontSize: "1.3rem", marginTop: "12px" }}>
            Age Verification Protocols
          </h3>
          <p>
            Prior to the production or publication of any original content, valid government-issued photographic identification confirming the model or performer was at least 18 years of age at the date of recording was inspected, verified, and archived in our compliance repository.
          </p>

          <h3 style={{ color: "var(--text-primary)", fontSize: "1.3rem", marginTop: "12px" }}>
            Exempt Content / User Content
          </h3>
          <p>
            YoruMuse does not permit third-party user uploads of explicit visual depictions. All streaming productions appearing in our catalog are commissioned, produced, or distributed under verified legal contracts adhering to Section 2257 regulations.
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
