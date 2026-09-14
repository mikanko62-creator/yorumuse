import React from "react";
import Link from "next/link";

export default function AntiTraffickingPage() {
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
          <span className="section-subtitle">ETHICS & INTEGRITY</span>
          <h1 style={{ fontSize: "2.4rem", color: "var(--text-primary)", marginBottom: "12px" }}>
            Platform Safety & Production Ethics
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1rem" }}>
            Our mandatory ethical standards regarding production integrity and safety.
          </p>
        </div>
      </section>

      <div className="container" style={{ maxWidth: "840px", padding: "48px 24px 80px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "28px", fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>
          <div
            style={{
              padding: "24px",
              backgroundColor: "rgba(212, 175, 55, 0.08)",
              borderRadius: "12px",
              border: "1px solid rgba(212, 175, 55, 0.25)",
              color: "var(--text-primary)",
              fontWeight: 500,
            }}
          >
            YoruMuse Studios enforces strict production standards across all commissioned cinema and serialized releases. We are committed to a zero-tolerance policy against any form of exploitation, harassment, or unauthorized recording.
          </div>

          <h3 style={{ color: "var(--text-primary)", fontSize: "1.3rem" }}>Verified Cast & Production Standards</h3>
          <p>
            All personnel, actors, and contributors depicted in YoruMuse releases operate under professional contracts, formal talent releases, and verified production safety oversight.
          </p>

          <h3 style={{ color: "var(--text-primary)", fontSize: "1.3rem" }}>Expedited Review & Compliance</h3>
          <p>
            If you believe content on YoruMuse requires copyright review or violates platform policies, please contact our compliance desk at compliance@yorumuse.com. Inquiries are handled expeditiously.
          </p>

          <div style={{ paddingTop: "20px", borderTop: "1px solid var(--border-subtle)", display: "flex", gap: "12px" }}>
            <Link href="/report" className="btn btn-primary">
              Submit Inquiries
            </Link>
            <Link href="/" className="btn btn-secondary">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
