// lib/create-notification.ts
import prisma from "./prisma";
import { pusherServer } from "./pusher";
import { NotificationType, Role } from "@prisma/client";

interface CreateNotificationParams {
  userId: string;
  userRole: Role;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
}

export async function createAndSendNotification({
  userId,
  userRole,
  type,
  title,
  message,
  link,
  relatedEntityId,
  relatedEntityType,
}: CreateNotificationParams) {
  try {
    // 1. Create the notification in the database
    const notification = await prisma.notification.create({
      data: {
        userId,
        userRole,
        type,
        title,
        message,
        link,
      },
    });

    // 2. Trigger a Pusher event for real-time delivery
    // The channel name should be unique to the user, e.g., 'private-user-<userId>'
    const channelName = `private-user-${userId}`;
    const eventName = "new-notification"; // A generic event name for all new notifications

    await pusherServer.trigger(channelName, eventName, notification);

    console.log(
      `Notification sent to user ${userId} via Pusher on channel ${channelName}`
    );
    return notification;
  } catch (error) {
    console.error("Failed to create and send notification:", error);
    // Depending on your error handling strategy, you might re-throw or return null
    throw error;
  }
}
