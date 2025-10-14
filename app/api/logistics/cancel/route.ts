import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentRider } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher";
import { createAndSendNotification } from "@/lib/create-notification";
import { getGeoHashNeighbors } from "@/lib/geohash";

export async function POST(req: Request) {
  const rider = await getCurrentRider();
  if (!rider)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { deliveryItemId, reason } = await req.json();

  if (!deliveryItemId)
    return NextResponse.json(
      { error: "Missing deliveryItemId" },
      { status: 400 }
    );

  try {
    const deliveryItem = await prisma.deliveryItem.findUnique({
      where: { id: deliveryItemId },
      include: {
        orderItem: {
          include: {
            order: { include: { buyer: true } },
            store: true,
          },
        },
      },
    });

    if (!deliveryItem)
      return NextResponse.json(
        { error: "Delivery item not found" },
        { status: 404 }
      );

    if (deliveryItem.riderId !== rider.id)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    if (deliveryItem.status === "DELIVERED")
      return NextResponse.json(
        { error: "Cannot cancel a completed delivery" },
        { status: 400 }
      );

    // Reset assignment
    const updated = await prisma.deliveryItem.update({
      where: { id: deliveryItemId },
      data: {
        riderId: null,
        status: "PENDING",
        cancelledAt: new Date(),
        // cancellationReason: reason || "No reason provided",
      },
      include: {
        orderItem: {
          include: {
            order: { include: { buyer: true } },
            store: true,
          },
        },
      },
    });

    // Notify seller — available again
    await pusherServer.trigger(
      `private-seller-${updated.orderItem.storeId}`,
      "delivery.reassigned",
      {
        orderItemId: updated.orderItemId,
        status: "PENDING",
      }
    );

    // Notify buyer if already out for delivery
    if (deliveryItem.status === "OUT_FOR_DELIVERY") {
      await pusherServer.trigger(
        `private-buyer-${updated.orderItem.order.buyerId}`,
        "delivery.cancelled",
        {
          orderItemId: updated.orderItemId,
          message:
            "The rider was unable to complete delivery. Reassigning soon.",
        }
      );

      await createAndSendNotification({
        userId: updated.orderItem.order.buyerId,
        userRole: "BUYER",
        type: "FAILED_DELIVERY",
        title: "Delivery Cancelled",
        message:
          "Your assigned rider was unable to complete delivery. We’re reassigning another rider shortly.",
        relatedEntityId: updated.orderItem.id,
        relatedEntityType: "ORDER_ITEM",
      });
    }

    // Rider self log
    await createAndSendNotification({
      userId: rider.id,
      userRole: "RIDER",
      type: "FAILED_DELIVERY",
      title: "Delivery Cancelled",
      message: `You cancelled delivery for order item ${updated.orderItemId}.`,
      relatedEntityId: updated.orderItem.id,
      relatedEntityType: "ORDER_ITEM",
    });

    // 🔍 Auto Reassignment Logic
    if (updated.sellerGeohash) {
      const nearbyHashes = getGeoHashNeighbors(updated.sellerGeohash);

      const nearbyRiders = await prisma.rider.findMany({
        where: {
          geohash: { in: [updated.sellerGeohash, ...nearbyHashes] },
          isActive: true,
        },
        select: { id: true },
      });

      if (nearbyRiders.length > 0) {
        // Notify nearby riders about the new delivery offer
        await Promise.all(
          nearbyRiders.map((r) =>
            pusherServer.trigger(
              `private-rider-${r.id}`,
              "delivery.new_offer",
              {
                deliveryItemId: updated.id,
                storeName: updated.orderItem.store.name,
              }
            )
          )
        );
      }
    }

    return NextResponse.json({ ok: true, reofferedTo: "nearby riders" });
  } catch (e: any) {
    console.error("Cancel/reassign error:", e);
    return NextResponse.json(
      { error: e.message || "Failed to cancel/reassign delivery" },
      { status: 400 }
    );
  }
}
