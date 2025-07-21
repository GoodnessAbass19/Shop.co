import { DeliveryCodeEmail, sendEmail } from "@/lib/otp";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: { itemId: string } }
) {
  function generateOTP(length = 6) {
    return Math.floor(Math.random() * Math.pow(10, length))
      .toString()
      .padStart(length, "0");
  }
  const { itemId } = await params;
  const body = await req.json();
  const confirmationCode = generateOTP();

  const updatedItem = await prisma.orderItem.update({
    where: { id: itemId },
    data: {
      riderName: body.riderName,
      riderPhone: body.riderPhone,
      trackingUrl: body.trackingUrl || null,
      deliveryStatus: "OUT_FOR_DELIVERY",
      assignedAt: new Date(),
      deliveryCode: confirmationCode, // Ensure deliveryCode is set if provided
    },
    include: {
      order: { include: { buyer: true } },
      productVariant: { include: { product: true } },
    },
  });

  const remainingItems = await prisma.orderItem.findMany({
    where: {
      orderId: updatedItem.orderId,
      deliveryStatus: { not: "DELIVERED" },
    },
  });

  // Step 3: If none are remaining, update the full order
  if (remainingItems.length === 0) {
    await prisma.order.update({
      where: { id: updatedItem.orderId },
      data: {
        status: "SHIPPED",
        shippedAt: new Date(),
      },
    });
  }

  const buyerEmail = updatedItem.order.buyer.email;
  const buyerName = updatedItem.order.buyer.name || "Customer";

  await sendEmail({
    to: buyerEmail,
    subject: "Your Order is on the Way!",
    html: DeliveryCodeEmail({ name: buyerName, code: confirmationCode }),
  });

  return Response.json({ success: true });
  // You can add SMS or email notification logic here.

  return NextResponse.json({ updatedItem });
}
