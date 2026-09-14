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
          <span className="section-subtitle">PROTECTION & SAFETY</span>
          <h1 style={{ fontSize: "2.4rem", color: "var(--text-primary)", marginBottom: "12px" }}>
            Zero-Tolerance Anti-Trafficking Policy
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1rem" }}>
            Our mandatory ethical standards against non-consensual content and human exploitation.
          </p>
        </div>
      </section>

      <div className="container" style={{ maxWidth: "840px", padding: "48px 24px 80px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "28px", fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>
          <div
            style={{
              padding: "24px",
              backgroundColor: "#fef2f2",
              borderRadius: "12px",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              fontWeight: 500,
            }}
          >
            YoruMuse enforces a strict zero-tolerance policy regarding human trafficking, non-consensual content, and underage exploitation. Any suspected violation is referred immediately to law enforcement authorities.
          </div>

          <h3 style={{ color: "var(--text-primary)", fontSize: "1.3rem" }}>Mandatory Creator Verification</h3>
          <p>
            All performers depicted on YoruMuse are confirmed consenting adults who have signed verified release agreements with identity verification conducted by qualified legal compliance specialists.
          </p>

          <h3 style={{ color: "var(--text-primary)", fontSize: "1.3rem" }}>Immediate Takedown & Response</h3>
          <p>
            If you believe content on YoruMuse violates consent or safety standards, please report it immediately using our direct hotline form or email compliance@yorumuse.com. Reports are acted upon within 1 hour.
          </p>

          <div style={{ paddingTop: "20px", borderTop: "1px solid var(--border-subtle)", display: "flex", gap: "12px" }}>
            <Link href="/report" className="btn btn-primary" style={{ backgroundColor: "#ef4444", borderColor: "#ef4444" }}>
              Report a Violation Now
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
