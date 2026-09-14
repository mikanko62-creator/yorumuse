import React from "react";
import Link from "next/link";
import Logo from "../common/Logo";

export default function Footer() {
  return (
    <footer
      style={{
        backgroundColor: "var(--bg-surface-elevated)",
        borderTop: "1px solid var(--border-subtle)",
        marginTop: "auto",
        position: "relative",
        zIndex: 1,
      }}
    >
      <div className="container" style={{ padding: "80px 24px 40px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "48px 32px",
            marginBottom: "64px",
          }}
        >
          {/* Brand Column */}
          <div style={{ maxWidth: "340px" }}>
            <Logo size="md" />
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.9rem",
                lineHeight: 1.6,
                marginTop: "20px",
                marginBottom: "24px",
              }}
            >
              YoruMuse is a curated adult community and cinematic entertainment platform. Designed for discerning adults who appreciate high aesthetic standards, privacy, and community.
            </p>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "4px 12px",
                borderRadius: "var(--radius-xs)",
                backgroundColor: "rgba(212, 175, 55, 0.1)",
                border: "1px solid rgba(212, 175, 55, 0.3)",
                color: "var(--accent-gold)",
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
              }}
            >
              <span>18+ ADULTS ONLY</span>
            </div>
          </div>

          {/* Navigation Column 1 */}
          <div>
            <h4
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.9rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--text-primary)",
                marginBottom: "20px",
              }}
            >
              Discovery
            </h4>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "12px" }}>
              <li>
                <Link href="/browse" style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                  All Content
                </Link>
              </li>
              <li>
                <Link href="/browse?category=originals" style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                  YoruMuse Originals
                </Link>
              </li>
              <li>
                <Link href="/browse?category=cinematic" style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                  Cinematic Noir
                </Link>
              </li>
              <li>
                <Link href="/browse?category=exclusive" style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                  Members Exclusive
                </Link>
              </li>
              <li>
                <Link href="/community" style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                  Community Discussions
                </Link>
              </li>
            </ul>
          </div>

          {/* Navigation Column 2 */}
          <div>
            <h4
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.9rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--text-primary)",
                marginBottom: "20px",
              }}
            >
              Membership
            </h4>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "12px" }}>
              <li>
                <Link href="/membership" style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                  Subscription Plans
                </Link>
              </li>
              <li>
                <Link href="/membership#faq" style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                  Billing FAQ & Privacy
                </Link>
              </li>
              <li>
                <Link href="/community/guidelines" style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                  Community Standards
                </Link>
              </li>
              <li>
                <Link href="/report" style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                  Report Violation / DMCA
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance Column */}
          <div>
            <h4
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.9rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--text-primary)",
                marginBottom: "20px",
              }}
            >
              Legal & Safety
            </h4>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "12px" }}>
              <li>
                <Link href="/legal/terms" style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                  Privacy & Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="/legal/2257" style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                  18 U.S.C. 2257 Statement
                </Link>
              </li>
              <li>
                <Link href="/legal/anti-trafficking" style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                  Zero Tolerance Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* 2257 Compliance & Age Statement Box */}
        <div
          style={{
            padding: "24px",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            marginBottom: "40px",
            fontSize: "0.82rem",
            color: "var(--text-muted)",
            lineHeight: 1.6,
          }}
        >
          <strong style={{ color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
            18 U.S.C. § 2257 RECORD-KEEPING REQUIREMENTS COMPLIANCE STATEMENT
          </strong>
          All visual representations depicting actual sexually explicit conduct appearing on this platform comply with the record-keeping requirements of 18 U.S.C. § 2257 and 28 C.F.R. Part 75. All models, actors, and content creators were 18 years of age or older at the time the visual depictions were produced. YoruMuse maintains a strict zero-tolerance policy against non-consensual content and underage material.
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            paddingTop: "24px",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            fontSize: "0.82rem",
            color: "var(--text-muted)",
          }}
        >
          <div>
            © {new Date().getFullYear()} YORUMUSE INC. All rights reserved. Strictly adults only.
          </div>
          <div style={{ display: "flex", gap: "20px" }}>
            <Link href="/legal/privacy" style={{ color: "var(--text-muted)" }}>
              Privacy
            </Link>
            <Link href="/legal/terms" style={{ color: "var(--text-muted)" }}>
              Terms
            </Link>
            <Link href="/legal/2257" style={{ color: "var(--text-muted)" }}>
              2257 Notice
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
