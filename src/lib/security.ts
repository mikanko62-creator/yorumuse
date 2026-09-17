import { NextResponse } from "next/server";

/**
 * Platform Security Utility Suite
 * Protects against XSS, input anomalies, URL protocol injection, and information disclosure.
 */

/**
 * Return a sanitized error response that never leaks database or system internals to clients.
 */
export function safeErrorResponse(
  publicMessage: string = "An unexpected error occurred. Please try again later.",
  status: number = 500,
  internalError?: unknown
): NextResponse {
  if (internalError) {
    console.error(`[API Security Logger - ${status}]`, internalError);
  }

  return NextResponse.json(
    {
      error: publicMessage,
      success: false,
    },
    { status }
  );
}

/**
 * Sanitize plain string input:
 * - Strip null bytes and control characters
 * - Trim leading/trailing whitespace
 * - Enforce optional maximum character length
 */
export function sanitizeString(input: unknown, maxLength: number = 10000): string {
  if (typeof input !== "string") return "";
  // Strip null bytes and invisible control chars (except standard newlines/tabs)
  const cleaned = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
  return cleaned.slice(0, maxLength);
}

/**
 * Validates and sanitizes URLs (for media, avatarUrl, links):
 * Strictly requires http: or https: protocol.
 * Rejects dangerous URI schemes like javascript:, data:, vbscript:, file:.
 */
export function sanitizeUrl(url: unknown): string | null {
  if (typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Allow relative paths starting with /
  if (trimmed.startsWith("/") && !trimmed.startsWith("//") && !trimmed.includes("\\")) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Strict email validation helper
 */
export function isValidEmail(email: unknown): boolean {
  if (typeof email !== "string") return false;
  const clean = email.trim().toLowerCase();
  if (clean.length > 254) return false;
  // RFC 5322 compliant regex simplified for practical web use
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(clean);
}

/**
 * Username validation: alphanumeric, underscores, hyphens only, 3-30 chars
 */
export function isValidUsername(username: unknown): boolean {
  if (typeof username !== "string") return false;
  const clean = username.trim();
  return /^[a-zA-Z0-9_-]{3,30}$/.test(clean);
}
