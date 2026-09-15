import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth";

// Default demo credentials fallback for serverless hosting environments
const DEMO_ACCOUNTS = [
  {
    id: "admin-user-001",
    email: "admin@yorumuse.com",
    username: "YoruMuseAdmin",
    password: "AdminPassword18+",
    role: "ADMIN",
    status: "ACTIVE",
    subscription: { status: "ACTIVE", planId: "vip_premium" },
  },
  {
    id: "member-user-001",
    email: "member@yorumuse.com",
    username: "VelvetPatron",
    password: "MemberPassword18+",
    role: "USER",
    status: "ACTIVE",
    subscription: { status: "ACTIVE", planId: "vip_tier" },
  },
  {
    id: "user-user-001",
    email: "user@yorumuse.com",
    username: "NocturneVoyeur",
    password: "UserPassword18+",
    role: "USER",
    status: "ACTIVE",
    subscription: null,
  },
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Username/email and password are required." },
        { status: 400 }
      );
    }

    const cleanIdentifier = identifier.trim().toLowerCase();

    // 1. Try querying Prisma database first
    let dbConnected = false;
    try {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: cleanIdentifier },
            { username: identifier.trim() },
          ],
        },
        include: {
          subscriptions: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });

      dbConnected = true;

      if (user) {
        if (user.status === "BANNED") {
          return NextResponse.json(
            { error: "This account has been permanently suspended." },
            { status: 403 }
          );
        }

        if (user.status === "SUSPENDED") {
          return NextResponse.json(
            { error: "This account is temporarily suspended." },
            { status: 403 }
          );
        }

        const validPassword = await verifyPassword(password, user.passwordHash);
        if (validPassword) {
          await createSession(user.id, {
            email: user.email,
            username: user.username,
            role: user.role,
          });

          return NextResponse.json({
            success: true,
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              role: user.role,
              subscription: user.subscriptions[0] || null,
            },
          });
        } else {
          return NextResponse.json(
            { error: "Invalid credentials. Please verify your email/username and password." },
            { status: 401 }
          );
        }
      } else {
        // User not found in active database
        return NextResponse.json(
          { error: "Invalid credentials. Please verify your email/username and password." },
          { status: 401 }
        );
      }
    } catch (dbError) {
      console.warn("Database query during login failed:", dbError);
    }

    // 2. Demo fallback check (ONLY in development mode when DB is completely unreachable)
    if (!dbConnected && process.env.NODE_ENV !== "production") {
      const demoUser = DEMO_ACCOUNTS.find(
        (acc) =>
          (acc.email.toLowerCase() === cleanIdentifier ||
            acc.username.toLowerCase() === cleanIdentifier) &&
          acc.password === password
      );

      if (demoUser) {
        await createSession(demoUser.id, {
          email: demoUser.email,
          username: demoUser.username,
          role: demoUser.role,
        });

        return NextResponse.json({
          success: true,
          user: {
            id: demoUser.id,
            username: demoUser.username,
            email: demoUser.email,
            role: demoUser.role,
            subscription: demoUser.subscription,
          },
        });
      }
    }

    return NextResponse.json(
      { error: "Invalid credentials. Please verify your email/username and password." },
      { status: 401 }
    );
  } catch (error) {
    console.error("Login fatal error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during login. Please try again." },
      { status: 500 }
    );
  }
}
