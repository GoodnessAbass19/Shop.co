// app/api/wishlist/status/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth"; // Assuming this function exists to get the authenticated user

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      // If no user, it's not wishlisted for them (or they can't have a wishlist)
      return NextResponse.json({ isWishlisted: false }, { status: 200 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required." },
        { status: 400 }
      );
    }

    const existingWishlistItem = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          // This unique constraint is defined in your Prisma schema
          userId: currentUser.id,
          productId: productId,
        },
      },
      select: { id: true }, // Only need to know if it exists
    });

    return NextResponse.json(
      { isWishlisted: !!existingWishlistItem },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error checking wishlist status:", error);
    // Even on error, we might want to return false or handle gracefully
    return NextResponse.json(
      { isWishlisted: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
