"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import HeroSlider, { HeroSlideData } from "@/components/home/HeroSlider";
import ContentCard from "@/components/content/ContentCard";
import EpisodeListCard from "@/components/content/EpisodeListCard";
import TrailerModal from "@/components/video/TrailerModal";
import CheckoutModal from "@/components/payment/CheckoutModal";
import { SUBSCRIPTION_PLANS } from "@/lib/payments/provider";
import { SubscriptionPlan } from "@/lib/payments/types";
import { MOCK_CONTENT, CATEGORIES } from "@/data/mockContent";
import { ContentItem } from "@/types/content";

export default function HomePage() {
  const router = useRouter();
  const [selectedTrailer, setSelectedTrailer] = useState<ContentItem | null>(null);

  const featuredItems = MOCK_CONTENT.filter((item) => item.featured);
  const [heroSlides, setHeroSlides] = useState<(ContentItem | HeroSlideData)[]>(featuredItems);

  const [contentList, setContentList] = useState<any[]>(MOCK_CONTENT);

  // Subscription state from Gambar 1
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [billingCycle, setBillingCycle] = useState<"month" | "year">("month");
  const [checkoutPlan, setCheckoutPlan] = useState<SubscriptionPlan | null>(null);
  const [checkoutSuccessMsg, setCheckoutSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setCurrentUser(data.user);
      })
      .catch(() => {});

    fetch("/api/hero")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.slides && data.slides.length > 0) {
          setHeroSlides(data.slides);
        }
      })
      .catch((err) => console.error("Error loading dynamic hero slides:", err));

    fetch("/api/content?sort=latest")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.content && data.content.length > 0) {
          setContentList(data.content);
        }
      })
      .catch((err) => console.error("Error loading dynamic content:", err));
  }, []);

  const subscriberPlan = SUBSCRIPTION_PLANS.find((p) => p.id === "vip_premium") || SUBSCRIPTION_PLANS[1];
  const isCurrentActiveSubscriber = currentUser?.subscription?.status === "ACTIVE";
  const displayPrice =
    billingCycle === "year" && subscriberPlan.price > 0
      ? Number((subscriberPlan.price * 0.75 * 12).toFixed(2))
      : subscriberPlan.price;

  const handleSelectSubscription = () => {
    if (!currentUser) {
      router.push("/login?redirect=/#subscription");
      return;
    }
    if (subscriberPlan) {
      setCheckoutPlan(subscriberPlan);
    }
  };

  const handleCheckoutSuccess = (result: { paymentMethod: string; planName: string; currentPeriodEnd: string }) => {
    setCheckoutPlan(null);
    setCheckoutSuccessMsg(`Access unlocked via ${result.paymentMethod}! Redirecting...`);
    setTimeout(() => {
      setCheckoutSuccessMsg(null);
      window.location.reload();
    }, 1500);
  };

  const latestItems = [...contentList].sort(
    (a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
  );
  const popularItems = [...contentList].sort(
    (a, b) => (b.views || 0) - (a.views || 0)
  ).slice(0, 4);

  const handleWatchTrailer = (item: ContentItem) => {
    setSelectedTrailer(item);
  };

  const handleCloseTrailer = () => {
    setSelectedTrailer(null);
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      {/* 1. Cinematic Hero Slider */}
      <HeroSlider slides={heroSlides} onWatchTrailer={handleWatchTrailer} />

      {/* 2. Latest Manhwa Releases Feed + Sidebar Layout */}
      <section className="section" style={{ paddingTop: "48px", paddingBottom: "48px" }}>
        <div className="container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "36px",
              alignItems: "start",
            }}
          >
            {/* Main Left Column: Episode Releases List */}
            <div style={{ minWidth: 0, flex: "1 1 65%" }}>
              {/* LATEST RELEASES Header Panel */}
              <div
                style={{
                  backgroundColor: "var(--bg-surface, #101016)",
                  border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))",
                  borderBottom: "2px solid var(--accent-gold, #d4af37)",
                  borderRadius: "10px 10px 0 0",
                  padding: "14px 20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: "var(--accent-gold, #d4af37)",
                      display: "inline-block",
                    }}
                  />
                  <h2
                    style={{
                      fontSize: "1.05rem",
                      fontWeight: 800,
                      color: "var(--text-primary, #ffffff)",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      margin: 0,
                    }}
                  >
                    LATEST MANHWA RELEASES
                  </h2>
                </div>

                <Link
                  href="/browse?category=manhwa"
                  style={{
                    fontSize: "0.82rem",
                    color: "var(--accent-gold, #d4af37)",
                    fontWeight: 700,
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <span>View All</span>
                  <span>→</span>
                </Link>
              </div>

              {/* Episode Card List Stack */}
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {latestItems.slice(0, 8).map((item) => (
                  <EpisodeListCard
                    key={item.id}
                    item={item}
                    chapterNumber={item.latestChapterNumber || 1}
                  />
                ))}
              </div>
            </div>

            {/* Right Sidebar Column: Trending & VIP Access */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "24px",
                minWidth: "280px",
              }}
            >
              {/* Widget 1: Trending Manhwa */}
              <div
                style={{
                  backgroundColor: "var(--bg-surface, #101016)",
                  border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))",
                  borderRadius: "12px",
                  overflow: "hidden",
                  boxShadow: "none",
                }}
              >
                <div
                  style={{
                    padding: "12px 18px",
                    backgroundColor: "rgba(255, 255, 255, 0.02)",
                    borderBottom: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.82rem",
                      fontWeight: 800,
                      color: "var(--accent-gold, #d4af37)",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    POPULAR & TRENDING
                  </span>
                  <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>Top This Week</span>
                </div>

                <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  {popularItems.map((item, idx) => (
                    <Link
                      key={item.id}
                      href={`/content/${item.slug}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        textDecoration: "none",
                        padding: "8px",
                        borderRadius: "8px",
                        transition: "background-color 0.2s ease",
                      }}
                      className="sidebar-trending-item"
                    >
                      {/* Rank Number */}
                      <span
                        style={{
                          fontSize: "1.1rem",
                          fontWeight: 900,
                          fontFamily: "var(--font-serif)",
                          color: idx === 0 ? "var(--accent-gold)" : "var(--text-muted)",
                          minWidth: "24px",
                          textAlign: "center",
                        }}
                      >
                        0{idx + 1}
                      </span>

                      {/* Mini Thumbnail */}
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        style={{
                          width: "56px",
                          height: "38px",
                          objectFit: "cover",
                          borderRadius: "4px",
                          flexShrink: 0,
                        }}
                      />

                      {/* Title & Views */}
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <h4
                          style={{
                            fontSize: "0.86rem",
                            fontWeight: 700,
                            color: "var(--text-primary)",
                            margin: 0,
                            lineHeight: 1.3,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {item.title}
                        </h4>
                        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                          {(item.views || 18000).toLocaleString()} views
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Widget 2: Subscriber Membership Card (from Gambar 1) */}
              <div
                id="subscription"
                style={{
                  backgroundColor: "var(--bg-surface, #101016)",
                  border: "1.5px solid rgba(212, 175, 55, 0.4)",
                  borderRadius: "16px",
                  padding: "24px 20px",
                  position: "relative",
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(212, 175, 55, 0.08)",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Top Badge */}
                <div
                  style={{
                    position: "absolute",
                    top: "-12px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    backgroundColor: "var(--accent-gold, #d4af37)",
                    color: "#0c060a",
                    padding: "3px 14px",
                    borderRadius: "9999px",
                    fontSize: "0.68rem",
                    fontWeight: 800,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    boxShadow: "0 2px 10px rgba(212, 175, 55, 0.3)",
                    whiteSpace: "nowrap",
                  }}
                >
                  MOST POPULAR
                </div>

                <div style={{ textAlign: "center", marginTop: "4px", marginBottom: "16px" }}>
                  <h3
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: "1.45rem",
                      fontWeight: 800,
                      color: "var(--text-primary)",
                      marginBottom: "6px",
                    }}
                  >
                    Subscriber
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.45, margin: 0 }}>
                    Full unlimited access to all serialized manhwa chapters and subscriber privileges.
                  </p>
                </div>

                {/* Billing Cycle Toggle */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                    padding: "4px",
                    borderRadius: "9999px",
                    backgroundColor: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))",
                    marginBottom: "18px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setBillingCycle("month")}
                    style={{
                      flex: 1,
                      padding: "6px 12px",
                      borderRadius: "9999px",
                      fontSize: "0.76rem",
                      fontWeight: 600,
                      backgroundColor: billingCycle === "month" ? "#ffffff" : "transparent",
                      color: billingCycle === "month" ? "#0c060a" : "var(--text-secondary)",
                      border: "none",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      textAlign: "center",
                    }}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle("year")}
                    style={{
                      flex: 1,
                      padding: "6px 10px",
                      borderRadius: "9999px",
                      fontSize: "0.76rem",
                      fontWeight: 600,
                      backgroundColor: billingCycle === "year" ? "var(--accent-gold)" : "transparent",
                      color: billingCycle === "year" ? "#0c060a" : "var(--text-secondary)",
                      border: "none",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                    }}
                  >
                    <span>Annual</span>
                    <span
                      style={{
                        fontSize: "0.62rem",
                        padding: "1px 5px",
                        borderRadius: "4px",
                        backgroundColor: billingCycle === "year" ? "rgba(0, 0, 0, 0.25)" : "rgba(212, 175, 55, 0.15)",
                        color: billingCycle === "year" ? "#ffffff" : "var(--accent-gold)",
                        fontWeight: 800,
                      }}
                    >
                      -25%
                    </span>
                  </button>
                </div>

                {/* Price Display */}
                <div style={{ textAlign: "center", marginBottom: "18px" }}>
                  <div style={{ display: "inline-flex", alignItems: "baseline", gap: "4px" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontSize: "2.4rem",
                        fontWeight: 800,
                        color: "var(--text-primary)",
                        lineHeight: 1,
                      }}
                    >
                      €{displayPrice.toFixed(2)}
                    </span>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                      /{billingCycle === "year" ? "year" : "month"}
                    </span>
                  </div>
                  {billingCycle === "year" && (
                    <span
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--accent-gold)",
                        marginTop: "4px",
                        display: "block",
                        fontWeight: 600,
                      }}
                    >
                      Billed annually (effectively €{(subscriberPlan.price * 0.75).toFixed(2)}/mo)
                    </span>
                  )}
                </div>

                {/* CTA Button */}
                <button
                  type="button"
                  onClick={handleSelectSubscription}
                  disabled={isCurrentActiveSubscriber}
                  className="btn btn-primary"
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    fontSize: "0.9rem",
                    padding: "12px 18px",
                    fontWeight: 700,
                    marginBottom: "20px",
                    cursor: isCurrentActiveSubscriber ? "default" : "pointer",
                    opacity: isCurrentActiveSubscriber ? 0.6 : 1,
                  }}
                  id="home-subscriber-cta"
                >
                  {isCurrentActiveSubscriber ? "Active Subscriber" : "Unlock Access"}
                </button>

                {/* Features List */}
                <div
                  style={{
                    borderTop: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))",
                    paddingTop: "16px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.68rem",
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "var(--text-muted)",
                      display: "block",
                      marginBottom: "12px",
                    }}
                  >
                    WHAT IS INCLUDED:
                  </span>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                    {[
                      "Unlimited access to all chapter updates",
                      "Full VIP manhwa serials library",
                      "High-definition image quality",
                      "Exclusive creator art drops",
                      "Ad-free uninterrupted reading",
                    ].map((feature, idx) => (
                      <li
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "10px",
                          fontSize: "0.8rem",
                          color: "var(--text-secondary)",
                          lineHeight: 1.4,
                        }}
                      >
                        <span
                          style={{
                            color: "var(--accent-gold, #d4af37)",
                            fontSize: "0.85rem",
                            lineHeight: 1,
                            marginTop: "2px",
                            flexShrink: 0,
                          }}
                        >
                          ✓
                        </span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Subtitle footnote for free tier */}
                <div
                  style={{
                    marginTop: "16px",
                    paddingTop: "12px",
                    borderTop: "1px dashed rgba(255, 255, 255, 0.08)",
                    textAlign: "center",
                  }}
                >
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                    Free Guest tier (€0) active by default.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Browse By Category Showcase */}
      <section
        className="section"
        style={{
          backgroundColor: "rgba(18, 18, 23, 0.4)",
          borderTop: "1px solid var(--border-subtle)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div className="container">
          <div className="section-header">
            <div>
              <span className="section-subtitle">Aesthetic Spectrum</span>
              <h2 className="section-title">Browse Categories</h2>
            </div>
            <Link href="/browse" className="view-all-link">
              <span>All Collections</span>
              <span>→</span>
            </Link>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
              gap: "20px",
            }}
          >
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                href={`/browse?category=${cat.slug}`}
                style={{
                  position: "relative",
                  borderRadius: "var(--radius-md)",
                  overflow: "hidden",
                  aspectRatio: "4 / 3",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  padding: "20px",
                  border: "1px solid var(--border-subtle)",
                  transition: "transform 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease",
                  textDecoration: "none",
                }}
                className="category-card"
              >
                {/* Background Image */}
                <img
                  src={cat.thumbnail}
                  alt={cat.name}
                  loading="lazy"
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    filter: "brightness(0.65) contrast(1.1)",
                    transition: "transform 0.5s ease",
                  }}
                  className="cat-bg"
                />

                {/* Dark Vignette Overlay */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(0deg, rgba(8, 8, 10, 0.95) 0%, rgba(8, 8, 10, 0.3) 60%, transparent 100%)",
                  }}
                />

                {/* Category Card Text */}
                <div style={{ position: "relative", zIndex: 2 }}>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--accent-gold)",
                      fontWeight: 600,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      marginBottom: "4px",
                    }}
                  >
                    {cat.count} Titles
                  </div>
                  <h3
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: "1.2rem",
                      color: "#ffffff",
                      marginBottom: "4px",
                    }}
                  >
                    {cat.name}
                  </h3>
                  <p
                    style={{
                      fontSize: "0.78rem",
                      color: "rgba(255, 255, 255, 0.7)",
                      lineHeight: 1.3,
                      display: "-webkit-box",
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {cat.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Latest Releases Section */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="section-subtitle">Fresh Premieres</span>
              <h2 className="section-title">Latest Releases</h2>
            </div>
            <Link href="/browse?sort=latest" className="view-all-link">
              <span>View Latest</span>
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
            {latestItems.map((item) => (
              <ContentCard
                key={item.id}
                item={item}
                onWatchTrailer={handleWatchTrailer}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 5. Popular / Most Watched Section */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-header">
            <div>
              <span className="section-subtitle">Audience Favorites</span>
              <h2 className="section-title">Popular & Trending</h2>
            </div>
            <Link href="/browse?sort=popular" className="view-all-link">
              <span>Top Chart</span>
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
            {popularItems.map((item) => (
              <ContentCard
                key={item.id}
                item={item}
                onWatchTrailer={handleWatchTrailer}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 5. Membership Conversion Banner */}
      <section className="section" style={{ padding: "100px 0" }}>
        <div className="container">
          <div
            style={{
              position: "relative",
              borderRadius: "24px",
              padding: "clamp(36px, 6vw, 72px) clamp(24px, 5vw, 60px)",
              background: "linear-gradient(135deg, rgba(28, 14, 24, 0.95) 0%, rgba(20, 9, 17, 0.98) 50%, rgba(12, 6, 10, 0.99) 100%)",
              border: "1px solid rgba(212, 175, 55, 0.35)",
              boxShadow: "0 24px 60px rgba(0, 0, 0, 0.75), 0 0 35px rgba(212, 175, 55, 0.12)",
              textAlign: "center",
              overflow: "hidden",
              backdropFilter: "blur(12px)",
            }}
          >
            {/* Ambient Background Gold Flare */}
            <div
              style={{
                position: "absolute",
                top: "-40%",
                left: "50%",
                transform: "translateX(-50%)",
                width: "650px",
                height: "320px",
                background: "radial-gradient(ellipse at center, rgba(212, 175, 55, 0.18) 0%, rgba(225, 29, 72, 0.08) 50%, transparent 70%)",
                pointerEvents: "none",
              }}
            />

            <span
              style={{
                fontSize: "0.85rem",
                fontWeight: 700,
                letterSpacing: "0.2em",
                color: "var(--accent-gold)",
                textTransform: "uppercase",
                display: "inline-block",
                marginBottom: "12px",
              }}
            >
              MEMBERSHIP ARCHITECTURE
            </span>

            <h2
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(2rem, 4vw, 3.2rem)",
                color: "var(--text-primary)",
                marginBottom: "18px",
                lineHeight: 1.2,
              }}
            >
              Unlock the Entire YoruMuse Vault
            </h2>

            <p
              style={{
                fontSize: "1.05rem",
                color: "var(--text-secondary)",
                maxWidth: "640px",
                margin: "0 auto 36px",
                lineHeight: 1.6,
              }}
            >
              Unlock unlimited access to all episodes and full chapters of manhwa series with a subscription.
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              <Link href="/membership" className="btn btn-primary btn-lg" id="home-membership-cta">
                Start Subscription
              </Link>
              <Link href="/browse" className="btn btn-secondary btn-lg">
                Browse Public Previews
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trailer Modal (Global Center Screen) */}
      <TrailerModal
        isOpen={!!selectedTrailer}
        onClose={handleCloseTrailer}
        videoUrl={selectedTrailer?.trailer || ""}
        posterImage={selectedTrailer?.thumbnail}
        title={selectedTrailer?.title || ""}
        category={selectedTrailer?.category}
      />

      {/* Checkout Modal for Direct Subscription */}
      {checkoutPlan && (
        <CheckoutModal
          isOpen={!!checkoutPlan}
          onClose={() => setCheckoutPlan(null)}
          plan={checkoutPlan}
          billingCycle={billingCycle}
          userEmail={currentUser?.email}
          onSuccess={handleCheckoutSuccess}
        />
      )}

      {/* Checkout Success Notification Toast */}
      {checkoutSuccessMsg && (
        <div
          style={{
            position: "fixed",
            bottom: "32px",
            right: "32px",
            zIndex: 99999,
            backgroundColor: "#064e3b",
            color: "#a7f3d0",
            padding: "16px 24px",
            borderRadius: "12px",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.6), 0 0 20px rgba(16, 185, 129, 0.2)",
            border: "1px solid #059669",
            fontWeight: 600,
            fontSize: "0.95rem",
          }}
        >
          ✓ {checkoutSuccessMsg}
        </div>
      )}

      <style jsx>{`
        .category-card:hover {
          transform: translateY(-4px);
          border-color: rgba(212, 175, 55, 0.45) !important;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.7), 0 0 20px rgba(212, 175, 55, 0.15) !important;
        }
        .category-card:hover .cat-bg {
          transform: scale(1.06);
        }
      `}</style>
    </div>
  );
}
