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
          <span className="section-subtitle">COMMUNITY STANDARDS</span>
          <h1 style={{ fontSize: "2.8rem", color: "var(--text-primary)", marginBottom: "14px" }}>
            Community Standards & Guidelines
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem" }}>
            YoruMuse is committed to fostering an inspiring, respectful, and safe community for cinephiles, creators, and members worldwide.
          </p>
        </div>
      </section>

      <div className="container" style={{ maxWidth: "800px", padding: "48px 24px 80px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "36px" }}>
          {/* Core Values Box */}
          <div
            style={{
              padding: "24px 32px",
              borderRadius: "16px",
              backgroundColor: "rgba(212, 175, 55, 0.08)",
              border: "1px solid rgba(212, 175, 55, 0.25)",
            }}
          >
            <h3 style={{ color: "var(--accent-gold-dark, #a67c1e)", fontSize: "1.25rem", marginBottom: "8px" }}>
              1. Respectful & Thoughtful Discourse
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.6 }}>
              We celebrate passionate discussions around filmmaking, screenwriting, cinematography, and episodic storytelling. Personal attacks, harassment, discriminatory remarks, hate speech, and defamation are strictly prohibited and will result in immediate suspension.
            </p>
          </div>

          <div>
            <h3 style={{ color: "var(--text-primary)", fontSize: "1.3rem", marginBottom: "10px" }}>
              2. Intellectual Property & Copyright Protection
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.6 }}>
              All series, films, trailers, musical scores, and imagery hosted on YoruMuse are legally protected works. Unapproved dissemination, screen recording, pirated redistribution, or unauthorized file sharing of any exclusive member content is strictly forbidden and subject to civil copyright enforcement.
            </p>
          </div>

          <div>
            <h3 style={{ color: "var(--text-primary)", fontSize: "1.3rem", marginBottom: "10px" }}>
              3. Member Privacy & Confidentiality
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.6 }}>
              Respect the privacy of fellow patrons and creative personnel. Never share private communications, personal contact details, or identifying information without explicit consent.
            </p>
          </div>

          <div>
            <h3 style={{ color: "var(--text-primary)", fontSize: "1.3rem", marginBottom: "10px" }}>
              4. Authentic Engagement & Zero Spam
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.6 }}>
              Community forums, reviews, and comment sections exist for genuine member interactions. Commercial advertising, affiliate links, automated bots, and repetitive spam are filtered and purged automatically.
            </p>
          </div>

          <div>
            <h3 style={{ color: "var(--text-primary)", fontSize: "1.3rem", marginBottom: "10px" }}>
              5. Moderation & Content Safety
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.6 }}>
              Our moderation team reviews community flags on an ongoing basis. If you observe content that violates these guidelines, please use the Report button available on each post or visit our Help Center.
            </p>
          </div>

          <div style={{ paddingTop: "24px", borderTop: "1px solid var(--border-subtle)" }}>
            <Link href="/community" className="btn btn-secondary">
              Back to Community Lounge
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
