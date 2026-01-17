import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ category: string }> }
) {
  const { category } = await params;
  try {
    const { searchParams } = new URL(req.url);
    const sort = searchParams.get("sort") || "recent";
    const page = parseInt(searchParams.get("page") || "1");

    const orderByOptions: Record<string, any> = {
      highest_price: { price: "desc" },
      lowest_price: { price: "asc" },
      recent: { createdAt: "desc" },
      top_reviews: undefined, // We'll handle manually
    };

    // Count total products for this category
    const total = await prisma.product.count({
      where: {
        category: {
          slug: category,
        },
        status: "ACTIVE", // Only count active products
        store: {
          isActive: true,
        },
      },
    });

    let products;

    if (sort === "top_reviews") {
      // Fetch all and sort manually by average rating
      const allProducts = await prisma.product.findMany({
        where: {
          category: {
            slug: category,
          },
          store: {
            isActive: true,
          },
        },
        include: {
          variants: true,
          reviews: true,
          discounts: {
            // Include discounts related to the product
            where: {
              expiresAt: {
                gte: new Date(), // Only include active discounts
              },
            },
            orderBy: {
              percentage: "desc", // Order by percentage to easily pick best
            },
          },
        },
      });

      const productsWithRating = allProducts.map((product) => {
        const totalRating = product.reviews.reduce(
          (acc, r) => acc + r.rating,
          0
        );
        const avgRating =
          product.reviews.length > 0 ? totalRating / product.reviews.length : 0;

        return { ...product, averageRating: avgRating };
      });

      const sorted = productsWithRating.sort(
        (a, b) => b.averageRating - a.averageRating
      );

      // Manual pagination
      products = sorted.slice(ITEM_PER_PAGE * (page - 1), ITEM_PER_PAGE * page);
    } else {
      products = await prisma.product.findMany({
        where: {
          category: {
            slug: category,
          },
        },
        orderBy: orderByOptions[sort] || orderByOptions["recent"],
        include: {
          variants: true,
          reviews: true,
          discounts: {
            // Include discounts related to the product
            where: {
              expiresAt: {
                gte: new Date(), // Only include active discounts
              },
            },
            orderBy: {
              percentage: "desc", // Order by percentage to easily pick best
            },
          },
        },
        take: ITEM_PER_PAGE,
        skip: ITEM_PER_PAGE * (page - 1),
      });
    }

    // Process products to include lowest price, discounted price, and average rating
    const processedProducts = products.map((product) => {
      // Determine the base price (lowest variant price or product's direct price)
      const lowestPrice =
        product.variants.length > 0 && (product.variants[0].price as any); // Already sorted by price: 'asc'
      // Fallback if no variants or base price

      let discountedPrice: number | null = null;
      let bestDiscountPercentage: number | null = null;

      // Find the best single discount percentage for this product
      if (product.discounts && product.discounts.length > 0) {
        bestDiscountPercentage = product.discounts[0].percentage; // Already ordered by desc percentage
        if (bestDiscountPercentage! > 0) {
          discountedPrice = lowestPrice * (1 - bestDiscountPercentage! / 100);
        }
      }

      // Calculate average rating
      const totalRating = product.reviews.reduce((acc, r) => acc + r.rating, 0);
      const averageRating =
        product.reviews.length > 0 ? totalRating / product.reviews.length : 0;

      // Return product data in a format compatible with your ProductCard
      return {
        ...product, // Keep original product data
        price: lowestPrice, // Use lowest price as base price
        discountedPrice, // Calculated discounted price
        averageRating, // Calculated average rating
      };
    });

    const totalPages = Math.ceil(total / ITEM_PER_PAGE);

    return NextResponse.json({
      products: processedProducts,
      total,
      page,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching category products:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
