import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateDeliveryCode, hashCode, codeExpiresIn } from "@/lib/delivery";
import {
  sendBuyerDeliveryCodeEmail,
  sendBuyerDeliveryCodeSMS,
} from "@/lib/notify";
import { pusherServer } from "@/lib/pusher";
import { getCurrentRider } from "@/lib/auth";

export async function POST(req: Request) {
  const rider = await getCurrentRider();
  if (!rider)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderItemId } = await req.json();

  try {
    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.orderItem.findUnique({
        where: { id: orderItemId },
        include: {
          order: { include: { buyer: true, address: true } },
          productVariant: { include: { product: true } },
        },
      });
      if (!item) throw new Error("Not found");
      if (!["READY_FOR_PICKUP", "PENDING"].includes(item.deliveryStatus))
        throw new Error("Already taken or invalid");

      // idempotency: ensure no assignment yet
      const existing = await tx.deliveryItem.findUnique({
        where: { orderItemId },
      });
      if (existing?.riderId) throw new Error("Already assigned");

      // generate code for buyer
      const code = generateDeliveryCode();
      const codeHash = await hashCode(code);

      const assignment = await tx.deliveryItem.upsert({
        where: { orderItemId },
        create: {
          orderItemId,
          riderId: rider.id,
          codeHash,
          codeExpiresAt: codeExpiresIn(24),
          acceptedAt: new Date(),
        },
        update: {
          riderId: rider.id,
          codeHash,
          codeExpiresAt: codeExpiresIn(24),
          acceptedAt: new Date(),
          attempts: 0,
        },
      });

      await tx.orderItem.update({
        where: { id: orderItemId },
        data: {
          deliveryStatus: "OUT_FOR_DELIVERY",
          assignedAt: new Date(),
          riderName: rider.name,
          riderPhone: rider.phone,
        },
      });

      return { item, assignment, code };
    });

    // Notify Buyer (email + SMS)
    const buyerEmail = result.item.order.buyer?.email;
    const buyerPhone = result.item.order.buyer?.phone;
    const itemName = result.item.productVariant.product.name;

    if (buyerEmail)
      await sendBuyerDeliveryCodeEmail(
        buyerEmail,
        result.item.order.buyer?.name || "",
        result.code,
        itemName
      );
    if (buyerPhone)
      await sendBuyerDeliveryCodeSMS(buyerPhone, result.code, itemName);

    // Realtime updates
    await pusherServer.trigger(
      `private-buyer-${result.item.order.buyerId}`,
      "order_item.assigned",
      {
        orderItemId,
        riderName: result.item.riderName,
        riderPhone: result.item.riderPhone,
      }
    );

    await pusherServer.trigger(
      `private-seller-${result.item.storeId}`,
      "order_item.assigned",
      {
        orderItemId,
        riderId: rider.id,
      }
    );

    await pusherServer.trigger(
      `private-rider-${rider.id}`,
      "order_item.assigned",
      {
        orderItemId,
      }
    );

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Accept failed" },
      { status: 400 }
    );
  }
}
