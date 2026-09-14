"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import HeroSlider, { HeroSlideData } from "@/components/home/HeroSlider";
import ContentCard from "@/components/content/ContentCard";
import TrailerModal from "@/components/video/TrailerModal";
import { MOCK_CONTENT, CATEGORIES } from "@/data/mockContent";
import { ContentItem } from "@/types/content";

export default function HomePage() {
  const [selectedTrailer, setSelectedTrailer] = useState<ContentItem | null>(null);

  const featuredItems = MOCK_CONTENT.filter((item) => item.featured);
  const [heroSlides, setHeroSlides] = useState<(ContentItem | HeroSlideData)[]>(featuredItems);

  useEffect(() => {
    fetch("/api/hero")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.slides && data.slides.length > 0) {
          setHeroSlides(data.slides);
        }
      })
      .catch((err) => console.error("Error loading dynamic hero slides:", err));
  }, []);

  const latestItems = [...MOCK_CONTENT].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 4);
  const popularItems = [...MOCK_CONTENT].sort(
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

      {/* 2. Featured Originals Section */}
      <section className="section" style={{ paddingTop: "60px" }}>
        <div className="container">
          <div className="section-header">
            <div>
              <span className="section-subtitle">Curated Excellence</span>
              <h2 className="section-title">YoruMuse Originals</h2>
            </div>
            <Link href="/browse?category=originals" className="view-all-link">
              <span>View All</span>
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
            {featuredItems.map((item) => (
              <ContentCard
                key={item.id}
                item={item}
                onWatchTrailer={handleWatchTrailer}
              />
            ))}
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

      {/* 6. Community Spotlight Section */}
      <section
        className="section"
        style={{
          backgroundColor: "var(--bg-surface-elevated)",
          borderTop: "1px solid var(--border-subtle)",
          borderBottom: "1px solid var(--border-subtle)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div className="container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "48px",
              alignItems: "center",
            }}
          >
            <div>
              <span className="section-subtitle">The Discerning Circle</span>
              <h2
                className="section-title"
                style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)", marginBottom: "18px" }}
              >
                A Curated Community for Cinephiles & Creators
              </h2>
              <p
                style={{
                  fontSize: "1rem",
                  lineHeight: 1.7,
                  color: "var(--text-secondary)",
                  marginBottom: "28px",
                }}
              >
                YoruMuse is more than streaming. Engage in thoughtful discussions, share reflections with fellow patrons, interact directly with verified creators, and explore episodic filmmaking in a curated, respectful community lounge.
              </p>

              <div style={{ display: "flex", gap: "24px", marginBottom: "32px", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.8rem", color: "var(--accent-gold)" }}>
                    100%
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Verified Members
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.8rem", color: "var(--accent-gold)" }}>
                    Ultra HD
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Ad-Free Experience
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.8rem", color: "var(--accent-gold)" }}>
                    Direct
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Creator Access
                  </div>
                </div>
              </div>

              <Link href="/community" className="btn btn-outline-gold btn-lg">
                Enter Community Lounge
              </Link>
            </div>

            {/* Teaser Preview Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div
                style={{
                  padding: "20px 24px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--accent-gold)", fontWeight: 700 }}>
                    DISCUSSIONS • 48 replies
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>2 hours ago</span>
                </div>
                <h4 style={{ fontSize: "1.05rem", color: "var(--text-primary)", marginBottom: "6px" }}>
                  The aesthetic nuances of &apos;Shadows in Champagne&apos;
                </h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                  &ldquo;The lighting design in scene three completely subverts traditional tropes. Thoughts on the director&apos;s cut?&rdquo;
                </p>
              </div>

              <div
                style={{
                  padding: "20px 24px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--accent-gold)", fontWeight: 700 }}>
                    ORIGINALS • 112 replies
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>5 hours ago</span>
                </div>
                <h4 style={{ fontSize: "1.05rem", color: "var(--text-primary)", marginBottom: "6px" }}>
                  Upcoming Velvet Sessions: Milan Series teaser feedback
                </h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                  &ldquo;Early access members, what did you think of the orchestral score integration?&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Membership Conversion Banner */}
      <section className="section" style={{ padding: "100px 0" }}>
        <div className="container">
          <div
            style={{
              position: "relative",
              borderRadius: "24px",
              padding: "clamp(36px, 6vw, 72px) clamp(24px, 5vw, 60px)",
              background: "linear-gradient(135deg, #ffffff 0%, #fdfbf7 50%, #f7f3e8 100%)",
              border: "1px solid rgba(166, 124, 30, 0.25)",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.06), 0 0 30px rgba(166, 124, 30, 0.08)",
              textAlign: "center",
              overflow: "hidden",
            }}
          >
            {/* Ambient Background Gold Flare */}
            <div
              style={{
                position: "absolute",
                top: "-40%",
                left: "50%",
                transform: "translateX(-50%)",
                width: "600px",
                height: "300px",
                background: "radial-gradient(ellipse at center, rgba(166, 124, 30, 0.12) 0%, transparent 70%)",
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
              Gain unrestricted access to full-length 4K HDR productions, director commentary, behind-the-scenes ateliers, and private member salons.
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
                View Membership Tiers
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
