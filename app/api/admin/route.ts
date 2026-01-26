import { getCurrentAdmin } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await getCurrentAdmin();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: user.id, role: "ADMIN" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user || user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: You are not an admin." },
        { status: 403 },
      );
    }

    return NextResponse.json({ admin: adminUser });
  } catch (error) {
    console.error("Error fetching admin user:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
