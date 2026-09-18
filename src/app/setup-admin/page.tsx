"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/common/Logo";

export default function SetupAdminPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("Admin");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError("Password and Confirm Password do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/setup-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          username: username.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save admin account.");
      }

      setSuccess("Administrator account created successfully! Redirecting to Admin Panel...");
      setTimeout(() => {
        router.push("/admin");
        router.refresh();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred.");
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px",
        background: "var(--bg-base)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          backgroundColor: "var(--bg-surface-elevated, #1c0e18)",
          border: "1px solid rgba(212, 175, 55, 0.3)",
          borderRadius: "18px",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.75), 0 0 35px rgba(212, 175, 55, 0.08)",
          padding: "44px 36px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <Logo size="md" linkToHome={true} />
          <h2
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "1.8rem",
              color: "var(--text-primary)",
              marginTop: "20px",
              marginBottom: "8px",
            }}
          >
            Administrator Account Form
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.5 }}>
            Register or update your preferred Admin email and password in the Supabase database.
          </p>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "var(--status-error)",
              padding: "12px 16px",
              borderRadius: "10px",
              marginBottom: "20px",
              fontSize: "0.88rem",
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              backgroundColor: "rgba(16, 185, 129, 0.08)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              color: "var(--status-success)",
              padding: "12px 16px",
              borderRadius: "10px",
              marginBottom: "20px",
              fontSize: "0.88rem",
            }}
          >
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px" }}>
              Admin Email *
            </label>
            <input
              type="email"
              required
              placeholder="your-admin-email@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: "100%", padding: "12px 16px" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px" }}>
              Admin Username (Display Name)
            </label>
            <input
              type="text"
              placeholder="e.g. YoruMuseAdmin or Your Name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ width: "100%", padding: "12px 16px" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px" }}>
              New Admin Password *
            </label>
            <input
              type="password"
              required
              placeholder="Enter your preferred password (min. 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: "100%", padding: "12px 16px" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px" }}>
              Confirm Password *
            </label>
            <input
              type="password"
              required
              placeholder="Re-type the password above"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{ width: "100%", padding: "12px 16px" }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              width: "100%",
              padding: "14px 20px",
              fontSize: "1rem",
              fontWeight: 600,
              marginTop: "8px",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Saving to Supabase..." : "Save & Sign In as Admin"}
          </button>
        </form>

        <div style={{ marginTop: "24px", textAlign: "center", fontSize: "0.85rem", color: "var(--text-muted)" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "var(--accent-gold)", fontWeight: 600 }}>
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
