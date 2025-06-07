import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // Ensure this path is correct for your prisma client setup
import { getCurrentUser } from "@/lib/auth"; // Adjust path based on where getCurrentUser is defined

export async function GET(request: Request) {
  try {
    // Use your custom getCurrentUser function to get the authenticated user
    const user = await getCurrentUser();

    // If user is null, it means the token was invalid, missing, or expired
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Now that you have the authenticated user object, use its ID directly
    const orders = await prisma.order.findMany({
      where: {
        buyerId: user.id,
      },
      include: {
        items: {
          // Include order items
          include: {
            productVariant: {
              // Include the product variant for each item
              include: {
                product: {
                  // Include the product for each variant (to get name, images)
                  select: {
                    // Select only necessary product fields
                    name: true,
                    images: true,
                    id: true, // Also include product ID
                  },
                },
              },
            },
          },
        },
        address: true, // Optional: Include address if you want to display it
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
