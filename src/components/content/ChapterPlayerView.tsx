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

interface ChapterPlayerViewProps {
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

export default function ChapterPlayerView({
  content,
  chapters,
  currentUser,
  isAuthorized,
}: ChapterPlayerViewProps) {
  // Ensure we have at least one fallback chapter if list is empty
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
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [spamError, setSpamError] = useState<string | null>(null);
  const [spamSuccess, setSpamSuccess] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const commentsTopRef = useRef<HTMLDivElement>(null);

  // Fetch comments for active chapter
  const fetchComments = useCallback(async (chapterId: string) => {
    // If it's a fallback synthetic id not yet in DB, start with empty list
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

  // Handle countdown for rate limiting
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setTimeout(() => {
      setCooldownSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [cooldownSeconds]);

  // Submit comment handler
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
        setSpamError(data.error || "Failed to submit comment.");
        // Extract remaining seconds if rate limited
        const match = data.error?.match(/(\d+)\s*(detik|seconds|s)/i);
        if (match && match[1]) {
          setCooldownSeconds(parseInt(match[1]));
        }
        return;
      }

      // Success
      setCommentText("");
      setSpamSuccess("Your comment has been published on this chapter!");
      setCooldownSeconds(15); // Start 15s local cooldown
      if (data.comment) {
        setComments((prev) => [data.comment, ...prev]);
      } else {
        fetchComments(activeChapter.id);
      }
    } catch {
      setSpamError("Network issue encountered while submitting comment.");
    } finally {
      setSubmittingComment(false);
    }
  };

  const secureVideoUrl = isAuthorized
    ? activeChapter.videoUrl || content.trailer
    : null;

  return (
    <div>
      {/* 1. Video Player Area */}
      <section
        style={{
          width: "100%",
          backgroundColor: "#050507",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div className="container" style={{ padding: "36px 24px" }}>
          {isAuthorized ? (
            <div
              style={{
                maxWidth: "1080px",
                margin: "0 auto",
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "0 24px 80px rgba(0, 0, 0, 0.9), 0 0 40px rgba(212, 175, 55, 0.15)",
                border: "1px solid rgba(212, 175, 55, 0.3)",
              }}
            >
              <ContentPlayerClient
                key={activeChapter.id}
                videoUrl={secureVideoUrl!}
                poster={activeChapter.thumbnail || content.thumbnail}
                title={`${content.title} - ${activeChapter.title}`}
              />
            </div>
          ) : (
            /* Premium Gate Screen */
            <div
              style={{
                maxWidth: "960px",
                margin: "0 auto",
                borderRadius: "20px",
                overflow: "hidden",
                position: "relative",
                backgroundColor: "#0d0d12",
                border: "1px solid rgba(212, 175, 55, 0.4)",
                boxShadow: "0 24px 70px rgba(0, 0, 0, 0.85), 0 0 50px rgba(212, 175, 55, 0.15)",
                aspectRatio: "16 / 9",
                minHeight: "440px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src={content.thumbnail}
                alt={content.title}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  filter: "blur(20px) brightness(0.25) contrast(1.2)",
                  transform: "scale(1.1)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "radial-gradient(ellipse at center, rgba(13, 13, 18, 0.85) 0%, rgba(8, 8, 10, 0.96) 80%)",
                }}
              />
              <div
                style={{
                  position: "relative",
                  zIndex: 2,
                  textAlign: "center",
                  padding: "40px 24px",
                  maxWidth: "580px",
                }}
              >
                <div
                  style={{
                    width: "72px",
                    height: "72px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(212, 175, 55, 0.15)",
                    border: "1px solid rgba(212, 175, 55, 0.45)",
                    color: "var(--accent-gold-light)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 20px",
                    boxShadow: "0 0 30px rgba(212, 175, 55, 0.2)",
                  }}
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <div
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    color: "var(--accent-gold)",
                    textTransform: "uppercase",
                    marginBottom: "8px",
                  }}
                >
                  EXCLUSIVE STREAM
                </div>
                <h2
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)",
                    color: "#ffffff",
                    marginBottom: "14px",
                    lineHeight: 1.2,
                  }}
                >
                  Unlock Member Access
                </h2>
                <p
                  style={{
                    color: "rgba(245, 245, 247, 0.8)",
                    fontSize: "0.98rem",
                    lineHeight: 1.6,
                    marginBottom: "32px",
                  }}
                >
                  &ldquo;{content.title}&rdquo; is an exclusive presentation for registered YoruMuse patrons. Unlock full 4K streaming access and enjoy every cinematic episode.
                </p>
                <div style={{ display: "flex", justifyContent: "center", gap: "14px", flexWrap: "wrap" }}>
                  <Link href="/membership" className="btn btn-primary btn-lg">
                    Become a Member
                  </Link>
                  {!currentUser && (
                    <Link
                      href={`/login?redirect=/content/${content.slug}`}
                      className="btn btn-secondary btn-lg"
                    >
                      Sign In
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Active Chapter Title Bar below player */}
          <div
            style={{
              maxWidth: "1080px",
              margin: "20px auto 0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <span
                  style={{
                    padding: "3px 8px",
                    borderRadius: "4px",
                    backgroundColor: "rgba(212, 175, 55, 0.2)",
                    color: "var(--accent-gold-light)",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                  }}
                >
                  SEDANG DIPUTAR • CHAPTER {activeChapter.chapterNumber}
                </span>
                <span style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "0.8rem" }}>
                  {activeChapter.duration || content.duration || "45 min"}
                </span>
              </div>
              <h2
                style={{
                  color: "#ffffff",
                  fontSize: "1.3rem",
                  fontFamily: "var(--font-serif)",
                  fontWeight: 600,
                }}
              >
                {activeChapter.title}
              </h2>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.8rem",
                  color: "#a1a1aa",
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                  padding: "6px 14px",
                  borderRadius: "20px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                
                <strong>{comments.length}</strong> Comments on This Chapter
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Chapter Playlist & Navigation Section */}
      <section
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          backgroundColor: "var(--bg-surface-elevated)",
          padding: "24px 0",
        }}
      >
        <div className="container" style={{ maxWidth: "1080px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              
              <h3 style={{ fontSize: "1.1rem", color: "var(--text-primary)", fontWeight: 700 }}>
                Chapter / Episode List ({defaultChapters.length})
              </h3>
            </div>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Select a chapter to switch videos & view specific comments
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: "14px",
            }}
          >
            {defaultChapters.map((ch) => {
              const isActive = ch.id === activeChapter.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => setActiveChapter(ch)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    textAlign: "left",
                    padding: "14px 16px",
                    borderRadius: "12px",
                    backgroundColor: isActive ? "var(--bg-surface)" : "var(--bg-base)",
                    border: isActive ? "2px solid var(--accent-gold)" : "1px solid var(--border-subtle)",
                    boxShadow: isActive ? "0 4px 16px rgba(166, 124, 30, 0.18)" : "var(--shadow-sm)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", width: "100%", marginBottom: "6px" }}>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 800,
                        color: isActive ? "var(--accent-gold)" : "var(--text-muted)",
                        letterSpacing: "0.05em",
                      }}
                    >
                      CHAPTER {ch.chapterNumber}
                    </span>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                      {ch.duration || "45 min"}
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: "0.92rem",
                      fontWeight: 700,
                      color: isActive ? "var(--accent-gold)" : "var(--text-primary)",
                      lineHeight: 1.3,
                      marginBottom: "6px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      width: "100%",
                    }}
                  >
                    {ch.title}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "0.74rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    <span>{ch._count?.comments || (isActive ? comments.length : 0)} reviews</span>
                    {isActive && (
                      <span
                        style={{
                          marginLeft: "auto",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          backgroundColor: "var(--accent-gold)",
                          color: "#ffffff",
                          fontSize: "0.65rem",
                          fontWeight: 800,
                        }}
                      >
                        AKTIF
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Chapter Comments Section */}
      <section className="section" style={{ paddingTop: "40px", paddingBottom: "60px" }} ref={commentsTopRef}>
        <div className="container" style={{ maxWidth: "1080px" }}>
          <div
            style={{
              backgroundColor: "var(--bg-surface)",
              borderRadius: "18px",
              border: "1px solid var(--border-subtle)",
              boxShadow: "var(--shadow-md)",
              padding: "36px",
            }}
          >
            {/* Comments Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid var(--border-subtle)",
                paddingBottom: "20px",
                marginBottom: "28px",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div>
                <div style={{ fontSize: "0.8rem", color: "var(--accent-gold)", fontWeight: 700, letterSpacing: "0.08em" }}>
                  OFFICIAL DISCUSSION & COMMENTS
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "1.6rem",
                    color: "var(--text-primary)",
                    marginTop: "4px",
                  }}
                >
                  Comments: {activeChapter.title}
                </h3>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 14px",
                  borderRadius: "20px",
                  backgroundColor: "var(--bg-surface-elevated)",
                  border: "1px solid var(--border-subtle)",
                  fontSize: "0.82rem",
                  color: "var(--text-secondary)",
                  fontWeight: 600,
                }}
              >
                <span>Anti-Spam Protected</span>
              </div>
            </div>

            {/* Comment Form OR Mandatory Login Prompt */}
            {currentUser ? (
              <form onSubmit={handleSubmitComment} style={{ marginBottom: "36px" }}>
                {/* Anti-spam error alert */}
                {spamError && (
                  <div
                    style={{
                      padding: "12px 16px",
                      borderRadius: "10px",
                      backgroundColor: "#fef2f2",
                      border: "1px solid #fecaca",
                      color: "#b91c1c",
                      fontSize: "0.88rem",
                      fontWeight: 600,
                      marginBottom: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    
                    <span>{spamError}</span>
                  </div>
                )}

                {/* Success alert */}
                {spamSuccess && (
                  <div
                    style={{
                      padding: "12px 16px",
                      borderRadius: "10px",
                      backgroundColor: "#ecfdf5",
                      border: "1px solid #a7f3d0",
                      color: "#065f46",
                      fontSize: "0.88rem",
                      fontWeight: 600,
                      marginBottom: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    
                    <span>{spamSuccess}</span>
                  </div>
                )}

                <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                  {/* User Avatar */}
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      backgroundColor: "var(--accent-gold)",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "1.1rem",
                      flexShrink: 0,
                      boxShadow: "var(--shadow-sm)",
                    }}
                  >
                    {currentUser.username.slice(0, 1).toUpperCase()}
                  </div>

                  <div style={{ flexGrow: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                      <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.92rem" }}>
                        {currentUser.username}
                      </span>
                      <span
                        className="badge badge-member"
                        style={{ fontSize: "0.68rem", padding: "2px 8px" }}
                      >
                        {currentUser.role}
                      </span>
                    </div>

                    {/* Honeypot trap field (hidden from legitimate humans) */}
                    <input
                      type="text"
                      name="website_trap"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                      tabIndex={-1}
                      autoComplete="off"
                      style={{
                        position: "absolute",
                        opacity: 0,
                        zIndex: -1,
                        pointerEvents: "none",
                        height: 0,
                        width: 0,
                      }}
                    />

                    <div style={{ position: "relative" }}>
                      <textarea
                        rows={3}
                        required
                        placeholder={`Share your thoughts, cinematographic appreciation, or discussion regarding ${activeChapter.title}...`}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        maxLength={1000}
                        style={{
                          width: "100%",
                          padding: "14px 16px",
                          borderRadius: "12px",
                          border: "1px solid var(--border-medium)",
                          backgroundColor: "var(--bg-base)",
                          fontSize: "0.95rem",
                          lineHeight: 1.5,
                          resize: "vertical",
                        }}
                      />

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginTop: "8px",
                          fontSize: "0.78rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        <div>
                          {cooldownSeconds > 0 ? (
                            <span style={{ color: "var(--accent-gold)", fontWeight: 600 }}>
                              Anti-Spam Cooldown: {cooldownSeconds}s
                            </span>
                          ) : (
                            <span>Rate limit: 1 review every 15 seconds to prevent spam.</span>
                          )}
                        </div>
                        <span style={{ color: commentText.length > 900 ? "#e11d48" : "var(--text-muted)" }}>
                          {commentText.length} / 1000 characters
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
                      <button
                        type="submit"
                        disabled={submittingComment || commentText.trim().length < 3 || cooldownSeconds > 0}
                        className="btn btn-primary"
                        style={{ minWidth: "160px" }}
                        id="submit-chapter-comment-btn"
                      >
                        {submittingComment ? "Posting Comment..." : "Post Comment"}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              /* MANDATORY LOGIN PROMPT CARD (Requires User Sign-in) */
              <div
                style={{
                  padding: "32px 28px",
                  borderRadius: "16px",
                  backgroundColor: "var(--bg-surface-elevated)",
                  border: "2px solid rgba(166, 124, 30, 0.35)",
                  boxShadow: "var(--shadow-sm)",
                  display: "flex",
                  alignItems: "center",
                  gap: "24px",
                  marginBottom: "36px",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(166, 124, 30, 0.12)",
                    border: "1px solid var(--accent-gold)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.8rem",
                    flexShrink: 0,
                  }}
                >
                  
                </div>

                <div style={{ flexGrow: 1, minWidth: "260px" }}>
                  <div
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: 800,
                      color: "var(--accent-gold)",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      marginBottom: "4px",
                    }}
                  >
                    Member-Only Comments
                  </div>
                  <h4
                    style={{
                      fontSize: "1.18rem",
                      color: "var(--text-primary)",
                      fontWeight: 700,
                      marginBottom: "6px",
                    }}
                  >
                    Account Login Required to Comment
                  </h4>
                  <p
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: "0.88rem",
                      lineHeight: 1.5,
                      margin: 0,
                    }}
                  >
                    To maintain the quality of the exclusive YoruMuse community and prevent automated spam bots, you must sign in or create an account before posting reviews on each chapter.
                  </p>
                </div>

                <div style={{ display: "flex", gap: "10px", flexShrink: 0 }}>
                  <Link
                    href={`/login?redirect=/content/${content.slug}`}
                    className="btn btn-primary"
                    style={{ padding: "10px 22px" }}
                    id="comment-login-redirect-btn"
                  >
                    Sign In
                  </Link>
                  <Link
                    href={`/register?redirect=/content/${content.slug}`}
                    className="btn btn-secondary"
                    style={{ padding: "10px 18px" }}
                  >
                    Register
                  </Link>
                </div>
              </div>
            )}

            {/* Comments List */}
            <div>
              <h4
                style={{
                  fontSize: "1.05rem",
                  color: "var(--text-primary)",
                  fontWeight: 700,
                  marginBottom: "20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span>Comments</span>
                <span
                  style={{
                    backgroundColor: "var(--bg-surface-elevated)",
                    color: "var(--accent-gold)",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  {comments.length}
                </span>
              </h4>

              {loadingComments ? (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                  Loading chapter comments...
                </div>
              ) : comments.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "48px 24px",
                    borderRadius: "14px",
                    border: "1px dashed var(--border-medium)",
                    backgroundColor: "var(--bg-base)",
                  }}
                >
                  
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>
                    No reviews yet for {activeChapter.title}
                  </div>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0 }}>
                    Be the first to share your thoughts and discuss the cinematography of this chapter!
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      style={{
                        padding: "18px 20px",
                        borderRadius: "14px",
                        backgroundColor: "var(--bg-base)",
                        border: "1px solid var(--border-subtle)",
                        boxShadow: "var(--shadow-sm)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "10px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              backgroundColor:
                                comment.author.role === "ADMIN"
                                  ? "#b45309"
                                  : "var(--accent-gold)",
                              color: "#ffffff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: "0.95rem",
                            }}
                          >
                            {comment.author.username.slice(0, 1).toUpperCase()}
                          </div>

                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--text-primary)" }}>
                                {comment.author.username}
                              </span>
                              <span
                                className="badge badge-member"
                                style={{
                                  fontSize: "0.65rem",
                                  padding: "2px 6px",
                                  backgroundColor:
                                    comment.author.role === "ADMIN"
                                      ? "rgba(180, 83, 9, 0.15)"
                                      : undefined,
                                  color:
                                    comment.author.role === "ADMIN"
                                      ? "#b45309"
                                      : undefined,
                                }}
                              >
                                {comment.author.role}
                              </span>
                            </div>
                            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                              {new Date(comment.createdAt).toLocaleDateString("en-US", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        </div>

                        <span style={{ fontSize: "0.7rem", color: "var(--accent-gold)", fontWeight: 700 }}>
                          CHAPTER {activeChapter.chapterNumber}
                        </span>
                      </div>

                      <p
                        style={{
                          color: "var(--text-primary)",
                          fontSize: "0.92rem",
                          lineHeight: 1.6,
                          whiteSpace: "pre-wrap",
                          margin: 0,
                        }}
                      >
                        {comment.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
