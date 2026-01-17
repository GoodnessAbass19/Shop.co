import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentRider, getCurrentUser } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ deliveryItemId: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rider = await prisma.rider.findUnique({
      where: { userId: user.id },
    });
    if (!rider) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { deliveryItemId } = await params;

    if (!deliveryItemId || typeof deliveryItemId !== "string") {
      return NextResponse.json(
        { error: "Invalid delivery item id" },
        { status: 400 }
      );
    }

    const delivery = await prisma.deliveryItem.findUnique({
      where: { id: deliveryItemId },
      include: {
        orderItem: {
          include: {
            store: {
              include: {
                shippingInfo: true,
              },
            },
            order: {
              include: {
                address: true,
                buyer: true,
              },
            },
          },
        },
      },
    });

    if (!delivery) {
      return NextResponse.json(
        { error: "Delivery not found" },
        { status: 404 }
      );
    }

    // 🔒 Ensure rider owns this delivery
    if (delivery.riderId !== rider.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // const pickup = delivery.orderItem.store.shippingInfo;
    const dropoff = delivery.orderItem.order.address;

    if (!dropoff) {
      return NextResponse.json(
        { error: "Pickup or dropoff location missing" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      delivery: {
        id: delivery.id,
        status: delivery.status,

        rider: {
          id: rider.id,
          lat: rider.latitude,
          lng: rider.longitude,
          payout: delivery.riderEarnings,
        },

        pickup: {
          lat: delivery.sellerLat,
          lng: delivery.sellerLng,
          address: `${delivery.orderItem.store.shippingInfo?.shippingAddress1}, ${delivery.orderItem.store.shippingInfo?.shippingCity}, ${delivery.orderItem.store.shippingInfo?.shippingState}`,
          storeName: delivery.orderItem.store.name,
          storePhone: delivery.orderItem.store.contactPhone,
        },

        dropoff: {
          lat: dropoff.latitude,
          lng: dropoff.longitude,
          address: `${dropoff.street}, ${dropoff.city}, ${dropoff.state}`,
          recipientName: delivery.orderItem.order.buyer.name,
          recipientPhone: delivery.orderItem.order.buyer.phone,
        },

        deadlines: {
          pickupBy: delivery.pickupDeadline,
          deliverBy: delivery.deliveryDeadline,
        },
      },
    });
  } catch (error) {
    console.error("❌ Get delivery error:", error);
    return NextResponse.json(
      { error: "Failed to load delivery details" },
      { status: 500 }
    );
  }
}
