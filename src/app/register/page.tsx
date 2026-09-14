"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "@/components/common/Logo";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!termsAccepted) {
      setError("You must confirm you are at least 18 years old and agree to the Terms.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email,
          password,
          birthDate,
          termsAccepted,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed.");
        setLoading(false);
        return;
      }

      // Success -> navigate to membership or profile
      router.push("/membership");
      router.refresh();
    } catch {
      setError("An unexpected network error occurred. Please try again.");
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
        padding: "100px 24px 60px",
        background: "var(--bg-base)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          backgroundColor: "#ffffff",
          border: "1px solid var(--border-medium)",
          borderRadius: "20px",
          padding: "44px 36px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.08), 0 0 30px rgba(166, 124, 30, 0.06)",
          position: "relative",
        }}
      >
        {/* Top Gold Accent Line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "200px",
            height: "2px",
            background: "linear-gradient(90deg, transparent, var(--accent-gold), transparent)",
          }}
        />

        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <Logo size="md" />
        </div>

        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.85rem", color: "var(--text-primary)", marginBottom: "6px" }}>
            Join YoruMuse
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Create an adult account to unlock discussions and exclusive member premieres.
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "var(--radius-sm)",
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              fontSize: "0.85rem",
              marginBottom: "20px",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div>
            <label
              htmlFor="reg-username"
              style={{
                display: "block",
                fontSize: "0.82rem",
                color: "var(--text-secondary)",
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontWeight: 600,
              }}
            >
              Username
            </label>
            <input
              id="reg-username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. NoirVoyeur"
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label
              htmlFor="reg-email"
              style={{
                display: "block",
                fontSize: "0.82rem",
                color: "var(--text-secondary)",
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontWeight: 600,
              }}
            >
              Email Address
            </label>
            <input
              id="reg-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label
              htmlFor="reg-password"
              style={{
                display: "block",
                fontSize: "0.82rem",
                color: "var(--text-secondary)",
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontWeight: 600,
              }}
            >
              Password (8+ Characters)
            </label>
            <input
              id="reg-password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label
              htmlFor="reg-dob"
              style={{
                display: "block",
                fontSize: "0.82rem",
                color: "var(--text-secondary)",
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontWeight: 600,
              }}
            >
              Date of Birth (Must be 18+)
            </label>
            <input
              id="reg-dob"
              type="date"
              required
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginTop: "4px" }}>
            <input
              id="reg-terms"
              type="checkbox"
              required
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              style={{ marginTop: "4px", width: "18px", height: "18px", accentColor: "var(--accent-gold)" }}
            />
            <label htmlFor="reg-terms" style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
              I certify under penalty of perjury that I am at least 18 years old and agree to the{" "}
              <Link href="/legal/terms" style={{ color: "var(--accent-gold)" }}>Terms of Service</Link>,{" "}
              <Link href="/legal/privacy" style={{ color: "var(--accent-gold)" }}>Privacy Policy</Link>, and{" "}
              <Link href="/community/guidelines" style={{ color: "var(--accent-gold)" }}>Community Guidelines</Link>.
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg"
            style={{
              width: "100%",
              marginTop: "10px",
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "wait" : "pointer",
            }}
            id="register-submit-btn"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div
          style={{
            marginTop: "28px",
            textAlign: "center",
            fontSize: "0.9rem",
            color: "var(--text-secondary)",
          }}
        >
          Already have an account?{" "}
          <Link href="/login" style={{ color: "var(--accent-gold)", fontWeight: 600 }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
