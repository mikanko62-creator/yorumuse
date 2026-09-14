"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ContentItem } from "@/types/content";

interface ContentCardProps {
  item: ContentItem;
  onWatchTrailer?: (item: ContentItem) => void;
  priority?: boolean;
}

export default function ContentCard({ item, onWatchTrailer }: ContentCardProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const trailerUrl = item.trailer || item.videoUrl;

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (!trailerUrl) return;

    // Small delay to prevent accidental playback on quick scroll
    hoverTimeoutRef.current = setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current
          .play()
          .then(() => setIsVideoPlaying(true))
          .catch(() => {
            // Autoplay might be blocked if unmuted, keep muted
          });
      }
    }, 200);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsVideoPlaying(false);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  const handleCardClick = (e: React.MouseEvent) => {
    // Navigate to content detail page
    router.push(`/content/${item.slug}`);
  };

  const getBadgeClass = (level: string) => {
    switch (level) {
      case "PUBLIC":
        return "badge badge-public";
      case "MEMBER":
        return "badge badge-member";
      case "PREMIUM":
        return "badge badge-premium";
      default:
        return "badge badge-public";
    }
  };

  return (
    <div
      className="content-card"
      onClick={handleCardClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        position: "relative",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
        backgroundColor: "var(--bg-surface)",
        border: isHovered ? "1px solid var(--accent-gold)" : "1px solid var(--border-subtle)",
        transition: "transform 0.35s var(--ease-cinematic), border-color 0.35s var(--ease-cinematic), box-shadow 0.35s var(--ease-cinematic)",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        boxShadow: isHovered
          ? "0 14px 30px rgba(0, 0, 0, 0.1), 0 0 16px rgba(166, 124, 30, 0.15)"
          : "var(--shadow-sm)",
        transform: isHovered ? "translateY(-4px)" : "none",
      }}
    >
      {/* Thumbnail / Hover Video Panel */}
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "16 / 10",
          overflow: "hidden",
          backgroundColor: "#0c0c10",
        }}
      >
        {/* Poster Image */}
        <img
          src={item.thumbnail}
          alt={item.title}
          loading="lazy"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "transform 0.5s var(--ease-cinematic), opacity 0.3s ease",
            transform: isHovered ? "scale(1.04)" : "scale(1)",
            opacity: isVideoPlaying ? 0 : 1,
          }}
          className="card-thumb"
        />

        {/* Hover Autoplay Video Trailer */}
        {trailerUrl && (
          <video
            ref={videoRef}
            src={trailerUrl}
            muted
            loop
            playsInline
            controlsList="nodownload noplaybackrate"
            disablePictureInPicture
            onContextMenu={(e) => e.preventDefault()}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: isVideoPlaying ? 1 : 0,
              transition: "opacity 0.35s ease",
              pointerEvents: "none",
            }}
          />
        )}

        {/* Cinematic Vignette Overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: isVideoPlaying
              ? "linear-gradient(180deg, rgba(8, 8, 10, 0.1) 0%, transparent 60%, rgba(8, 8, 10, 0.7) 100%)"
              : "linear-gradient(180deg, rgba(8, 8, 10, 0.2) 0%, rgba(8, 8, 10, 0.05) 40%, rgba(8, 8, 10, 0.8) 100%)",
            transition: "background 0.3s ease",
          }}
        />

        {/* Live Hover Trailer Badge Indicator */}
        {isVideoPlaying && (
          <div
            style={{
              position: "absolute",
              bottom: "10px",
              left: "12px",
              zIndex: 3,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              borderRadius: "20px",
              backgroundColor: "rgba(0, 0, 0, 0.75)",
              backdropFilter: "blur(6px)",
              color: "#ffffff",
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: "0.06em",
              border: "1px solid rgba(212, 175, 55, 0.5)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
            }}
          >
            <span style={{ color: "var(--accent-gold)" }}>▶</span>
            <span>TRAILER PREVIEW</span>
          </div>
        )}

        {/* Top Badges */}
        {item.duration && (
          <div
            style={{
              position: "absolute",
              top: "12px",
              right: "12px",
              zIndex: 3,
            }}
          >
            <span
              style={{
                fontSize: "0.72rem",
                color: "#ffffff",
                backgroundColor: "rgba(0, 0, 0, 0.65)",
                backdropFilter: "blur(6px)",
                padding: "3px 8px",
                borderRadius: "var(--radius-xs)",
                fontWeight: 600,
                letterSpacing: "0.04em",
              }}
            >
              {item.duration}
            </span>
          </div>
        )}
      </div>

      {/* Card Information Body */}
      <div
        style={{
          padding: "16px 18px 18px",
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
        }}
      >
        <div
          style={{
            fontSize: "0.74rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--accent-gold)",
            marginBottom: "4px",
          }}
        >
          {item.category}
        </div>

        <h4
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "1.12rem",
            color: "var(--text-primary)",
            marginBottom: "6px",
            lineHeight: 1.3,
          }}
        >
          {item.title}
        </h4>

        <p
          style={{
            fontSize: "0.84rem",
            color: "var(--text-secondary)",
            lineHeight: 1.45,
            marginBottom: "14px",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {item.description}
        </p>

        {/* Card Footer Actions */}
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "10px",
            borderTop: "1px solid var(--border-subtle)",
          }}
        >
          <span
            style={{
              fontSize: "0.82rem",
              fontWeight: 700,
              color: isHovered ? "var(--accent-gold)" : "var(--text-primary)",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              transition: "color 0.2s ease",
            }}
          >
            Lihat Serial & Episode
            <span style={{ color: "var(--accent-gold)" }}>→</span>
          </span>

          <span
            style={{
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            
            <span>Hover preview</span>
          </span>
        </div>
      </div>
    </div>
  );
}
