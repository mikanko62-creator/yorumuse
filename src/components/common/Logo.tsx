import React from "react";
import Link from "next/link";
import Image from "next/image";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  className?: string;
  linkToHome?: boolean;
}

export default function Logo({
  size = "md",
  showWordmark = true,
  className = "",
  linkToHome = true,
}: LogoProps) {
  const dimensions = {
    sm: { iconSize: 32, fontSize: "1.1rem", subSize: "0.55rem" },
    md: { iconSize: 42, fontSize: "1.45rem", subSize: "0.65rem" },
    lg: { iconSize: 64, fontSize: "1.95rem", subSize: "0.75rem" },
  }[size];

  const content = (
    <div
      className={`logo-container ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: size === "sm" ? "10px" : size === "lg" ? "16px" : "14px",
        userSelect: "none",
      }}
    >
      {/* Official YoruMuse Gold Emblem from /logo.png */}
      <div
        style={{
          width: `${dimensions.iconSize}px`,
          height: `${dimensions.iconSize}px`,
          position: "relative",
          borderRadius: "50%",
          overflow: "hidden",
          flexShrink: 0,
          boxShadow: "0 2px 10px rgba(166, 124, 30, 0.25), 0 1px 3px rgba(0, 0, 0, 0.08)",
          border: "1px solid rgba(166, 124, 30, 0.3)",
          backgroundColor: "#000000",
        }}
      >
        <Image
          src="/logo.png"
          alt="YoruMuse Emblem"
          width={dimensions.iconSize * 2}
          height={dimensions.iconSize * 2}
          priority
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      </div>

      {/* Wordmark */}
      {showWordmark && (
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.05 }}>
          <span
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: dimensions.fontSize,
              fontWeight: 700,
              letterSpacing: "0.22em",
              color: "var(--text-primary)",
              textTransform: "uppercase",
              background: "linear-gradient(180deg, #111827 0%, #374151 55%, var(--accent-gold) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            YORUMUSE
          </span>
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: dimensions.subSize,
              letterSpacing: "0.35em",
              color: "var(--accent-gold)",
              textTransform: "uppercase",
              fontWeight: 600,
              opacity: 0.9,
              marginTop: "2px",
            }}
          >
            CINEMA STUDIOS
          </span>
        </div>
      )}
    </div>
  );

  if (linkToHome) {
    return (
      <Link href="/" aria-label="YoruMuse Home" style={{ display: "inline-flex", textDecoration: "none" }}>
        {content}
      </Link>
    );
  }

  return content;
}
