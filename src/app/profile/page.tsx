"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ContentCard from "@/components/content/ContentCard";
import TrailerModal from "@/components/video/TrailerModal";
import { MOCK_CONTENT } from "@/data/mockContent";
import { ContentItem } from "@/types/content";

interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: string;
  birthDate: string;
  bio?: string;
  subscription?: {
    id: string;
    planId: string;
    status: string;
    currentPeriodEnd?: string;
    paymentMethod?: string;
  } | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTrailer, setSelectedTrailer] = useState<ContentItem | null>(null);
  const [bioInput, setBioInput] = useState("");
  const [savedBio, setSavedBio] = useState(false);

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
          Loading profile sanctuary...
        </div>
      </div>
    );
  }

  if (!user) return null;

  const isSubscribed = user.subscription?.status === "ACTIVE";
  const userPlanName = isSubscribed
    ? "Pengguna Subscription"
    : "Pengguna Biasa";

  // Demo bookmarked watchlist
  const watchlist = MOCK_CONTENT.slice(0, 3);

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
            {/* User Avatar & Identity */}
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <div
                style={{
                  width: "84px",
                  height: "84px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #b88a25 0%, #8c6411 100%)",
                  color: "#ffffff",
                  fontFamily: "var(--font-serif)",
                  fontSize: "2.4rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 8px 24px rgba(166, 124, 30, 0.2)",
                  border: "2px solid rgba(255, 255, 255, 0.5)",
                  flexShrink: 0,
                }}
              >
                {user.username.charAt(0).toUpperCase()}
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
                  {user.email} • Verified Member Account
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

      {/* Main Profile Grid */}
      <div className="container" style={{ padding: "48px 24px 80px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "32px",
            marginBottom: "48px",
          }}
        >
          {/* Subscription Status Card */}
          <div
            style={{
              backgroundColor: "var(--bg-surface)",
              borderRadius: "16px",
              border: "1px solid rgba(212, 175, 55, 0.3)",
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
              Status Langganan
            </div>
            <h3 style={{ fontSize: "1.5rem", color: "var(--text-primary)", marginBottom: "8px" }}>
              {userPlanName}
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "20px" }}>
              {isSubscribed
                ? "Akun Anda aktif sebagai Pengguna Subscription dengan akses tak terbatas ke seluruh episode dan chapter penuh manhwa."
                : "Anda saat ini adalah Pengguna Biasa. Mulai berlangganan untuk membuka dan menonton seluruh chapter penuh serial manhwa."}
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
                    : "Lifetime Free"}
                </span>
              </div>
              <div style={{ gridColumn: "span 2", paddingTop: "8px", borderTop: "1px dashed var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", letterSpacing: "0.08em" }}>
                    PAYMENT METHOD
                  </span>
                  <span style={{ color: "var(--accent-gold)", fontSize: "0.88rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                      <line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                    <span>{user.subscription?.paymentMethod || "PayPal EU"}</span>
                  </span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>
                    STATEMENT LINE
                  </span>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontFamily: "monospace" }}>
                    YM MEDIA LUX
                  </span>
                </div>
              </div>
            </div>

            <Link
              href="/membership"
              className={isSubscribed ? "btn btn-secondary" : "btn btn-primary"}
              style={{ width: "100%" }}
            >
              {isSubscribed ? "Manage Subscription & Billing" : "Upgrade to Member Access"}
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
              Patron Profile
            </div>
            <h3 style={{ fontSize: "1.5rem", color: "var(--text-primary)", marginBottom: "16px" }}>
              Personal Details
            </h3>

            <form onSubmit={handleSaveBio} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Community Bio
                </label>
                <textarea
                  rows={3}
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value)}
                  placeholder="Share a thought or aesthetic preference with the community..."
                  style={{ width: "100%", resize: "vertical" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button type="submit" className="btn btn-secondary btn-sm">
                  Save Changes
                </button>
                {savedBio && (
                  <span style={{ color: "var(--status-success)", fontSize: "0.85rem" }}>
                    Bio updated
                  </span>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Watchlist / Saved Productions Section */}
        <div style={{ marginTop: "32px" }}>
          <div className="section-header">
            <div>
              <span className="section-subtitle">Private Curation</span>
              <h2 className="section-title">My Saved Productions</h2>
            </div>
            <Link href="/browse" className="view-all-link">
              <span>Explore More</span>
              <span>→</span>
            </Link>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "28px",
            }}
          >
            {watchlist.map((item) => (
              <ContentCard
                key={item.id}
                item={item}
                onWatchTrailer={(it) => setSelectedTrailer(it)}
              />
            ))}
          </div>
        </div>
      </div>

      <TrailerModal
        isOpen={!!selectedTrailer}
        onClose={() => setSelectedTrailer(null)}
        videoUrl={selectedTrailer?.trailer || ""}
        posterImage={selectedTrailer?.thumbnail}
        title={selectedTrailer?.title || ""}
        category={selectedTrailer?.category}
      />
    </div>
  );
}
