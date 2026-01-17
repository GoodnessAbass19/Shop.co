// app/api/wishlist/[productId]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth"; // Assuming this function exists

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId } = await params;

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required." },
        { status: 400 }
      );
    }

    // Find and delete the wishlist item for the current user and product
    const deletedItem = await prisma.wishlistItem.deleteMany({
      // Use deleteMany in case of unexpected duplicates, or delete if unique
      where: {
        userId: currentUser.id,
        productId: productId,
      },
    });

    if (deletedItem.count === 0) {
      return NextResponse.json(
        { message: "Product not found in wishlist or already removed." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Product removed from wishlist successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
