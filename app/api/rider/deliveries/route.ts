import prisma from "@/lib/prisma";
import { getCurrentRider } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const rider = await getCurrentRider();
  if (!rider)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const deliveries = await prisma.deliveryItem.findMany({
    where: {
      riderId: rider.id,
      status: { in: ["READY_FOR_PICKUP", "OUT_FOR_DELIVERY"] },
    },
    include: {
      orderItem: {
        include: {
          order: { include: { buyer: true } },
          productVariant: { include: { product: true } },
        },
      },
    },
  });
  return NextResponse.json(deliveries);
}
