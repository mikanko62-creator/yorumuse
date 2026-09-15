"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "../common/Logo";

interface UserState {
  id: string;
  username: string;
  email: string;
  role: string;
  subscription?: {
    status: string;
    planId: string;
  } | null;
}

interface NavigationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserState | null;
  isAdmin: boolean;
}

export default function NavigationSidebar({
  isOpen,
  onClose,
  user,
  isAdmin,
}: NavigationSidebarProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Mount check for safe createPortal SSR compatibility
  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Lock body scroll when sidebar is open to prevent page scrolling underneath
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  // Kategori Utama sesuai dengan Navigasi Header
  const headerCategories = [
    {
      label: "Home",
      href: "/",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      label: "Browse",
      href: "/browse",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
      subCategories: [
        { label: "Semua Koleksi", href: "/browse" },
        { label: "Romance & Drama", href: "/browse?category=Romance" },
        { label: "Fantasy & Supernatural", href: "/browse?category=Fantasy" },
        { label: "Action & Thriller", href: "/browse?category=Action" },
        { label: "Mystery & Noir", href: "/browse?category=Mystery" },
      ],
    },
    {
      label: "Membership",
      href: "/membership",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ),
    },
    {
      label: "Community",
      href: "/community",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      ),
    },
  ];

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Fullscreen Backdrop Overlay - Attached to document.body */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(15, 23, 42, 0.65)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          zIndex: 99998,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        aria-hidden={!isOpen}
      />

      {/* Left Sidebar Drawer - Attached to document.body via Portal */}
      <aside
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: "320px",
          maxWidth: "85vw",
          backgroundColor: "#ffffff",
          zIndex: 99999,
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          display: "flex",
          flexDirection: "column",
          boxShadow: isOpen ? "12px 0 40px rgba(0, 0, 0, 0.25)" : "none",
          borderRight: "1px solid rgba(0, 0, 0, 0.08)",
          overflow: "hidden",
        }}
        aria-label="Sidebar Menu Kategori"
      >
        {/* Header Drawer */}
        <div
          style={{
            height: "64px",
            padding: "0 20px",
            borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#ffffff",
            flexShrink: 0,
          }}
        >
          <div onClick={onClose} style={{ cursor: "pointer" }}>
            <Logo size="sm" />
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup Menu"
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0, 0, 0, 0.04)",
              border: "1px solid rgba(0, 0, 0, 0.08)",
              color: "#374151",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            title="Tutup Menu (Esc)"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Scrollable Navigation Body */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 16px",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          {/* Menu Kategori Navigasi Sesuai Header */}
          <div>
            <div
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#9ca3af",
                padding: "0 12px",
                marginBottom: "10px",
              }}
            >
              Navigasi Header & Kategori
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {headerCategories.map((item) => {
                const isActive = pathname === item.href;
                const isBrowseActive = item.href === "/browse" && pathname.startsWith("/browse");

                return (
                  <div key={item.label} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "11px 14px",
                        borderRadius: "10px",
                        fontSize: "0.92rem",
                        fontWeight: isActive || isBrowseActive ? 700 : 500,
                        color: isActive || isBrowseActive ? "var(--accent-gold, #946c15)" : "#1f2937",
                        backgroundColor: isActive || isBrowseActive ? "rgba(212, 175, 55, 0.1)" : "transparent",
                        textDecoration: "none",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <span style={{ color: isActive || isBrowseActive ? "var(--accent-gold, #946c15)" : "#6b7280", display: "flex" }}>
                        {item.icon}
                      </span>
                      <span style={{ flex: 1 }}>{item.label}</span>
                      {isActive && (
                        <span
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            backgroundColor: "var(--accent-gold, #946c15)",
                          }}
                        />
                      )}
                    </Link>

                    {/* Sub-Kategori Genre Khusus Browse */}
                    {item.subCategories && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "2px",
                          marginLeft: "30px",
                          paddingLeft: "12px",
                          borderLeft: "2px solid rgba(212, 175, 55, 0.25)",
                          marginTop: "2px",
                          marginBottom: "6px",
                        }}
                      >
                        {item.subCategories.map((sub) => (
                          <Link
                            key={sub.label}
                            href={sub.href}
                            onClick={onClose}
                            style={{
                              padding: "7px 10px",
                              fontSize: "0.82rem",
                              color: "#4b5563",
                              borderRadius: "6px",
                              textDecoration: "none",
                              transition: "color 0.15s ease",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <span>{sub.label}</span>
                            <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>→</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Admin Panel Entry (Hanya jika Login sebagai Admin) */}
          {isAdmin && (
            <div>
              <div
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#dc2626",
                  padding: "0 12px",
                  marginBottom: "8px",
                }}
              >
                Area Pengelola
              </div>

              <Link
                href="/admin"
                onClick={onClose}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "11px 14px",
                  borderRadius: "10px",
                  fontSize: "0.92rem",
                  fontWeight: 700,
                  color: "#b91c1c",
                  backgroundColor: "rgba(220, 38, 38, 0.08)",
                  border: "1px solid rgba(220, 38, 38, 0.2)",
                  textDecoration: "none",
                  transition: "all 0.15s ease",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span style={{ flex: 1 }}>Admin Panel</span>
                <span
                  style={{
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: "4px",
                    backgroundColor: "#b91c1c",
                    color: "#ffffff",
                  }}
                >
                  ADMIN
                </span>
              </Link>
            </div>
          )}
        </div>

        {/* Footer Drawer: User Info / Login & Logout */}
        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid rgba(0, 0, 0, 0.08)",
            backgroundColor: "#f9fafb",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            flexShrink: 0,
          }}
        >
          {user ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #d4af37, #997b1e)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    flexShrink: 0,
                  }}
                >
                  {user.username.slice(0, 1).toUpperCase()}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "0.88rem",
                      color: "#111827",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {user.username}
                  </div>
                  <div
                    style={{
                      fontSize: "0.72rem",
                      color: "#6b7280",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {user.email}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <Link
                  href="/profile"
                  onClick={onClose}
                  style={{
                    flex: 1,
                    textAlign: "center",
                    padding: "7px 10px",
                    borderRadius: "6px",
                    backgroundColor: "#ffffff",
                    border: "1px solid rgba(0, 0, 0, 0.12)",
                    color: "#374151",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  Profil
                </Link>
                <button
                  onClick={handleLogout}
                  style={{
                    flex: 1,
                    padding: "7px 10px",
                    borderRadius: "6px",
                    backgroundColor: "#fee2e2",
                    color: "#b91c1c",
                    border: "1px solid #fca5a5",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                  }}
                >
                  Keluar
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "8px" }}>
              <Link
                href="/login"
                onClick={onClose}
                style={{
                  flex: 1,
                  textAlign: "center",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  backgroundColor: "#111827",
                  color: "#ffffff",
                  fontSize: "0.84rem",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Sign In
              </Link>
              <Link
                href="/membership"
                onClick={onClose}
                style={{
                  flex: 1,
                  textAlign: "center",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(212, 175, 55, 0.12)",
                  color: "#946c15",
                  border: "1px solid rgba(212, 175, 55, 0.35)",
                  fontSize: "0.84rem",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Join Now
              </Link>
            </div>
          )}

          <div style={{ fontSize: "0.7rem", color: "#9ca3af", textAlign: "center" }}>
            &copy; {new Date().getFullYear()} YORUMUSE. All rights reserved.
          </div>
        </div>
      </aside>
    </>,
    document.body
  );
}
