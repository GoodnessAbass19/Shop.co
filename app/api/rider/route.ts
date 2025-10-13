import { getCurrentUser } from "@/lib/auth";
import { signToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const { email } = body;

    // Check if the user already has a rider profile
    const existingRider = await prisma.rider.findUnique({
      where: { userId: user.id },
    });

    if (existingRider) {
      return NextResponse.json(
        { error: "You already have a rider profile." },
        { status: 400 }
      );
    }

    const newRider = await prisma.rider.create({
      data: {
        ...body,
        userId: user.id,
      },
    });

    // Update user role if not already RIDER
    if (user.role !== Role.RIDER) {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: Role.RIDER, isRider: true },
      });
      console.log(`User ${user.id} role updated to RIDER.`);
    }

    const token = signToken({
      userId: user.id,
      email: email,
      role: Role.RIDER,
    });

    const cookieStore = await cookies();
    cookieStore.set("rider-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      maxAge: 60 * 60 * 6, // 6 hour
      sameSite: "lax",
      path: "/",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Rider created successfully!",
        rider: newRider,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("API Error creating rider profile:", error);

    return NextResponse.json(
      { error: "Failed to create rider profile." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const rider = await prisma.rider.findUnique({
      where: { userId: user.id },
    });
    if (!rider) {
      return NextResponse.json({ error: "Rider not found" }, { status: 404 });
    }
    return NextResponse.json({ rider }, { status: 200 });
  } catch (error) {
    console.error("API Error fetching rider profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch rider profile." },
      { status: 500 }
    );
  }
}
