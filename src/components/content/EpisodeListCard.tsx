"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ContentItem } from "@/types/content";

interface EpisodeListCardProps {
  item: ContentItem;
  badgePrefix?: string;
  chapterNumber?: number;
}

export default function EpisodeListCard({
  item,
  badgePrefix,
  chapterNumber = 1,
}: EpisodeListCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Format date if valid
  const formattedDate = React.useMemo(() => {
    if (!item.createdAt) return "Latest";
    try {
      const d = new Date(item.createdAt);
      return d.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "Latest";
    }
  }, [item.createdAt]);

  const viewCount = item.views ? `${item.views.toLocaleString()} views` : "14.2k views";

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: "flex",
        flexDirection: "row",
        gap: "18px",
        backgroundColor: isHovered ? "var(--bg-surface-elevated, #16161f)" : "var(--bg-surface, #101016)",
        border: `1px solid ${isHovered ? "rgba(212, 175, 55, 0.4)" : "var(--border-subtle, rgba(255, 255, 255, 0.08))"}`,
        borderRadius: "12px",
        padding: "14px",
        transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        boxShadow: "none",
        position: "relative",
      }}
      className="episode-list-card"
    >
      {/* 1. Left Thumbnail (16:9 ratio) */}
      <Link
        href={`/content/${item.slug}`}
        style={{
          position: "relative",
          width: "210px",
          minWidth: "160px",
          maxWidth: "240px",
          aspectRatio: "16 / 9",
          borderRadius: "8px",
          overflow: "hidden",
          flexShrink: 0,
          backgroundColor: "#0a0a0e",
          display: "block",
        }}
        tabIndex={-1}
      >
        <img
          src={item.thumbnail}
          alt={item.title}
          loading="lazy"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: isHovered ? "scale(1.06)" : "scale(1)",
            transition: "transform 0.4s ease",
          }}
        />

        {/* Play Icon Hover Overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: isHovered ? "rgba(0, 0, 0, 0.35)" : "rgba(0, 0, 0, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background-color 0.2s ease",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: isHovered ? "var(--accent-gold, #d4af37)" : "rgba(0, 0, 0, 0.6)",
              color: isHovered ? "#000000" : "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.85rem",
              paddingLeft: "3px",
              transition: "all 0.2s ease",
              boxShadow: "none",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="6 4 20 12 6 20 6 4" />
            </svg>
          </div>
        </div>

        {/* Duration badge */}
        {item.duration && (
          <span
            style={{
              position: "absolute",
              bottom: "6px",
              right: "6px",
              fontSize: "0.68rem",
              fontWeight: 700,
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              color: "#ffffff",
              padding: "2px 6px",
              borderRadius: "4px",
              backdropFilter: "blur(4px)",
              letterSpacing: "0.02em",
            }}
          >
            {item.duration}
          </span>
        )}
      </Link>

      {/* 2. Right Details & Synopsis */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          flex: 1,
          minWidth: 0,
        }}
      >
        <div>
          {/* Title Header with resolution badge */}
          <Link
            href={`/content/${item.slug}`}
            style={{
              textDecoration: "none",
              display: "block",
              marginBottom: "6px",
            }}
          >
            <h3
              style={{
                fontSize: "1.1rem",
                fontWeight: 700,
                color: "var(--text-primary, #ffffff)",
                margin: 0,
                lineHeight: 1.35,
                transition: "color 0.2s ease",
              }}
            >
              {badgePrefix ? (
                <span
                  style={{
                    color: "var(--accent-gold, #d4af37)",
                    marginRight: "6px",
                    fontWeight: 800,
                  }}
                >
                  [{badgePrefix}]
                </span>
              ) : null}
              {item.title.toLowerCase().includes("chapter")
                ? item.title
                : `${item.title} Chapter ${chapterNumber || 1}`}
            </h3>
          </Link>

          {/* Synopsis (2-3 lines max) */}
          <p
            style={{
              fontSize: "0.86rem",
              color: "var(--text-secondary, rgba(255, 255, 255, 0.7))",
              lineHeight: 1.5,
              margin: 0,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            <strong style={{ color: "var(--text-muted, #8a8a93)", fontWeight: 600 }}>
              Synopsis :{" "}
            </strong>
            {item.description}
          </p>
        </div>

        {/* Bottom Metadata & CTA */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "8px",
            marginTop: "10px",
            paddingTop: "8px",
            borderTop: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.05))",
            fontSize: "0.78rem",
            color: "var(--text-muted, #8a8a93)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span
              style={{
                color: "var(--accent-gold-dark, #a67c1e)",
                backgroundColor: "rgba(212, 175, 55, 0.12)",
                padding: "2px 8px",
                borderRadius: "4px",
                fontWeight: 700,
                fontSize: "0.72rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {item.category || "Manhwa"}
            </span>
            <span>{viewCount}</span>
            <span>•</span>
            <span>{formattedDate}</span>
          </div>

          <Link
            href={`/content/${item.slug}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              color: "var(--accent-gold, #d4af37)",
              fontWeight: 700,
              fontSize: "0.8rem",
              textDecoration: "none",
            }}
          >
            <span>Watch Chapter</span>
            <span style={{ transition: "transform 0.2s ease", transform: isHovered ? "translateX(3px)" : "none" }}>
              →
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
