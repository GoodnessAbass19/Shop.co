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
      select: { id: true, name: true, shippingInfo: true },
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
        productVariant: {
          include: { product: true },
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: "Order item not found or not eligible for delivery." },
        { status: 404 }
      );
    }

    if (item.deliveryStatus !== "PENDING") {
      return NextResponse.json(
        { error: "Order item cannot transition to READY_FOR_PICKUP." },
        { status: 400 }
      );
    }

    // Check for existing delivery entry
    const existingDelivery = await prisma.deliveryItem.findUnique({
      where: { orderItemId: item.id },
    });

    if (existingDelivery) {
      return NextResponse.json({
        success: true,
        message: "Delivery offer already created.",
        orderItem: item,
        deliveryItem: existingDelivery,
      });
    }

    const sellerGeohash = encodeGeoHash5(sellerLat, sellerLng);
    const offerExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Update order item delivery status
    const updatedItem = await prisma.orderItem.update({
      where: { id: item.id },
      data: { deliveryStatus: "READY_FOR_PICKUP" },
      include: {
        order: { include: { buyer: true } },
        productVariant: {
          include: { product: true },
        },
        store: true,
      },
    });

    const itemPrice = updatedItem.productVariant?.product?.price || 0;
    const basePay = 1000; // NGN
    const bonus = 100; // NGN
    const percentOfPrice = 0.05 * itemPrice; // 5% of item price
    const riderEarning = basePay + bonus + percentOfPrice;

    // Create the DeliveryItem record
    const deliveryItem = await prisma.deliveryItem.create({
      data: {
        orderItemId: item.id,
        sellerLat,
        sellerLng,
        sellerGeohash,
        offerExpiresAt,
        status: "PENDING",
        riderEarnings: riderEarning,
      },
      include: {
        orderItem: {
          include: {
            order: { include: { buyer: true, address: true } },
            productVariant: {
              include: { product: true },
            },
            store: {
              include: {
                shippingInfo: true,
              },
            },
          },
        },
      },
    });

    // Notify nearby riders (Pusher broadcast)
    const offerPayload = {
      id: deliveryItem.id,
      orderItemId: deliveryItem.orderItemId,
      storeName: store.name,
      pickupAddress: `${store.shippingInfo?.shippingAddress1}, ${
        store.shippingInfo?.shippingAddress2 || ""
      } ${store.shippingInfo?.shippingCity || ""}, ${
        store.shippingInfo?.shippingState
      }`.trim(),
      dropoffAddress:
        `${deliveryItem.orderItem.order.address?.street}, ${deliveryItem.orderItem.order.address?.city}, ${deliveryItem.orderItem.order.address?.state}`.trim(),
      fee: deliveryItem.riderEarnings,
      itemName: deliveryItem.orderItem.productVariant.product.name,
      price: deliveryItem.orderItem.price,
      sellerLat,
      sellerLng,
      buyerName: deliveryItem.orderItem.order.buyer?.name || "Buyer",
      timestamp: new Date().toISOString(),
      geohash: sellerGeohash,
    };

    await pusherServer.trigger(
      `presence-nearby-${sellerGeohash}`,
      "offer.new",
      offerPayload
    );

    return NextResponse.json({
      success: true,
      message: "Order item marked as ready for pickup and offer broadcasted.",
      deliveryItem,
    });
  } catch (error: any) {
    console.error("❌ Error creating delivery offer:", error);
    return NextResponse.json(
      { error: "Failed to create delivery offer." },
      { status: 500 }
    );
  }
}
