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
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="btn btn-outline-gold btn-sm"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    padding: "6px 12px",
                    borderColor: "var(--accent-gold)",
                    color: "var(--accent-gold)",
                  }}
                  id="admin-header-link"
                >
                  Admin Panel
                </Link>
              )}
              <Link
                href="/profile"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "6px 14px",
                  borderRadius: "var(--radius-full)",
                  background: "var(--bg-surface-elevated)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #b88a25, #8c6411)",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <span
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  {user.username}
                </span>
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Link
                href="/login"
                className="btn btn-ghost btn-sm"
                style={{ color: "var(--text-primary)" }}
              >
                Sign In
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
            {user?.role === "ADMIN" && (
              <Link
                href="/admin"
                style={{
                  fontSize: "1.25rem",
                  fontFamily: "var(--font-serif)",
                  color: "var(--accent-gold)",
                  padding: "10px 0",
                  borderBottom: "1px solid var(--border-subtle)",
                }}
              >
                Admin Dashboard
              </Link>
            )}
          </nav>

          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "14px" }}>
            {user ? (
              <>
                <Link href="/profile" className="btn btn-secondary btn-lg" style={{ width: "100%" }}>
                  My Profile ({user.username})
                </Link>
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
      `}</style>
    </header>
  );
}
