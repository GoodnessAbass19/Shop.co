// import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";
// import { pusherServer } from "@/lib/pusher";
// import { getCurrentRider } from "@/lib/auth";

// export async function POST(req: Request) {
//   const rider = await getCurrentRider();
//   if (!rider) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }

//   const { orderItemId } = await req.json();
//   if (!orderItemId || typeof orderItemId !== "string") {
//     return NextResponse.json(
//       { error: "Invalid or missing orderItemId" },
//       { status: 400 }
//     );
//   }

//   if (rider.suspensionUntil && new Date() < rider.suspensionUntil) {
//     const remaining = Math.ceil(
//       (rider.suspensionUntil.getTime() - Date.now()) / (60 * 1000)
//     );
//     return NextResponse.json(
//       {
//         error: `You are temporarily suspended. Please try again in ${remaining} minutes.`,
//       },
//       { status: 403 }
//     );
//   }

//   try {
//     const updatedDelivery = await prisma.$transaction(async (tx) => {
//       // Ensure delivery item exists and is available
//       const deliveryItem = await tx.deliveryItem.findUnique({
//         where: { orderItemId },
//         include: {
//           orderItem: {
//             include: {
//               order: { include: { buyer: true } },
//               productVariant: { include: { product: true } },
//               store: true,
//             },
//           },
//         },
//       });

//       if (!deliveryItem) throw new Error("Delivery offer not found");
//       if (deliveryItem.riderId)
//         throw new Error("This delivery has already been accepted");

//       if (deliveryItem.status !== "PENDING")
//         throw new Error("Delivery item is not available for acceptance");

//       const now = new Date();
//       const pickupDeadline = new Date(now.getTime() + 30 * 60 * 1000); // 15 mins
//       const deliveryDeadline = new Date(now.getTime() + 6 * 60 * 60 * 1000); // 6 hour

//       // Assign the rider and mark ready for pickup
//       const updated = await tx.deliveryItem.update({
//         where: { orderItemId },
//         data: {
//           riderId: rider.id,
//           status: "READY_FOR_PICKUP",
//           acceptedAt: new Date(),
//           attempts: 0,
//           pickupDeadline: pickupDeadline,
//           deliveryDeadline: deliveryDeadline,
//         },
//         include: {
//           orderItem: true,
//         },
//       });

//       // Update orderItem delivery status
//       await tx.orderItem.update({
//         where: { id: orderItemId },
//         data: {
//           deliveryStatus: "READY_FOR_PICKUP",
//           assignedAt: new Date(),
//         },
//       });

//       return updated;
//     });

//     // Realtime notifications
//     await pusherServer.trigger(
//       `private-seller-${updatedDelivery.orderItem.storeId}`,
//       "delivery.assigned",
//       {
//         orderItemId,
//         riderId: rider.id,
//         riderName: `${rider.firstName} ${rider.lastName}`,
//       }
//     );

//     await pusherServer.trigger(
//       `private-rider-${rider.id}`,
//       "delivery.assigned",
//       {
//         orderItemId,
//         status: "READY_FOR_PICKUP",
//       }
//     );

//     return NextResponse.json({
//       success: true,
//       message: "Delivery accepted successfully",
//     });
//   } catch (error: any) {
//     console.error("Accept offer error:", error);
//     return NextResponse.json(
//       { error: error.message || "Failed to accept delivery offer" },
//       { status: 400 }
//     );
//   }
// }

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { getCurrentRider, getCurrentUser } from "@/lib/auth";
import { createAndSendNotification } from "@/lib/create-notification";

export async function POST(
  req: Request,
  { params }: { params?: { itemId?: string } } = {}
) {
  // Try to read rider first — keep original behavior
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rider = await prisma.rider.findUnique({
    where: { userId: user.id },
  });

  if (!rider) {
    console.warn(
      "AcceptOffer: unauthenticated request (getCurrentRider returned null)"
    );
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse body safely (handle missing JSON gracefully)
  let body: any = {};
  try {
    // Some clients may send urlencoded or JSON; handle JSON mainly
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      body = await req.json();
    } else {
      // fallback: attempt to read text and parse urlencoded
      const txt = await req.text().catch(() => "");
      if (txt) {
        try {
          body = JSON.parse(txt);
        } catch {
          const params = new URLSearchParams(txt);
          body.orderItemId =
            params.get("orderItemId") || params.get("orderitem") || undefined;
        }
      }
    }
  } catch (err) {
    console.warn("AcceptOffer: error parsing body", err);
  }

  const orderItemId = (body && body.orderItemId) || params?.itemId;
  if (!orderItemId || typeof orderItemId !== "string") {
    return NextResponse.json(
      { error: "Invalid or missing orderItemId" },
      { status: 400 }
    );
  }

  // optionally: log for debugging in dev
  console.log(`AcceptOffer: rider=${rider.id}, orderItemId=${orderItemId}`);

  // ... rest of your original logic unchanged ...
  try {
    const updatedDelivery = await prisma.$transaction(async (tx) => {
      const deliveryItem = await tx.deliveryItem.findUnique({
        where: { orderItemId },
        include: {
          orderItem: {
            include: {
              order: { include: { buyer: true } },
              productVariant: { include: { product: true } },
              store: true,
            },
          },
        },
      });

      if (!deliveryItem) throw new Error("Delivery offer not found");
      if (deliveryItem.riderId)
        throw new Error("This delivery has already been accepted");
      if (deliveryItem.status !== "PENDING")
        throw new Error("Delivery item is not available for acceptance");

      const now = new Date();
      const pickupDeadline = new Date(now.getTime() + 30 * 60 * 1000); // 30 mins
      const deliveryDeadline = new Date(now.getTime() + 6 * 60 * 60 * 1000); // 6 hours

      const updated = await tx.deliveryItem.update({
        where: { orderItemId },
        data: {
          riderId: rider.id,
          status: "READY_FOR_PICKUP",
          acceptedAt: new Date(),
          attempts: 0,
          pickupDeadline,
          deliveryDeadline,
        },
        include: {
          orderItem: {
            include: {
              store: true,
            },
          },
        },
      });

      await tx.orderItem.update({
        where: { id: orderItemId },
        data: {
          deliveryStatus: "ASSIGNED",
          assignedAt: new Date(),
        },
      });

      return updated;
    });

    // push real-time notifications
    await pusherServer.trigger(
      `private-seller-${updatedDelivery.orderItem.storeId}`,
      "delivery.assigned",
      {
        orderItemId,
        riderId: rider.id,
        riderName: `${rider.firstName} ${rider.lastName}`,
      }
    );

    await pusherServer.trigger(
      `private-rider-${rider.id}`,
      "delivery.assigned",
      {
        orderItemId,
        status: "READY_FOR_PICKUP",
      }
    );

    return NextResponse.json({
      success: true,
      message: "Delivery accepted successfully",
    });
  } catch (error: any) {
    console.error("Accept offer error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to accept delivery offer" },
      { status: 400 }
    );
  }
}
