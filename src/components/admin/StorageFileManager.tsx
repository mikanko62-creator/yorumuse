"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";

interface StorageItem {
  Guid: string;
  StorageZoneName: string;
  Path: string;
  ObjectName: string;
  Length: number;
  Checksum?: string | null;
  IsDirectory: boolean;
  DateCreated: string;
  LastChanged: string;
  cdnUrl?: string;
}

interface StorageFileManagerProps {
  onOpenUploadModal?: () => void;
}

export default function StorageFileManager({ onOpenUploadModal }: StorageFileManagerProps = {}) {
  const [currentFolder, setCurrentFolder] = useState<string>("");
  const [items, setItems] = useState<StorageItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [deletingName, setDeletingName] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [previewItem, setPreviewItem] = useState<StorageItem | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = useCallback(async (folder: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/storage?folder=${encodeURIComponent(folder)}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load files from Bunny Storage");
      }
      const data = await res.json();
      setItems(data.items || []);
    } catch (err: any) {
      setError(err.message || "Failed to connect to Bunny Storage API");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles(currentFolder);
  }, [currentFolder, fetchFiles]);

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  const handleDelete = async (item: StorageItem) => {
    const fullPath = currentFolder ? `${currentFolder}/${item.ObjectName}` : item.ObjectName;
    const confirmMsg = item.IsDirectory
      ? `Delete folder "${item.ObjectName}" and all its contents from Bunny Storage?`
      : `Delete file "${item.ObjectName}" from Bunny Storage?`;

    if (!window.confirm(confirmMsg)) return;

    setDeletingName(item.ObjectName);
    try {
      const res = await fetch("/api/admin/storage", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: fullPath }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete file");
      }

      // Optimistic update
      setItems((prev) => prev.filter((it) => it.ObjectName !== item.ObjectName));
    } catch (err: any) {
      alert(err.message || "Failed to delete");
    } finally {
      setDeletingName(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", currentFolder);

      try {
        const res = await fetch("/api/admin/storage", {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          successCount++;
        }
      } catch (err) {
        console.error("Upload failed for:", file.name, err);
      }
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    fetchFiles(currentFolder);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const isImage = (name: string) => /\.(jpg|jpeg|png|webp|gif|avif|svg)$/i.test(name);
  const isVideo = (name: string) => /\.(mp4|webm|mov|mkv|avi)$/i.test(name);

  const filteredItems = items.filter((it) =>
    it.ObjectName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalBytes = items.reduce((acc, it) => acc + (it.Length || 0), 0);
  const totalFiles = items.filter((it) => !it.IsDirectory).length;
  const totalFolders = items.filter((it) => it.IsDirectory).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header Bar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          background: "var(--bg-surface)",
          padding: "20px 24px",
          borderRadius: "16px",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
              Bunny.net Cloud Storage Manager
            </h2>
            <span
              style={{
                fontSize: "0.75rem",
                padding: "2px 8px",
                borderRadius: "12px",
                background: "rgba(34, 197, 94, 0.15)",
                color: "#22c55e",
                border: "1px solid rgba(34, 197, 94, 0.3)",
                fontWeight: 600,
              }}
            >
              Direct API Connected
            </span>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: "4px 0 0" }}>
            Manage CDN files, preview thumbnails, stream videos, upload, and delete files with ease.
          </p>
        </div>

        {/* Stats & Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div
            style={{
              padding: "8px 14px",
              background: "var(--bg-surface-elevated)",
              borderRadius: "8px",
              border: "1px solid var(--border-subtle)",
              fontSize: "0.8rem",
              color: "var(--text-secondary)",
            }}
          >
            <strong style={{ color: "var(--text-primary)" }}>{totalFiles}</strong> {totalFiles === 1 ? "file" : "files"},{" "}
            <strong style={{ color: "var(--text-primary)" }}>{totalFolders}</strong> {totalFolders === 1 ? "folder" : "folders"} (
            <span style={{ color: "var(--accent-gold)" }}>{formatBytes(totalBytes)}</span>)
          </div>

          <button
            onClick={() => fetchFiles(currentFolder)}
            disabled={loading}
            className="btn btn-secondary"
            style={{ padding: "8px 14px", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            <span>{loading ? "Loading..." : "Refresh"}</span>
          </button>

          {onOpenUploadModal && (
            <button
              type="button"
              onClick={onOpenUploadModal}
              className="btn btn-primary"
              style={{
                padding: "8px 18px",
                fontSize: "0.85rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "linear-gradient(135deg, #d4af37 0%, #aa820a 100%)",
                border: "none",
                color: "#000",
                fontWeight: 700,
              }}
            >
              <span>+ Upload Video / New Title</span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileUpload}
            style={{ display: "none" }}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="btn btn-primary"
            style={{ padding: "8px 18px", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            {uploading ? (
              <span>Uploading...</span>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span>Upload to {currentFolder ? `/${currentFolder}` : "Root"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Breadcrumb & Quick Jump */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          padding: "12px 16px",
          background: "var(--bg-surface-elevated)",
          borderRadius: "12px",
          border: "1px solid var(--border-subtle)",
        }}
      >
        {/* Breadcrumbs */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem" }}>
          <button
            onClick={() => setCurrentFolder("")}
            style={{
              background: "none",
              border: "none",
              color: currentFolder === "" ? "var(--accent-gold)" : "var(--text-secondary)",
              fontWeight: currentFolder === "" ? 700 : 500,
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: "6px",
            }}
          >
            📁 yorumuse-storage (root)
          </button>

          {currentFolder && (
            <>
              <span style={{ color: "var(--text-muted)" }}>/</span>
              <span style={{ color: "var(--accent-gold)", fontWeight: 700, padding: "4px 8px" }}>
                📂 {currentFolder}
              </span>
            </>
          )}
        </div>

        {/* Quick Folders & View Toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => setCurrentFolder("thumbnails")}
            className="btn btn-secondary"
            style={{
              padding: "4px 10px",
              fontSize: "0.78rem",
              background: currentFolder === "thumbnails" ? "rgba(212, 175, 55, 0.2)" : undefined,
              borderColor: currentFolder === "thumbnails" ? "var(--accent-gold)" : undefined,
            }}
          >
            🖼️ /thumbnails
          </button>
          <button
            onClick={() => setCurrentFolder("videos")}
            className="btn btn-secondary"
            style={{
              padding: "4px 10px",
              fontSize: "0.78rem",
              background: currentFolder === "videos" ? "rgba(212, 175, 55, 0.2)" : undefined,
              borderColor: currentFolder === "videos" ? "var(--accent-gold)" : undefined,
            }}
          >
            🎬 /videos
          </button>

          {/* Search bar */}
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: "6px 12px",
              fontSize: "0.82rem",
              borderRadius: "8px",
              border: "1px solid var(--border-subtle)",
              background: "var(--bg-surface)",
              color: "var(--text-primary)",
              width: "180px",
            }}
          />

          {/* View mode */}
          <button
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            className="btn btn-secondary"
            style={{ padding: "6px 10px", fontSize: "0.8rem" }}
            title="Switch View"
          >
            {viewMode === "grid" ? "📋 List" : "🔲 Grid"}
          </button>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div
          style={{
            padding: "14px 18px",
            borderRadius: "8px",
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#f87171",
            fontSize: "0.88rem",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Copied notification */}
      {copiedUrl && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            background: "var(--accent-gold)",
            color: "#000",
            fontWeight: 700,
            padding: "10px 18px",
            borderRadius: "8px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            zIndex: 9999,
            fontSize: "0.88rem",
          }}
        >
          ✓ CDN URL copied to clipboard!
        </div>
      )}

      {/* Content Area */}
      {loading ? (
        <div
          style={{
            padding: "80px 20px",
            textAlign: "center",
            color: "var(--accent-gold)",
            fontSize: "1.1rem",
            fontFamily: "var(--font-serif)",
          }}
        >
          Loading files directly from Bunny Storage API...
        </div>
      ) : filteredItems.length === 0 ? (
        <div
          style={{
            padding: "60px 20px",
            textAlign: "center",
            background: "var(--bg-surface)",
            borderRadius: "16px",
            border: "1px dashed var(--border-subtle)",
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📂</div>
          <h4 style={{ color: "var(--text-primary)", margin: "0 0 6px" }}>This folder is empty</h4>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", margin: 0 }}>
            No files or items found. Use the &quot;Upload&quot; button above to upload files.
          </p>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "18px",
          }}
        >
          {filteredItems.map((item) => {
            const isDir = item.IsDirectory;
            const img = !isDir && isImage(item.ObjectName);
            const vid = !isDir && isVideo(item.ObjectName);

            return (
              <div
                key={item.Guid || item.ObjectName}
                style={{
                  background: "var(--bg-surface)",
                  borderRadius: "12px",
                  border: "1px solid var(--border-subtle)",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.15s ease, border-color 0.15s ease",
                }}
              >
                {/* Media Preview / Folder Icon */}
                <div
                  onClick={() => {
                    if (isDir) {
                      setCurrentFolder(item.ObjectName);
                    } else if (img || vid) {
                      setPreviewItem(item);
                    }
                  }}
                  style={{
                    height: "140px",
                    background: "var(--bg-surface-elevated)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {isDir ? (
                    <div style={{ textAlign: "center" }}>
                      <span style={{ fontSize: "3rem" }}>📁</span>
                      <div style={{ fontSize: "0.75rem", color: "var(--accent-gold)", fontWeight: 600 }}>
                        Open Folder
                      </div>
                    </div>
                  ) : img && item.cdnUrl ? (
                    <img
                      src={item.cdnUrl}
                      alt={item.ObjectName}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      loading="lazy"
                    />
                  ) : vid ? (
                    <div style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                      <span style={{ fontSize: "2.8rem" }}>🎬</span>
                      <div style={{ fontSize: "0.72rem", marginTop: "4px" }}>Click to Play</div>
                    </div>
                  ) : (
                    <span style={{ fontSize: "2.5rem" }}>📄</span>
                  )}

                  {!isDir && (
                    <span
                      style={{
                        position: "absolute",
                        bottom: "6px",
                        right: "6px",
                        background: "rgba(0,0,0,0.75)",
                        color: "#fff",
                        fontSize: "0.7rem",
                        padding: "2px 6px",
                        borderRadius: "4px",
                      }}
                    >
                      {formatBytes(item.Length)}
                    </span>
                  )}
                </div>

                {/* Details */}
                <div style={{ padding: "12px", flex: 1, display: "flex", flexDirection: "column" }}>
                  <div
                    title={item.ObjectName}
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      marginBottom: "6px",
                    }}
                  >
                    {item.ObjectName}
                  </div>

                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: "12px" }}>
                    {new Date(item.LastChanged || item.DateCreated).toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>

                  {/* Actions */}
                  <div style={{ marginTop: "auto", display: "flex", gap: "6px" }}>
                    {item.cdnUrl && (
                      <button
                        onClick={() => handleCopy(item.cdnUrl!)}
                        className="btn btn-secondary"
                        style={{ flex: 1, padding: "5px 8px", fontSize: "0.72rem" }}
                        title="Copy CDN Link"
                      >
                        Copy URL
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(item)}
                      disabled={deletingName === item.ObjectName}
                      className="btn btn-secondary"
                      style={{
                        padding: "5px 8px",
                        fontSize: "0.72rem",
                        color: "#ef4444",
                        borderColor: "rgba(239, 68, 68, 0.3)",
                      }}
                      title="Delete from Bunny Storage"
                    >
                      {deletingName === item.ObjectName ? "..." : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div
          style={{
            background: "var(--bg-surface)",
            borderRadius: "16px",
            border: "1px solid var(--border-subtle)",
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ background: "var(--bg-surface-elevated)", borderBottom: "1px solid var(--border-subtle)" }}>
                <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--text-secondary)" }}>Name</th>
                <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--text-secondary)" }}>Size</th>
                <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--text-secondary)" }}>Type</th>
                <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--text-secondary)" }}>Date</th>
                <th style={{ padding: "12px 16px", textAlign: "right", color: "var(--text-secondary)" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr
                  key={item.Guid || item.ObjectName}
                  style={{ borderBottom: "1px solid var(--border-subtle)" }}
                >
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span>{item.IsDirectory ? "📁" : isImage(item.ObjectName) ? "🖼️" : isVideo(item.ObjectName) ? "🎬" : "📄"}</span>
                      {item.IsDirectory ? (
                        <button
                          onClick={() => setCurrentFolder(item.ObjectName)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--accent-gold)",
                            fontWeight: 600,
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          {item.ObjectName}
                        </button>
                      ) : (
                        <span
                          onClick={() => setPreviewItem(item)}
                          style={{ color: "var(--text-primary)", fontWeight: 500, cursor: "pointer" }}
                        >
                          {item.ObjectName}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>
                    {item.IsDirectory ? "—" : formatBytes(item.Length)}
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--text-muted)" }}>
                    {item.IsDirectory ? "Folder" : item.ObjectName.split(".").pop()?.toUpperCase() || "FILE"}
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>
                    {new Date(item.LastChanged || item.DateCreated).toLocaleDateString("en-US")}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "8px" }}>
                      {item.cdnUrl && (
                        <button
                          onClick={() => handleCopy(item.cdnUrl!)}
                          className="btn btn-secondary"
                          style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                        >
                          Copy URL
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(item)}
                        disabled={deletingName === item.ObjectName}
                        className="btn btn-secondary"
                        style={{
                          padding: "4px 10px",
                          fontSize: "0.75rem",
                          color: "#ef4444",
                          borderColor: "rgba(239, 68, 68, 0.3)",
                        }}
                      >
                        {deletingName === item.ObjectName ? "..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Preview Modal */}
      {previewItem && (
        <div
          onClick={() => setPreviewItem(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: "24px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--bg-surface)",
              borderRadius: "16px",
              border: "1px solid var(--border-subtle)",
              maxWidth: "800px",
              width: "100%",
              overflow: "hidden",
              boxShadow: "0 24px 48px rgba(0,0,0,0.8)",
            }}
          >
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid var(--border-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <h3 style={{ fontSize: "1rem", margin: 0, color: "var(--text-primary)" }}>
                {previewItem.ObjectName}
              </h3>
              <button
                onClick={() => setPreviewItem(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-secondary)",
                  fontSize: "1.2rem",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: "20px", textAlign: "center", background: "#000" }}>
              {isImage(previewItem.ObjectName) ? (
                <img
                  src={previewItem.cdnUrl}
                  alt={previewItem.ObjectName}
                  style={{ maxWidth: "100%", maxHeight: "60vh", objectFit: "contain" }}
                />
              ) : isVideo(previewItem.ObjectName) ? (
                <video
                  src={previewItem.cdnUrl}
                  controls
                  autoPlay
                  style={{ maxWidth: "100%", maxHeight: "60vh" }}
                />
              ) : (
                <p style={{ color: "#fff" }}>Preview is not available for this file type.</p>
              )}
            </div>

            <div
              style={{
                padding: "16px 20px",
                background: "var(--bg-surface-elevated)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                Size: {formatBytes(previewItem.Length)}
              </span>
              <div style={{ display: "flex", gap: "10px" }}>
                {previewItem.cdnUrl && (
                  <button
                    onClick={() => handleCopy(previewItem.cdnUrl!)}
                    className="btn btn-primary"
                    style={{ padding: "6px 14px", fontSize: "0.82rem" }}
                  >
                    Copy CDN URL
                  </button>
                )}
                <button
                  onClick={() => setPreviewItem(null)}
                  className="btn btn-secondary"
                  style={{ padding: "6px 14px", fontSize: "0.82rem" }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
