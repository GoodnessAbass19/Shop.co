// /api/products/top-deals.ts
// app/api/top-deals/route.ts (assuming this is your path for top deals)
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Fetch products that have at least one active discount.
    // We fetch more than 10 to ensure we have enough to sort and then take the top 10.
    const products = await prisma.product.findMany({
      where: {
        discounts: {
          some: {
            // Use 'some' to check if at least one related discount exists
            expiresAt: {
              gte: new Date(), // And that the discount is still active
            },
            startsAt: {
              lte: new Date(), // And that the discount has started
            },
          },
        },
        status: "ACTIVE", // Only fetch active products
        store: {
          isActive: true, // Fetch products from active store
          status: "ACTIVE",
        },
      },
      include: {
        discounts: {
          // Correct relation name (plural: 'discounts')
          where: {
            expiresAt: {
              gte: new Date(), // Ensure only active discounts are included
            },
          },
          orderBy: {
            percentage: "desc", // Order included discounts by percentage for easier access
          },
          take: 1, // Optionally, only take the best discount for each product if you only care about the top one
        },
        variants: {
          orderBy: { price: "asc" }, // Get lowest variant price
          select: {
            id: true,
            price: true,
            size: true,
            quantity: true,
            salePrice: true,
            saleEndDate: true,
            saleStartDate: true,
          },
        },
        // Include other relations needed for the ProductCard if not already part of the processing
        category: { select: { id: true, name: true, slug: true } },
        subCategory: { select: { id: true, name: true, slug: true } },
        subSubCategory: { select: { id: true, name: true, slug: true } },
        store: { select: { id: true, name: true, slug: true } },
      },
      // IMPORTANT: Cannot directly orderBy a related many-to-many field (discounts)
      // So, remove the orderBy here and sort in memory.
      // orderBy: {
      //   discounts: { // This structure is not valid for `findMany`
      //     _count: 'desc' // Example if you wanted to order by number of discounts
      //   }
      // }
    });

    // 2. Process products to calculate discountedPrice and sort them in memory.
    const processedProducts = products.map((product) => {
      const lowestPrice =
        product.variants.length > 0 ? product.variants[0].price : 0; // Use product.price if no variants or lowest variant is null/undefined

      let discountedPrice: number | null = product.variants[0].salePrice as any;
      let bestDiscountPercentage = 0;

      // if (product.discounts && product.discounts.length > 0) {
      //   // Since we ordered discounts by percentage: "desc" in the include, the first one is the best
      //   bestDiscountPercentage = product?.discounts[0]?.percentage!;
      //   if (bestDiscountPercentage > 0) {
      //     discountedPrice = lowestPrice * (1 - bestDiscountPercentage / 100);
      //   }
      // }

      return {
        ...product,
        productName: product.name,
        price: lowestPrice, // This is the base price for the card
        discountedPrice: discountedPrice, // The calculated discounted price
        images: product.images.map((url) => ({ url })), // Ensure image format
        // Add a temporary field for sorting by discount percentage
        _bestDiscountPercentage: bestDiscountPercentage,
      };
    });

    // 3. Sort the processed products by their best discount percentage (descending)
    // and then take the top 10.
    const topDeals = processedProducts
      .sort((a, b) => b._bestDiscountPercentage - a._bestDiscountPercentage)
      .slice(0, 10); // Take only the top 10 after sorting

    return NextResponse.json({ products: topDeals }); // Return as { products: [...] } for consistency with ProductGrid
  } catch (error) {
    console.error("Top deals fetch failed:", error); // Added colon for consistent logging
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    ); // Consistent error message
  }
}
