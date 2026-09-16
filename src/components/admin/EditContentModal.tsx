"use client";

import React, { useState, useEffect } from "react";

interface ContentRow {
  id: string;
  title: string;
  slug: string;
  category: string;
  accessLevel: string;
  featured: boolean;
  published: boolean;
  duration?: string;
  thumbnail: string;
  trailer: string;
  videoUrl?: string;
  description?: string;
  views: number;
}

interface EditContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentItem: ContentRow | null;
  onSuccess: (updated: ContentRow) => void;
}

export default function EditContentModal({
  isOpen,
  onClose,
  contentItem,
  onSuccess,
}: EditContentModalProps) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Manhwa");
  const [accessLevel, setAccessLevel] = useState("PUBLIC");
  const [duration, setDuration] = useState("45 min");
  const [thumbnail, setThumbnail] = useState("");
  const [trailer, setTrailer] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [featured, setFeatured] = useState(false);
  const [published, setPublished] = useState(true);

  const [saving, setSaving] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (contentItem) {
      setTitle(contentItem.title || "");
      setSlug(contentItem.slug || "");
      setDescription(contentItem.description || "");
      setCategory(contentItem.category || "Manhwa");
      setAccessLevel(contentItem.accessLevel || "PUBLIC");
      setDuration(contentItem.duration || "45 min");
      setThumbnail(contentItem.thumbnail || "");
      setTrailer(contentItem.trailer || "");
      setVideoUrl(contentItem.videoUrl || contentItem.trailer || "");
      setFeatured(Boolean(contentItem.featured));
      setPublished(contentItem.published !== undefined ? Boolean(contentItem.published) : true);
      setErrorMessage(null);
    }
  }, [contentItem]);

  if (!isOpen || !contentItem) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === "image") setUploadingThumb(true);
    else setUploadingVideo(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload file.");

      if (type === "image") {
        setThumbnail(data.url);
      } else {
        setTrailer(data.url);
        setVideoUrl(data.url);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to upload file.");
    } finally {
      if (type === "image") setUploadingThumb(false);
      else setUploadingVideo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/admin/content/${contentItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim() || undefined,
          description: description.trim(),
          category,
          accessLevel,
          duration,
          thumbnail: thumbnail.trim(),
          trailer: trailer.trim(),
          videoUrl: videoUrl.trim(),
          featured,
          published,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update content.");
      }

      onSuccess(data.content);
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "680px",
          backgroundColor: "var(--bg-surface)",
          border: "1px solid rgba(212, 175, 55, 0.4)",
          borderRadius: "18px",
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 35px rgba(184, 138, 37, 0.15)",
          padding: "30px",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <span style={{ fontSize: "0.75rem", color: "var(--accent-gold)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              SUPER USER • EDIT CONTENT
            </span>
            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", color: "var(--text-primary)", margin: "4px 0 0" }}>
              Edit Series: {contentItem.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              fontSize: "1.5rem",
              cursor: "pointer",
              padding: "4px 8px",
            }}
          >
            ✕
          </button>
        </div>

        {errorMessage && (
          <div style={{ padding: "10px 14px", backgroundColor: "rgba(239, 68, 68, 0.15)", border: "1px solid #ef4444", color: "#fca5a5", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "16px" }}>
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Row 1: Title & Slug */}
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "4px", fontWeight: 600 }}>
                Series / Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border-medium)", backgroundColor: "var(--bg-surface-elevated)", color: "var(--text-primary)" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "4px", fontWeight: 600 }}>
                Slug URL
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="shadows-in-champagne"
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border-medium)", backgroundColor: "var(--bg-surface-elevated)", color: "var(--text-primary)" }}
              />
            </div>
          </div>

          {/* Row 2: Category, Access Level, Duration */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "4px", fontWeight: 600 }}>
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border-medium)", backgroundColor: "var(--bg-surface-elevated)", color: "var(--text-primary)" }}
              >
                <option value="Manhwa">Manhwa</option>
                <option value="Romance Noir">Romance Noir</option>
                <option value="Intrigue">Intrigue</option>
                <option value="Modern Classic">Modern Classic</option>
                <option value="Drama">Drama</option>
                <option value="Exclusive Premiere">Exclusive Premiere</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "4px", fontWeight: 600 }}>
                Access Level
              </label>
              <select
                value={accessLevel}
                onChange={(e) => setAccessLevel(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border-medium)", backgroundColor: "var(--bg-surface-elevated)", color: "var(--text-primary)" }}
              >
                <option value="PUBLIC">PUBLIC (Everyone)</option>
                <option value="MEMBER">MEMBER (Velvet Club)</option>
                <option value="VIP">VIP (Sovereign Patron)</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "4px", fontWeight: 600 }}>
                Average Duration
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="45 min"
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border-medium)", backgroundColor: "var(--bg-surface-elevated)", color: "var(--text-primary)" }}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "4px", fontWeight: 600 }}>
              Story Synopsis
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Full story synopsis and description..."
              style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border-medium)", backgroundColor: "var(--bg-surface-elevated)", color: "var(--text-primary)", resize: "vertical" }}
            />
          </div>

          {/* Thumbnail */}
          <div>
            <div style={{ display: "flex", borderBottom: "none", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <label style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                Poster Thumbnail URL *
              </label>
              <label style={{ fontSize: "0.75rem", color: "var(--accent-gold)", cursor: "pointer", textDecoration: "underline" }}>
                <span>{uploadingThumb ? "Uploading..." : "Upload New Image"}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, "image")}
                  disabled={uploadingThumb}
                  style={{ display: "none" }}
                />
              </label>
            </div>
            <input
              type="text"
              required
              value={thumbnail}
              onChange={(e) => setThumbnail(e.target.value)}
              placeholder="https://... or /uploads/..."
              style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border-medium)", backgroundColor: "var(--bg-surface-elevated)", color: "var(--text-primary)" }}
            />
          </div>

          {/* Video & Trailer */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <label style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                  Trailer Video URL *
                </label>
                <label style={{ fontSize: "0.75rem", color: "var(--accent-gold)", cursor: "pointer", textDecoration: "underline" }}>
                  <span>{uploadingVideo ? "Uploading..." : "Upload Video"}</span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleFileUpload(e, "video")}
                    disabled={uploadingVideo}
                    style={{ display: "none" }}
                  />
                </label>
              </div>
              <input
                type="text"
                required
                value={trailer}
                onChange={(e) => setTrailer(e.target.value)}
                placeholder="/stream/... or MP4 URL"
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border-medium)", backgroundColor: "var(--bg-surface-elevated)", color: "var(--text-primary)" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "4px", fontWeight: 600 }}>
                Full Master Video URL
              </label>
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="Same as trailer if empty"
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border-medium)", backgroundColor: "var(--bg-surface-elevated)", color: "var(--text-primary)" }}
              />
            </div>
          </div>

          {/* Checkboxes: Featured & Published */}
          <div style={{ display: "flex", gap: "24px", padding: "12px 16px", backgroundColor: "var(--bg-surface-elevated)", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.85rem", color: "var(--text-primary)" }}>
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                style={{ accentColor: "var(--accent-gold)" }}
              />
              <span>Publish Series (Active & Visible)</span>
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.85rem", color: "var(--text-primary)" }}>
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                style={{ accentColor: "var(--accent-gold)" }}
              />
              <span>Mark as Featured (Spotlight)</span>
            </label>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
              style={{ flex: 1, padding: "12px", fontWeight: 600 }}
            >
              {saving ? "Saving Changes..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="btn btn-secondary"
              style={{ padding: "12px 20px" }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
