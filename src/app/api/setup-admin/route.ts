import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, username } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan Password wajib diisi." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username?.trim() || cleanEmail.split("@")[0] || "Admin";
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

    // Create session & log the admin in immediately
    await createSession(user.id, {
      email: user.email,
      username: user.username,
      role: "ADMIN",
    });

    return NextResponse.json({
      success: true,
      message: "Akun Administrator berhasil dibuat/diperbarui.",
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Setup admin error:", error);
    return NextResponse.json(
      { error: "Gagal membuat akun admin: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
