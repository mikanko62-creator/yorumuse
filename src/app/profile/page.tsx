"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: string;
  birthDate: string;
  bio?: string;
  avatarUrl?: string | null;
  subscription?: {
    id: string;
    planId: string;
    status: string;
    currentPeriodEnd?: string;
    paymentMethod?: string;
    createdAt?: string;
  } | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [bioInput, setBioInput] = useState("");
  const [savedBio, setSavedBio] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          setBioInput(data.user.bio || "");
          if (data.user.avatarUrl) {
            setAvatarPreview(data.user.avatarUrl);
          }
        } else {
          router.push("/login");
        }
        setLoading(false);
      })
      .catch(() => {
        router.push("/login");
      });
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  const handleSaveBio = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavedBio(true);
    setTimeout(() => setSavedBio(false), 2500);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate on client side
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      alert("File format not supported. Please use JPEG, PNG, WebP, or GIF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("File size is too large. Maximum 5MB.");
      return;
    }

    // Show preview immediately
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch("/api/auth/avatar", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setAvatarPreview(data.avatarUrl);
        setUser((prev) => prev ? { ...prev, avatarUrl: data.avatarUrl } : prev);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to upload profile photo.");
        // Revert preview
        setAvatarPreview(user?.avatarUrl || null);
      }
    } catch {
      alert("Failed to upload profile photo.");
      setAvatarPreview(user?.avatarUrl || null);
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "80vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: "var(--header-height)",
        }}
      >
        <div style={{ color: "var(--accent-gold)", fontFamily: "var(--font-serif)", fontSize: "1.2rem" }}>
          Loading profile...
        </div>
      </div>
    );
  }

  if (!user) return null;

  const isSubscribed = user.subscription?.status === "ACTIVE";
  const userPlanName = isSubscribed ? "Member Subscription" : "Free User";

  return (
    <div style={{ paddingTop: "var(--header-height)", minHeight: "100vh" }}>
      {/* Profile Header Banner */}
      <section
        style={{
          padding: "60px 0 40px",
          background: "var(--bg-surface)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div className="container">
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "24px",
            }}
          >
            {/* Avatar & Identity */}
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              {/* Clickable Avatar */}
              <div
                onClick={handleAvatarClick}
                style={{
                  width: "84px",
                  height: "84px",
                  borderRadius: "50%",
                  position: "relative",
                  cursor: "pointer",
                  flexShrink: 0,
                  overflow: "hidden",
                  border: "2px solid rgba(255, 255, 255, 0.5)",
                  boxShadow: "0 8px 24px rgba(166, 124, 30, 0.2)",
                }}
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt={user.username}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      background: "linear-gradient(135deg, #b88a25 0%, #8c6411 100%)",
                      color: "#ffffff",
                      fontFamily: "var(--font-serif)",
                      fontSize: "2.4rem",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Hover overlay */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(0,0,0,0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: uploadingAvatar ? 1 : 0,
                    transition: "opacity 0.2s ease",
                    borderRadius: "50%",
                  }}
                  className="avatar-overlay"
                >
                  {uploadingAvatar ? (
                    <div
                      style={{
                        width: "24px",
                        height: "24px",
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTopColor: "#fff",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                      }}
                    />
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleAvatarChange}
                  style={{ display: "none" }}
                />
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <h1 style={{ fontSize: "2rem", color: "var(--text-primary)", marginBottom: 0 }}>
                    {user.username}
                  </h1>
                  {user.role === "ADMIN" && (
                    <span className="badge badge-premium" style={{ backgroundColor: "#ef4444", color: "#ffffff" }}>
                      ADMINISTRATOR
                    </span>
                  )}
                  <span className={`badge ${isSubscribed ? "badge-member" : "badge-public"}`}>
                    {isSubscribed ? "MEMBER ACCESS" : "FREE ACCESS"}
                  </span>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginTop: "4px" }}>
                  {user.email}
                </p>
              </div>
            </div>

            {/* Header Right Actions */}
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              {user.role === "ADMIN" && (
                <Link href="/admin" className="btn btn-outline-gold">
                  Admin Dashboard
                </Link>
              )}
              <button onClick={handleLogout} className="btn btn-secondary">
                Log Out
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Profile Content */}
      <div className="container" style={{ padding: "48px 24px 80px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "32px",
          }}
        >
          {/* Subscription Status Card */}
          <div
            style={{
              backgroundColor: "var(--bg-surface)",
              borderRadius: "16px",
              border: isSubscribed
                ? "1px solid rgba(212, 175, 55, 0.3)"
                : "1px solid var(--border-subtle)",
              padding: "32px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                fontSize: "0.78rem",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "var(--accent-gold)",
                fontWeight: 700,
                marginBottom: "8px",
              }}
            >
              Subscription Status
            </div>
            <h3 style={{ fontSize: "1.5rem", color: "var(--text-primary)", marginBottom: "8px" }}>
              {userPlanName}
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "20px" }}>
              {isSubscribed
                ? "Your account is active as a Member Subscriber with unlimited access to all episodes and full chapters."
                : "You are currently a Free User. Subscribe to unlock all full chapters of manhwa series."}
            </p>

            <div
              style={{
                padding: "16px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "var(--bg-surface-elevated)",
                border: "1px solid var(--border-subtle)",
                marginBottom: "20px",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "14px",
              }}
            >
              <div>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", letterSpacing: "0.08em" }}>
                  STATUS
                </span>
                <span style={{ color: isSubscribed ? "var(--status-success)" : "var(--text-secondary)", fontWeight: 700, fontSize: "0.95rem" }}>
                  {user.subscription?.status || "FREE"}
                </span>
              </div>
              <div>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", letterSpacing: "0.08em" }}>
                  RENEWAL DATE
                </span>
                <span style={{ color: "var(--text-primary)", fontSize: "0.9rem", fontWeight: 600 }}>
                  {user.subscription?.currentPeriodEnd
                    ? new Date(user.subscription.currentPeriodEnd).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                    : "—"}
                </span>
              </div>
              <div>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", letterSpacing: "0.08em" }}>
                  PAYMENT METHOD
                </span>
                <span style={{ color: "var(--text-primary)", fontSize: "0.9rem", fontWeight: 600 }}>
                  {user.subscription?.paymentMethod || "—"}
                </span>
              </div>
              <div>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", letterSpacing: "0.08em" }}>
                  PLAN
                </span>
                <span style={{ color: "var(--accent-gold)", fontSize: "0.9rem", fontWeight: 600 }}>
                  {user.subscription?.planId?.replace(/_/g, " ").toUpperCase() || "FREE"}
                </span>
              </div>
            </div>

            <Link
              href="/membership"
              className={isSubscribed ? "btn btn-secondary" : "btn btn-primary"}
              style={{ width: "100%" }}
            >
              {isSubscribed ? "Manage Subscription" : "Upgrade to Member"}
            </Link>
          </div>

          {/* Account Settings / Bio Card */}
          <div
            style={{
              backgroundColor: "var(--bg-surface)",
              borderRadius: "16px",
              border: "1px solid var(--border-subtle)",
              boxShadow: "var(--shadow-sm)",
              padding: "32px",
            }}
          >
            <div
              style={{
                fontSize: "0.75rem",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                fontWeight: 700,
                marginBottom: "8px",
              }}
            >
              Account Settings
            </div>
            <h3 style={{ fontSize: "1.5rem", color: "var(--text-primary)", marginBottom: "16px" }}>
              Profile Details
            </h3>

            <form onSubmit={handleSaveBio} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Bio
                </label>
                <textarea
                  rows={3}
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value)}
                  placeholder="Write something about yourself..."
                  style={{ width: "100%", resize: "vertical" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button type="submit" className="btn btn-secondary btn-sm">
                  Save
                </button>
                {savedBio && (
                  <span style={{ color: "var(--status-success)", fontSize: "0.85rem" }}>
                    Bio saved
                  </span>
                )}
              </div>
            </form>

            {/* Divider */}
            <div style={{ borderTop: "1px solid var(--border-subtle)", margin: "24px 0" }} />

            {/* Logout section */}
            <div>
              <div
                style={{
                  fontSize: "0.75rem",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  fontWeight: 700,
                  marginBottom: "12px",
                }}
              >
                Account Session
              </div>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: "16px" }}>
                Sign out of your account on this device.
              </p>
              <button
                onClick={handleLogout}
                className="btn btn-secondary"
                style={{
                  width: "100%",
                  borderColor: "rgba(239, 68, 68, 0.4)",
                  color: "#ef4444",
                }}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Avatar hover style + spin animation */}
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .avatar-overlay {
          opacity: 0;
        }
        div:hover > .avatar-overlay {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}
