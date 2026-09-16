"use client";

import React, { useEffect } from "react";
import Link from "next/link";

interface QuickActionsSidebarProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onSelectTab: (tab: "overview" | "posts" | "hero" | "content" | "users" | "moderation") => void;
  onAddContent: () => void;
  onAddUser: () => void;
  onAddHero: () => void;
  currentUserEmail?: string;
}

export default function QuickActionsSidebar({
  isOpen,
  onOpen,
  onClose,
  onSelectTab,
  onAddContent,
  onAddUser,
  onAddHero,
  currentUserEmail,
}: QuickActionsSidebarProps) {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Floating 3-line Toggle on Left Screen Edge when closed */}
      {!isOpen && (
        <button
          onClick={onOpen}
          style={{
            position: "fixed",
            left: 0,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 9998,
            backgroundColor: "var(--bg-surface-elevated)",
            border: "1px solid var(--accent-gold)",
            borderLeft: "none",
            borderRadius: "0 10px 10px 0",
            padding: "12px 10px",
            boxShadow: "4px 4px 20px rgba(0, 0, 0, 0.6), 0 0 15px rgba(184, 138, 37, 0.25)",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
            color: "var(--accent-gold)",
            transition: "all 0.2s ease",
          }}
          title="Open Quick Actions Menu"
          id="floating-left-hamburger-btn"
        >
          <span style={{ display: "block", width: "20px", height: "2.5px", backgroundColor: "var(--accent-gold)", borderRadius: "2px" }} />
          <span style={{ display: "block", width: "20px", height: "2.5px", backgroundColor: "var(--accent-gold)", borderRadius: "2px" }} />
          <span style={{ display: "block", width: "20px", height: "2.5px", backgroundColor: "var(--accent-gold)", borderRadius: "2px" }} />
        </button>
      )}

      {/* Backdrop Overlay when open */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10001,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            transition: "opacity 0.25s ease",
          }}
        />
      )}

      {/* Slide-over Sidebar Drawer on LEFT side */}
      <aside
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: "100%",
          maxWidth: "380px",
          zIndex: 10002,
          backgroundColor: "var(--bg-surface)",
          borderRight: "1px solid rgba(212, 175, 55, 0.35)",
          boxShadow: "10px 0 40px rgba(0, 0, 0, 0.8), 0 0 25px rgba(184, 138, 37, 0.15)",
          display: "flex",
          flexDirection: "column",
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          overflowY: "auto",
        }}
      >
        {/* Sidebar Header */}
        <div
          style={{
            padding: "24px 22px",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            background: "linear-gradient(180deg, rgba(212, 175, 55, 0.08) 0%, transparent 100%)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  backgroundColor: "var(--accent-gold)",
                  color: "#000",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--accent-gold)", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                Control Center
              </span>
            </div>
            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.35rem", color: "var(--text-primary)", margin: 0 }}>
              Admin Quick Actions
            </h3>
            <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: "4px 0 0" }}>
              Instant shortcuts & YoruMuse platform controls
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "var(--bg-surface-elevated)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-muted)",
              borderRadius: "8px",
              padding: "6px 10px",
              cursor: "pointer",
              fontSize: "1rem",
              lineHeight: 1,
              transition: "color 0.15s",
            }}
            title="Close Sidebar (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Sidebar Body Content */}
        <div style={{ padding: "22px", display: "flex", flexDirection: "column", gap: "22px", flexGrow: 1 }}>
          {/* SECTION 1: AKSI PEMBUATAN BARU (CREATE SHORTCUTS) */}
          <div>
            <span
              style={{
                display: "block",
                fontSize: "0.72rem",
                fontWeight: 800,
                letterSpacing: "0.12em",
                color: "var(--accent-gold)",
                textTransform: "uppercase",
                marginBottom: "10px",
              }}
            >
              Creation Actions
            </span>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {/* Button: Tambah Film Baru */}
              <button
                onClick={() => {
                  onClose();
                  onAddContent();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "14px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(212, 175, 55, 0.08)",
                  border: "1px solid var(--accent-gold)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "transform 0.15s, background-color 0.15s",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    backgroundColor: "var(--accent-gold)",
                    color: "#000",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                    <line x1="7" y1="2" x2="7" y2="22" />
                    <line x1="17" y1="2" x2="17" y2="22" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.9rem" }}>
                    + Create Series & Chapter
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                    Upload anti-theft video & poster
                  </div>
                </div>
              </button>

              {/* Button: Add New User */}
              <button
                onClick={() => {
                  onClose();
                  onAddUser();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "14px",
                  borderRadius: "10px",
                  backgroundColor: "var(--bg-surface-elevated)",
                  border: "1px solid var(--border-subtle)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "transform 0.15s, border-color 0.15s",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(59, 130, 246, 0.15)",
                    color: "#60a5fa",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.9rem" }}>
                    + Add New User
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                    Create member or super user account
                  </div>
                </div>
              </button>

              {/* Button: Tambah Slide Hero Baru */}
              <button
                onClick={() => {
                  onClose();
                  onAddHero();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "14px",
                  borderRadius: "10px",
                  backgroundColor: "var(--bg-surface-elevated)",
                  border: "1px solid var(--border-subtle)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "transform 0.15s, border-color 0.15s",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(168, 85, 247, 0.15)",
                    color: "#c084fc",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.9rem" }}>
                    + Add New Hero Slide
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                    Homepage carousel banner
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* SECTION 2: PINTASAN MODUL ADMINISTRATOR */}
          <div>
            <span
              style={{
                display: "block",
                fontSize: "0.72rem",
                fontWeight: 800,
                letterSpacing: "0.12em",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                marginBottom: "10px",
              }}
            >
              Quick Module Navigation
            </span>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <button
                onClick={() => {
                  onSelectTab("posts");
                  onClose();
                }}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  backgroundColor: "var(--bg-surface-elevated)",
                  border: "1px solid var(--border-subtle)",
                  cursor: "pointer",
                  color: "var(--text-primary)",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  textAlign: "left",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <span>Manage All Posts</span>
                </span>
                <span style={{ color: "var(--accent-gold)", fontSize: "0.8rem" }}>→</span>
              </button>

              <button
                onClick={() => {
                  onSelectTab("hero");
                  onClose();
                }}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  backgroundColor: "var(--bg-surface-elevated)",
                  border: "1px solid var(--border-subtle)",
                  cursor: "pointer",
                  color: "var(--text-primary)",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  textAlign: "left",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <span>Edit Hero Section</span>
                </span>
                <span style={{ color: "var(--accent-gold)", fontSize: "0.8rem" }}>→</span>
              </button>

              <button
                onClick={() => {
                  onSelectTab("content");
                  onClose();
                }}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  backgroundColor: "var(--bg-surface-elevated)",
                  border: "1px solid var(--border-subtle)",
                  cursor: "pointer",
                  color: "var(--text-primary)",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  textAlign: "left",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                  </svg>
                  <span>Series & Chapters Catalog</span>
                </span>
                <span style={{ color: "var(--accent-gold)", fontSize: "0.8rem" }}>→</span>
              </button>

              <button
                onClick={() => {
                  onSelectTab("users");
                  onClose();
                }}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  backgroundColor: "var(--bg-surface-elevated)",
                  border: "1px solid var(--border-subtle)",
                  cursor: "pointer",
                  color: "var(--text-primary)",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  textAlign: "left",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <span>User List & Admin Whitelist</span>
                </span>
                <span style={{ color: "var(--accent-gold)", fontSize: "0.8rem" }}>→</span>
              </button>

              <button
                onClick={() => {
                  onSelectTab("moderation");
                  onClose();
                }}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  backgroundColor: "var(--bg-surface-elevated)",
                  border: "1px solid var(--border-subtle)",
                  cursor: "pointer",
                  color: "var(--text-primary)",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  textAlign: "left",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span>Report Moderation Center</span>
                </span>
                <span style={{ color: "var(--accent-gold)", fontSize: "0.8rem" }}>→</span>
              </button>
            </div>
          </div>

          {/* SECTION 3: EXTERNAL & SERVER INFO */}
          <div style={{ marginTop: "auto" }}>
            <span
              style={{
                display: "block",
                fontSize: "0.72rem",
                fontWeight: 800,
                letterSpacing: "0.12em",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                marginBottom: "10px",
              }}
            >
              System & Connection
            </span>

            <div
              style={{
                padding: "14px",
                borderRadius: "10px",
                backgroundColor: "var(--bg-surface-elevated)",
                border: "1px solid var(--border-subtle)",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                fontSize: "0.78rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Server DB:</span>
                <span style={{ color: "var(--status-success)", fontWeight: 700 }}>● eu-central-1 (Frankfurt)</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Admin Session:</span>
                <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{currentUserEmail || "Active Admin"}</span>
              </div>

              <div style={{ paddingTop: "8px", borderTop: "1px dashed var(--border-subtle)", display: "flex", gap: "8px" }}>
                <Link
                  href="/"
                  target="_blank"
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1, textAlign: "center", fontSize: "0.75rem" }}
                >
                  Open Homepage
                </Link>
                <Link
                  href="/membership"
                  target="_blank"
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1, textAlign: "center", fontSize: "0.75rem" }}
                >
                  Membership
                </Link>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
