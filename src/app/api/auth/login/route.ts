import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth";

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
      console.error("Database query during login failed:", dbError);
      return NextResponse.json(
        { error: "Authentication service temporarily unavailable. Please try again." },
        { status: 503 }
      );
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
