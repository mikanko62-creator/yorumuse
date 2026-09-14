import { cookies } from "next/headers";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const SESSION_COOKIE_NAME = "yorumuse_session";
const SESSION_EXPIRY_DAYS = 30;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return token;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    try {
      await prisma.session.deleteMany({
        where: { token },
      });
    } catch {
      // Ignored if session already expired/deleted
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
    // Expired
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  const { user } = session;
  if (user.status === "BANNED") return null;

  const activeSubscription = user.subscriptions?.[0] || null;

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    status: user.status,
    birthDate: user.birthDate,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    subscription: activeSubscription,
  };
}

export async function hasMemberAccess(user: { subscription?: { status: string; planId?: string } | null; role?: string } | null): Promise<boolean> {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  return user.subscription?.status === "ACTIVE";
}
