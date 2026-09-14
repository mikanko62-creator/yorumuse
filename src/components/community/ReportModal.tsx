"use client";

import React, { useState, useEffect } from "react";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: "POST" | "COMMENT" | "USER" | "CONTENT";
  targetId: string;
  targetTitle?: string;
}

export default function ReportModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetTitle,
}: ReportModalProps) {
  const [reason, setReason] = useState("UNDERAGE_SUSPICION");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

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
          targetId,
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

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        backgroundColor: "rgba(5, 5, 8, 0.88)",
        backdropFilter: "blur(16px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          backgroundColor: "#ffffff",
          border: "1px solid var(--border-medium)",
          borderRadius: "16px",
          padding: "32px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", color: "var(--text-primary)" }}>
            Report {targetType.toLowerCase()}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close report dialog"
            style={{ color: "var(--text-muted)", fontSize: "1.2rem", padding: "4px" }}
          >
            Tutup
          </button>
        </div>

        {targetTitle && (
          <div
            style={{
              padding: "8px 12px",
              backgroundColor: "var(--bg-surface-elevated)",
              borderRadius: "6px",
              fontSize: "0.85rem",
              color: "var(--text-secondary)",
              marginBottom: "20px",
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            Target: &ldquo;{targetTitle}&rdquo;
          </div>
        )}

        {success ? (
          <div
            style={{
              padding: "24px",
              textAlign: "center",
              color: "#065f46",
              backgroundColor: "#ecfdf5",
              borderRadius: "12px",
            }}
          >
            
            <h4 style={{ fontSize: "1.1rem", marginBottom: "4px", color: "#065f46" }}>Report Submitted</h4>
            <p style={{ fontSize: "0.88rem", color: "#047857" }}>
              Thank you for keeping YoruMuse safe. Our compliance officers have been alerted.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {error && (
              <div style={{ color: "#b91c1c", fontSize: "0.85rem", padding: "8px 12px", backgroundColor: "#fef2f2", borderRadius: "6px", border: "1px solid #fecaca" }}>
                {error}
              </div>
            )}

            <div>
              <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "6px", textTransform: "uppercase", fontWeight: 700 }}>
                Reason for report
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                style={{ width: "100%", padding: "10px 14px" }}
              >
                <option value="COPYRIGHT">Copyright or Unauthorized Media</option>
                <option value="HARASSMENT">Harassment or Defamation</option>
                <option value="SPAM">Spam or Unsolicited Promotion</option>
                <option value="INAPPROPRIATE">Inappropriate Content</option>
                <option value="OTHER">Other Community Guideline Violation</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "6px", textTransform: "uppercase", fontWeight: 700 }}>
                Additional Details (Optional)
              </label>
              <textarea
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Explain the violation..."
                style={{ width: "100%", resize: "vertical" }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ flexGrow: 1, backgroundColor: "#ef4444", borderColor: "#ef4444" }}
              >
                {loading ? "Filing Report..." : "Submit Report"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
