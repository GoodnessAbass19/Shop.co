// app/api/products/new-arrivals/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: {
        status: "ACTIVE", // Only fetch active products
        store: {
          isActive: true, // Fetch products from active store
        },
      },
      orderBy: {
        createdAt: "desc", // Order by creation date for new arrivals
      },
      take: 10, // Limit to the top 10 newest products
      include: {
        // Include necessary relations for the frontend ProductCard
        category: {
          select: { id: true, name: true, slug: true },
        },
        subCategory: {
          select: { id: true, name: true, slug: true },
        },
        subSubCategory: {
          select: { id: true, name: true, slug: true },
        },
        variants: {
          orderBy: { price: "asc" }, // Get lowest variant price for display
          select: {
            id: true,
            price: true,
            size: true,
            color: true,
            stock: true,
          },
        },
        store: {
          select: { id: true, name: true, slug: true },
        },
        discounts: {
          // Include discounts to calculate discountedPrice
          where: {
            expiresAt: {
              gte: new Date(), // Only active discounts
            },
            startsAt: {
              lte: new Date(),
            },
          },
          orderBy: {
            percentage: "desc", // Best discount first
          },
          take: 1, // Optionally, only take the best discount for each product
        },
      },
    });

    // Process products to match the frontend ProductCard's expected structure
    const processedProducts = products.map((product) => {
      // Determine the base price (lowest variant price or product's direct price)
      const lowestPrice =
        product.variants.length > 0
          ? product.variants[0].price // Already sorted by price: 'asc'
          : product.price || 0; // Fallback if no variants or base price is null

      let discountedPrice: number | null = null;

      // Calculate discounted price if applicable
      if (product.discounts && product.discounts.length > 0) {
        const bestDiscountPercentage = product.discounts[0].percentage;
        if (bestDiscountPercentage! > 0) {
          discountedPrice = lowestPrice * (1 - bestDiscountPercentage! / 100);
        }
      }

      return {
        ...product, // Keep original product data for debugging if needed, but overwrite frontend specific fields
        productName: product.name, // Map 'name' to 'productName'
        price: lowestPrice, // Use lowest price as base price for the card
        discountedPrice: discountedPrice, // Calculated discounted price
        images: product.images.map((url) => ({ url })), // Transform images to { url: string }[]
      };
    });
    return NextResponse.json({ products: processedProducts }); // Return as { products: [...] } for consistency
  } catch (error) {
    console.error("New arrivals fetch failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
