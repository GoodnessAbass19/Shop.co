// app/api/wishlist/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth"; // Assuming this function exists to get the authenticated user

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser(); // Get the authenticated user
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required." },
        { status: 400 }
      );
    }

    // Check if the product exists
    const productExists = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!productExists) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    // Check if the item is already in the wishlist
    const existingWishlistItem = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          // Unique constraint defined in schema
          userId: currentUser.id,
          productId: productId,
        },
      },
    });

    if (existingWishlistItem) {
      return NextResponse.json(
        { message: "Product already in wishlist." },
        { status: 200 }
      ); // Or 409 Conflict
    }

    const wishlistItem = await prisma.wishlistItem.create({
      data: {
        userId: currentUser.id,
        productId: productId,
      },
    });

    return NextResponse.json(
      { message: "Product added to wishlist successfully.", wishlistItem },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const wishlistItems = await prisma.wishlistItem.findMany({
      where: {
        userId: currentUser.id,
      },
      include: {
        product: {
          // Include the full product details for each wishlist item
          include: {
            variants: {
              orderBy: { price: "asc" }, // Get lowest variant price
              select: { price: true },
            },
            discounts: {
              // Include discounts to calculate discountedPrice if needed
              where: {
                expiresAt: {
                  gte: new Date(), // Only active discounts
                },
              },
              orderBy: {
                percentage: "desc", // Best discount first
              },
              take: 1,
            },
            category: { select: { id: true, name: true, slug: true } },
            subCategory: { select: { id: true, name: true, slug: true } },
            subSubCategory: { select: { id: true, name: true, slug: true } },
            store: { select: { id: true, name: true, slug: true } },
          },
        },
      },
      orderBy: {
        addedAt: "desc", // Show most recently added items first
      },
    });

    // Process products to match frontend expectations (e.g., for ProductCard)
    const productsInWishlist = wishlistItems.map((item) => {
      const product = item.product;
      const lowestPrice =
        product.variants.length > 0
          ? product.variants[0].price
          : product.price || 0;

      let discountedPrice: number | null = null;
      if (product.discounts && product.discounts.length > 0) {
        const bestDiscountPercentage = product.discounts[0].percentage;
        if (bestDiscountPercentage > 0) {
          discountedPrice = lowestPrice * (1 - bestDiscountPercentage / 100);
        }
      }

      return {
        ...product,
        productName: product.name,
        price: lowestPrice,
        discountedPrice: discountedPrice,
        images: product.images.map((img: any) => ({ url: img })),
        wishlistItemId: item.id, // Pass the wishlist item ID if you need it for deletion
      };
    });

    return NextResponse.json({ wishlist: productsInWishlist }, { status: 200 });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
