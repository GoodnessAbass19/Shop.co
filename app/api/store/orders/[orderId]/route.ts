// app/api/seller/orders/[orderId]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
// import { Role } from "@prisma/client"; // Role is imported but not used, can be removed

export async function GET(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.log(
        "Unauthorized access attempt to get single order: No user found."
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Corrected: Destructure orderId directly from params
    const { orderId } = await params;

    if (!orderId) {
      console.log(
        "Bad Request: Missing orderId in URL parameters for single order GET."
      );
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
                    storeId: true, // Include storeId to verify ownership
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      console.log(`Not Found: Order ${orderId} not found.`);
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    // Authorization check: Ensure the order contains at least one item from the seller's store
    const sellerStore = await prisma.store.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!sellerStore) {
      console.log(`Forbidden: No store found for user ${user.id}.`);
      return NextResponse.json(
        { error: "No store found for this user." },
        { status: 403 }
      );
    }

    // Check if the order contains ANY item from the seller's store
    const isOrderRelevantToSeller = order.items.some(
      (item) => item.productVariant.product.storeId === sellerStore.id
    );

    if (!isOrderRelevantToSeller) {
      console.log(
        `Forbidden: Order ${orderId} does not contain any items from seller's store ${sellerStore.id}.`
      );
      return NextResponse.json(
        { error: "Forbidden: This order does not belong to your store." },
        { status: 403 }
      );
    }

    // Filter order items to only include those belonging to the current seller's store
    const filteredItems = order.items.filter(
      (item) => item.productVariant.product.storeId === sellerStore.id
    );

    const filteredItemsTotal = filteredItems.reduce(
      (sum, item) => sum + item.productVariant.price * item.quantity,
      0
    );

    // Create a new order object with only the filtered items
    const sellerSpecificOrder = {
      ...order,
      items: filteredItems,
      total: filteredItemsTotal, // Keep the original total for the order
      // Optionally, you might want to recalculate total if it's based on items
      // For now, we'll assume total is the original order total, not just seller's items
      // If total should only reflect seller's items, uncomment and adjust:
      // total: filteredItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    };

    return NextResponse.json(
      { order: { ...sellerSpecificOrder } },
      { status: 200 }
    ); // Return the filtered order
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
