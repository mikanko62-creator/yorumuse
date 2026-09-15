import { cookies } from "next/headers";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const SESSION_COOKIE_NAME = "yorumuse_session";
const SESSION_EXPIRY_DAYS = 30;
const SESSION_SECRET = process.env.SESSION_SECRET || "yorumuse-secret-key-32-character-minimum-hex-2026-auth";

export interface SessionPayload {
  userId: string;
  email: string;
  username: string;
  role: string;
  exp: number;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signSessionToken(payload: SessionPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", SESSION_SECRET).update(data).digest("base64url");
  return `${data}.${signature}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const [data, signature] = token.split(".");
    if (!data || !signature) return null;
    const expected = crypto.createHmac("sha256", SESSION_SECRET).update(data).digest("base64url");
    if (signature !== expected) return null;
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8")) as SessionPayload;
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function createSession(
  userId: string,
  userMeta?: { email: string; username: string; role: string }
) {
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  // If userMeta is not provided or incomplete, look up user from database securely
  let meta = userMeta;
  if (!meta || !meta.role) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, username: true, role: true },
      });
      if (dbUser) {
        meta = {
          email: dbUser.email,
          username: dbUser.username,
          role: dbUser.role || "USER",
        };
      }
    } catch {
      // ignore
    }
  }

  // Ensure role is never escalated by default
  const safeRole = meta?.role === "ADMIN" ? "ADMIN" : "USER";
  const safeEmail = meta?.email || "";
  const safeUsername = meta?.username || "User";

  // Optional: write to DB if database is writable (local dev)
  try {
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.session.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    }).catch(() => {});
  } catch {
    // Ignore read-only filesystem errors on serverless Vercel
  }

  // Create tamper-proof signed session token (stateless, works on Vercel serverless)
  const signedToken = signSessionToken({
    userId,
    email: safeEmail,
    username: safeUsername,
    role: safeRole,
    exp: expiresAt.getTime(),
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, signedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return signedToken;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    try {
      await prisma.session.deleteMany({
        where: { token },
      }).catch(() => {});
    } catch {
      // Ignored if database is read-only
    }
  }

  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return null;

  // 1. Verify signed token (stateless fallback for Vercel)
  const payload = verifySessionToken(token);
  if (payload) {
    let dbLookupSucceeded = false;
    try {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: {
          subscriptions: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });

      dbLookupSucceeded = true;

      if (user) {
        if (user.status === "BANNED" || user.status === "SUSPENDED") {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          status: user.status,
          birthDate: user.birthDate,
          bio: user.bio,
          avatarUrl: user.avatarUrl,
          subscription: user.subscriptions?.[0] || null,
        };
      } else {
        // User was explicitly deleted in the database -> revoke access immediately!
        return null;
      }
    } catch {
      // Database not reachable, fallback only if DB connection errored
    }

    // Only if database was unreachable (network partition / outage), fallback to valid signed token
    if (!dbLookupSucceeded) {
      return {
        id: payload.userId,
        email: payload.email,
        username: payload.username,
        role: payload.role === "ADMIN" ? "ADMIN" : "USER",
        status: "ACTIVE",
        birthDate: "1990-01-01",
        bio: "Verified Member",
        avatarUrl: null,
        subscription: payload.role === "ADMIN" ? { status: "ACTIVE", planId: "vip_premium" } : null,
      };
    }
  }

  // 2. Legacy database session lookup
  try {
    const session = await prisma.session.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            subscriptions: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    if (!session) return null;

    if (session.expiresAt < new Date()) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      return null;
    }

    const { user } = session;
    if (user.status === "BANNED") return null;

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      status: user.status,
      birthDate: user.birthDate,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      subscription: user.subscriptions?.[0] || null,
    };
  } catch {
    return null;
  }
}

export async function hasMemberAccess(user: { subscription?: { status: string; planId?: string } | null; role?: string } | null): Promise<boolean> {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  return user.subscription?.status === "ACTIVE";
}
