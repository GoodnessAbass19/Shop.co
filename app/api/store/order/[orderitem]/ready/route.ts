import { getCurrentUser } from "@/lib/auth";
import { createAndSendNotification } from "@/lib/create-notification";
import { generateDeliveryCode, hashCode } from "@/lib/delivery";
import { encodeGeoHash4 } from "@/lib/geohash";
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
    if (!body) {
      return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
    }

    const { sellerLat, sellerLng } = body;

    if (
      typeof sellerLat !== "number" ||
      typeof sellerLng !== "number" ||
      sellerLat < -90 ||
      sellerLat > 90 ||
      sellerLng < -180 ||
      sellerLng > 180
    ) {
      return NextResponse.json(
        { error: "Invalid coordinates." },
        { status: 400 }
      );
    }

    // Verify store ownership
    const store = await prisma.store.findUnique({
      where: { userId: user.id },
      select: { id: true, name: true, shippingInfo: true, userId: true },
    });

    if (!store) {
      return NextResponse.json(
        { error: "Unauthorized store" },
        { status: 403 }
      );
    }

    // Find order item
    const item = await prisma.orderItem.findFirst({
      where: {
        id: orderitem,
        storeId: store.id,
        order: { status: "PAID" },
      },
      include: {
        order: { include: { buyer: true, address: true } },
        productVariant: { include: { product: true } },
        store: true,
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: "Order not eligible." },
        { status: 404 }
      );
    }

    if (!["PENDING", "READY_FOR_PICKUP"].includes(item.deliveryStatus)) {
      return NextResponse.json(
        { error: "Invalid delivery state transition." },
        { status: 400 }
      );
    }

    // Prevent duplicate offers
    const existingDelivery = await prisma.deliveryItem.findFirst({
      where: {
        orderItemId: item.id,
        status: { in: ["PENDING", "ASSIGNED", "OUT_FOR_DELIVERY"] },
      },
    });

    if (existingDelivery) {
      return NextResponse.json({
        success: true,
        message: "Offer already active.",
        deliveryItem: existingDelivery,
      });
    }

    const sellerGeohash = encodeGeoHash4(sellerLat, sellerLng);
    const offerExpiresAt = new Date(Date.now() + 60 * 60 * 1000);

    const updatedItem = await prisma.orderItem.update({
      where: { id: item.id },
      data: { deliveryStatus: "READY_FOR_PICKUP" },
      include: {
        order: { include: { buyer: true, address: true } },
        productVariant: { include: { product: true } },
        store: true,
      },
    });

    // Rider earnings logic
    const itemPrice = updatedItem.productVariant?.product?.price || 0;
    const basePay = 1000;
    const bonus = 100;
    const riderEarnings = basePay + bonus + itemPrice * 0.05;
    const code = generateDeliveryCode();
    const pickupCodeHash = await hashCode(code);

    const deliveryItem = await prisma.deliveryItem.create({
      data: {
        orderItemId: item.id,
        sellerLat,
        sellerLng,
        sellerGeohash,
        offerExpiresAt,
        status: "PENDING",
        riderEarnings,
        pickupCodeHash,
        pickupCodeExpires: new Date(Date.now() + 15 * 60 * 1000),
        pickupDeadline: new Date(Date.now() + 60 * 60 * 1000),
      },
      include: {
        orderItem: {
          include: {
            order: { include: { buyer: true, address: true } },
            productVariant: { include: { product: true } },
            store: { include: { shippingInfo: true } },
          },
        },
      },
    });

    const offer = {
      id: deliveryItem.id,
      orderItemId: deliveryItem.orderItemId,
      storeName: store.name,
      pickupAddress: `${store.shippingInfo?.shippingAddress1 || ""} ${
        store.shippingInfo?.shippingCity || ""
      } ${store.shippingInfo?.shippingState || ""}`.trim(),
      dropoffAddress: `${deliveryItem.orderItem.order.address?.street || ""}, ${
        deliveryItem.orderItem.order.address?.city || ""
      }, ${deliveryItem.orderItem.order.address?.state || ""}`.trim(),
      fee: riderEarnings,
      itemName: deliveryItem.orderItem.productVariant.product.name,
      buyerName: deliveryItem.orderItem.order.buyer?.name || "Buyer",
      buyerContact: deliveryItem.orderItem.order.buyer?.phone || "",
      sellerLat,
      sellerLng,
      buyerLat: deliveryItem.orderItem.order.address?.latitude || 0,
      buyerLng: deliveryItem.orderItem.order.address?.longitude || 0,
      geohash: sellerGeohash,
      pickupCodeExpires: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 30 * 1000).toISOString(), //
    };

    // Broadcast to nearby riders (do not include sensitive pickup code)
    try {
      await pusherServer.trigger(
        `presence-nearby-${sellerGeohash}`,
        "offer.new",
        offer
      );
    } catch (pusherErr) {
      console.error("⚠️ Pusher trigger failed, continuing:", pusherErr);
    }

    await createAndSendNotification({
      userId: store.userId,
      userRole: "SELLER",
      type: "SHIPPING_UPDATE",
      title: "Pickup code for delivery",
      message: `Your pickup code is ${code}.`,
    });

    // Remove sensitive fields before returning
    const safeDeliveryItem = { ...deliveryItem } as any;
    if (safeDeliveryItem.pickupCode) delete safeDeliveryItem.pickupCode;
    if (safeDeliveryItem.pickupCodeHash) delete safeDeliveryItem.pickupCodeHash;

    return NextResponse.json({
      success: true,
      message: "Offer broadcasted to riders.",
      deliveryItem: safeDeliveryItem,
    });
  } catch (err) {
    console.error("❌ Delivery Ready Error:", err);
    return NextResponse.json(
      { error: "Failed to mark order as ready." },
      { status: 500 }
    );
  }
}
