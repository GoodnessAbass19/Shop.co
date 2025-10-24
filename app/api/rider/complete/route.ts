import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyCode } from "@/lib/delivery";
import { pusherServer } from "@/lib/pusher";
import { sendStatusEmail, sendStatusSMS } from "@/lib/notify";
import { getCurrentRider } from "@/lib/auth";

export async function POST(req: Request) {
  const rider = await getCurrentRider();
  if (!rider)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderItemId, code } = await req.json();

  try {
    await prisma.$transaction(async (tx) => {
      const assignment = await tx.deliveryItem.findUnique({
        where: { orderItemId },
        include: {
          orderItem: {
            include: {
              order: { include: { buyer: true } },
            },
          },
        },
      });

      if (!assignment || assignment.riderId !== rider.id)
        throw new Error("Forbidden");
      if (!assignment.deliveryCodeHash || !assignment.deliveryCodeExpires)
        throw new Error("No active code");
      if (new Date() > assignment.deliveryCodeExpires)
        throw new Error("Code expired");

      const match = await verifyCode(code, assignment.deliveryCodeHash);
      if (!match) {
        await tx.deliveryItem.update({
          where: { orderItemId },
          data: { attempts: { increment: 1 } },
        });
        throw new Error("Invalid code");
      }

      // Mark order item as delivered
      const item = await tx.orderItem.update({
        where: { id: orderItemId },
        data: {
          deliveryStatus: "DELIVERED",
          deliveredAt: new Date(),
        },
        include: { order: { include: { buyer: true } } },
      });

      // Update delivery record
      await tx.deliveryItem.update({
        where: { orderItemId },
        data: {
          deliveredAt: new Date(),
          status: "DELIVERED",
          deliveryCodeHash: null,
          deliveryCodeExpires: null,
          attempts: 0,
        },
      });

      // If all order items delivered, mark order as delivered
      const remaining = await tx.orderItem.count({
        where: {
          orderId: item.orderId,
          deliveryStatus: { not: "DELIVERED" },
        },
      });
      if (remaining === 0) {
        await tx.order.update({
          where: { id: item.orderId },
          data: { status: "DELIVERED", deliveredAt: new Date() },
        });
      }

      // Notifications
      const buyerEmail = item.order.buyer?.email;
      const buyerPhone = item.order.buyer?.phone;

      if (buyerEmail)
        await sendStatusEmail(
          buyerEmail,
          "Delivery confirmed",
          `<p>Your item has been delivered successfully. Thank you for shopping with us!</p>`
        );

      if (buyerPhone)
        await sendStatusSMS(
          buyerPhone,
          "✅ Your item has been delivered successfully. Thank you for shopping with us!"
        );

      // Push real-time updates
      await pusherServer.trigger(
        `private-buyer-${item.order.buyerId}`,
        "order_item.delivered",
        { orderItemId }
      );
      await pusherServer.trigger(
        `private-seller-${item.storeId}`,
        "order_item.delivered",
        { orderItemId }
      );
      await pusherServer.trigger(
        `private-rider-${rider.id}`,
        "order_item.delivered",
        { orderItemId }
      );
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Deliver route error:", e);
    return NextResponse.json(
      { error: e.message || "Delivery confirmation failed" },
      { status: 400 }
    );
  }
}
