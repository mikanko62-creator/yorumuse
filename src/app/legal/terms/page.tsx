import React from "react";
import Link from "next/link";

export default function TermsPage() {
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
          <span className="section-subtitle">USER AGREEMENT</span>
          <h1 style={{ fontSize: "2.4rem", color: "var(--text-primary)", marginBottom: "12px" }}>
            Terms of Service
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1rem" }}>
            Last revised: March 2026. Please read thoroughly before utilizing the platform.
          </p>
        </div>
      </section>

      <div className="container" style={{ maxWidth: "840px", padding: "48px 24px 80px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "28px", fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>
          <h3 style={{ color: "var(--text-primary)", fontSize: "1.3rem" }}>1. Legal Age Requirement</h3>
          <p>
            You must be at least eighteen (18) years of age, or the age of legal majority in the jurisdiction where you reside or access this website, whichever is greater, to view content, register an account, or purchase a membership on YoruMuse.
          </p>

          <h3 style={{ color: "var(--text-primary)", fontSize: "1.3rem" }}>2. Discretion & Billing</h3>
          <p>
            All paid memberships are billed on a recurring basis until explicitly cancelled. Charges will appear under the neutral descriptor &ldquo;YM MEDIA LLC&rdquo; on financial statements. You may cancel your subscription at any time via your user profile.
          </p>

          <h3 style={{ color: "var(--text-primary)", fontSize: "1.3rem" }}>3. Prohibited Conduct</h3>
          <p>
            Patrons agree never to harvest user information, harass other members, post commercial spam, attempt unauthorized access, or redistribute video streams outside the authenticated web player.
          </p>

          <h3 style={{ color: "var(--text-primary)", fontSize: "1.3rem" }}>4. Intellectual Property</h3>
          <p>
            All visual productions, branding, trademarks, audio tracks, and user interface designs are the exclusive property of YoruMuse Inc. and protected by copyright law.
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
