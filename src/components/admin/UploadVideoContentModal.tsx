"use client";

import React, { useState, useEffect, useRef } from "react";

interface UploadVideoContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newContent: any) => void;
}

export default function UploadVideoContentModal({
  isOpen,
  onClose,
  onSuccess,
}: UploadVideoContentModalProps) {
  // Form State
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Manhwa");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [type, setType] = useState("Manhwa");
  const [genres, setGenres] = useState("Action, Fantasy, Romance");
  const [status, setStatus] = useState("Ongoing");
  const [postedBy, setPostedBy] = useState("Admin");
  const [accessLevel, setAccessLevel] = useState("PUBLIC");
  const [duration, setDuration] = useState("45 min");
  const [featured, setFeatured] = useState(false);
  const [chapterNumber, setChapterNumber] = useState(1);
  const [chapterTitle, setChapterTitle] = useState("");

  // Auto-filled Links from Bunny Storage
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  // Upload Progress & File Names
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [thumbFileName, setThumbFileName] = useState("");
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoFileName, setVideoFileName] = useState("");
  const [videoFileSize, setVideoFileSize] = useState("");

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const thumbInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Prevent background scroll when modal open
  useEffect(() => {
    if (isOpen) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = orig;
      };
    }
  }, [isOpen]);

  // Auto-generate chapter title and slug from title
  useEffect(() => {
    if (title) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      setSlug(generatedSlug);

      if (!chapterTitle || chapterTitle.startsWith("Chapter ")) {
        setChapterTitle(`Chapter ${chapterNumber}: ${title}`);
      }
    }
  }, [title, chapterNumber]);

  if (!isOpen) return null;

  // Handle Thumbnail File Upload -> Bunny Storage -> Auto-populate URL
  const handleThumbSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingThumb(true);
    setThumbFileName(file.name);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "image");

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload thumbnail to Bunny Storage");
      }

      // Automatically fill the thumbnail link!
      setThumbnailUrl(data.url);
    } catch (err: any) {
      alert(err.message || "Failed to upload thumbnail.");
      setThumbFileName("");
      setThumbnailUrl("");
    } finally {
      setUploadingThumb(false);
    }
  };

  // Handle Video File Upload -> Bunny Storage -> Auto-populate URL + Detect Duration
  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVideo(true);
    setVideoFileName(file.name);
    setVideoFileSize((file.size / (1024 * 1024)).toFixed(1) + " MB");
    setErrorMessage(null);

    // Auto-probe duration from video element locally
    try {
      const videoElement = document.createElement("video");
      videoElement.preload = "metadata";
      videoElement.src = URL.createObjectURL(file);
      videoElement.onloadedmetadata = () => {
        const totalSec = Math.floor(videoElement.duration);
        if (!isNaN(totalSec) && totalSec > 0) {
          const m = Math.floor(totalSec / 60);
          const s = totalSec % 60;
          setDuration(m > 0 ? `${m} min ${s > 0 ? `${s}s` : ""}`.trim() : `${s}s`);
        }
      };
    } catch {
      // fallback to current duration
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "video");

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload video to Bunny Storage");
      }

      // Automatically fill the video link!
      setVideoUrl(data.url);
    } catch (err: any) {
      alert(err.message || "Failed to upload video.");
      setVideoFileName("");
      setVideoUrl("");
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setErrorMessage("Title is required.");
      return;
    }
    if (!description.trim()) {
      setErrorMessage("Synopsis/description is required.");
      return;
    }
    if (!thumbnailUrl.trim()) {
      setErrorMessage("Please upload a thumbnail image first.");
      return;
    }
    if (!videoUrl.trim()) {
      setErrorMessage("Please upload a video file first.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    const finalCategory = isCustomCategory && customCategory.trim() ? customCategory.trim() : category;
    const genreArray = genres
      .split(",")
      .map((g) => g.trim())
      .filter(Boolean);

    // Pack complete metadata into tags structure
    const metadataTags = {
      genres: genreArray.length > 0 ? genreArray : ["Manhwa", "Romance"],
      type: type.trim() || "Manhwa",
      status: status.trim() || "Ongoing",
      postedBy: postedBy.trim() || "Admin",
    };

    try {
      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim() || undefined,
          description: description.trim(),
          category: finalCategory,
          accessLevel,
          thumbnail: thumbnailUrl.trim(),
          trailer: videoUrl.trim(),
          videoUrl: videoUrl.trim(),
          duration: duration.trim() || "45 min",
          featured,
          published: true,
          chapterNumber: Number(chapterNumber) || 1,
          chapterTitle: chapterTitle.trim() || `Chapter ${chapterNumber}: ${title.trim()}`,
          tags: metadataTags,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save title to database.");
      }

      alert(`Success! Title "${data.content.title}" and Chapter 1 have been published.`);
      onSuccess(data.content);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred while saving.");
    } finally {
      setSubmitting(false);
    }
  };

  const quickGenres = ["Action", "Romance", "Drama", "Fantasy", "Mystery", "Slice of Life", "Sci-Fi", "Comedy"];

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        backgroundColor: "rgba(10, 10, 15, 0.85)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "840px",
          backgroundColor: "var(--bg-surface)",
          border: "1px solid rgba(212, 175, 55, 0.35)",
          borderRadius: "20px",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.8)",
          padding: "32px",
          maxHeight: "92vh",
          overflowY: "auto",
          margin: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            borderBottom: "1px solid var(--border-subtle)",
            paddingBottom: "18px",
            marginBottom: "24px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "1.6rem" }}>🎬</span>
              <h2
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "1.6rem",
                  color: "var(--text-primary)",
                  margin: 0,
                  fontWeight: 700,
                }}
              >
                Upload Video & New Title
              </h2>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.86rem", margin: "6px 0 0" }}>
              Upload video & thumbnail directly to Bunny Storage. URLs are auto-populated without manual copy-pasting!
            </p>
          </div>
          <button
            onClick={onClose}
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

        {/* Error notification */}
        {errorMessage && (
          <div
            style={{
              padding: "12px 16px",
              backgroundColor: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              borderRadius: "10px",
              color: "#f87171",
              fontSize: "0.88rem",
              marginBottom: "20px",
              fontWeight: 500,
            }}
          >
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
          {/* ================= SECTION 1: MEDIA DIRECT UPLOADER (VIDEO & THUMBNAIL) ================= */}
          <div
            style={{
              background: "var(--bg-surface-elevated)",
              padding: "20px",
              borderRadius: "14px",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div
              style={{
                fontSize: "0.78rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--accent-gold)",
                fontWeight: 700,
                marginBottom: "14px",
              }}
            >
              1. Upload Media (Bunny Storage Auto-Connect)
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "20px",
              }}
            >
              {/* Uploader 1: Video File */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    marginBottom: "8px",
                  }}
                >
                  Video File <span style={{ color: "#ef4444" }}>*</span>
                </label>

                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                  onChange={handleVideoSelect}
                  disabled={uploadingVideo}
                  style={{ display: "none" }}
                />

                <div
                  onClick={() => !uploadingVideo && videoInputRef.current?.click()}
                  style={{
                    padding: "20px 16px",
                    border: videoUrl
                      ? "2px solid #10b981"
                      : "2px dashed var(--border-medium)",
                    borderRadius: "12px",
                    backgroundColor: "var(--bg-surface)",
                    textAlign: "center",
                    cursor: uploadingVideo ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  {uploadingVideo ? (
                    <div>
                      <div style={{ fontSize: "1.8rem", marginBottom: "6px" }}>⏳</div>
                      <div style={{ fontSize: "0.9rem", color: "var(--accent-gold)", fontWeight: 600 }}>
                        Uploading to Bunny Storage...
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "4px" }}>
                        {videoFileName} ({videoFileSize})
                      </div>
                    </div>
                  ) : videoUrl ? (
                    <div>
                      <div style={{ fontSize: "1.6rem", color: "#10b981", marginBottom: "4px" }}>✓</div>
                      <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#10b981" }}>
                        Video Successfully Uploaded!
                      </div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-secondary)",
                          marginTop: "4px",
                          fontFamily: "monospace",
                          wordBreak: "break-all",
                        }}
                      >
                        {videoUrl}
                      </div>
                      <div style={{ marginTop: "10px" }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            videoInputRef.current?.click();
                          }}
                          className="btn btn-secondary"
                          style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                        >
                          Change Video
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: "2rem", marginBottom: "6px" }}>🎬</div>
                      <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)" }}>
                        Click to Select Video File
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                        MP4, WebM, MOV (Max 250MB)
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Uploader 2: Thumbnail Image */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    marginBottom: "8px",
                  }}
                >
                  Poster / Thumbnail <span style={{ color: "#ef4444" }}>*</span>
                </label>

                <input
                  ref={thumbInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif,.jpg,.jpeg,.png,.webp"
                  onChange={handleThumbSelect}
                  disabled={uploadingThumb}
                  style={{ display: "none" }}
                />

                <div
                  onClick={() => !uploadingThumb && thumbInputRef.current?.click()}
                  style={{
                    padding: "20px 16px",
                    border: thumbnailUrl
                      ? "2px solid #10b981"
                      : "2px dashed var(--border-medium)",
                    borderRadius: "12px",
                    backgroundColor: "var(--bg-surface)",
                    textAlign: "center",
                    cursor: uploadingThumb ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  {uploadingThumb ? (
                    <div>
                      <div style={{ fontSize: "1.8rem", marginBottom: "6px" }}>⏳</div>
                      <div style={{ fontSize: "0.9rem", color: "var(--accent-gold)", fontWeight: 600 }}>
                        Uploading Thumbnail to Bunny Storage...
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "4px" }}>
                        {thumbFileName}
                      </div>
                    </div>
                  ) : thumbnailUrl ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", textAlign: "left" }}>
                      <img
                        src={thumbnailUrl}
                        alt="Preview"
                        style={{
                          width: "80px",
                          height: "50px",
                          objectFit: "cover",
                          borderRadius: "6px",
                          border: "1px solid var(--border-subtle)",
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#10b981" }}>
                          ✓ Thumbnail Uploaded
                        </div>
                        <div
                          style={{
                            fontSize: "0.72rem",
                            color: "var(--text-secondary)",
                            fontFamily: "monospace",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {thumbnailUrl}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            thumbInputRef.current?.click();
                          }}
                          className="btn btn-secondary"
                          style={{ padding: "2px 8px", fontSize: "0.72rem", marginTop: "6px" }}
                        >
                          Change Image
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: "2rem", marginBottom: "6px" }}>🖼️</div>
                      <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)" }}>
                        Click to Select Thumbnail
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                        JPG, PNG, WebP (16:9 ratio recommended)
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ================= SECTION 2: FULL TITLE INFORMATION ================= */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div
              style={{
                fontSize: "0.78rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--accent-gold)",
                fontWeight: 700,
              }}
            >
              2. Full Title Information
            </div>

            {/* Judul & Type */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "6px", fontWeight: 600 }}>
                  Title <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Solo Max-Level Newbie"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ width: "100%", fontSize: "0.95rem", fontWeight: 600 }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "6px", fontWeight: 600 }}>
                  TYPE
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  style={{ width: "100%", fontWeight: 600 }}
                >
                  <option value="Manhwa">Manhwa</option>
                  <option value="Donghua">Donghua</option>
                  <option value="Anime">Anime</option>
                  <option value="Manga">Manga</option>
                  <option value="Webtoon">Webtoon</option>
                  <option value="Drama Series">Drama Series</option>
                </select>
              </div>
            </div>

            {/* Synopsis */}
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "6px", fontWeight: 600 }}>
                SYNOPSIS <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="Write a summary or complete synopsis..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ width: "100%", resize: "vertical", fontSize: "0.9rem" }}
              />
            </div>

            {/* Genre, Status, & Posted By */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "6px", fontWeight: 600 }}>
                  GENRE (Separate with commas)
                </label>
                <input
                  type="text"
                  placeholder="Action, Fantasy, Romance, Drama"
                  value={genres}
                  onChange={(e) => setGenres(e.target.value)}
                  style={{ width: "100%" }}
                />
                {/* Quick genre pills */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
                  {quickGenres.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => {
                        if (!genres.includes(g)) {
                          setGenres(genres ? `${genres}, ${g}` : g);
                        }
                      }}
                      style={{
                        background: "var(--bg-surface-elevated)",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--text-muted)",
                        fontSize: "0.72rem",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      +{g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "6px", fontWeight: 600 }}>
                  STATUS
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={{ width: "100%", fontWeight: 600, color: status === "Ongoing" ? "#10b981" : "inherit" }}
                >
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                  <option value="Hiatus">Hiatus</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "6px", fontWeight: 600 }}>
                  POSTED BY
                </label>
                <input
                  type="text"
                  value={postedBy}
                  onChange={(e) => setPostedBy(e.target.value)}
                  style={{ width: "100%", fontWeight: 600 }}
                />
              </div>
            </div>

            {/* Kategori & Tingkat Akses */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                    Menu Category
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomCategory(!isCustomCategory)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--accent-gold)",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                      fontWeight: 600,
                      textDecoration: "underline",
                    }}
                  >
                    {isCustomCategory ? "Select from List" : "+ New Category"}
                  </button>
                </div>
                {isCustomCategory ? (
                  <input
                    type="text"
                    required
                    placeholder="New category name"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    style={{ width: "100%" }}
                  />
                ) : (
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{ width: "100%" }}
                  >
                    <option value="Manhwa">Manhwa</option>
                    <option value="Midnight Noir">Midnight Noir</option>
                    <option value="Velvet Sessions">Velvet Sessions</option>
                    <option value="Elegance & Silk">Elegance & Silk</option>
                    <option value="Tokyo Nocturne">Tokyo Nocturne</option>
                    <option value="Romance & Passion">Romance & Passion</option>
                    <option value="Sensual Aesthetics">Sensual Aesthetics</option>
                  </select>
                )}
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "6px", fontWeight: 600 }}>
                  Audience Access Level
                </label>
                <select
                  value={accessLevel}
                  onChange={(e) => setAccessLevel(e.target.value)}
                  style={{ width: "100%", fontWeight: 600 }}
                >
                  <option value="PUBLIC">PUBLIC (Free for Everyone)</option>
                  <option value="MEMBER">MEMBER (Subscribers Only)</option>
                  <option value="PREMIUM">PREMIUM (VIP Sovereign)</option>
                </select>
              </div>
            </div>

            {/* Chapter 1 Details & Durasi */}
            <div
              style={{
                padding: "16px",
                borderRadius: "12px",
                backgroundColor: "var(--bg-surface-elevated)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div style={{ fontSize: "0.84rem", fontWeight: 700, color: "var(--accent-gold)", marginBottom: "12px" }}>
                Premiere Chapter (Chapter 1)
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "100px 1fr 140px", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Chapter No.
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={chapterNumber}
                    onChange={(e) => setChapterNumber(parseInt(e.target.value) || 1)}
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Chapter Title
                  </label>
                  <input
                    type="text"
                    required
                    value={chapterTitle}
                    onChange={(e) => setChapterTitle(e.target.value)}
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Duration (Auto-detected)
                  </label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 24 min"
                    style={{ width: "100%" }}
                  />
                </div>
              </div>
            </div>

            {/* Featured Checkbox */}
            <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "0.88rem" }}>
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                style={{ width: "18px", height: "18px", accentColor: "var(--accent-gold)" }}
              />
              <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                Feature on Hero / Highlights
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              paddingTop: "16px",
              borderTop: "1px solid var(--border-subtle)",
              marginTop: "8px",
            }}
          >
            <button
              type="submit"
              disabled={submitting || uploadingThumb || uploadingVideo}
              className="btn btn-primary"
              style={{
                flex: 1,
                padding: "12px 24px",
                fontSize: "0.95rem",
                fontWeight: 700,
                opacity: submitting || uploadingThumb || uploadingVideo ? 0.6 : 1,
              }}
            >
              {submitting
                ? "Saving & Publishing..."
                : uploadingThumb || uploadingVideo
                ? "Waiting for File Upload to Complete..."
                : "Save & Publish Title"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
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
