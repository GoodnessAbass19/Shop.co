import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { getCurrentRider } from "@/lib/auth";

export async function POST(req: Request) {
  const rider = await getCurrentRider();
  if (!rider) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderItemId } = await req.json();
  if (!orderItemId || typeof orderItemId !== "string") {
    return NextResponse.json(
      { error: "Invalid or missing orderItemId" },
      { status: 400 }
    );
  }

  try {
    const updatedDelivery = await prisma.$transaction(async (tx) => {
      // Ensure delivery item exists and is available
      const deliveryItem = await tx.deliveryItem.findUnique({
        where: { orderItemId },
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

      if (!deliveryItem) throw new Error("Delivery offer not found");
      if (deliveryItem.riderId)
        throw new Error("This delivery has already been accepted");

      if (deliveryItem.status !== "PENDING")
        throw new Error("Delivery item is not available for acceptance");

      // Assign the rider and mark ready for pickup
      const updated = await tx.deliveryItem.update({
        where: { orderItemId },
        data: {
          riderId: rider.id,
          status: "READY_FOR_PICKUP",
          acceptedAt: new Date(),
          attempts: 0,
        },
        include: {
          orderItem: true,
        },
      });

      // Update orderItem delivery status
      await tx.orderItem.update({
        where: { id: orderItemId },
        data: {
          deliveryStatus: "READY_FOR_PICKUP",
          assignedAt: new Date(),
          assignedRiderId: rider.id,
        },
      });

      return updated;
    });

    // Realtime notifications
    await pusherServer.trigger(
      `private-seller-${updatedDelivery.orderItem.storeId}`,
      "delivery.assigned",
      {
        orderItemId,
        riderId: rider.id,
        riderName: `${rider.firstName} ${rider.lastName}`,
      }
    );

    await pusherServer.trigger(
      `private-rider-${rider.id}`,
      "delivery.assigned",
      {
        orderItemId,
        status: "READY_FOR_PICKUP",
      }
    );

    return NextResponse.json({
      success: true,
      message: "Delivery accepted successfully",
    });
  } catch (error: any) {
    console.error("Accept offer error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to accept delivery offer" },
      { status: 400 }
    );
  }
}
