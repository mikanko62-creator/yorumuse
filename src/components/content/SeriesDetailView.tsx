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
    duration?: string | null;
    releaseYear?: number;
    likes?: number;
    tags?: string | null;
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
            title: `Chapter 1: ${content.title}`,
            description: content.description,
            thumbnail: content.thumbnail,
            videoUrl: content.trailer,
            duration: content.duration || "45 min",
            published: true,
          },
        ];

  const [activeChapter, setActiveChapter] = useState<ChapterItem>(defaultChapters[0]);
  const [isPlayingEpisode, setIsPlayingEpisode] = useState(false);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(content.likes || 18);
  const [shareCopied, setShareCopied] = useState(false);

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

  // Parse tags
  let tagList = ["Romantasy", "Historical", "Cinematic Noir", "Steamy", "Exclusive", "4K Master"];
  if (content.tags) {
    try {
      const parsed = JSON.parse(content.tags);
      if (Array.isArray(parsed) && parsed.length > 0) tagList = parsed;
    } catch {
      // fallback
    }
  }

  // Sorted chapters
  const sortedChapters = [...defaultChapters].sort((a, b) =>
    sortOrder === "asc"
      ? a.chapterNumber - b.chapterNumber
      : b.chapterNumber - a.chapterNumber
  );

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
    setIsPlayingEpisode(true);
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

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setSpamError(null);
    setSpamSuccess(null);

    const trimmed = commentText.trim();
    if (trimmed.length < 3) {
      setSpamError("Komentar terlalu pendek (minimal 3 karakter).");
      return;
    }
    if (trimmed.length > 1000) {
      setSpamError("Komentar melebihi batas 1.000 karakter.");
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
        setSpamError(data.error || "Gagal mengirim komentar.");
        const match = data.error?.match(/(\d+)\s*detik/);
        if (match && match[1]) {
          setCooldownSeconds(parseInt(match[1]));
        }
        return;
      }

      // Success
      setCommentText("");
      setSpamSuccess("Komentar Anda berhasil dipublikasikan di chapter ini!");
      setCooldownSeconds(15);
      if (data.comment) {
        setComments((prev) => [data.comment, ...prev]);
      } else {
        fetchComments(activeChapter.id);
      }
    } catch {
      setSpamError("Terjadi kendala saat mengirimkan komentar.");
    } finally {
      setSubmittingComment(false);
    }
  };

  const secureVideoUrl = isAuthorized
    ? activeChapter.videoUrl || content.trailer
    : null;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}>
      {/* Top Breadcrumb Header Bar */}
      <div
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          backgroundColor: "var(--bg-surface)",
          padding: "14px 24px",
        }}
      >
        <div
          className="container"
          style={{
            maxWidth: "1240px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "0.86rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)" }}>
            <Link href="/" style={{ color: "var(--text-secondary)", textDecoration: "none", fontWeight: 500 }}>
              Home
            </Link>
            <span>/</span>
            <Link href="/browse" style={{ color: "var(--text-secondary)", textDecoration: "none", fontWeight: 500 }}>
              Series
            </Link>
            <span>/</span>
            <span style={{ color: "var(--accent-gold)", fontWeight: 700 }}>{content.title}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                fontSize: "0.74rem",
                color: "#991b1b",
                backgroundColor: "#fee2e2",
                border: "1px solid #fecaca",
                padding: "2px 8px",
                borderRadius: "4px",
                fontWeight: 700,
                letterSpacing: "0.06em",
              }}
            >
              18+ MATURE CONTENT
            </span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Content Layout (Light Mode Architecture) */}
      <div className="container" style={{ maxWidth: "1240px", padding: "40px 24px 80px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "48px",
            alignItems: "start",
          }}
        >
          {/* ================= LEFT COLUMN: POSTER & SERIES INFO ================= */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px", position: "sticky", top: "100px" }}>
            {/* Big Series Cover Image */}
            <div
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "1 / 1",
                maxWidth: "380px",
                borderRadius: "16px",
                overflow: "hidden",
                border: "1px solid var(--border-subtle)",
                boxShadow: "var(--shadow-lg)",
                backgroundColor: "var(--bg-surface-elevated)",
              }}
            >
              <img
                src={content.thumbnail}
                alt={content.title}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(180deg, transparent 60%, rgba(17, 24, 39, 0.75) 100%)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: "16px",
                  left: "16px",
                  right: "16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    backgroundColor: "rgba(17, 24, 39, 0.85)",
                    backdropFilter: "blur(8px)",
                    color: "#fef3c7",
                    padding: "4px 12px",
                    borderRadius: "20px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    border: "1px solid rgba(212, 175, 55, 0.4)",
                  }}
                >
                  {content.accessLevel === "PUBLIC" ? "FREE ACCESS" : `${content.accessLevel} EXCLUSIVE`}
                </span>
                <span style={{ fontSize: "0.78rem", color: "#f3f4f6", fontWeight: 600 }}>
                  {defaultChapters.length} Chapters
                </span>
              </div>
            </div>

            {/* Badges & Meta */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    padding: "3px 8px",
                    borderRadius: "4px",
                    backgroundColor: "#fee2e2",
                    color: "#991b1b",
                    border: "1px solid #fecaca",
                  }}
                >
                  18+
                </span>
                <span style={{ fontSize: "0.84rem", color: "var(--text-muted)", fontWeight: 600 }}>
                  {content.category} • Cinematic Romance
                </span>
              </div>

              <h1
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "clamp(1.9rem, 3vw, 2.4rem)",
                  color: "var(--text-primary)",
                  lineHeight: 1.2,
                  marginBottom: "8px",
                  fontWeight: 700,
                }}
              >
                {content.title}
              </h1>

              <div style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "18px" }}>
                By <strong style={{ color: "var(--text-primary)" }}>YoruMuse Studios</strong>, Curated Direction
              </div>

              {/* Action Buttons: Like, Share, Bookmark */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "22px" }}>
                <button
                  onClick={handleToggleLike}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 16px",
                    borderRadius: "20px",
                    backgroundColor: liked ? "var(--accent-gold-surface)" : "var(--bg-surface)",
                    border: liked ? "1px solid var(--accent-gold)" : "1px solid var(--border-medium)",
                    color: liked ? "var(--accent-gold)" : "var(--text-primary)",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    boxShadow: "var(--shadow-sm)",
                    transition: "all 0.2s ease",
                  }}
                >
                  
                  <span>{likeCount}</span>
                </button>

                <button
                  onClick={() => setIsBookmarked(!isBookmarked)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 16px",
                    borderRadius: "20px",
                    backgroundColor: isBookmarked ? "var(--accent-gold-surface)" : "var(--bg-surface)",
                    border: isBookmarked ? "1px solid var(--accent-gold)" : "1px solid var(--border-medium)",
                    color: isBookmarked ? "var(--accent-gold)" : "var(--text-primary)",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <span>{isBookmarked ? "Tersimpan" : "+ Simpan"}</span>
                  <span>{isBookmarked ? "Disimpan" : "Simpan"}</span>
                </button>

                <button
                  onClick={handleShare}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 16px",
                    borderRadius: "20px",
                    backgroundColor: "var(--bg-surface)",
                    border: "1px solid var(--border-medium)",
                    color: "var(--text-primary)",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <span>Bagikan</span>
                  <span>{shareCopied ? "Disalin!" : "Bagikan"}</span>
                </button>
              </div>

              {/* Synopsis */}
              <p
                style={{
                  fontSize: "0.94rem",
                  lineHeight: 1.7,
                  color: "var(--text-secondary)",
                  marginBottom: "26px",
                }}
              >
                {content.description}
              </p>

              {/* Tags Section */}
              <div>
                <h4 style={{ fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px", fontWeight: 700 }}>
                  Tags
                </h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {tagList.map((tag, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: "5px 12px",
                        borderRadius: "20px",
                        backgroundColor: "var(--bg-surface)",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--text-secondary)",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        boxShadow: "var(--shadow-sm)",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: EPISODES & PLAYER ================= */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }} ref={playerRef}>
            {/* Header: Episodes Count & Top Actions */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid var(--border-subtle)",
                paddingBottom: "16px",
              }}
            >
              <div>
                <h2
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "1.65rem",
                    color: "var(--text-primary)",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    fontWeight: 700,
                  }}
                >
                  <span>Episodes</span>
                  <span style={{ color: "var(--accent-gold)", fontWeight: 800 }}>
                    {defaultChapters.length}
                  </span>
                </h2>
                <div style={{ fontSize: "0.84rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  Setiap Chapter memuat tayangan video resolusi 4K & forum diskusi
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "7px 14px",
                    borderRadius: "8px",
                    backgroundColor: "var(--bg-surface)",
                    border: "1px solid var(--border-medium)",
                    color: "var(--text-primary)",
                    fontSize: "0.82rem",
                    cursor: "pointer",
                    fontWeight: 700,
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <span>⇅</span>
                  <span>{sortOrder === "asc" ? "Terlama" : "Terbaru"}</span>
                </button>
              </div>
            </div>

            {/* Schedule & Membership Info Bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                fontSize: "0.84rem",
                color: "var(--text-muted)",
                flexWrap: "wrap",
                fontWeight: 500,
              }}
            >
              <span style={{ color: "var(--status-success)", fontWeight: 800 }}>● Update Mingguan</span>
              <span>•</span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span>Included in</span>
                <strong style={{ color: "var(--accent-gold)", fontWeight: 800 }}>YoruMuse Membership</strong>
              </span>
              <span>•</span>
              <span style={{ color: "#2563eb", fontWeight: 600 }}>Bebas Nonton Chapter Publik</span>
            </div>

            {/* Luxury Membership Banner */}
            <Link
              href="/membership"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "18px 22px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #1c1917 0%, #292524 100%)",
                border: "1px solid rgba(166, 124, 30, 0.4)",
                color: "#ffffff",
                textDecoration: "none",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                
                <div>
                  <div style={{ fontSize: "0.96rem", fontWeight: 700, color: "#ffffff" }}>
                    Watch in 4K Ultra HD with Membership
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#d6d3d1", marginTop: "2px" }}>
                    Buka seluruh adegan tanpa sensor, kecepatan stream maksimal & akses VIP
                  </div>
                </div>
              </div>
              <span
                style={{
                  fontSize: "0.84rem",
                  fontWeight: 800,
                  color: "#1c1917",
                  padding: "8px 16px",
                  borderRadius: "20px",
                  backgroundColor: "#fef3c7",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                  flexShrink: 0,
                }}
              >
                Join Club →
              </span>
            </Link>

            {/* ACTIVE VIDEO PLAYER & CHAPTER COMMENTS AREA */}
            {isPlayingEpisode && (
              <div
                style={{
                  borderRadius: "16px",
                  backgroundColor: "var(--bg-surface)",
                  border: "2px solid var(--accent-gold)",
                  overflow: "hidden",
                  boxShadow: "var(--shadow-lg)",
                  marginBottom: "16px",
                }}
              >
                {/* Player Top Bar */}
                <div
                  style={{
                    padding: "14px 20px",
                    backgroundColor: "var(--bg-surface-elevated)",
                    borderBottom: "1px solid var(--border-subtle)",
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
                        padding: "3px 8px",
                        borderRadius: "4px",
                        backgroundColor: "var(--accent-gold)",
                        color: "#ffffff",
                        fontSize: "0.72rem",
                        fontWeight: 800,
                      }}
                    >
                      EPISODE {activeChapter.chapterNumber}
                    </span>
                    <h3 style={{ fontSize: "1.1rem", color: "var(--text-primary)", margin: 0, fontWeight: 700 }}>
                      {activeChapter.title}
                    </h3>
                  </div>

                  <button
                    onClick={() => setIsPlayingEpisode(false)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      fontSize: "0.82rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontWeight: 600,
                    }}
                  >
                    <span>Tutup Pemutar</span>
                  </button>
                </div>

                {/* Video Component */}
                {isAuthorized ? (
                  <div style={{ position: "relative", width: "100%", backgroundColor: "#000000" }}>
                    <ContentPlayerClient
                      key={activeChapter.id}
                      videoUrl={secureVideoUrl!}
                      poster={activeChapter.thumbnail || content.thumbnail}
                      title={`${content.title} - ${activeChapter.title}`}
                    />
                  </div>
                ) : (
                  /* Unauthorized Gate */
                  <div
                    style={{
                      padding: "48px 24px",
                      textAlign: "center",
                      backgroundColor: "var(--bg-surface)",
                    }}
                  >
                    
                    <h3 style={{ fontSize: "1.4rem", color: "var(--text-primary)", marginBottom: "8px", fontWeight: 700 }}>
                      Episode Ini Memerlukan Akses Member
                    </h3>
                    <p style={{ color: "var(--text-secondary)", maxWidth: "480px", margin: "0 auto 24px", fontSize: "0.92rem", lineHeight: 1.6 }}>
                      &ldquo;{activeChapter.title}&rdquo; termasuk dalam paket member eksklusif. Bergabunglah untuk langsung menonton.
                    </p>
                    <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
                      <Link href="/membership" className="btn btn-primary">
                        Become a Member
                      </Link>
                      {!currentUser && (
                        <Link href={`/login?redirect=/content/${content.slug}`} className="btn btn-secondary">
                          Sign In
                        </Link>
                      )}
                    </div>
                  </div>
                )}

                {/* Chapter Comments Section right under the video */}
                <div style={{ padding: "28px 24px", backgroundColor: "var(--bg-surface)" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "20px",
                    }}
                  >
                    <h4 style={{ fontSize: "1.1rem", color: "var(--text-primary)", fontWeight: 700, margin: 0 }}>
                      Diskusi Chapter {activeChapter.chapterNumber} ({comments.length})
                    </h4>
                    <span
                      style={{
                        fontSize: "0.76rem",
                        color: "var(--accent-gold)",
                        fontWeight: 700,
                        backgroundColor: "var(--accent-gold-surface)",
                        padding: "3px 10px",
                        borderRadius: "12px",
                        border: "1px solid var(--accent-gold-glow)",
                      }}
                    >
                      Anti-Spam Protected
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
                            color: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: "1rem",
                            flexShrink: 0,
                            boxShadow: "var(--shadow-sm)",
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
                            placeholder={`Tulis pandangan atau ulasan mengenai Chapter ${activeChapter.chapterNumber}...`}
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            maxLength={1000}
                            style={{
                              width: "100%",
                              padding: "12px 14px",
                              borderRadius: "8px",
                              border: "1px solid var(--border-medium)",
                              backgroundColor: "var(--bg-base)",
                              color: "var(--text-primary)",
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
                                ? `⏳ Cooldown anti-spam: ${cooldownSeconds} detik`
                                : "Batas 1 komentar per 15 detik"}
                            </span>
                            <span>{commentText.length} / 1000</span>
                          </div>

                          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
                            <button
                              type="submit"
                              disabled={submittingComment || commentText.trim().length < 3 || cooldownSeconds > 0}
                              className="btn btn-primary btn-sm"
                              style={{ padding: "6px 18px" }}
                            >
                              {submittingComment ? "Mengirim..." : "Kirim Komentar"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </form>
                  ) : (
                    /* Mandatory Login Card */
                    <div
                      style={{
                        padding: "20px 24px",
                        borderRadius: "12px",
                        backgroundColor: "var(--accent-gold-surface)",
                        border: "1px solid var(--border-active)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "14px",
                        marginBottom: "24px",
                        boxShadow: "var(--shadow-sm)",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "2px" }}>
                          Wajib Login untuk Berkomentar
                        </div>
                        <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                          Masuk untuk berdiskusi dengan sesama penonton di chapter ini.
                        </div>
                      </div>

                      <Link
                        href={`/login?redirect=/content/${content.slug}`}
                        className="btn btn-primary btn-sm"
                        style={{ padding: "8px 20px" }}
                      >
                        Masuk Akun
                      </Link>
                    </div>
                  )}

                  {/* Comments List */}
                  {loadingComments ? (
                    <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "20px" }}>
                      Memuat komentar...
                    </div>
                  ) : comments.length === 0 ? (
                    <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "24px 0", fontSize: "0.9rem" }}>
                      Belum ada komentar di chapter ini. Jadilah yang pertama berkomentar!
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {comments.map((comm) => (
                        <div
                          key={comm.id}
                          style={{
                            padding: "14px 16px",
                            borderRadius: "10px",
                            backgroundColor: "var(--bg-base)",
                            border: "1px solid var(--border-subtle)",
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
                                  backgroundColor: "var(--accent-gold-surface)",
                                  color: "var(--accent-gold)",
                                  fontWeight: 700,
                                  border: "1px solid var(--accent-gold-glow)",
                                }}
                              >
                                {comm.author.role}
                              </span>
                            </div>
                            <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                              {new Date(comm.createdAt).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: 0, lineHeight: 1.55 }}>
                            {comm.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Play Chapter 1 CTA if not playing */}
            {!isPlayingEpisode && (
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={() => handleSelectChapter(defaultChapters[0])}
                  className="btn btn-primary btn-lg"
                  style={{ flexGrow: 1, padding: "14px 24px", fontSize: "1rem", fontWeight: 700 }}
                >
                  ▶ Mulai Nonton Episode 1
                </button>
              </div>
            )}

            {/* SERIES EPISODES LIST (LIGHT MODE HIGH CONTRAST) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {sortedChapters.map((chapter) => {
                const isActive = isPlayingEpisode && activeChapter.id === chapter.id;
                const isFree = content.accessLevel === "PUBLIC" || chapter.chapterNumber === 1;

                return (
                  <div
                    key={chapter.id}
                    onClick={() => handleSelectChapter(chapter)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "12px 16px",
                      borderRadius: "12px",
                      backgroundColor: isActive ? "var(--accent-gold-surface)" : "var(--bg-surface)",
                      border: isActive ? "2px solid var(--accent-gold)" : "1px solid var(--border-subtle)",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      gap: "16px",
                      boxShadow: "var(--shadow-sm)",
                    }}
                    className="series-episode-row"
                  >
                    {/* Left: Square Thumbnail */}
                    <div
                      style={{
                        position: "relative",
                        width: "72px",
                        height: "72px",
                        borderRadius: "8px",
                        overflow: "hidden",
                        flexShrink: 0,
                        backgroundColor: "var(--bg-surface-elevated)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      <img
                        src={chapter.thumbnail || content.thumbnail}
                        alt={chapter.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      {isActive && (
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            backgroundColor: "rgba(17, 24, 39, 0.45)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#ffffff",
                            fontSize: "1.4rem",
                          }}
                        >
                          ▶
                        </div>
                      )}
                    </div>

                    {/* Middle: Title & Meta */}
                    <div style={{ flexGrow: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "0.98rem",
                          fontWeight: 700,
                          color: isActive ? "var(--accent-gold)" : "var(--text-primary)",
                          marginBottom: "4px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        S1 Episode {chapter.chapterNumber} • {chapter.title}
                      </div>

                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        May 18, 2026 • {chapter.duration || "45 min"}
                      </div>
                    </div>

                    {/* Right: FREE / MEMBER Badge & Comments count */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                      <span
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--text-muted)",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          fontWeight: 600,
                        }}
                      >
                        
                        <span>{chapter._count?.comments || (isActive ? comments.length : 0)}</span>
                      </span>

                      <span
                        style={{
                          fontSize: "0.84rem",
                          fontWeight: 800,
                          letterSpacing: "0.05em",
                          color: isFree ? "var(--status-success)" : "var(--accent-gold)",
                        }}
                      >
                        {isFree ? "FREE" : "MEMBER"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .series-episode-row:hover {
          background-color: var(--bg-surface-elevated) !important;
          border-color: var(--accent-gold) !important;
          transform: translateX(4px);
        }
      `}</style>
    </div>
  );
}
