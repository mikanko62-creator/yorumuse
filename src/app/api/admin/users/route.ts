import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

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

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, status, role } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(status && { status }),
        ...(role && { role }),
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error("Admin patch user error:", error);
    return NextResponse.json({ error: "Failed to update user." }, { status: 500 });
  }
}
