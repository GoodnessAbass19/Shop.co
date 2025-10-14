import prisma from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { applyRiderPenalty } from "./rider-penalty";

export async function autoReofferTimedOutDeliveries() {
  const now = new Date();

  // PENDING PICKUPS
  const latePickups = await prisma.deliveryItem.findMany({
    where: {
      status: "READY_FOR_PICKUP",
      pickupDeadline: { lt: now },
      pickedUpAt: null,
    },
  });

  for (const item of latePickups) {
    await prisma.deliveryItem.update({
      where: { id: item.id },
      data: { riderId: null, status: "PENDING", reofferedAt: new Date() },
    });

    if (item.riderId) {
      await applyRiderPenalty(item.riderId, "Pickup timeout");
    }

    await pusherServer.trigger("rider-reoffers", "delivery_item.reoffered", {
      deliveryItemId: item.id,
      orderItemId: item.orderItemId,
      type: "pickup_timeout",
    });
  }

  // LATE DELIVERIES
  const lateDeliveries = await prisma.deliveryItem.findMany({
    where: {
      status: "OUT_FOR_DELIVERY",
      deliveryDeadline: { lt: now },
      deliveredAt: null,
    },
  });

  for (const item of lateDeliveries) {
    await prisma.deliveryItem.update({
      where: { id: item.id },
      data: { riderId: null, status: "PENDING", reofferedAt: new Date() },
    });

    if (item.riderId) {
      await applyRiderPenalty(item.riderId, "Delivery timeout");
    }

    await pusherServer.trigger("rider-reoffers", "delivery_item.reoffered", {
      deliveryItemId: item.id,
      orderItemId: item.orderItemId,
      type: "delivery_timeout",
    });
  }
}

// VERCEL.JSON CRON JOB SETUP
// {
//   "crons": [
//     {
//       "path": "/api/cron/auto-reoffer",
//       "schedule": "*/5 * * * *"
//     }
//   ]
// }
