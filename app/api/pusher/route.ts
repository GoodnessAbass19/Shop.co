// app/api/pusher/auth/route.ts
import { pusherServer } from "@/lib/pusher";
import { getCurrentUser } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const socketId = formData.get("socket_id") as string;
    const channelName = formData.get("channel_name") as string;

    // IMPORTANT: Validate that the user is authorized to subscribe to this channel.
    // For user-specific notifications, the channel name should typically be `private-user-${userId}`.
    // Ensure the `userId` in the channel name matches the authenticated `user.id`.
    if (!channelName.startsWith(`private-user-${user.id}`)) {
      console.warn(
        `Attempted unauthorized subscription: User ${user.id} tried to subscribe to ${channelName}`
      );
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const authResponse = pusherServer.authorizeChannel(socketId, channelName);
    return NextResponse.json(authResponse);
  } catch (error) {
    console.error("Pusher authentication error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
