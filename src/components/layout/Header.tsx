"use client";

import React, { useState, useEffect } from "react";
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

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
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
        backgroundColor: scrolled ? "rgba(255, 255, 255, 0.94)" : "rgba(248, 249, 250, 0.85)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: scrolled ? "1px solid var(--border-subtle)" : "1px solid transparent",
      }}
    >
      <div
        className="container"
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Left: Brand Logo */}
        <Logo size="md" />

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
                  title="Panel Kontrol Administrator"
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

              {/* Icon Profile User: Tersedia untuk semua pengguna yang login */}
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
                title="Profil Saya"
              >
                {/* SVG Icon Profile dalam bulatan gradasi emas */}
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
            /* Visitor: Icon Profile untuk Sign In / Register */
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
                title="Masuk ke Akun / Profil"
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

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "5px",
              padding: "8px",
              color: "var(--text-primary)",
              zIndex: 1001,
            }}
            className="mobile-toggle-btn"
          >
            <span
              style={{
                width: "22px",
                height: "2px",
                backgroundColor: "var(--text-primary)",
                transition: "transform 0.3s, opacity 0.3s",
                transform: mobileMenuOpen ? "translateY(7px) rotate(45deg)" : "none",
              }}
            />
            <span
              style={{
                width: "22px",
                height: "2px",
                backgroundColor: "var(--text-primary)",
                transition: "opacity 0.3s",
                opacity: mobileMenuOpen ? 0 : 1,
              }}
            />
            <span
              style={{
                width: "22px",
                height: "2px",
                backgroundColor: "var(--text-primary)",
                transition: "transform 0.3s, opacity 0.3s",
                transform: mobileMenuOpen ? "translateY(-7px) rotate(-45deg)" : "none",
              }}
            />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            position: "fixed",
            top: "var(--header-height)",
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(255, 255, 255, 0.98)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            padding: "32px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            animation: "fadeIn 0.25s ease-out",
            zIndex: 999,
          }}
        >
          <nav style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  fontSize: "1.25rem",
                  fontFamily: "var(--font-serif)",
                  color: pathname === link.href ? "var(--accent-gold)" : "var(--text-primary)",
                  padding: "10px 0",
                  borderBottom: "1px solid var(--border-subtle)",
                }}
              >
                {link.label}
              </Link>
            ))}
            {isAdminOrSuperUser && (
              <Link
                href="/admin"
                style={{
                  fontSize: "1.25rem",
                  fontFamily: "var(--font-serif)",
                  color: "var(--accent-gold)",
                  padding: "10px 0",
                  borderBottom: "1px solid var(--border-subtle)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <svg
                  width="18"
                  height="18"
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
          </nav>

          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "14px" }}>
            {user ? (
              <>
                <Link
                  href="/profile"
                  className="btn btn-secondary btn-lg"
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>Profil Saya ({user.username})</span>
                </Link>
                {isAdminOrSuperUser && (
                  <Link
                    href="/admin"
                    className="btn btn-primary btn-lg"
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <span>Admin Panel</span>
                  </Link>
                )}
                <button
                  onClick={async () => {
                    await fetch("/api/auth/logout", { method: "POST" });
                    window.location.reload();
                  }}
                  className="btn btn-ghost btn-sm"
                  style={{ color: "var(--status-error)" }}
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link href="/membership" className="btn btn-primary btn-lg" style={{ width: "100%" }}>
                  Join Membership
                </Link>
                <Link href="/login" className="btn btn-secondary btn-lg" style={{ width: "100%" }}>
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      )}

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
        @media (max-width: 480px) {
          .header-username-label {
            display: none !important;
          }
        }
        .header-profile-link:hover {
          border-color: var(--accent-gold, #d4af37) !important;
          box-shadow: 0 0 10px rgba(212, 175, 55, 0.25) !important;
        }
      `}</style>
    </header>
  );
}
