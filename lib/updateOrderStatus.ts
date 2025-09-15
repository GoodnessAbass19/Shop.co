// lib/updateOrderStatus.ts

import prisma from "./prisma";

export async function updateOrderStatus(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { deliveryItem: true } } },
  });

  if (!order) return null;

  const deliveryStatuses = order.items.map((i) =>
    i.deliveryItem?.deliveredAt
      ? "DELIVERED"
      : i.deliveryItem?.cancelledAt
      ? "FAILED"
      : "IN_PROGRESS"
  );

  const allDelivered = deliveryStatuses.every((s) => s === "DELIVERED");
  const anyFailed = deliveryStatuses.includes("FAILED");
  const anyInProgress = deliveryStatuses.includes("IN_PROGRESS");

  let newStatus: string = order.status;

  if (allDelivered) {
    newStatus = "DELIVERED";
  } else if (anyFailed && allDelivered === false) {
    newStatus = deliveryStatuses.every((s) => s === "FAILED")
      ? "RETURNED"
      : "PARTIALLY_RETURNED";
  } else if (anyInProgress) {
    newStatus = "IN_PROGRESS";
  }

  if (newStatus !== order.status) {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: newStatus as any,
        deliveredAt: newStatus === "DELIVERED" ? new Date() : null,
      },
    });
  }

  return newStatus;
}
