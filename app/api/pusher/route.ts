// app/api/pusher/auth/route.ts
import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const socketId = formData.get("socket_id") as string;
    const channelName = formData.get("channel_name") as string;

    // --- 1. Handle Presence Channels for Riders ---
    if (channelName.startsWith("presence-nearby-")) {
      // Check if the current user is a rider.
      const rider = await prisma.rider.findUnique({
        where: { userId: user.id },
        select: { id: true, name: true, latitude: true, longitude: true },
      });

      if (!rider) {
        return NextResponse.json(
          { message: "Forbidden: Not a rider" },
          { status: 403 }
        );
      }

      // Authorize with user info for presence.
      const presenceData = {
        user_id: rider.id,
        user_info: {
          name: rider.name,
          lat: rider.latitude,
          lng: rider.longitude,
        },
      };

      const auth = pusherServer.authorizeChannel(
        socketId,
        channelName,
        presenceData
      );
      return NextResponse.json(auth);
    }

    // --- 2. Handle Private Channel for Sellers ---
    if (channelName.startsWith("private-seller-")) {
      const sellerIdFromChannel = channelName.split("-")[2];

      const store = await prisma.store.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });

      if (!store || String(store.id) !== sellerIdFromChannel) {
        return NextResponse.json(
          { message: "Forbidden: Not the channel owner" },
          { status: 403 }
        );
      }

      const auth = pusherServer.authorizeChannel(socketId, channelName);
      return NextResponse.json(auth);
    }

    // --- 3. Handle Private Channels for Buyers and Riders ---
    if (
      channelName.startsWith("private-buyer-") ||
      channelName.startsWith("private-rider-")
    ) {
      const entityIdFromChannel = channelName.split("-")[2];
      if (user.id !== entityIdFromChannel) {
        return NextResponse.json(
          { message: "Forbidden: Not the channel owner" },
          { status: 403 }
        );
      }

      const auth = pusherServer.authorizeChannel(socketId, channelName);
      return NextResponse.json(auth);
    }

    // --- 4. Fallback for All Other Cases ---
    console.warn(
      `Attempted unauthorized subscription to unknown channel type: ${channelName}`
    );
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  } catch (error) {
    console.error("Pusher authentication error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
