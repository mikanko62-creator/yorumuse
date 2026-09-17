import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession, getCurrentUser } from "@/lib/auth";
import { safeErrorResponse, isValidEmail, isValidUsername, sanitizeString } from "@/lib/security";

export async function POST(request: Request) {
  try {
    // 1. Authorization & Bootstrap verification
    const currentUser = await getCurrentUser();
    const setupKeyHeader = request.headers.get("x-setup-admin-key");
    const configuredKey = process.env.SETUP_ADMIN_KEY;
    const isAuthorizedViaKey = Boolean(configuredKey && setupKeyHeader && setupKeyHeader === configuredKey);
    const isAuthorizedAdmin = currentUser?.role === "ADMIN";

    // Fail-closed admin check
    const existingAdminCount = await prisma.user.count({
      where: { role: "ADMIN" },
    });

    // If admins already exist, strictly forbid unauthenticated requests without the setup key
    if (existingAdminCount > 0 && !isAuthorizedAdmin && !isAuthorizedViaKey) {
      return safeErrorResponse(
        "Akses ditolak: Sistem administrator sudah aktif. Hanya Administrator atau Key resmi yang diizinkan.",
        403
      );
    }

    const body = await request.json();
    const { email, password, username } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters for account security." },
        { status: 400 }
      );
    }

    const cleanEmail = sanitizeString(email, 100).toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      return NextResponse.json(
        { error: "Format email tidak valid." },
        { status: 400 }
      );
    }

    const cleanUsername = sanitizeString(username || cleanEmail.split("@")[0] || "Admin", 30);
    const passwordHash = await hashPassword(password);

    // Upsert admin user in database (Supabase PostgreSQL)
    const user = await prisma.user.upsert({
      where: { email: cleanEmail },
      update: {
        username: cleanUsername,
        passwordHash,
        role: "ADMIN",
        status: "ACTIVE",
      },
      create: {
        email: cleanEmail,
        username: cleanUsername,
        passwordHash,
        birthDate: "1990-01-01",
        role: "ADMIN",
        status: "ACTIVE",
        bio: "Executive Platform Administrator.",
      },
    });

    // Ensure VIP/Admin Subscription is active
    await prisma.subscription.upsert({
      where: { id: `sub-admin-${user.id}` },
      update: {
        status: "ACTIVE",
        planId: "vip_premium",
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
      create: {
        id: `sub-admin-${user.id}`,
        userId: user.id,
        planId: "vip_premium",
        status: "ACTIVE",
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });

    // Only create immediate session cookie if this is the initial bootstrap setup (no user was logged in)
    if (!currentUser) {
      await createSession(user.id, {
        email: user.email,
        username: user.username,
        role: "ADMIN",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Administrator account created/updated successfully.",
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    return safeErrorResponse("Terjadi kesalahan saat memproses pembuatan administrator.", 500, error);
  }
}
