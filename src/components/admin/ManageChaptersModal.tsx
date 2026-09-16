"use client";

import React, { useState, useEffect, useCallback } from "react";

interface ContentRow {
  id: string;
  title: string;
  slug: string;
  category: string;
  thumbnail: string;
}

interface ChapterItem {
  id: string;
  contentId: string;
  chapterNumber: number;
  title: string;
  description?: string | null;
  thumbnail?: string | null;
  videoUrl: string;
  duration?: string | null;
  published: boolean;
  views: number;
  _count?: {
    comments: number;
  };
}

interface ManageChaptersModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentItem: ContentRow | null;
}

export default function ManageChaptersModal({
  isOpen,
  onClose,
  contentItem,
}: ManageChaptersModalProps) {
  const [chapters, setChapters] = useState<ChapterItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);

  // Add Chapter Form State
  const [newNumber, setNewNumber] = useState<number>(1);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newDuration, setNewDuration] = useState("45 min");
  const [newPublished, setNewPublished] = useState(true);
  const [savingNew, setSavingNew] = useState(false);
  const [uploadingNewVideo, setUploadingNewVideo] = useState(false);

  // Edit Chapter Form State
  const [editNumber, setEditNumber] = useState<number>(1);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editVideoUrl, setEditVideoUrl] = useState("");
  const [editDuration, setEditDuration] = useState("45 min");
  const [editPublished, setEditPublished] = useState(true);
  const [savingEdit, setSavingEdit] = useState(false);
  const [uploadingEditVideo, setUploadingEditVideo] = useState(false);

  const loadChapters = useCallback(async () => {
    if (!contentItem) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/content/${contentItem.id}/chapters`);
      const data = await res.json();
      if (res.ok) {
        setChapters(data.chapters || []);
        // Determine next chapter number
        const maxNum = (data.chapters || []).reduce((max: number, c: ChapterItem) => Math.max(max, c.chapterNumber), 0);
        setNewNumber(maxNum + 1);
        setNewTitle(`Chapter ${maxNum + 1}`);
      }
    } catch (err) {
      console.error("Error loading chapters:", err);
    } finally {
      setLoading(false);
    }
  }, [contentItem]);

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
    if (isOpen && contentItem) {
      loadChapters();
      setShowAddForm(false);
      setEditingChapterId(null);
    }
  }, [isOpen, contentItem, loadChapters]);

  if (!isOpen || !contentItem) return null;

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isEdit) setUploadingEditVideo(true);
    else setUploadingNewVideo(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "video");

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload video.");

      if (isEdit) {
        setEditVideoUrl(data.url);
      } else {
        setNewVideoUrl(data.url);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to upload video.");
    } finally {
      if (isEdit) setUploadingEditVideo(false);
      else setUploadingNewVideo(false);
    }
  };

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newVideoUrl.trim()) {
      alert("Chapter title and video URL are required.");
      return;
    }

    setSavingNew(true);
    try {
      const res = await fetch(`/api/content/${contentItem.id}/chapters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapterNumber: newNumber,
          title: newTitle.trim(),
          description: newDesc.trim() || null,
          videoUrl: newVideoUrl.trim(),
          duration: newDuration.trim() || "45 min",
          published: newPublished,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create chapter.");

      setShowAddForm(false);
      setNewDesc("");
      setNewVideoUrl("");
      await loadChapters();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add chapter.");
    } finally {
      setSavingNew(false);
    }
  };

  const startEditChapter = (ch: ChapterItem) => {
    setEditingChapterId(ch.id);
    setEditNumber(ch.chapterNumber);
    setEditTitle(ch.title);
    setEditDesc(ch.description || "");
    setEditVideoUrl(ch.videoUrl);
    setEditDuration(ch.duration || "45 min");
    setEditPublished(ch.published);
  };

  const handleUpdateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChapterId) return;

    setSavingEdit(true);
    try {
      const res = await fetch(`/api/admin/chapters/${editingChapterId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapterNumber: editNumber,
          title: editTitle.trim(),
          description: editDesc.trim() || null,
          videoUrl: editVideoUrl.trim(),
          duration: editDuration.trim(),
          published: editPublished,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update chapter.");

      setEditingChapterId(null);
      await loadChapters();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save chapter changes.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteChapter = async (chapterId: string, chapterTitle: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${chapterTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/chapters/${chapterId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete chapter.");

      await loadChapters();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete chapter.");
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
        if (e.target === e.currentTarget && !savingNew && !savingEdit) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "840px",
          backgroundColor: "var(--bg-surface)",
          border: "1px solid rgba(212, 175, 55, 0.4)",
          borderRadius: "20px",
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 35px rgba(184, 138, 37, 0.15)",
          padding: "32px",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <img
              src={contentItem.thumbnail}
              alt={contentItem.title}
              style={{ width: "70px", height: "46px", objectFit: "cover", borderRadius: "6px", border: "1px solid var(--border-subtle)" }}
            />
            <div>
              <span style={{ fontSize: "0.75rem", color: "var(--accent-gold)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                CHAPTER MANAGEMENT • SUPER USER
              </span>
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.45rem", color: "var(--text-primary)", margin: "2px 0 0" }}>
                {contentItem.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
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

        {/* Action Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", paddingBottom: "14px", borderBottom: "1px solid var(--border-subtle)" }}>
          <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)", fontWeight: 600 }}>
            Total Chapters: <span style={{ color: "var(--accent-gold)" }}>{chapters.length} Episodes</span>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowAddForm(!showAddForm);
              setEditingChapterId(null);
            }}
            className="btn btn-primary btn-sm"
          >
            {showAddForm ? "✕ Close Form" : "+ Add New Chapter"}
          </button>
        </div>

        {/* --- FORM: TAMBAH CHAPTER BARU --- */}
        {showAddForm && (
          <form
            onSubmit={handleCreateChapter}
            style={{
              padding: "20px",
              borderRadius: "12px",
              backgroundColor: "var(--bg-surface-elevated)",
              border: "1px solid var(--accent-gold)",
              marginBottom: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <h4 style={{ margin: "0 0 6px", fontSize: "1.05rem", color: "var(--accent-gold)" }}>
              Add New Chapter to Series
            </h4>

            <div style={{ display: "grid", gridTemplateColumns: "100px 1fr 140px", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Chapter No. *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newNumber}
                  onChange={(e) => setNewNumber(parseInt(e.target.value) || 1)}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--border-medium)", backgroundColor: "var(--bg-surface)", color: "var(--text-primary)" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Chapter Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Chapter 2: The Moonlit Vow"
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--border-medium)", backgroundColor: "var(--bg-surface)", color: "var(--text-primary)" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Duration
                </label>
                <input
                  type="text"
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  placeholder="45 min"
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--border-medium)", backgroundColor: "var(--bg-surface)", color: "var(--text-primary)" }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <label style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                  Chapter Video URL *
                </label>
                <label style={{ fontSize: "0.75rem", color: "var(--accent-gold)", cursor: "pointer", textDecoration: "underline" }}>
                  <span>{uploadingNewVideo ? "Uploading video..." : "Upload Video File"}</span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleVideoUpload(e, false)}
                    disabled={uploadingNewVideo}
                    style={{ display: "none" }}
                  />
                </label>
              </div>
              <input
                type="text"
                required
                value={newVideoUrl}
                onChange={(e) => setNewVideoUrl(e.target.value)}
                placeholder="/stream/... or encrypted mp4 URL"
                style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--border-medium)", backgroundColor: "var(--bg-surface)", color: "var(--text-primary)" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                Chapter Synopsis (Optional)
              </label>
              <textarea
                rows={2}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Chapter storyline details..."
                style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--border-medium)", backgroundColor: "var(--bg-surface)", color: "var(--text-primary)", resize: "vertical" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", color: "var(--text-primary)", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={newPublished}
                  onChange={(e) => setNewPublished(e.target.checked)}
                  style={{ accentColor: "var(--accent-gold)" }}
                />
                <span>Publish Chapter Immediately</span>
              </label>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingNew || uploadingNewVideo}
                  className="btn btn-primary btn-sm"
                >
                  {savingNew ? "Saving..." : "Save Chapter"}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* --- CHAPTER LIST TABLE --- */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--accent-gold)" }}>
            Loading series chapter list...
          </div>
        ) : chapters.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", backgroundColor: "var(--bg-surface-elevated)", borderRadius: "10px", color: "var(--text-muted)" }}>
            No chapters found for this series yet. Click the button above to add the first chapter.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {chapters.map((ch) => {
              const isEditing = editingChapterId === ch.id;

              return (
                <div
                  key={ch.id}
                  style={{
                    backgroundColor: isEditing ? "rgba(212, 175, 55, 0.08)" : "var(--bg-surface-elevated)",
                    borderRadius: "10px",
                    border: isEditing ? "1px solid var(--accent-gold)" : "1px solid var(--border-subtle)",
                    padding: "16px",
                    transition: "all 0.2s",
                  }}
                >
                  {isEditing ? (
                    /* Inline Edit Form */
                    <form onSubmit={handleUpdateChapter} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.82rem", color: "var(--accent-gold)", fontWeight: 700 }}>
                          Edit Chapter #{ch.chapterNumber}
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditingChapterId(null)}
                          style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.8rem" }}
                        >
                          Cancel
                        </button>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "100px 1fr 140px", gap: "10px" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "2px" }}>
                            Chapter No.
                          </label>
                          <input
                            type="number"
                            min="1"
                            required
                            value={editNumber}
                            onChange={(e) => setEditNumber(parseInt(e.target.value) || 1)}
                            style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--border-medium)", backgroundColor: "var(--bg-surface)", color: "var(--text-primary)" }}
                          />
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "2px" }}>
                            Chapter Title
                          </label>
                          <input
                            type="text"
                            required
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--border-medium)", backgroundColor: "var(--bg-surface)", color: "var(--text-primary)" }}
                          />
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "2px" }}>
                            Duration
                          </label>
                          <input
                            type="text"
                            value={editDuration}
                            onChange={(e) => setEditDuration(e.target.value)}
                            style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--border-medium)", backgroundColor: "var(--bg-surface)", color: "var(--text-primary)" }}
                          />
                        </div>
                      </div>

                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                          <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                            Video URL
                          </label>
                          <label style={{ fontSize: "0.72rem", color: "var(--accent-gold)", cursor: "pointer", textDecoration: "underline" }}>
                            <span>{uploadingEditVideo ? "Uploading..." : "Upload Replacement"}</span>
                            <input
                              type="file"
                              accept="video/*"
                              onChange={(e) => handleVideoUpload(e, true)}
                              disabled={uploadingEditVideo}
                              style={{ display: "none" }}
                            />
                          </label>
                        </div>
                        <input
                          type="text"
                          required
                          value={editVideoUrl}
                          onChange={(e) => setEditVideoUrl(e.target.value)}
                          style={{ width: "100%", padding: "6px 8px", borderRadius: "6px", border: "1px solid var(--border-medium)", backgroundColor: "var(--bg-surface)", color: "var(--text-primary)" }}
                        />
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: "var(--text-primary)", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={editPublished}
                            onChange={(e) => setEditPublished(e.target.checked)}
                            style={{ accentColor: "var(--accent-gold)" }}
                          />
                          <span>Published Status</span>
                        </label>

                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            type="button"
                            onClick={() => setEditingChapterId(null)}
                            className="btn btn-secondary btn-sm"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={savingEdit || uploadingEditVideo}
                            className="btn btn-primary btn-sm"
                          >
                            {savingEdit ? "Saving..." : "Save Changes"}
                          </button>
                        </div>
                      </div>
                    </form>
                  ) : (
                    /* Read Row */
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontSize: "1rem", fontWeight: 800, color: "var(--accent-gold)", width: "36px" }}>
                          #{ch.chapterNumber}
                        </span>

                        <div>
                          <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.95rem" }}>
                            {ch.title}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", gap: "12px", marginTop: "2px" }}>
                            <span>Duration: {ch.duration || "45 min"}</span>
                            <span>•</span>
                            <span>Views: {ch.views}</span>
                            <span>•</span>
                            <span>Comments: {ch._count?.comments || 0}</span>
                            <span>•</span>
                            <span style={{ color: ch.published ? "var(--status-success)" : "var(--text-muted)", fontWeight: 600 }}>
                              {ch.published ? "● PUBLISHED" : "○ HIDDEN"}
                            </span>
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "3px", fontFamily: "monospace" }}>
                            {ch.videoUrl}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          type="button"
                          onClick={() => startEditChapter(ch)}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: "0.75rem", padding: "4px 10px" }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteChapter(ch.id, ch.title)}
                          className="btn btn-ghost btn-sm"
                          style={{ color: "var(--status-error)", fontSize: "0.75rem", padding: "4px 10px" }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
