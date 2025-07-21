import prisma from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { itemId: string } }
) {
  const body = await req.json();
  const { code } = body;
  const { itemId } = await params;

  const orderItem = await prisma.orderItem.findUnique({
    where: { id: itemId },
  });

  if (!orderItem) {
    return new Response("Order item not found", { status: 404 });
  }

  if (orderItem.deliveryCode !== code) {
    return new Response("Invalid confirmation code", { status: 400 });
  }

  await prisma.orderItem.update({
    where: { id: itemId },
    data: {
      deliveryStatus: "DELIVERED",
      deliveredAt: new Date(),
      deliveryCode: null,
    },
  });

  // Step 2: Check if all items in this order are delivered
  const remainingItems = await prisma.orderItem.findMany({
    where: {
      orderId: orderItem.orderId,
      deliveryStatus: { notIn: ["DELIVERED"] },
    },
  });

  // Step 3: If none are remaining, update the full order
  if (remainingItems.length === 0) {
    await prisma.order.update({
      where: { id: orderItem.orderId },
      data: {
        status: "DELIVERED",
        deliveredAt: new Date(),
      },
    });
  }

  return Response.json({ success: true });
}
