import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPassword } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
        birthDate: true,
        createdAt: true,
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: {
          select: {
            posts: true,
            comments: true,
          },
        },
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Admin users fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch users." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Hak akses Super User diperlukan." }, { status: 403 });
    }

    const body = await request.json();
    const { email, username, password, role, status, planId, birthDate } = body;

    if (!email || !username || !password) {
      return NextResponse.json(
        { error: "Email, username, and password are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Email is already registered in the system." },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const assignedRole = role === "ADMIN" ? "ADMIN" : "USER";
    const assignedStatus = status || "ACTIVE";

    const newUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        username: username.trim(),
        passwordHash: hashedPassword,
        role: assignedRole,
        status: assignedStatus,
        birthDate: birthDate || "1995-01-01",
        ...(planId && planId !== "free_tier"
          ? {
              subscriptions: {
                create: {
                  planId,
                  status: "ACTIVE",
                  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                  paymentMethod: "Admin Manual Grant",
                },
              },
            }
          : {
              subscriptions: {
                create: {
                  planId: "free_tier",
                  status: "FREE",
                },
              },
            }),
      },
      include: {
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "New user created successfully.",
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role,
        status: newUser.status,
        subscriptions: newUser.subscriptions,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Admin create user error:", error);
    return NextResponse.json({ error: "Failed to create new user." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, username, email, password, status, role, planId } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (role) updateData.role = role;
    if (username) updateData.username = username.trim();
    if (email) updateData.email = email.toLowerCase().trim();
    if (password && password.trim().length >= 6) {
      updateData.passwordHash = await hashPassword(password.trim());
    }


    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Update or grant subscription if planId is provided
    if (planId) {
      const existingSub = await prisma.subscription.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });

      const isActivePlan = planId !== "free_tier";
      const currentPeriodEnd = isActivePlan
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        : null;

      if (existingSub) {
        await prisma.subscription.update({
          where: { id: existingSub.id },
          data: {
            planId,
            status: isActivePlan ? "ACTIVE" : "FREE",
            currentPeriodEnd,
            paymentMethod: "Admin Manual Grant",
          },
        });
      } else {
        await prisma.subscription.create({
          data: {
            userId,
            planId,
            status: isActivePlan ? "ACTIVE" : "FREE",
            currentPeriodEnd,
            paymentMethod: "Admin Manual Grant",
          },
        });
      }
    }

    return NextResponse.json({ success: true, user: updatedUser, message: "User updated successfully." });
  } catch (error) {
    console.error("Admin patch user error:", error);
    return NextResponse.json({ error: "Failed to update user." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get("id");

    if (!targetUserId) {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 });
    }

    if (targetUserId === user.id) {
      return NextResponse.json(
        { error: "You cannot delete your own administrator account." },
        { status: 400 }
      );
    }

    // Cascade delete user
    await prisma.user.delete({
      where: { id: targetUserId },
    });

    return NextResponse.json({ success: true, message: "User and all associated data permanently deleted." });
  } catch (error) {
    console.error("Admin delete user error:", error);
    return NextResponse.json({ error: "Failed to delete user." }, { status: 500 });
  }
}

