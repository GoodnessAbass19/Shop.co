import { getCurrentUser } from "@/lib/auth";
import { encodeGeoHash5 } from "@/lib/geohash";
import prisma from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: { orderitem: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderitem } = params;

    if (!orderitem || typeof orderitem !== "string") {
      return NextResponse.json(
        { error: "Invalid or missing order item ID." },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => null);
    if (
      !body ||
      typeof body.sellerLat !== "number" ||
      typeof body.sellerLng !== "number"
    ) {
      return NextResponse.json(
        { error: "Invalid or missing coordinates." },
        { status: 400 }
      );
    }

    const { sellerLat, sellerLng } = body;

    // Verify the seller owns this store
    const store = await prisma.store.findUnique({
      where: { userId: user.id },
      select: { id: true, name: true },
    });

    if (!store) {
      return NextResponse.json(
        { error: "Forbidden: Store not found or not owned by user." },
        { status: 403 }
      );
    }

    // Find the order item
    const item = await prisma.orderItem.findFirst({
      where: {
        id: orderitem,
        storeId: store.id,
        order: { status: "PAID" },
      },
      include: {
        order: { include: { buyer: true } },
        store: true,
        productVariant: { include: { product: true } },
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: "Order item not found." },
        { status: 404 }
      );
    }

    // Only allow PENDING → READY_FOR_PICKUP
    if (item.deliveryStatus !== "PENDING") {
      return NextResponse.json(
        { error: "Order item cannot transition to READY_FOR_PICKUP." },
        { status: 400 }
      );
    }

    // Check if a delivery item already exists for this order item
    const existingDelivery = await prisma.deliveryItem.findUnique({
      where: { orderItemId: item.id },
    });

    if (existingDelivery) {
      return NextResponse.json({
        success: true,
        message: "Order item is already marked as ready for pickup.",
        orderItem: item,
        deliveryItem: existingDelivery,
      });
    }

    const hash = encodeGeoHash5(sellerLat, sellerLng);
    const offerExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Update order item delivery status
    const updatedItem = await prisma.orderItem.update({
      where: { id: orderitem },
      data: { deliveryStatus: "READY_FOR_PICKUP" },
    });

    // Create a corresponding DeliveryItem
    const deliveryItem = await prisma.deliveryItem.create({
      data: {
        orderItemId: item.id,
        status: "PENDING",
        sellerLat,
        sellerLng,
        sellerGeohash: hash,
        offerExpiresAt: offerExpiry,
      },
    });

    // Notify nearby riders
    await pusherServer.trigger(
      `presence-nearby-${hash}`,
      "order-item-offered",
      {
        orderitem: updatedItem.id,
        orderId: updatedItem.orderId,
        storeId: updatedItem.storeId,
        storeName: store.name,
        sellerLat,
        sellerLng,
        itemName: item.productVariant.product.name,
        price: item.price,
        timestamp: new Date().toISOString(),
        geohash: hash,
      }
    );

    return NextResponse.json({
      success: true,
      message: "Order item marked as ready for pickup.",
      orderItem: updatedItem,
      deliveryItem,
    });
  } catch (error: any) {
    console.error("Error marking order item ready for pickup:", error);
    return NextResponse.json(
      { error: "Failed to mark order item as ready for pickup." },
      { status: 500 }
    );
  }
}
