import { getCurrentUser } from "@/lib/auth";
import { encodeGeoHash5 } from "@/lib/geohash";
import prisma from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: { orderitem: string } }
) {
  const user = await getCurrentUser();
  let sellerLat: number | null = null;
  let sellerLng: number | null = null;

  try {
    const body = await req.json();
    sellerLat = body.sellerLat;
    sellerLng = body.sellerLng;
  } catch {
    return NextResponse.json(
      { error: "Invalid or missing JSON body" },
      { status: 400 }
    );
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify user owns this store
  const store = await prisma.store.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!store) {
    return NextResponse.json(
      { error: "Forbidden: Store not found or not owned by user." },
      { status: 403 }
    );
  }

  const { orderitem } = params;

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
      { error: "Order item not found" },
      { status: 404 }
    );
  }

  if (
    item.deliveryStatus !== "PENDING" &&
    item.deliveryStatus !== "READY_FOR_PICKUP"
  ) {
    return NextResponse.json(
      { error: "Invalid state transition" },
      { status: 400 }
    );
  }

  // mark ready
  await prisma.orderItem.update({
    where: { id: orderitem },
    data: { deliveryStatus: "READY_FOR_PICKUP" },
  });

  const hash = encodeGeoHash5(sellerLat!, sellerLng!);

  // Notify nearby riders
  await pusherServer.trigger(`presence-nearby-${hash}`, "order-item-offered", {
    orderitem,
    storeId: item.storeId,
    sellerLat,
    sellerLng,
    itemName: item.productVariant.product.name,
    price: item.price,
  });

  return NextResponse.json({ ok: true });
}
