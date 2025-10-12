import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

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

    await prisma.user.update({
      where: { id: user.id },
      data: { role: Role.RIDER, isRider: true }, // Set user's role to SELLER
    });
    console.log(`User ${user.id} role updated to RIDER.`);

    return NextResponse.json(
      {
        success: true,
        message: "Rider created successfully!",
        store: newRider,
      },
      { status: 201 } // 201 Created
    );
  } catch (error: any) {
    console.error("API Error creating store and products:", error);

    // Handle unique constraint error for store name (slug is handled by utility)
    if (error.code === "P2002" && error.meta?.target?.includes("name")) {
      return NextResponse.json(
        { error: "Store name already taken. Please choose a different name." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create store and products." },
      { status: 500 }
    );
  }
}
