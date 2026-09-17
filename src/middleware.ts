import { NextRequest, NextResponse } from "next/server";

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("CRITICAL SECURITY CONFIGURATION ERROR: SESSION_SECRET must be set in environment variables in production.");
    }
    return "dev-insecure-local-only-session-secret-change-in-env";
  }
  return secret;
}

interface TokenPayload {
  userId: string;
  email: string;
  username: string;
  role: string;
  exp: number;
}

// Convert base64url string to Uint8Array without external dependencies
function base64UrlToUint8Array(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function verifyEdgeToken(token: string): Promise<TokenPayload | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [dataPart, signaturePart] = parts;

    const enc = new TextEncoder();
    const secret = getSessionSecret();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const sigBytes = base64UrlToUint8Array(signaturePart);
    const dataBytes = enc.encode(dataPart);

    const isValid = await crypto.subtle.verify("HMAC", key, sigBytes as unknown as BufferSource, dataBytes as unknown as BufferSource);
    if (!isValid) return null;

    const jsonString = atob(dataPart.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(jsonString) as TokenPayload;

    if (payload.exp && Date.now() > payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminPage = pathname.startsWith("/admin") || pathname.startsWith("/setup-admin");
  const isAdminApi = pathname.startsWith("/api/admin");

  if (isAdminPage || isAdminApi) {
    const sessionCookie = request.cookies.get("yorumuse_session")?.value;

    let isAuthorizedAdmin = false;
    if (sessionCookie) {
      const payload = await verifyEdgeToken(sessionCookie);
      if (payload && payload.role === "ADMIN") {
        isAuthorizedAdmin = true;
      }
    }

    if (!isAuthorizedAdmin) {
      if (isAdminApi) {
        // Disguise API as 404 Not Found to scanner tools
        return NextResponse.json(
          { error: "Not Found" },
          { status: 404 }
        );
      } else {
        // Disguise Admin Page as 404 Not Found: URL stays the same, renders 404 page with HTTP 404 status
        const notFoundUrl = new URL("/not-found", request.url);
        const res = NextResponse.rewrite(notFoundUrl, { status: 404 });
        res.headers.set("X-Frame-Options", "SAMEORIGIN");
        res.headers.set("X-Content-Type-Options", "nosniff");
        res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
        return res;
      }
    }
  }

  const response = NextResponse.next();

  // Edge security response headers
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("X-XSS-Protection", "1; mode=block");

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/setup-admin/:path*",
    "/api/admin/:path*",
  ],
};
