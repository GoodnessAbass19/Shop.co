import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentRider } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher";
import { createAndSendNotification } from "@/lib/create-notification";
import {
  sendBuyerDeliveryCodeEmail,
  sendBuyerDeliveryCodeSMS,
} from "@/lib/notify";
import { codeExpiresIn, generateDeliveryCode, hashCode } from "@/lib/delivery";

export async function POST(req: Request) {
  const rider = await getCurrentRider();
  if (!rider)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { deliveryItemId } = await req.json();
  if (!deliveryItemId)
    return NextResponse.json(
      { error: "Missing deliveryItemId" },
      { status: 400 }
    );

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const deliveryItem = await tx.deliveryItem.findUnique({
        where: { id: deliveryItemId },
        include: {
          orderItem: {
            include: {
              order: { include: { buyer: true } },
              productVariant: { include: { product: true } },
              store: true,
            },
          },
        },
      });

      if (!deliveryItem)
        throw new Error("Delivery item not found or unavailable");

      if (deliveryItem.riderId !== rider.id)
        throw new Error("You are not assigned to this delivery");

      if (deliveryItem.status !== "READY_FOR_PICKUP")
        throw new Error("This item is not ready for pickup");

      // Generate delivery code
      const code = generateDeliveryCode();
      const deliveryCodeHash = await hashCode(code);

      // Update both delivery item & order item status
      const updatedDelivery = await tx.deliveryItem.update({
        where: { id: deliveryItemId },
        data: {
          status: "OUT_FOR_DELIVERY",
          pickedUpAt: new Date(),
          deliveryCodeHash,
          deliveryCodeExpires: codeExpiresIn(24),
        },
        include: {
          orderItem: {
            include: {
              order: { include: { buyer: true } },
              productVariant: { include: { product: true } },
              store: true,
            },
          },
        },
      });

      await tx.orderItem.update({
        where: { id: deliveryItem.orderItemId },
        data: { deliveryStatus: "OUT_FOR_DELIVERY" },
      });

      return { updatedDelivery, code };
    });

    const { updatedDelivery, code } = updated;
    const buyer = updatedDelivery.orderItem.order.buyer;
    const itemName = updatedDelivery.orderItem.productVariant.product.name;

    // Notify buyer via email + SMS
    if (buyer?.email)
      await sendBuyerDeliveryCodeEmail(
        buyer.email,
        buyer.name || "",
        code,
        itemName
      );

    if (buyer?.phone)
      await sendBuyerDeliveryCodeSMS(buyer.phone, code, itemName);

    // Realtime updates
    await pusherServer.trigger(
      `private-buyer-${buyer.id}`,
      "order_item.picked_up",
      { orderItemId: updatedDelivery.orderItemId }
    );

    await pusherServer.trigger(
      `private-seller-${updatedDelivery.orderItem.storeId}`,
      "order_item.picked_up",
      { orderItemId: updatedDelivery.orderItemId }
    );

    // In-app notification
    await createAndSendNotification({
      userId: buyer.id,
      userRole: "BUYER",
      type: "ORDER_CONFIRMATION",
      title: "Your order is out for delivery",
      message: `Your order item "${itemName}" has been picked up and is on its way!`,
      relatedEntityId: updatedDelivery.orderItem.id,
      relatedEntityType: "ORDER_ITEM",
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Pickup route error:", error);
    return NextResponse.json(
      { error: error.message || "Pickup failed" },
      { status: 400 }
    );
  }
}
