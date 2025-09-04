import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { getCurrentRider } from "@/lib/auth";

export async function POST(req: Request) {
  const rider = await getCurrentRider();
  if (!rider)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { orderItemId } = await req.json();

  const assignment = await prisma.deliveryItem.findUnique({
    where: { orderItemId },
  });
  if (!assignment || assignment.riderId !== rider.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const item = await prisma.orderItem.update({
    where: { id: orderItemId },
    data: { deliveryStatus: "OUT_FOR_DELIVERY" },
    include: { order: true },
  });

  await prisma.deliveryItem.update({
    where: { orderItemId },
    data: { pickedUpAt: new Date() },
  });

  await pusherServer.trigger(
    `private-buyer-${item.order.buyerId}`,
    "order_item.picked_up",
    { orderItemId }
  );
  await pusherServer.trigger(
    `private-seller-${item.storeId}`,
    "order_item.picked_up",
    { orderItemId }
  );

  return NextResponse.json({ ok: true });
}
