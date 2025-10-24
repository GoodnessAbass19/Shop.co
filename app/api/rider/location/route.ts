import { getCurrentRider } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const rider = await getCurrentRider();

    if (!rider?.id) {
      return NextResponse.json(
        { error: "rider is not logged in" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { latitude, longitude } = body;

    const parsedLat =
      typeof latitude === "number" ? latitude : parseFloat(latitude);
    const parsedLng =
      typeof longitude === "number" ? longitude : parseFloat(longitude);

    if (!isFinite(parsedLat) || !isFinite(parsedLng)) {
      return NextResponse.json(
        { error: "Invalid latitude or longitude" },
        { status: 400 }
      );
    }

    const updatedRider = await prisma.rider.update({
      where: { id: rider.id },
      data: {
        latitude,
        longitude,
      },
    });

    return NextResponse.json({ success: true, rider: updatedRider });
  } catch (error) {
    console.error("Error updating rider location:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
