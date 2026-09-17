"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ContentItem } from "@/types/content";

export interface HeroSlideData {
  id: string;
  title: string;
  subtitle?: string | null;
  description?: string;
  badge?: string | null;
  category?: string;
  accessLevel?: string;
  duration?: string;
  thumbnail: string;
  trailerUrl?: string | null;
  trailer?: string;
  slug?: string;
  contentSlug?: string | null;
  ctaPrimaryText?: string | null;
  ctaPrimaryLink?: string | null;
  ctaSecondaryText?: string | null;
}

interface HeroSliderProps {
  slides: (ContentItem | HeroSlideData)[];
  onWatchTrailer: (item: ContentItem) => void;
}

export default function HeroSlider({ slides, onWatchTrailer }: HeroSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalSlides = slides.length;

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goToSlide = (idx: number) => {
    setCurrentIndex(idx);
  };

  // Autoplay functionality
  useEffect(() => {
    if (isPaused || totalSlides <= 1) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 6500);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide, totalSlides]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only react if hero is in viewport or focused
      if (e.key === "ArrowLeft") {
        prevSlide();
      } else if (e.key === "ArrowRight") {
        nextSlide();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide]);

  // Touch swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 50) {
      // Swiped left -> next
      nextSlide();
    } else if (diff < -50) {
      // Swiped right -> prev
      prevSlide();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (!slides || slides.length === 0) return null;

  return (
    <section
      ref={containerRef}
      aria-label="Featured Showcase Carousel"
      className="hero-slider-section"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        position: "relative",
        width: "100%",
        minHeight: "88vh",
        maxHeight: "920px",
        overflow: "hidden",
        backgroundColor: "#050507",
        display: "flex",
        alignItems: "center",
      }}
    >
      {/* Slides Container */}
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          transform: `translateX(-${currentIndex * 100}%)`,
          transition: "transform 0.75s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {slides.map((slide, idx) => (
          <div
            key={slide.id}
            aria-hidden={idx !== currentIndex}
            style={{
              flex: "0 0 100%",
              width: "100%",
              minHeight: "88vh",
              position: "relative",
              display: "flex",
              alignItems: "center",
            }}
          >
            {/* Background Image */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 1,
              }}
            >
              <img
                src={slide.thumbnail}
                alt={slide.title}
                fetchPriority={idx === 0 ? "high" : "auto"}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center 25%",
                  filter: "brightness(0.72) contrast(1.1)",
                }}
              />
            </div>

            {/* Sensual Nocturnal Vignette Overlays */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 2,
                background: "linear-gradient(90deg, rgba(12, 6, 10, 0.96) 0%, rgba(22, 10, 18, 0.82) 42%, rgba(12, 6, 10, 0.4) 80%, rgba(12, 6, 10, 0.88) 100%)",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 2,
                background: "linear-gradient(0deg, var(--bg-base) 0%, rgba(12, 6, 10, 0.65) 25%, transparent 65%)",
              }}
            />

            {/* Slide Content */}
            <div
              className="container"
              style={{
                position: "relative",
                zIndex: 3,
                paddingTop: "60px",
                paddingBottom: "60px",
              }}
            >
              <div
                style={{
                  maxWidth: "680px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "18px",
                  animation: idx === currentIndex ? "slideUp 0.6s var(--ease-cinematic)" : "none",
                }}
              >
                {/* Category & Badges */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                  <span
                    style={{
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: "var(--accent-gold-light)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    {slide.category || "Manhwa"}
                  </span>

                  {(slide as HeroSlideData).badge && 
                    !(slide as HeroSlideData).badge?.toUpperCase().includes("MEMBER") &&
                    !(slide as HeroSlideData).badge?.toUpperCase().includes("PREMIUM") &&
                    !(slide as HeroSlideData).badge?.toUpperCase().includes("PUBLIC") && (
                    <span className="badge" style={{ backgroundColor: "rgba(212, 175, 55, 0.12)", color: "var(--accent-gold)", border: "1px solid rgba(212, 175, 55, 0.3)" }}>
                      {(slide as HeroSlideData).badge}
                    </span>
                  )}

                  {slide.duration && (
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      • {slide.duration}
                    </span>
                  )}
                </div>

                {/* Main Title */}
                <h1
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "clamp(2.4rem, 5.5vw, 4.2rem)",
                    lineHeight: 1.1,
                    color: "#ffffff",
                    letterSpacing: "-0.01em",
                    textShadow: "0 4px 24px rgba(0, 0, 0, 0.8)",
                  }}
                >
                  {slide.title}
                </h1>

                {/* Description */}
                <p
                  style={{
                    fontSize: "clamp(0.95rem, 1.8vw, 1.15rem)",
                    color: "rgba(245, 245, 247, 0.85)",
                    lineHeight: 1.6,
                    maxWidth: "580px",
                    textShadow: "0 2px 10px rgba(0, 0, 0, 0.7)",
                  }}
                >
                  {(slide as HeroSlideData).subtitle || (slide as any).description || ""}
                </p>

                {/* Call to Actions */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    marginTop: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  {((slide as any).trailer || (slide as HeroSlideData).trailerUrl) && (
                    <button
                      onClick={() => {
                        const payload: ContentItem = {
                          id: slide.id,
                          title: slide.title,
                          slug: (slide as any).slug || (slide as HeroSlideData).contentSlug || "",
                          description: (slide as HeroSlideData).subtitle || (slide as any).description || "",
                          thumbnail: slide.thumbnail,
                          trailer: (slide as any).trailer || (slide as HeroSlideData).trailerUrl || "",
                          category: slide.category || "Manhwa",
                          accessLevel: (slide.accessLevel as any) || "PUBLIC",
                          featured: true,
                          published: true,
                          releaseYear: 2026,
                          createdAt: new Date().toISOString(),
                          duration: slide.duration || "45 min",
                        };
                        onWatchTrailer(payload);
                      }}
                      className="btn btn-primary btn-lg"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                      <span>{(slide as HeroSlideData).ctaSecondaryText || "Watch Trailer"}</span>
                    </button>
                  )}

                  <Link
                    href={
                      (slide as HeroSlideData).ctaPrimaryLink ||
                      ((slide as HeroSlideData).contentSlug
                        ? `/content/${(slide as HeroSlideData).contentSlug}`
                        : (slide as any).slug
                        ? `/content/${(slide as any).slug}`
                        : "/browse")
                    }
                    className="btn btn-secondary btn-lg"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.18)",
                      color: "#ffffff",
                      borderColor: "rgba(255, 255, 255, 0.35)",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    {(slide as HeroSlideData).ctaPrimaryText || "Explore Film"}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Slider Controls: Previous & Next Arrows */}
      <div
        style={{
          position: "absolute",
          bottom: "40px",
          right: "40px",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
        className="slider-controls"
      >
        <button
          onClick={prevSlide}
          aria-label="Previous slide"
          style={{
            width: "48px",
            height: "48px",
            padding: 0,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#ffffff",
            color: "var(--text-primary)",
            border: "1px solid var(--border-medium)",
            boxShadow: "none",
            cursor: "pointer",
            transition: "all var(--transition-fast)",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <button
          onClick={nextSlide}
          aria-label="Next slide"
          style={{
            width: "48px",
            height: "48px",
            padding: 0,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#ffffff",
            color: "var(--text-primary)",
            border: "1px solid var(--border-medium)",
            boxShadow: "none",
            cursor: "pointer",
            transition: "all var(--transition-fast)",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Pagination Indicators */}
      <div
        style={{
          position: "absolute",
          bottom: "48px",
          left: "24px",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
        className="container slider-pagination"
      >
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goToSlide(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            style={{
              width: idx === currentIndex ? "44px" : "12px",
              height: "4px",
              borderRadius: "2px",
              backgroundColor: idx === currentIndex ? "var(--accent-gold)" : "rgba(255, 255, 255, 0.25)",
              boxShadow: "none",
              transition: "all 0.35s ease",
              cursor: "pointer",
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .slider-controls {
            bottom: 24px !important;
            right: 20px !important;
          }
          .slider-pagination {
            bottom: 30px !important;
            left: 16px !important;
          }
        }
      `}</style>
    </section>
  );
}
