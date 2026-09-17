"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "../common/Logo";
import NavigationSidebar from "./NavigationSidebar";

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

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<UserState | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch current user session status
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null));
  }, [pathname]);

  // Close sidebar drawer on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/browse", label: "Browse" },
    { href: "/membership", label: "Membership" },
    { href: "/community", label: "Community" },
  ];

  const isAdminOrSuperUser = Boolean(
    user && (
      user.role?.toUpperCase() === "ADMIN" ||
      user.role?.toUpperCase() === "SUPERUSER" ||
      user.role?.toUpperCase() === "SUPER_USER" ||
      user.role?.toUpperCase() === "OWNER"
    )
  );

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "var(--header-height)",
        zIndex: 1000,
        transition: "background-color 0.3s ease, backdrop-filter 0.3s ease, border-bottom 0.3s ease",
        backgroundColor: scrolled ? "rgba(12, 6, 10, 0.92)" : "rgba(12, 6, 10, 0.72)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: scrolled ? "1px solid rgba(225, 29, 72, 0.2)" : "1px solid transparent",
        boxShadow: scrolled ? "0 8px 32px rgba(0, 0, 0, 0.6)" : "none",
      }}
    >
      <div
        className="header-inner"
        style={{
          width: "100%",
          paddingLeft: "16px",
          paddingRight: "24px",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Left: 3-line Toggle Button + Brand Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open Navigation Menu"
            style={{
              display: "inline-flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              gap: "4px",
              width: "38px",
              height: "38px",
              borderRadius: "8px",
              backgroundColor: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              cursor: "pointer",
              transition: "all 0.2s ease",
              padding: "8px",
              color: "var(--text-primary)",
              flexShrink: 0,
            }}
            className="header-left-toggle-btn"
            title="Open Navigation Menu"
            id="header-left-toggle"
          >
            <span style={{ width: "18px", height: "2px", backgroundColor: "currentColor", borderRadius: "2px" }} />
            <span style={{ width: "18px", height: "2px", backgroundColor: "currentColor", borderRadius: "2px" }} />
            <span style={{ width: "18px", height: "2px", backgroundColor: "currentColor", borderRadius: "2px" }} />
          </button>

          <Logo size="md" />
        </div>

        {/* Center: Desktop Navigation */}
        <nav
          style={{
            display: "none",
            alignItems: "center",
            gap: "32px",
          }}
          className="desktop-nav"
        >
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  fontSize: "0.95rem",
                  fontWeight: 500,
                  letterSpacing: "0.04em",
                  color: isActive ? "var(--accent-gold)" : "var(--text-secondary)",
                  position: "relative",
                  padding: "8px 0",
                  transition: "color var(--transition-fast)",
                }}
              >
                {link.label}
                {isActive && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: "2px",
                      background: "var(--accent-gold)",
                      borderRadius: "2px",
                      boxShadow: "0 0 8px var(--accent-gold)",
                    }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right: Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {/* Tombol Admin Panel: Hanya muncul jika login sebagai Admin atau Super User */}
              {isAdminOrSuperUser && (
                <Link
                  href="/admin"
                  className="btn btn-outline-gold btn-sm"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    padding: "7px 14px",
                    borderRadius: "8px",
                    borderColor: "var(--accent-gold, #d4af37)",
                    color: "var(--accent-gold, #d4af37)",
                    backgroundColor: "rgba(212, 175, 55, 0.08)",
                    boxShadow: "0 2px 8px rgba(212, 175, 55, 0.15)",
                    transition: "all 0.2s ease",
                  }}
                  id="admin-header-link"
                  title="Administrator Control Panel"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span>Admin Panel</span>
                </Link>
              )}

              {/* User Profile Icon */}
              <Link
                href="/profile"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "4px 12px 4px 6px",
                  borderRadius: "var(--radius-full, 9999px)",
                  background: "var(--bg-surface-elevated, #ffffff)",
                  border: "1px solid var(--border-subtle, rgba(0, 0, 0, 0.1))",
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.08)",
                }}
                className="header-profile-link"
                title="My Profile"
              >
                {/* SVG Icon Profile */}
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, var(--accent-gold, #d4af37), #997b1e)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 6px rgba(212, 175, 55, 0.25)",
                    flexShrink: 0,
                  }}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <span
                  className="header-username-label"
                  style={{
                    fontSize: "0.88rem",
                    fontWeight: 600,
                    color: "var(--text-primary, #111827)",
                    maxWidth: "110px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {user.username}
                </span>
              </Link>
            </div>
          ) : (
            /* Visitor: Profile Icon for Sign In */
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Link
                href="/login"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "6px 14px",
                  borderRadius: "var(--radius-full, 9999px)",
                  background: "var(--bg-surface-elevated, #ffffff)",
                  border: "1px solid var(--border-subtle, rgba(0, 0, 0, 0.1))",
                  color: "var(--text-primary, #111827)",
                  textDecoration: "none",
                  fontSize: "0.86rem",
                  fontWeight: 600,
                  transition: "all 0.2s ease",
                  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.05)",
                }}
                className="header-profile-link"
                title="Sign In / Profile"
              >
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    background: "rgba(212, 175, 55, 0.15)",
                    color: "var(--accent-gold, #d4af37)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <span>Sign In</span>
              </Link>
              <Link
                href="/membership"
                className="btn btn-primary btn-sm"
                style={{ display: "none" }}
                id="header-join-btn"
              >
                Join Now
              </Link>
            </div>
          )}

          {/* Optional Right Action Spacer */}
        </div>
      </div>

      {/* Left Navigation Sidebar Drawer */}
      <NavigationSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        isAdmin={isAdminOrSuperUser}
      />

      {/* Global CSS for Responsive Header Queries */}
      <style jsx global>{`
        @media (min-width: 768px) {
          .desktop-nav {
            display: flex !important;
          }
          .mobile-toggle-btn {
            display: none !important;
          }
          #header-join-btn {
            display: inline-flex !important;
          }
          #admin-header-link {
            display: inline-flex !important;
          }
        }
        @media (max-width: 640px) {
          .header-inner {
            padding-left: 12px !important;
            padding-right: 14px !important;
          }
        }
        @media (max-width: 480px) {
          .header-username-label {
            display: none !important;
          }
        }
        .header-profile-link:hover {
          border-color: var(--accent-gold, #d4af37) !important;
          box-shadow: 0 0 10px rgba(212, 175, 55, 0.25) !important;
        }
        .header-left-toggle-btn:hover {
          background-color: rgba(212, 175, 55, 0.12) !important;
          border-color: rgba(212, 175, 55, 0.35) !important;
          color: var(--accent-gold, #946c15) !important;
        }
      `}</style>
    </header>
  );
}
