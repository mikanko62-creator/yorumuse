"use client";

import React, { useState, useEffect } from "react";

interface UserRow {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  birthDate: string;
  createdAt: string;
  subscriptions: {
    status: string;
    planId: string;
  } | {
    status: string;
    planId: string;
  }[];
}

interface UserCrudModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit: UserRow | null;
  onSuccess: () => void;
}

export default function UserCrudModal({
  isOpen,
  onClose,
  userToEdit,
  onSuccess,
}: UserCrudModalProps) {
  const isEditMode = !!userToEdit;

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("USER");
  const [status, setStatus] = useState("ACTIVE");
  const [planId, setPlanId] = useState("free_tier");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Lock body scroll when modal is open to prevent page scroll-through/overlap
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
    if (userToEdit) {
      setUsername(userToEdit.username || "");
      setEmail(userToEdit.email || "");
      setPassword(""); // Clear password field for edit
      setRole(userToEdit.role || "USER");
      setStatus(userToEdit.status || "ACTIVE");
      const subs = Array.isArray(userToEdit.subscriptions)
        ? userToEdit.subscriptions[0]
        : userToEdit.subscriptions;
      setPlanId(subs?.status === "ACTIVE" ? subs.planId : "free_tier");
      setErrorMessage(null);
    } else {
      setUsername("");
      setEmail("");
      setPassword("");
      setRole("USER");
      setStatus("ACTIVE");
      setPlanId("free_tier");
      setErrorMessage(null);
    }
  }, [userToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage(null);

    try {
      if (isEditMode && userToEdit) {
        // Update user
        const res = await fetch("/api/admin/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: userToEdit.id,
            username: username.trim(),
            email: email.trim(),
            password: password.trim() ? password.trim() : undefined,
            role,
            status,
            planId,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update user.");

        onSuccess();
        onClose();
      } else {
        // Create user
        if (!password.trim() || password.trim().length < 6) {
          throw new Error("Password must be at least 6 characters.");
        }

        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: username.trim(),
            email: email.trim(),
            password: password.trim(),
            role,
            status,
            planId,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create new user.");

        onSuccess();
        onClose();
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "An error occurred while processing account.");
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
        backgroundColor: "rgba(17, 24, 39, 0.75)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "540px",
          maxHeight: "min(92vh, 760px)",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#ffffff",
          border: "1px solid rgba(212, 175, 55, 0.4)",
          borderRadius: "18px",
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.45)",
          margin: "auto",
          overflow: "hidden",
        }}
      >
        {/* Header - Fixed top */}
        <div
          style={{
            padding: "22px 28px 16px",
            borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
            backgroundColor: "#ffffff",
          }}
        >
          <div>
            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--accent-gold, #946c15)",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              SUPER USER • USER MANAGEMENT
            </span>
            <h3
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "1.3rem",
                color: "#111827",
                margin: "4px 0 0",
                fontWeight: 700,
              }}
            >
              {isEditMode ? `Edit Account: ${userToEdit?.username}` : "Add New User"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0, 0, 0, 0.04)",
              border: "1px solid rgba(0, 0, 0, 0.06)",
              color: "#4b5563",
              fontSize: "1.2rem",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            title="Close (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Form Container */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          {/* Scrollable Form Body */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "20px 28px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {errorMessage && (
              <div
                style={{
                  padding: "10px 14px",
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#b91c1c",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                }}
              >
                {errorMessage}
              </div>
            )}

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.82rem",
                  color: "#374151",
                  marginBottom: "6px",
                  fontWeight: 600,
                }}
              >
                Username *
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. ElenaVane"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                  backgroundColor: "#f9fafb",
                  color: "#111827",
                  fontSize: "0.9rem",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.82rem",
                  color: "#374151",
                  marginBottom: "6px",
                  fontWeight: 600,
                }}
              >
                Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@provider.com"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                  backgroundColor: "#f9fafb",
                  color: "#111827",
                  fontSize: "0.9rem",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.82rem",
                  color: "#374151",
                  marginBottom: "6px",
                  fontWeight: 600,
                }}
              >
                {isEditMode
                  ? "New Password (Leave blank to keep current)"
                  : "Password *"}
              </label>
              <input
                type="password"
                required={!isEditMode}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isEditMode ? "Enter new password..." : "At least 6 characters"}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                  backgroundColor: "#f9fafb",
                  color: "#111827",
                  fontSize: "0.9rem",
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.82rem",
                    color: "#374151",
                    marginBottom: "6px",
                    fontWeight: 600,
                  }}
                >
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    backgroundColor: "#f9fafb",
                    color: "#111827",
                    fontSize: "0.9rem",
                  }}
                >
                  <option value="USER">USER (Regular Member)</option>
                  <option value="ADMIN">ADMIN (Super User)</option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.82rem",
                    color: "#374151",
                    marginBottom: "6px",
                    fontWeight: 600,
                  }}
                >
                  Account Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                    backgroundColor: "#f9fafb",
                    color: "#111827",
                    fontSize: "0.9rem",
                  }}
                >
                  <option value="ACTIVE">ACTIVE (Active)</option>
                  <option value="SUSPENDED">SUSPENDED (Suspended)</option>
                  <option value="BANNED">BANNED (Banned)</option>
                </select>
              </div>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.82rem",
                  color: "#374151",
                  marginBottom: "6px",
                  fontWeight: 600,
                }}
              >
                Subscription Plan Status
              </label>
              <select
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                  backgroundColor: "#f9fafb",
                  color: "#111827",
                  fontSize: "0.9rem",
                }}
              >
                <option value="free_tier">Regular User (Free Tier)</option>
                <option value="member_monthly">
                  Subscriber (Full Access)
                </option>
              </select>
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "#6b7280",
                  marginTop: "6px",
                  display: "block",
                }}
              >
                Super User can configure account status as Regular User or Subscriber.
              </span>
            </div>
          </div>

          {/* Footer - Fixed bottom buttons */}
          <div
            style={{
              padding: "16px 28px",
              borderTop: "1px solid rgba(0, 0, 0, 0.08)",
              backgroundColor: "#f9fafb",
              display: "flex",
              gap: "12px",
              flexShrink: 0,
            }}
          >
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
              style={{ flex: 1, padding: "12px", fontWeight: 600, fontSize: "0.9rem" }}
            >
              {saving
                ? "Saving..."
                : isEditMode
                ? "Save Account Changes"
                : "Create User Account"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="btn btn-secondary"
              style={{ padding: "12px 20px", fontSize: "0.9rem" }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
