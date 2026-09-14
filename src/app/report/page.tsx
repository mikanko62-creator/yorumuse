"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function GeneralReportPage() {
  const [targetType, setTargetType] = useState("CONTENT");
  const [targetId, setTargetId] = useState("");
  const [reason, setReason] = useState("UNDERAGE_SUSPICION");
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          targetId: targetId.trim() || "general-flag",
          reason,
          details,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit report.");
        setLoading(false);
        return;
      }

      setSubmitted(true);
      setLoading(false);
    } catch {
      setError("An unexpected network error occurred.");
      setLoading(false);
    }
  };

  return (
    <div style={{ paddingTop: "var(--header-height)", minHeight: "100vh" }}>
      <section
        style={{
          padding: "60px 0 40px",
          background: "var(--bg-surface)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div className="container" style={{ maxWidth: "720px", textAlign: "center" }}>
          <span className="section-subtitle">COMPLIANCE & INTEGRITY</span>
          <h1 style={{ fontSize: "2.4rem", color: "var(--text-primary)", marginBottom: "12px" }}>
            Report a Violation or Concern
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1rem" }}>
            Submit an urgent compliance report regarding underage suspicion, non-consensual content, or terms violations.
          </p>
        </div>
      </section>

      <div className="container" style={{ maxWidth: "720px", padding: "48px 24px 80px" }}>
        {submitted ? (
          <div
            style={{
              padding: "48px 32px",
              textAlign: "center",
              backgroundColor: "var(--bg-surface)",
              borderRadius: "16px",
              border: "1px solid var(--status-success)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            
            <h2 style={{ fontSize: "1.8rem", color: "var(--text-primary)", marginBottom: "12px" }}>
              Report Registered
            </h2>
            <p style={{ color: "var(--text-secondary)", maxWidth: "480px", margin: "0 auto 28px", lineHeight: 1.6 }}>
              Thank you for alerting our compliance operations team. All priority safety reports are audited immediately and acted upon without delay.
            </p>
            <Link href="/" className="btn btn-secondary">
              Return to Home
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{
              backgroundColor: "var(--bg-surface)",
              borderRadius: "18px",
              border: "1px solid var(--border-subtle)",
              boxShadow: "var(--shadow-md)",
              padding: "36px 32px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            {error && (
              <div style={{ padding: "12px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#b91c1c", fontSize: "0.88rem" }}>
                {error}
              </div>
            )}

            <div>
              <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "6px", textTransform: "uppercase", fontWeight: 700 }}>
                Category of Violation
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                style={{ width: "100%", padding: "12px 14px" }}
              >
                <option value="UNDERAGE_SUSPICION">Underage / Minor Concern (Highest Priority)</option>
                <option value="NON_CONSENSUAL">Non-Consensual Conduct or Material</option>
                <option value="HARASSMENT">Severe Harassment or Bullying</option>
                <option value="SPAM">Commercial Spam or Unauthorized Solicitation</option>
                <option value="COPYRIGHT">DMCA / Copyright Infringement</option>
                <option value="OTHER">Other Terms Violation</option>
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "6px", textTransform: "uppercase", fontWeight: 700 }}>
                  Subject Type
                </label>
                <select
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value)}
                  style={{ width: "100%", padding: "12px 14px" }}
                >
                  <option value="CONTENT">Film / Production</option>
                  <option value="POST">Community Discussion</option>
                  <option value="COMMENT">Reply / Comment</option>
                  <option value="USER">Patron Account</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "6px", textTransform: "uppercase", fontWeight: 700 }}>
                  Target Identifier / URL
                </label>
                <input
                  type="text"
                  required
                  placeholder="URL, slug, or username"
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  style={{ width: "100%" }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "6px", textTransform: "uppercase", fontWeight: 700 }}>
                Specific Details & Timestamps
              </label>
              <textarea
                rows={4}
                required
                placeholder="Provide exact details of the observed issue to assist our investigation..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                style={{ width: "100%", resize: "vertical" }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg"
              style={{
                marginTop: "10px",
                backgroundColor: "#ef4444",
                borderColor: "#ef4444",
                color: "#ffffff",
              }}
            >
              {loading ? "Submitting..." : "Submit Formal Report"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
