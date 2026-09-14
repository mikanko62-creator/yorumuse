"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import ReportModal from "@/components/community/ReportModal";

interface PostItem {
  id: string;
  title: string;
  content: string;
  category: string;
  likesCount: number;
  createdAt: string;
  author: {
    id: string;
    username: string;
    role: string;
    avatarUrl?: string;
  };
  _count: {
    comments: number;
    likes: number;
  };
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ id: string; title: string } | null>(null);

  // New post form state
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("Content Discussions");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const categories = [
    "all",
    "Content Discussions",
    "Creative Noir",
    "Announcements",
    "Introductions",
  ];

  const fetchPosts = () => {
    setLoading(true);
    fetch(`/api/posts?category=${category}`)
      .then((res) => (res.ok ? res.json() : { posts: [] }))
      .then((data) => {
        setPosts(data.posts || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchPosts();
  }, [category]);

  const handleLike = async (postId: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}/like`, { method: "POST" });
      if (!res.ok) {
        if (res.status === 401) {
          alert("Please sign in to like community posts.");
        }
        return;
      }
      const data = await res.json();
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, likesCount: data.likesCount } : p
        )
      );
    } catch {
      // Ignore network error
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          content: newContent,
          category: newCategory,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create post.");
        setSubmitting(false);
        return;
      }

      setNewTitle("");
      setNewContent("");
      setIsComposeOpen(false);
      setSubmitting(false);
      fetchPosts();
    } catch {
      setError("An unexpected error occurred.");
      setSubmitting(false);
    }
  };

  return (
    <div style={{ paddingTop: "var(--header-height)", minHeight: "100vh" }}>
      {/* Community Header Banner */}
      <section
        style={{
          padding: "60px 0 36px",
          background: "linear-gradient(180deg, #111117 0%, var(--bg-base) 100%)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div className="container">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              flexWrap: "wrap",
              gap: "24px",
            }}
          >
            <div>
              <span className="section-subtitle">Private Salons</span>
              <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", marginBottom: "12px" }}>
                The YoruMuse Community
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", maxWidth: "600px" }}>
                Connect with fellow patrons to discuss cinema, aesthetic storytelling, and artistic vision.
              </p>
            </div>

            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <Link href="/community/guidelines" className="btn btn-secondary">
                Standards & Guidelines
              </Link>
              <button
                onClick={() => setIsComposeOpen(true)}
                className="btn btn-primary"
                id="create-post-trigger"
              >
                + Start Discussion
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              marginTop: "32px",
              overflowX: "auto",
              paddingBottom: "6px",
            }}
          >
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`btn btn-sm ${category === cat ? "btn-primary" : "btn-secondary"}`}
              >
                {cat === "all" ? "All Discussions" : cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Posts Feed */}
      <div className="container" style={{ padding: "40px 24px 80px", maxWidth: "960px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--accent-gold)" }}>
            Loading salons...
          </div>
        ) : posts.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {posts.map((post) => (
              <div
                key={post.id}
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderRadius: "16px",
                  border: "1px solid var(--border-subtle)",
                  padding: "24px 28px",
                  transition: "border-color 0.25s ease, transform 0.25s ease",
                }}
                className="community-post-card"
              >
                {/* Post Top Row */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        backgroundColor: "var(--bg-surface-elevated)",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--accent-gold)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "0.9rem",
                      }}
                    >
                      {post.author.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.95rem" }}>
                          {post.author.username}
                        </span>
                        {post.author.role === "ADMIN" && (
                          <span className="badge badge-premium" style={{ fontSize: "0.65rem", padding: "2px 6px" }}>
                            CURATOR
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--accent-gold)",
                      padding: "4px 10px",
                      backgroundColor: "var(--accent-gold-glow)",
                      borderRadius: "var(--radius-xs)",
                      fontWeight: 600,
                    }}
                  >
                    {post.category}
                  </span>
                </div>

                {/* Post Title & Content */}
                <h3 style={{ fontSize: "1.3rem", color: "var(--text-primary)", marginBottom: "10px" }}>
                  <Link href={`/community/post/${post.id}`} style={{ color: "inherit" }}>
                    {post.title}
                  </Link>
                </h3>

                <p
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "0.95rem",
                    lineHeight: 1.6,
                    marginBottom: "20px",
                  }}
                >
                  {post.content}
                </p>

                {/* Post Actions Bar */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: "14px",
                    borderTop: "1px solid var(--border-subtle)",
                  }}
                >
                  <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                    <button
                      onClick={() => handleLike(post.id)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        color: "var(--text-secondary)",
                        fontSize: "0.85rem",
                        cursor: "pointer",
                      }}
                    >
                      <span>Suka</span>
                      <span>{post.likesCount || 0} Likes</span>
                    </button>

                    <Link
                      href={`/community/post/${post.id}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        color: "var(--text-secondary)",
                        fontSize: "0.85rem",
                      }}
                    >
                      <span>Balasan</span>
                      <span>{post._count?.comments || 0} Comments</span>
                    </Link>
                  </div>

                  <button
                    onClick={() => setReportTarget({ id: post.id, title: post.title })}
                    style={{
                      color: "var(--text-muted)",
                      fontSize: "0.8rem",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      cursor: "pointer",
                    }}
                  >
                    <span>Laporkan</span>
                    <span>Report</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              backgroundColor: "var(--bg-surface)",
              borderRadius: "16px",
              border: "1px solid var(--border-subtle)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <h3 style={{ color: "var(--text-primary)", marginBottom: "8px" }}>No discussions in this category yet</h3>
            <p style={{ color: "var(--text-secondary)", marginBottom: "20px" }}>
              Be the first patron to initiate an aesthetic conversation.
            </p>
            <button onClick={() => setIsComposeOpen(true)} className="btn btn-primary">
              Start Discussion
            </button>
          </div>
        )}
      </div>

      {/* Compose Discussion Modal */}
      {isComposeOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            backgroundColor: "rgba(17, 24, 39, 0.6)",
            backdropFilter: "blur(16px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsComposeOpen(false);
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "540px",
              backgroundColor: "#ffffff",
              border: "1px solid var(--border-medium)",
              borderRadius: "18px",
              padding: "36px 32px",
              boxShadow: "0 24px 70px rgba(0, 0, 0, 0.15)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", color: "var(--text-primary)" }}>
                Start Discussion
              </h3>
              <button onClick={() => setIsComposeOpen(false)} style={{ color: "var(--text-muted)", fontSize: "1.2rem" }}>
                Tutup
              </button>
            </div>

            {error && (
              <div style={{ padding: "10px 14px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "6px", color: "#b91c1c", fontSize: "0.85rem", marginBottom: "16px", fontWeight: 500 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleCreatePost} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Salon Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  style={{ width: "100%" }}
                >
                  <option value="Content Discussions">Content Discussions</option>
                  <option value="Creative Noir">Creative Noir</option>
                  <option value="Announcements">Announcements</option>
                  <option value="Introductions">Introductions</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Discussion Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Symbolism in Midnight Noir cinematography"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  style={{ width: "100%" }}
                  id="compose-post-title"
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Reflections / Content
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Share your perspective or pose a question to the community..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  style={{ width: "100%", resize: "vertical" }}
                  id="compose-post-content"
                />
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ flexGrow: 1 }}
                  id="compose-submit-btn"
                >
                  {submitting ? "Publishing..." : "Publish Discussion"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsComposeOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Report Modal */}
      {reportTarget && (
        <ReportModal
          isOpen={true}
          onClose={() => setReportTarget(null)}
          targetType="POST"
          targetId={reportTarget.id}
          targetTitle={reportTarget.title}
        />
      )}

      <style jsx>{`
        .community-post-card:hover {
          border-color: rgba(212, 175, 55, 0.35) !important;
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}
