// POST /api/rider/accept-reoffer
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentRider } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: Request) {
  const rider = await getCurrentRider();
  if (!rider)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { deliveryItemId } = await req.json();

  const item = await prisma.deliveryItem.findUnique({
    where: { id: deliveryItemId },
  });
  if (!item || item.status !== "PENDING")
    return NextResponse.json({ error: "Item unavailable" }, { status: 400 });

  const updated = await prisma.deliveryItem.update({
    where: { id: deliveryItemId },
    data: { riderId: rider.id, status: "READY_FOR_PICKUP" },
  });

  await pusherServer.trigger("rider-reoffers", "delivery_item.claimed", {
    deliveryItemId: updated.id,
  });

  return NextResponse.json({ ok: true });
}
