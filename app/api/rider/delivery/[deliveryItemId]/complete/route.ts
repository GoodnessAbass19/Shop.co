import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyCode } from "@/lib/delivery";
import { pusherServer } from "@/lib/pusher";
import { sendStatusEmail, sendStatusSMS } from "@/lib/notify";
import { getCurrentRider, getCurrentUser } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ deliveryItemId: string }> }
) {
  const { deliveryItemId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rider = await prisma.rider.findUnique({
    where: { userId: user.id },
  });
  if (!rider)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code } = await req.json();

  try {
    await prisma.$transaction(async (tx) => {
      const assignment = await tx.deliveryItem.findUnique({
        where: { id: deliveryItemId },
        include: {
          orderItem: {
            include: {
              order: { include: { buyer: true } },
              productVariant: {
                include: {
                  product: true,
                },
              },
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
          where: { id: deliveryItemId },
          data: { attempts: { increment: 1 } },
        });
        throw new Error("Invalid code");
      }

      /**
       * 💰 Compute Rider Earning
       * You can later customize this logic dynamically (distance, bonuses, etc.)
       */
      const itemPrice = assignment.orderItem.productVariant?.price || 0;
      const basePay = 1000; // NGN
      const bonus = 100; // NGN
      const percentOfPrice = 0.05 * itemPrice; // 5% of item price
      const riderEarnings = basePay + bonus + percentOfPrice;

      /**
       * ✅ Update order item as delivered
       */
      const item = await tx.orderItem.update({
        where: { id: assignment.orderItemId },
        data: {
          deliveryStatus: "DELIVERED",
          deliveredAt: new Date(),
        },
        include: { order: { include: { buyer: true } } },
      });

      /**
       * ✅ Update delivery item
       */
      await tx.deliveryItem.update({
        where: { id: deliveryItemId },
        data: {
          deliveredAt: new Date(),
          status: "DELIVERED",
          deliveryCodeHash: null,
          deliveryCodeExpires: null,
          attempts: 0,
          // riderEarnings, // 💰 Save earning
        },
      });

      /**
       * 🧮 If all order items delivered, mark full order as delivered
       */
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

      /**
       * ✉️ Notifications
       */
      const buyerEmail = item.order.buyer?.email;
      const buyerPhone = item.order.buyer?.phone;

      if (buyerEmail)
        await sendStatusEmail(
          buyerEmail,
          "Delivery confirmed",
          `<p>Your item has been delivered successfully. Thank you for shopping with us!</p>`
        );

      // if (buyerPhone)
      //   await sendStatusSMS(
      //     buyerPhone,
      //     "✅ Your item has been delivered successfully. Thank you for shopping with us!"
      //   );

      /**
       * 🔔 Realtime updates via Pusher
       */
      await pusherServer.trigger(
        `private-buyer-${item.order.buyerId}`,
        "order_item.delivered",
        { orderItemId: item.id }
      );

      await pusherServer.trigger(
        `private-seller-${item.storeId}`,
        "order_item.delivered",
        { orderItemId: item.id }
      );

      await pusherServer.trigger(
        `private-rider-${rider.id}`,
        "order_item.delivered",
        { orderItemId: item.id, earning: riderEarnings }
      );

      /**
       * ⭐ (Optional) Rider Rating Placeholder
       * We'll later add a route where buyer can rate this completed delivery.
       */
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
