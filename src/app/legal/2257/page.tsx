import React from "react";
import Link from "next/link";

export default function ContentLicensingPage() {
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
          <span className="section-subtitle">LEGAL NOTICE</span>
          <h1 style={{ fontSize: "2.4rem", color: "var(--text-primary)", marginBottom: "12px" }}>
            Content Licensing & Distribution Statement
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1rem" }}>
            Statement regarding digital broadcast rights, original productions, and intellectual property.
          </p>
        </div>
      </section>

      <div className="container" style={{ maxWidth: "840px", padding: "48px 24px 80px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "28px", fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>
          <p>
            All original cinematic productions, episodic video series, musical scores, and digital assets published on YoruMuse are copyrighted properties produced or licensed exclusively by YoruMuse Studios.
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
              Rights & Licensing Department
            </h4>
            <p style={{ color: "var(--text-primary)", fontWeight: 600 }}>
              YoruMuse Studios Licensing Group
            </p>
            <p>1000 Brickell Avenue, Suite 700</p>
            <p>Miami, FL 33131, United States</p>
            <p style={{ marginTop: "6px" }}>Email: licensing@yorumuse.com</p>
          </div>

          <h3 style={{ color: "var(--text-primary)", fontSize: "1.3rem", marginTop: "12px" }}>
            Subscription & Streaming Rights
          </h3>
          <p>
            Active members receive a non-exclusive, non-transferable, personal license to view streaming productions on authorized devices. Downloading, ripping, publicly exhibiting, or rebroadcasting any video asset without formal authorization is strictly prohibited.
          </p>

          <h3 style={{ color: "var(--text-primary)", fontSize: "1.3rem", marginTop: "12px" }}>
            Production Inquiries & Submissions
          </h3>
          <p>
            Independent directors, cinematographers, and production companies interested in distributing original series or curated cinema on YoruMuse may submit portfolio presentations directly to our creative acquisitions team.
          </p>

          <div style={{ paddingTop: "20px", borderTop: "1px solid var(--border-subtle)" }}>
            <Link href="/" className="btn btn-secondary">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
