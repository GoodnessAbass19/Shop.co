import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";
import { getCurrentRider } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const rider = await getCurrentRider();
  if (!rider) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { latitude, longitude } = await req.json();

  try {
    // 1. Update the rider's static location in the DB for initial assignment search
    await prisma.rider.update({
      where: { id: rider.id },
      data: { latitude: latitude, longitude: longitude },
    });

    // 2. Broadcast the real-time location to the relevant parties
    // We get the delivery item to know which buyer and seller to notify
    const deliveryItems = await prisma.deliveryItem.findMany({
      where: { riderId: rider.id, status: { not: "DELIVERED" } },
      include: {
        orderItem: {
          select: { order: { select: { buyerId: true } }, storeId: true },
        },
      },
    });

    const buyerIds: string[] = [];
    const sellerIds: string[] = [];

    deliveryItems.forEach((item) => {
      if (item.orderItem.order?.buyerId) {
        buyerIds.push(item.orderItem.order.buyerId);
      }
      if (item.orderItem.storeId) {
        sellerIds.push(item.orderItem.storeId);
      }
    });

    const uniqueBuyerIds = [...new Set(buyerIds)];
    const uniqueSellerIds = [...new Set(sellerIds)];

    // Trigger Pusher events for each relevant buyer and seller
    uniqueBuyerIds.forEach((buyerId) => {
      pusherServer.trigger(
        `private-buyer-${buyerId}`,
        "rider.location_update",
        {
          riderId: rider.id,
          lat: latitude,
          lng: longitude,
        }
      );
    });

    uniqueSellerIds.forEach((sellerId) => {
      pusherServer.trigger(
        `private-seller-${sellerId}`,
        "rider.location_update",
        {
          riderId: rider.id,
          lat: latitude,
          lng: longitude,
        }
      );
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error updating rider location:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
