"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import ReportModal from "@/components/community/ReportModal";

interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    username: string;
    role: string;
  };
}

interface PostDetail {
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
    bio?: string;
  };
  comments: CommentItem[];
}

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ id: string; title: string } | null>(null);

  const fetchPost = () => {
    fetch(`/api/posts/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.post) setPost(data.post);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchPost();
  }, [id]);

  const handleLike = async () => {
    if (!post) return;
    try {
      const res = await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setPost({ ...post, likesCount: data.likesCount });
      }
    } catch {
      // Ignore
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !post) return;
    setSubmittingComment(true);

    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentText }),
      });

      if (res.ok) {
        setCommentText("");
        fetchPost();
      } else if (res.status === 401) {
        alert("Please sign in to reply to this discussion.");
      }
    } catch {
      // Ignore
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div style={{ paddingTop: "140px", textAlign: "center", color: "var(--accent-gold)" }}>
        Loading salon conversation...
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container" style={{ paddingTop: "140px", textAlign: "center" }}>
        <h2>Discussion not found</h2>
        <p style={{ color: "var(--text-secondary)", marginTop: "8px" }}>
          This conversation may have been archived or removed by moderation.
        </p>
        <Link href="/community" className="btn btn-secondary" style={{ marginTop: "20px" }}>
          Back to Community
        </Link>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: "var(--header-height)", minHeight: "100vh" }}>
      <div className="container" style={{ maxWidth: "860px", padding: "48px 24px 80px" }}>
        {/* Back Link */}
        <Link
          href="/community"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            color: "var(--accent-gold)",
            fontSize: "0.9rem",
            marginBottom: "28px",
          }}
        >
          <span>←</span>
          <span>Back to Discussions</span>
        </Link>

        {/* Post Card */}
        <article
          style={{
            backgroundColor: "var(--bg-surface)",
            borderRadius: "18px",
            border: "1px solid var(--border-subtle)",
            padding: "36px 32px",
            marginBottom: "36px",
          }}
        >
          {/* Author Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #b88a25, #8c6411)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "1.1rem",
                  boxShadow: "0 2px 8px rgba(148, 108, 21, 0.2)",
                }}
              >
                {post.author.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "1.05rem" }}>
                    {post.author.username}
                  </span>
                  {post.author.role === "ADMIN" && (
                    <span className="badge badge-premium" style={{ fontSize: "0.68rem" }}>
                      ADMIN
                    </span>
                  )}
                </div>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Posted on {new Date(post.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <span
              style={{
                fontSize: "0.78rem",
                color: "var(--accent-gold)",
                backgroundColor: "var(--accent-gold-glow)",
                padding: "4px 12px",
                borderRadius: "var(--radius-xs)",
                fontWeight: 600,
              }}
            >
              {post.category}
            </span>
          </div>

          {/* Title & Body */}
          <h1 style={{ fontSize: "2rem", color: "var(--text-primary)", marginBottom: "20px", lineHeight: 1.25 }}>
            {post.title}
          </h1>

          <div
            style={{
              fontSize: "1.05rem",
              lineHeight: 1.75,
              color: "var(--text-primary)",
              marginBottom: "32px",
              whiteSpace: "pre-wrap",
            }}
          >
            {post.content}
          </div>

          {/* Actions */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: "18px",
              borderTop: "1px solid var(--border-subtle)",
            }}
          >
            <button
              onClick={handleLike}
              className="btn btn-secondary btn-sm"
              style={{ gap: "8px" }}
              id="like-post-btn"
            >
              <span>Suka</span>
              <span>{post.likesCount || 0} Likes</span>
            </button>

            <button
              onClick={() => setReportTarget({ id: post.id, title: post.title })}
              style={{
                color: "var(--text-muted)",
                fontSize: "0.85rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span>Laporkan</span>
              <span>Report Post</span>
            </button>
          </div>
        </article>

        {/* Comment Section */}
        <section>
          <h3 style={{ fontSize: "1.4rem", color: "var(--text-primary)", marginBottom: "24px" }}>
            Replies ({post.comments?.length || 0})
          </h3>

          {/* New Comment Box */}
          <form
            onSubmit={handleAddComment}
            style={{
              backgroundColor: "var(--bg-surface)",
              borderRadius: "14px",
              padding: "20px",
              border: "1px solid var(--border-subtle)",
              boxShadow: "var(--shadow-sm)",
              marginBottom: "32px",
            }}
          >
            <textarea
              rows={3}
              required
              placeholder="Add your contribution to this salon discussion..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              style={{ width: "100%", marginBottom: "12px", resize: "vertical" }}
              id="comment-input"
            />
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="submit"
                disabled={submittingComment}
                className="btn btn-primary btn-sm"
                id="comment-submit-btn"
              >
                {submittingComment ? "Posting..." : "Post Reply"}
              </button>
            </div>
          </form>

          {/* Comments List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {post.comments && post.comments.length > 0 ? (
              post.comments.map((comment) => (
                <div
                  key={comment.id}
                  style={{
                    padding: "20px",
                    backgroundColor: "var(--bg-surface)",
                    borderRadius: "12px",
                    border: "1px solid var(--border-subtle)",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.9rem" }}>
                        {comment.author.username}
                      </span>
                      {comment.author.role === "ADMIN" && (
                        <span className="badge badge-premium" style={{ fontSize: "0.62rem", padding: "1px 5px" }}>
                          CURATOR
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", lineHeight: 1.5 }}>
                    {comment.content}
                  </p>
                </div>
              ))
            ) : (
              <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "24px 0" }}>
                No replies yet. Be the first to join the conversation.
              </div>
            )}
          </div>
        </section>
      </div>

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
    </div>
  );
}
