// app/api/seller/orders/[orderId]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function GET(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = await params;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required." },
        { status: 400 }
      );
    }

    // Fetch the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyer: {
          select: { id: true, name: true, email: true, phone: true },
        },
        address: true,
        items: {
          include: {
            productVariant: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    images: true,
                    slug: true,
                    storeId: true,
                  }, // Include storeId to verify ownership
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    // Authorization check: Ensure the order contains at least one item from the seller's store
    const sellerStore = await prisma.store.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!sellerStore) {
      return NextResponse.json(
        { error: "No store found for this user." },
        { status: 403 }
      );
    }

    const isOrderForThisSeller = order.items.some(
      (item) => item.productVariant.product.storeId === sellerStore.id
    );

    if (!isOrderForThisSeller) {
      return NextResponse.json(
        { error: "Forbidden: This order does not belong to your store." },
        { status: 403 }
      );
    }

    return NextResponse.json({ order }, { status: 200 });
  } catch (error) {
    console.error("API Error fetching single seller order:", error);
    return NextResponse.json(
      { error: "Failed to fetch order details." },
      { status: 500 }
    );
  }
}

// export async function PATCH(
//   req: Request,
//   { params }: { params: { orderId: string } }
// ) {
//   function generateOTP(length = 6) {
//     return Math.floor(Math.random() * Math.pow(10, length))
//       .toString()
//       .padStart(length, "0");
//   }
//   const { orderId } = params;
//   const body = await req.json();
//   const confirmationCode = generateOTP();

//   const updatedItem = await prisma.orderItem.update({
//     where: { id: orderId },
//     data: {
//       riderName: body.riderName,
//       riderPhone: body.riderPhone,
//       trackingUrl: body.trackingUrl || null,
//       deliveryStatus: "ASSIGNED",
//       assignedAt: new Date(),
//       deliveryCode: confirmationCode, // Ensure deliveryCode is set if provided
//     },
//     include: {
//       order: { include: { buyer: true } },
//       productVariant: { include: { product: true } },
//     },
//   });

//   // You can add SMS or email notification logic here.

//   return NextResponse.json({ updatedItem });
// }

//
