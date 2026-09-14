import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, email, password, birthDate, termsAccepted } = body;

    if (!username || !email || !password || !birthDate) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    if (!termsAccepted) {
      return NextResponse.json(
        { error: "You must accept the terms and confirm you are 18 or older." },
        { status: 400 }
      );
    }

    // Validate 18+ requirement
    const dob = new Date(birthDate);
    if (isNaN(dob.getTime())) {
      return NextResponse.json(
        { error: "Invalid birth date provided." },
        { status: 400 }
      );
    }

    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    if (age < 18) {
      return NextResponse.json(
        { error: "You must be at least 18 years old to join YoruMuse." },
        { status: 403 }
      );
    }

    // Password strength check
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    // Clean username & email
    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    // Check existing
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: cleanEmail }, { username: cleanUsername }],
      },
    });

    if (existing) {
      if (existing.email === cleanEmail) {
        return NextResponse.json(
          { error: "An account with this email already exists." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "This username is already claimed." },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user with default FREE subscription
    const user = await prisma.user.create({
      data: {
        username: cleanUsername,
        email: cleanEmail,
        passwordHash,
        birthDate,
        role: "USER",
        status: "ACTIVE",
        subscriptions: {
          create: {
            planId: "free_tier",
            status: "FREE",
          },
        },
      },
      include: {
        subscriptions: true,
      },
    });

    // Create session cookie
    await createSession(user.id);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        birthDate: user.birthDate,
        subscription: user.subscriptions[0],
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An error occurred during registration. Please try again." },
      { status: 500 }
    );
  }
}
