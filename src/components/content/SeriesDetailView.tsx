"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import ContentPlayerClient from "@/app/content/[slug]/ContentPlayerClient";

export interface ChapterItem {
  id: string;
  chapterNumber: number;
  title: string;
  description?: string | null;
  thumbnail?: string | null;
  videoUrl: string;
  duration?: string | null;
  published: boolean;
  _count?: {
    comments: number;
  };
}

export interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    username: string;
    role: string;
    avatarUrl?: string | null;
  };
}

interface SeriesDetailViewProps {
  content: {
    id: string;
    title: string;
    slug: string;
    description: string;
    category: string;
    accessLevel: string;
    thumbnail: string;
    trailer: string;
    videoUrl?: string | null;
    duration?: string | null;
    releaseYear?: number;
    views?: number | null;
    likes?: number;
    tags?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    status?: string;
  };
  chapters: ChapterItem[];
  currentUser: {
    id: string;
    username: string;
    role: string;
    avatarUrl?: string | null;
  } | null;
  isAuthorized: boolean;
}

export default function SeriesDetailView({
  content,
  chapters,
  currentUser,
  isAuthorized,
}: SeriesDetailViewProps) {
  // Ensure we have at least one fallback chapter
  const defaultChapters: ChapterItem[] =
    chapters.length > 0
      ? chapters
      : [
          {
            id: `fallback-${content.id}`,
            chapterNumber: 1,
            title: `Chapter 1: The Beginning`,
            description: content.description,
            thumbnail: content.thumbnail,
            videoUrl: content.trailer,
            duration: content.duration || "45 min",
            published: true,
          },
        ];

  const [activeChapter, setActiveChapter] = useState<ChapterItem>(defaultChapters[0]);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(content.likes || 18);
  const [shareCopied, setShareCopied] = useState(false);
  const [theaterMode, setTheaterMode] = useState(false);

  // User Star Rating State
  const [userRating, setUserRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [ratingCount, setRatingCount] = useState<number>(1248);
  const [averageRating, setAverageRating] = useState<number>(4.9);
  const [hasRated, setHasRated] = useState<boolean>(false);
  const [ratingFeedback, setRatingFeedback] = useState<string | null>(null);

  // Dynamic Video Duration
  const [videoDuration, setVideoDuration] = useState<string>(activeChapter.duration || content.duration || "45 min");

  // Load saved rating from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`yorumuse_rating_${content.id}`);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 5) {
          setUserRating(parsed);
          setHasRated(true);
        }
      }
    }
  }, [content.id]);

  const handleRate = (stars: number) => {
    setUserRating(stars);
    setHasRated(true);
    if (typeof window !== "undefined") {
      localStorage.setItem(`yorumuse_rating_${content.id}`, stars.toString());
    }
    if (!hasRated) {
      setRatingCount((prev) => prev + 1);
      setAverageRating((prev) => {
        const newAvg = (prev * 1248 + stars) / 1249;
        return Math.round(newAvg * 10) / 10;
      });
    }
    setRatingFeedback(`Thank you! You rated ${stars} out of 5 stars.`);
    setTimeout(() => setRatingFeedback(null), 3500);
  };

  // Auto-detect video duration from video file metadata
  useEffect(() => {
    const videoUrlToProbe = isAuthorized
      ? (activeChapter.videoUrl || content.videoUrl || content.trailer)
      : (content.trailer || activeChapter.videoUrl);

    if (!videoUrlToProbe) return;

    const probe = document.createElement("video");
    probe.preload = "metadata";
    probe.src = videoUrlToProbe;

    const handleMeta = () => {
      const sec = probe.duration;
      if (sec && !isNaN(sec) && isFinite(sec)) {
        const mins = Math.floor(sec / 60);
        const remSecs = Math.floor(sec % 60);
        if (mins >= 60) {
          const hrs = Math.floor(mins / 60);
          const remMins = mins % 60;
          setVideoDuration(`${hrs} hr ${remMins} min`);
        } else if (mins > 0) {
          setVideoDuration(`${mins} min ${remSecs > 0 ? `${remSecs}s` : ""}`);
        } else {
          setVideoDuration(`${remSecs}s`);
        }
      }
    };

    probe.addEventListener("loadedmetadata", handleMeta);
    return () => {
      probe.removeEventListener("loadedmetadata", handleMeta);
      probe.src = "";
    };
  }, [activeChapter.id, activeChapter.videoUrl, content.videoUrl, content.trailer, isAuthorized]);

  // Comments state
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [spamError, setSpamError] = useState<string | null>(null);
  const [spamSuccess, setSpamSuccess] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const playerRef = useRef<HTMLDivElement>(null);
  const chaptersListRef = useRef<HTMLDivElement>(null);

  // Parse tags & specifications
  let tagList = ["Manhwa", "Romance", "Drama", "Exclusive", "Serialized"];
  let contentType = "Manhwa";
  let contentStatus = content.status || "Ongoing";
  let contentPostedBy = "Admin";

  if (content.tags) {
    try {
      const parsed = JSON.parse(content.tags);
      if (Array.isArray(parsed) && parsed.length > 0) {
        tagList = parsed;
      } else if (typeof parsed === "object" && parsed !== null) {
        if (Array.isArray(parsed.genres) && parsed.genres.length > 0) tagList = parsed.genres;
        if (parsed.type) contentType = parsed.type;
        if (parsed.status) contentStatus = parsed.status;
        if (parsed.postedBy) contentPostedBy = parsed.postedBy;
      }
    } catch {
      if (typeof content.tags === "string" && content.tags.trim()) {
        tagList = content.tags.split(",").map((s) => s.trim()).filter(Boolean);
      }
    }
  }

  // Sorted chapters
  const sortedChapters = [...defaultChapters].sort((a, b) =>
    sortOrder === "asc"
      ? a.chapterNumber - b.chapterNumber
      : b.chapterNumber - a.chapterNumber
  );

  // Current active chapter index
  const currentIndex = sortedChapters.findIndex((c) => c.id === activeChapter.id);
  const prevChapter = currentIndex > 0 ? sortedChapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < sortedChapters.length - 1 ? sortedChapters[currentIndex + 1] : null;

  // Fetch comments for active chapter
  const fetchComments = useCallback(async (chapterId: string) => {
    if (chapterId.startsWith("fallback-")) {
      setComments([]);
      return;
    }

    setLoadingComments(true);
    try {
      const res = await fetch(`/api/chapters/${chapterId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error("Error fetching chapter comments:", err);
    } finally {
      setLoadingComments(false);
    }
  }, []);

  useEffect(() => {
    fetchComments(activeChapter.id);
    setSpamError(null);
    setSpamSuccess(null);
  }, [activeChapter.id, fetchComments]);

  // Rate limit cooldown timer
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setTimeout(() => {
      setCooldownSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [cooldownSeconds]);

  const handleSelectChapter = (chapter: ChapterItem) => {
    setActiveChapter(chapter);
    if (playerRef.current) {
      playerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleToggleLike = () => {
    if (liked) {
      setLiked(false);
      setLikeCount((prev) => Math.max(0, prev - 1));
    } else {
      setLiked(true);
      setLikeCount((prev) => prev + 1);
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    }
  };

  const handleFullscreen = () => {
    if (playerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        playerRef.current.requestFullscreen();
      }
    }
  };

  const scrollToChapters = () => {
    if (chaptersListRef.current) {
      chaptersListRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setSpamError(null);
    setSpamSuccess(null);

    const trimmed = commentText.trim();
    if (trimmed.length < 3) {
      setSpamError("Comment is too short (minimum 3 characters).");
      return;
    }
    if (trimmed.length > 1000) {
      setSpamError("Comment exceeds the 1,000 character limit.");
      return;
    }

    setSubmittingComment(true);

    try {
      const res = await fetch(`/api/chapters/${activeChapter.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: trimmed,
          honeypot: honeypot,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSpamError(data.error || "Failed to post comment.");
        const match = data.error?.match(/(\d+)\s*(?:detik|seconds?)/);
        if (match && match[1]) {
          setCooldownSeconds(parseInt(match[1]));
        }
        return;
      }

      // Success
      setCommentText("");
      setSpamSuccess("Your comment has been published on this chapter!");
      setCooldownSeconds(15);
      if (data.comment) {
        setComments((prev) => [data.comment, ...prev]);
      } else {
        fetchComments(activeChapter.id);
      }
    } catch {
      setSpamError("An error occurred while posting your comment.");
    } finally {
      setSubmittingComment(false);
    }
  };

  const secureVideoUrl = isAuthorized
    ? activeChapter.videoUrl || content.trailer
    : null;

  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const postedOnDate = content.createdAt
    ? new Date(content.createdAt).toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "September 14, 2026";

  const updatedOnDate = content.updatedAt
    ? new Date(content.updatedAt).toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "September 15, 2026";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-base, #0a0a0e)", color: "var(--text-primary, #ffffff)" }}>
      {/* Theater Mode Dark Backdrop Overlay */}
      {theaterMode && (
        <div
          onClick={() => setTheaterMode(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.94)",
            zIndex: 900,
            cursor: "pointer",
            transition: "opacity 0.3s ease",
          }}
          title="Click anywhere to exit theater mode"
        />
      )}

      {/* 1. Top Recommended / Notice Bar (Gambar 2 Header Bar) */}
      <div
        style={{
          borderBottom: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))",
          backgroundColor: "var(--bg-surface, #101016)",
          padding: "10px 24px",
        }}
      >
        <div
          className="container"
          style={{
            maxWidth: "1040px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "0.84rem",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                backgroundColor: "var(--accent-gold, #d4af37)",
                color: "#000000",
                fontSize: "0.72rem",
                fontWeight: 800,
                padding: "3px 8px",
                borderRadius: "4px",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              RECOMMENDED
            </span>
            <span style={{ color: "var(--text-secondary, #d1d1d6)" }}>
              {content.title} — Exclusive Manhwa Series Adaptation
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)" }}>
            <Link href="/" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
              Home
            </Link>
            <span>/</span>
            <Link href="/browse?category=manhwa" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
              Manhwa
            </Link>
            <span>/</span>
            <span style={{ color: "var(--accent-gold)" }}>{content.title}</span>
          </div>
        </div>
      </div>

      {/* Main Container: Structured Sequentially (Gambar 2 & Gambar 3) */}
      <div className="container" style={{ maxWidth: "1040px", padding: "32px 20px 80px" }}>

        {/* ================= SECTION 1 (GAMBAR 2): DETAIL SERIAL & THUMBNAIL ================= */}
        <div
          style={{
            backgroundColor: "var(--bg-surface, #101016)",
            border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "var(--shadow-md, 0 4px 16px rgba(0,0,0,0.3))",
            marginBottom: "28px",
          }}
        >
          {/* Card Top Header: Title & Meta Views */}
          <div
            style={{
              padding: "16px 20px",
              backgroundColor: "rgba(255, 255, 255, 0.02)",
              borderBottom: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))",
            }}
          >
            <h1
              style={{
                fontSize: "clamp(1.25rem, 2.8vw, 1.65rem)",
                fontWeight: 800,
                color: "var(--text-primary, #ffffff)",
                margin: "0 0 8px 0",
                lineHeight: 1.3,
              }}
            >
              {content.title}: Chapter {activeChapter.chapterNumber}
            </h1>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                fontSize: "0.82rem",
                color: "var(--text-muted, #8a8a93)",
                flexWrap: "wrap",
              }}
            >
              <span>{(content.views || 14200).toLocaleString()} views</span>
              <span>•</span>
              <span>{formattedDate}</span>
              <span>•</span>
              {/* Interactive User Star Rating */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                }}
                title="Rate this title"
              >
                <div style={{ display: "inline-flex", gap: "2px" }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRate(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        cursor: "pointer",
                        color: ((hoverRating || userRating || 5) >= star) ? "var(--accent-gold, #d4af37)" : "rgba(255, 255, 255, 0.25)",
                        fontSize: "0.95rem",
                        lineHeight: 1,
                        transition: "color 0.15s ease",
                      }}
                      title={`Rate ${star} stars`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <span style={{ fontWeight: 700, color: "var(--accent-gold, #d4af37)" }}>
                  {averageRating.toFixed(1)}
                </span>
                <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
                  ({ratingCount.toLocaleString()})
                </span>
              </div>
              <span>•</span>
              <button
                onClick={handleToggleLike}
                style={{
                  background: "none",
                  border: "none",
                  color: liked ? "var(--accent-gold)" : "var(--text-muted)",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "0.82rem",
                  padding: 0,
                  fontWeight: 600,
                }}
              >
                <span>{likeCount} Likes</span>
              </button>
              <span>•</span>
              <button
                onClick={handleShare}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: "0.82rem",
                  padding: 0,
                  fontWeight: 600,
                }}
              >
                {shareCopied ? "Link Copied" : "Share"}
              </button>
            </div>

            {ratingFeedback && (
              <div
                style={{
                  marginTop: "8px",
                  padding: "4px 10px",
                  backgroundColor: "rgba(212, 175, 55, 0.12)",
                  border: "1px solid rgba(212, 175, 55, 0.35)",
                  borderRadius: "6px",
                  color: "var(--accent-gold, #d4af37)",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                <span>{ratingFeedback}</span>
              </div>
            )}
          </div>

          {/* Center: Featured Thumbnail / Preview Banner */}
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "680px",
              margin: "24px auto 16px",
              aspectRatio: "16 / 9",
              borderRadius: "10px",
              overflow: "hidden",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.6)",
              backgroundColor: "#000000",
              border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))",
            }}
          >
            <img
              src={activeChapter.thumbnail || content.thumbnail}
              alt={`${content.title} Chapter ${activeChapter.chapterNumber}`}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>

          {/* Structured Info Block (Gambar 2 Detail Table) */}
          <div style={{ padding: "16px 24px 24px" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                fontSize: "0.92rem",
                lineHeight: 1.6,
              }}
            >
              {/* Synopsis */}
              <div style={{ paddingBottom: "10px", borderBottom: "1px solid var(--border-subtle, rgba(255,255,255,0.06))" }}>
                <span style={{ color: "var(--accent-gold, #d4af37)", fontWeight: 800, marginRight: "8px", textTransform: "uppercase", fontSize: "0.85rem", letterSpacing: "0.05em" }}>
                  SYNOPSIS :
                </span>
                <span style={{ color: "var(--text-secondary, #d1d1d6)" }}>
                  {activeChapter.description || content.description}
                </span>
              </div>

              {/* Genre */}
              <div style={{ paddingBottom: "10px", borderBottom: "1px solid var(--border-subtle, rgba(255,255,255,0.06))" }}>
                <span style={{ color: "var(--accent-gold, #d4af37)", fontWeight: 800, marginRight: "8px", textTransform: "uppercase", fontSize: "0.85rem", letterSpacing: "0.05em" }}>
                  GENRE :
                </span>
                <span style={{ color: "var(--text-secondary, #d1d1d6)" }}>
                  {tagList.join(", ")}
                </span>
              </div>

              {/* Type (menggantikan Seri Manhwa) */}
              <div style={{ paddingBottom: "10px", borderBottom: "1px solid var(--border-subtle, rgba(255,255,255,0.06))" }}>
                <span style={{ color: "var(--accent-gold, #d4af37)", fontWeight: 800, marginRight: "8px", textTransform: "uppercase", fontSize: "0.85rem", letterSpacing: "0.05em" }}>
                  TYPE :
                </span>
                <span style={{ color: "var(--text-primary, #ffffff)", fontWeight: 600 }}>
                  {contentType}
                </span>
              </div>

              {/* Status */}
              <div style={{ paddingBottom: "10px", borderBottom: "1px solid var(--border-subtle, rgba(255,255,255,0.06))", display: "flex", alignItems: "center" }}>
                <span style={{ color: "var(--accent-gold, #d4af37)", fontWeight: 800, marginRight: "8px", textTransform: "uppercase", fontSize: "0.85rem", letterSpacing: "0.05em" }}>
                  STATUS :
                </span>
                <span style={{ color: "#10b981", fontWeight: 700, fontSize: "0.9rem" }}>
                  {contentStatus}
                </span>
              </div>

              {/* Posted By (menggantikan Studio / Produsen) */}
              <div style={{ paddingBottom: "10px", borderBottom: "1px solid var(--border-subtle, rgba(255,255,255,0.06))" }}>
                <span style={{ color: "var(--accent-gold, #d4af37)", fontWeight: 800, marginRight: "8px", textTransform: "uppercase", fontSize: "0.85rem", letterSpacing: "0.05em" }}>
                  POSTED BY :
                </span>
                <span style={{ color: "var(--text-secondary, #d1d1d6)" }}>
                  {contentPostedBy}
                </span>
              </div>

              {/* Posted On */}
              <div style={{ paddingBottom: "10px", borderBottom: "1px solid var(--border-subtle, rgba(255,255,255,0.06))" }}>
                <span style={{ color: "var(--accent-gold, #d4af37)", fontWeight: 800, marginRight: "8px", textTransform: "uppercase", fontSize: "0.85rem", letterSpacing: "0.05em" }}>
                  POSTED ON :
                </span>
                <span style={{ color: "var(--text-secondary, #d1d1d6)" }}>
                  {postedOnDate}
                </span>
              </div>

              {/* Updated On */}
              <div style={{ paddingBottom: "10px", borderBottom: "1px solid var(--border-subtle, rgba(255,255,255,0.06))" }}>
                <span style={{ color: "var(--accent-gold, #d4af37)", fontWeight: 800, marginRight: "8px", textTransform: "uppercase", fontSize: "0.85rem", letterSpacing: "0.05em" }}>
                  UPDATED ON :
                </span>
                <span style={{ color: "var(--text-secondary, #d1d1d6)" }}>
                  {updatedOnDate}
                </span>
              </div>

              {/* User Rating (Star Rating) */}
              <div style={{ paddingBottom: "10px", borderBottom: "1px solid var(--border-subtle, rgba(255,255,255,0.06))", display: "flex", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <span style={{ color: "var(--accent-gold, #d4af37)", fontWeight: 800, marginRight: "8px", textTransform: "uppercase", fontSize: "0.85rem", letterSpacing: "0.05em" }}>
                  RATING :
                </span>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ display: "inline-flex", gap: "3px" }}>
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isFilled = (hoverRating || userRating || 5) >= star;
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleRate(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          style={{
                            background: "none",
                            border: "none",
                            padding: "0 2px",
                            cursor: "pointer",
                            fontSize: "1.25rem",
                            color: isFilled ? "#eab308" : "rgba(255, 255, 255, 0.25)",
                            transform: (hoverRating === star || userRating === star) ? "scale(1.18)" : "scale(1)",
                            transition: "all 0.15s ease",
                            lineHeight: 1,
                          }}
                          title={`Rate ${star} out of 5 stars`}
                        >
                          ★
                        </button>
                      );
                    })}
                  </div>
                  <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.92rem" }}>
                    {averageRating.toFixed(1)} / 5.0
                  </span>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    ({ratingCount.toLocaleString()} reviews)
                  </span>
                  {hasRated && (
                    <span style={{ fontSize: "0.72rem", backgroundColor: "rgba(212, 175, 55, 0.15)", color: "var(--accent-gold, #d4af37)", padding: "2px 8px", borderRadius: "4px", fontWeight: 700 }}>
                      Your Rating: {userRating}/5
                    </span>
                  )}
                </div>
              </div>

              {/* Durasi (Menyesuaikan Video) */}
              <div>
                <span style={{ color: "var(--accent-gold, #d4af37)", fontWeight: 800, marginRight: "8px", textTransform: "uppercase", fontSize: "0.85rem", letterSpacing: "0.05em" }}>
                  DURATION :
                </span>
                <span style={{ color: "var(--text-secondary, #d1d1d6)" }}>
                  {videoDuration}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Jump Bar ke Daftar Chapter */}
          <button
            onClick={scrollToChapters}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 20px",
              backgroundColor: "rgba(212, 175, 55, 0.08)",
              border: "none",
              borderTop: "1px solid rgba(212, 175, 55, 0.25)",
              color: "var(--accent-gold, #d4af37)",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontWeight: 700,
              transition: "background-color 0.2s ease",
            }}
          >
            <div>
              <span>SERIES: {content.title} ({sortedChapters.length} Chapters Available)</span>
            </div>
            <span>View All Chapters</span>
          </button>
        </div>


        {/* ================= SECTION 2 (GAMBAR 3): STREAMING PEMUTAR VIDEO ================= */}
        <div
          ref={playerRef}
          style={{
            backgroundColor: "var(--bg-surface, #101016)",
            border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "var(--shadow-lg, 0 8px 32px rgba(0,0,0,0.4))",
            marginBottom: "28px",
            position: "relative",
            zIndex: theaterMode ? 950 : "auto",
          }}
        >
          {/* Bar Header "STREAMING" (Gambar 3) */}
          <div
            style={{
              padding: "12px 20px",
              backgroundColor: "#161622",
              borderBottom: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span
                style={{
                  fontSize: "0.95rem",
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  color: "#ffffff",
                  textTransform: "uppercase",
                }}
              >
                STREAMING
              </span>
              <span
                style={{
                  fontSize: "0.74rem",
                  color: "var(--accent-gold)",
                  backgroundColor: "rgba(212, 175, 55, 0.15)",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  fontWeight: 700,
                }}
              >
                Chapter {activeChapter.chapterNumber}
              </span>
            </div>

            {/* Controls: Theater Mode & Fullscreen */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                onClick={() => setTheaterMode(!theaterMode)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "6px",
                  backgroundColor: theaterMode ? "var(--accent-gold, #d4af37)" : "rgba(255, 255, 255, 0.08)",
                  color: theaterMode ? "#000000" : "#ffffff",
                  border: "1px solid var(--border-subtle)",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {theaterMode ? "Turn On Lights" : "Theater Mode"}
              </button>

              <button
                onClick={handleFullscreen}
                style={{
                  padding: "6px 14px",
                  borderRadius: "6px",
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                  color: "#ffffff",
                  border: "1px solid var(--border-subtle)",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Fullscreen
              </button>
            </div>
          </div>

          {/* Video Player Display */}
          {isAuthorized ? (
            <div style={{ position: "relative", width: "100%", backgroundColor: "#000000" }}>
              <ContentPlayerClient
                key={activeChapter.id}
                videoUrl={secureVideoUrl!}
                poster={activeChapter.thumbnail || content.thumbnail}
                title={`${content.title} - Chapter ${activeChapter.chapterNumber}: ${activeChapter.title}`}
                onDurationLoaded={(dur) => setVideoDuration(dur)}
              />
            </div>
          ) : (
            /* Member Lock Gate (Full video requires subscription) */
            <div
              style={{
                padding: "60px 24px",
                textAlign: "center",
                backgroundColor: "#0e0e14",
                borderTop: "1px solid var(--border-subtle)",
                borderBottom: "1px solid var(--border-subtle)",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(212, 175, 55, 0.12)",
                  border: "1px solid rgba(212, 175, 55, 0.4)",
                  color: "var(--accent-gold)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h3
                style={{
                  fontSize: "1.35rem",
                  fontWeight: 800,
                  color: "var(--text-primary, #ffffff)",
                  marginBottom: "8px",
                }}
              >
                Exclusive Member Content
              </h3>
              <p
                style={{
                  color: "var(--text-secondary, #d1d1d6)",
                  maxWidth: "500px",
                  margin: "0 auto 24px",
                  fontSize: "0.92rem",
                  lineHeight: 1.6,
                }}
              >
                To watch the full video of Chapter {activeChapter.chapterNumber} in unlimited 4K HDR quality, please become a Member.
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
                <Link
                  href="/membership"
                  className="btn btn-primary"
                  style={{ padding: "12px 28px", fontSize: "0.95rem", fontWeight: 700 }}
                >
                  Subscribe Now (VIP Member)
                </Link>
                {!currentUser && (
                  <Link
                    href={`/login?redirect=/content/${content.slug}`}
                    className="btn btn-secondary"
                    style={{ padding: "12px 24px", fontSize: "0.95rem" }}
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Episode Navigation Buttons (Gambar 3 Previous/Next Navigation) */}
          <div
            style={{
              padding: "14px 20px",
              backgroundColor: "rgba(255, 255, 255, 0.02)",
              borderTop: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            {prevChapter ? (
              <button
                onClick={() => handleSelectChapter(prevChapter)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "background-color 0.2s ease",
                }}
              >
                <span>Chapter {prevChapter.chapterNumber} (Previous)</span>
              </button>
            ) : (
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                First Chapter
              </div>
            )}

            <div style={{ fontSize: "0.85rem", color: "var(--accent-gold)", fontWeight: 700 }}>
              Chapter {activeChapter.chapterNumber} of {sortedChapters.length}
            </div>

            {nextChapter ? (
              <button
                onClick={() => handleSelectChapter(nextChapter)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(212, 175, 55, 0.15)",
                  border: "1px solid rgba(212, 175, 55, 0.4)",
                  color: "var(--accent-gold)",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "background-color 0.2s ease",
                }}
              >
                <span>Chapter {nextChapter.chapterNumber} (Next)</span>
              </button>
            ) : (
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Latest Chapter
              </div>
            )}
          </div>
        </div>


        {/* ================= SECTION 3 (GAMBAR 3): DAFTAR SEMUA CHAPTER ================= */}
        <div
          ref={chaptersListRef}
          style={{
            backgroundColor: "var(--bg-surface, #101016)",
            border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "var(--shadow-md)",
            marginBottom: "28px",
          }}
        >
          {/* Header Panel Daftar Chapter */}
          <div
            style={{
              padding: "14px 20px",
              backgroundColor: "rgba(255, 255, 255, 0.02)",
              borderBottom: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span>CHAPTER LIST</span>
                <span
                  style={{
                    fontSize: "0.78rem",
                    backgroundColor: "var(--accent-gold)",
                    color: "#000000",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    fontWeight: 800,
                  }}
                >
                  {sortedChapters.length} Total
                </span>
              </h2>
            </div>

            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              style={{
                background: "none",
                border: "1px solid var(--border-subtle)",
                borderRadius: "6px",
                padding: "6px 12px",
                color: "var(--text-secondary)",
                fontSize: "0.78rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span>Sort: {sortOrder === "asc" ? "Oldest First" : "Newest First"}</span>
            </button>
          </div>

          {/* Chapters Grid / List */}
          <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {sortedChapters.map((chapter) => {
              const isActive = activeChapter.id === chapter.id;

              return (
                <div
                  key={chapter.id}
                  onClick={() => handleSelectChapter(chapter)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    backgroundColor: isActive ? "rgba(212, 175, 55, 0.12)" : "rgba(255, 255, 255, 0.02)",
                    border: `1px solid ${isActive ? "var(--accent-gold, #d4af37)" : "var(--border-subtle, rgba(255, 255, 255, 0.06))"}`,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  className="chapter-select-card"
                >
                  {/* Thumbnail on left */}
                  <div
                    style={{
                      position: "relative",
                      width: "84px",
                      height: "56px",
                      borderRadius: "6px",
                      overflow: "hidden",
                      flexShrink: 0,
                      backgroundColor: "#0a0a0e",
                    }}
                  >
                    <img
                      src={chapter.thumbnail || content.thumbnail}
                      alt={chapter.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                    {isActive && (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          backgroundColor: "rgba(0, 0, 0, 0.5)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--accent-gold)",
                        }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="6 4 20 12 6 20 6 4" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Title & Duration */}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: "0.92rem",
                        fontWeight: 700,
                        color: isActive ? "var(--accent-gold, #d4af37)" : "var(--text-primary, #ffffff)",
                        marginBottom: "4px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      Chapter {chapter.chapterNumber}: {chapter.title}
                    </div>
                    <div style={{ fontSize: "0.76rem", color: "var(--text-muted, #8a8a93)" }}>
                      Duration: {chapter.duration || "45 min"} • {chapter._count?.comments || 0} comments
                    </div>
                  </div>

                  {/* Badge: Now Playing or Select Chapter */}
                  <div>
                    {isActive ? (
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 800,
                          backgroundColor: "var(--accent-gold, #d4af37)",
                          color: "#000000",
                          padding: "4px 10px",
                          borderRadius: "4px",
                          letterSpacing: "0.04em",
                        }}
                      >
                        NOW PLAYING
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: "0.74rem",
                          fontWeight: 700,
                          color: "var(--text-secondary)",
                          padding: "4px 8px",
                        }}
                      >
                        Select Chapter
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>


        {/* ================= SECTION 4: DISCUSSION & COMMENTS ================= */}
        <div
          style={{
            backgroundColor: "var(--bg-surface, #101016)",
            border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "var(--shadow-md)",
            padding: "24px 20px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
              paddingBottom: "12px",
              borderBottom: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))",
            }}
          >
            <h3 style={{ fontSize: "1.1rem", color: "var(--text-primary)", fontWeight: 800, margin: 0 }}>
              Chapter {activeChapter.chapterNumber} Discussion ({comments.length})
            </h3>
            <span
              style={{
                fontSize: "0.74rem",
                color: "var(--accent-gold)",
                backgroundColor: "rgba(212, 175, 55, 0.12)",
                padding: "2px 8px",
                borderRadius: "4px",
                fontWeight: 700,
              }}
            >
              Viewer Community
            </span>
          </div>

          {/* Comment Form OR Mandatory Login Prompt */}
          {currentUser ? (
            <form onSubmit={handleSubmitComment} style={{ marginBottom: "28px" }}>
              {spamError && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    backgroundColor: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#b91c1c",
                    fontSize: "0.86rem",
                    fontWeight: 600,
                    marginBottom: "12px",
                  }}
                >
                  {spamError}
                </div>
              )}

              {spamSuccess && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    backgroundColor: "#ecfdf5",
                    border: "1px solid #a7f3d0",
                    color: "#065f46",
                    fontSize: "0.86rem",
                    fontWeight: 600,
                    marginBottom: "12px",
                  }}
                >
                  {spamSuccess}
                </div>
              )}

              <div style={{ display: "flex", gap: "14px" }}>
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "50%",
                    backgroundColor: "var(--accent-gold)",
                    color: "#000000",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: "1rem",
                    flexShrink: 0,
                  }}
                >
                  {currentUser.username[0].toUpperCase()}
                </div>

                <div style={{ flexGrow: 1 }}>
                  <input
                    type="text"
                    name="website_honeypot"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    tabIndex={-1}
                    style={{ display: "none" }}
                  />

                  <textarea
                    rows={2}
                    required
                    placeholder={`Write your thoughts or review about Chapter ${activeChapter.chapterNumber}...`}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    maxLength={1000}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "8px",
                      border: "1px solid var(--border-medium, rgba(255, 255, 255, 0.15))",
                      backgroundColor: "var(--bg-base, #0a0a0e)",
                      color: "var(--text-primary, #ffffff)",
                      fontSize: "0.92rem",
                      resize: "vertical",
                    }}
                  />

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: "6px",
                      fontSize: "0.76rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    <span>
                      {cooldownSeconds > 0
                        ? `Anti-spam cooldown: ${cooldownSeconds}s`
                        : "Limit 1 comment per 15 seconds"}
                    </span>
                    <span>{commentText.length} / 1000</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
                    <button
                      type="submit"
                      disabled={submittingComment || commentText.trim().length < 3 || cooldownSeconds > 0}
                      className="btn btn-primary btn-sm"
                      style={{ padding: "6px 18px", fontWeight: 700 }}
                    >
                      {submittingComment ? "Submitting..." : "Post Comment"}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            /* Mandatory Login Card */
            <div
              style={{
                padding: "16px 20px",
                borderRadius: "10px",
                backgroundColor: "rgba(212, 175, 55, 0.08)",
                border: "1px solid rgba(212, 175, 55, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "14px",
                marginBottom: "24px",
              }}
            >
              <div>
                <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "2px" }}>
                  Sign In Required to Comment
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  Sign in to join the discussion with other viewers on this chapter.
                </div>
              </div>

              <Link
                href={`/login?redirect=/content/${content.slug}`}
                className="btn btn-primary btn-sm"
                style={{ padding: "8px 18px", fontWeight: 700 }}
              >
                Sign In
              </Link>
            </div>
          )}

          {/* Comments List */}
          {loadingComments ? (
            <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "20px" }}>
              Loading comments...
            </div>
          ) : comments.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "24px 0", fontSize: "0.88rem" }}>
              No comments on this chapter yet. Be the first to comment!
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {comments.map((comm) => (
                <div
                  key={comm.id}
                  style={{
                    padding: "14px 16px",
                    borderRadius: "10px",
                    backgroundColor: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid var(--border-subtle, rgba(255, 255, 255, 0.06))",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <strong style={{ fontSize: "0.88rem", color: "var(--text-primary)" }}>
                        {comm.author.username}
                      </strong>
                      <span
                        style={{
                          fontSize: "0.66rem",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          backgroundColor: "rgba(212, 175, 55, 0.15)",
                          color: "var(--accent-gold)",
                          fontWeight: 700,
                        }}
                      >
                        {comm.author.role}
                      </span>
                    </div>
                    <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                      {new Date(comm.createdAt).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", margin: 0, lineHeight: 1.55 }}>
                    {comm.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      <style jsx>{`
        .chapter-select-card:hover {
          background-color: rgba(255, 255, 255, 0.06) !important;
          border-color: var(--accent-gold) !important;
          transform: translateX(4px);
        }
      `}</style>
    </div>
  );
}
