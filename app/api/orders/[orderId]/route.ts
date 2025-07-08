// app/api/orders/[orderId]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth"; // Your custom auth function

export async function GET(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = await params;

    // 1. Authenticate User
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch the specific order with all its relations
    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
        buyerId: user.id, // CRUCIAL: Ensure the user can only view their own orders
      },
      include: {
        items: {
          include: {
            productVariant: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    images: true, // Assuming this is an array of strings
                  },
                },
              },
            },
          },
        },
        address: true, // Include the shipping address
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true, // Include buyer's contact details
          },
        },

        // You might want to include buyer details here too if for admin view,
        // but for a user's own page, `user` object already has their info.
      },
    });

    // 3. Handle Order Not Found or Not Owned by User
    if (!order) {
      return NextResponse.json(
        { error: "Order not found or you do not have permission to view it." },
        { status: 404 }
      );
    }

    // 4. Return the order data
    return NextResponse.json({ order }, { status: 200 });
  } catch (error) {
    console.error("API Error fetching order details:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
