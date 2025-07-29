// app/api/notifications/[notificationId]/read/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.log(
        "Unauthorized access attempt to mark notification as read: No user found."
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    if (!id) {
      console.log("Bad Request: Missing id in URL parameters.");
      return NextResponse.json(
        { error: "Notification ID is required." },
        { status: 400 }
      );
    }

    // Find the notification and ensure it belongs to the current user
    const notification = await prisma.notification.findUnique({
      where: { id: id },
    });

    if (!notification) {
      console.log(`Not Found: Notification ${id} not found.`);
      return NextResponse.json(
        { error: "Notification not found." },
        { status: 404 }
      );
    }

    if (notification.userId !== user.id) {
      console.log(
        `Forbidden: User ${user.id} attempted to mark notification ${id} not belonging to them.`
      );
      return NextResponse.json(
        {
          error:
            "Forbidden: You do not have permission to modify this notification.",
        },
        { status: 403 }
      );
    }

    // Update the notification's read status to true
    const updatedNotification = await prisma.notification.update({
      where: { id: id },
      data: { read: true },
    });

    return NextResponse.json(updatedNotification, { status: 200 });
  } catch (error) {
    console.error("API Error marking notification as read:", error);
    return NextResponse.json(
      { error: "Failed to mark notification as read." },
      { status: 500 }
    );
  }
}
