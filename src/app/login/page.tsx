"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Logo from "@/components/common/Logo";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/profile";

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed. Please verify credentials.");
        setLoading(false);
        return;
      }

      router.push(redirectUrl);
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
          maxWidth: "460px",
          backgroundColor: "var(--bg-surface-elevated, #1c0e18)",
          border: "1px solid rgba(212, 175, 55, 0.3)",
          borderRadius: "20px",
          padding: "44px 36px",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.75), 0 0 35px rgba(212, 175, 55, 0.08)",
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

        {/* Brand Logo */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <Logo size="md" />
        </div>

        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.85rem", color: "var(--text-primary)", marginBottom: "6px", fontWeight: 700 }}>
            Welcome Back
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Enter your credentials to access the private salon.
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "var(--radius-sm)",
              backgroundColor: "rgba(225, 29, 72, 0.15)",
              border: "1px solid rgba(225, 29, 72, 0.4)",
              color: "#fca5a5",
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
              htmlFor="identifier"
              style={{
                display: "block",
                fontSize: "0.82rem",
                color: "var(--text-secondary)",
                marginBottom: "8px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontWeight: 600,
              }}
            >
              Email or Username
            </label>
            <input
              id="identifier"
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. member@yorumuse.com"
              style={{
                width: "100%",
                backgroundColor: "rgba(12, 6, 10, 0.7)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <label
                htmlFor="password"
                style={{
                  fontSize: "0.82rem",
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontWeight: 600,
                }}
              >
                Password
              </label>
            </div>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              style={{
                width: "100%",
                backgroundColor: "rgba(12, 6, 10, 0.7)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "var(--text-primary)",
              }}
            />
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
            id="login-submit-btn"
          >
            {loading ? "Verifying..." : "Sign In to YoruMuse"}
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
          Don&apos;t have an account?{" "}
          <Link href="/register" style={{ color: "var(--accent-gold)", fontWeight: 600 }}>
            Create one here
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--bg-base)" }} />}>
      <LoginForm />
    </Suspense>
  );
}
