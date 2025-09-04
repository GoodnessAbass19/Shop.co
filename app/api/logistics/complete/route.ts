import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyCode } from "@/lib/delivery";
import { pusherServer } from "@/lib/pusher";
import { sendStatusEmail, sendStatusSMS } from "@/lib/notify";
import { getCurrentRider } from "@/lib/auth";

async function maybeSetOrderDelivered(orderId: string) {
  // If every item is DELIVERED, flip order status + deliveredAt
  const items = await prisma.orderItem.findMany({ where: { orderId } });
  const allDelivered = items.every((i) => i.deliveryStatus === "DELIVERED");
  if (allDelivered) {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "DELIVERED", deliveredAt: new Date() },
    });
  }
}

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
          orderItem: { include: { order: { include: { buyer: true } } } },
        },
      });
      if (!assignment || assignment.riderId !== rider.id)
        throw new Error("Forbidden");
      if (!assignment.codeHash || !assignment.codeExpiresAt)
        throw new Error("No active code");
      if (new Date() > assignment.codeExpiresAt)
        throw new Error("Code expired");

      const match = await verifyCode(code, assignment.codeHash);
      if (!match) {
        await tx.deliveryItem.update({
          where: { orderItemId },
          data: { attempts: { increment: 1 } },
        });
        throw new Error("Invalid code");
      }

      const item = await tx.orderItem.update({
        where: { id: orderItemId },
        data: { deliveryStatus: "DELIVERED", deliveredAt: new Date() },
        include: { order: { include: { buyer: true } } },
      });

      await tx.deliveryItem.update({
        where: { orderItemId },
        data: {
          deliveredAt: new Date(),
          codeHash: null,
          codeExpiresAt: null,
          attempts: 0,
        },
      });

      await maybeSetOrderDelivered(item.orderId);

      // Notify buyer & seller
      const buyerEmail = item.order.buyer?.email;
      const buyerPhone = item.order.buyer?.phone;
      if (buyerEmail)
        await sendStatusEmail(
          buyerEmail,
          "Delivery confirmed",
          `<p>Your item has been delivered. Thanks!</p>`
        );
      if (buyerPhone)
        await sendStatusSMS(
          buyerPhone,
          "Your item has been delivered. Thanks for shopping!"
        );

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
    return NextResponse.json(
      { error: e.message || "Complete failed" },
      { status: 400 }
    );
  }
}
