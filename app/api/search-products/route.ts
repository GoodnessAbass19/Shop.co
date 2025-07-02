// app/api/products/search/route.ts (assuming this is the intended path)
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server"; // Import NextRequest for better type safety

export async function GET(request: Request) {
  // Changed to 'request' to access URL
  try {
    // For GET requests, extract query parameters from request.url
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query"); // Get the 'query' parameter

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid search query parameter." },
        { status: 400 }
      );
    }

    const products = await prisma.product.findMany({
      where: {
        name: {
          contains: query,
          mode: "insensitive", // Case-insensitive search
        },
      },
      take: 20, // Limit the number of results
      // Include necessary relations if you want to display more details on the frontend
      include: {
        // Assuming your product images are stored as a relation
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
      },
    });

    // Process products to match frontend expectations (e.g., for ProductCard)
    const processedProducts = products.map((product) => {
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
        productName: product.name, // Map 'name' to 'productName' for consistency
        price: lowestPrice,
        discountedPrice: discountedPrice,
        // Ensure images are in { url: string } format
      };
    });

    return NextResponse.json({ products: processedProducts }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch products:", error); // Log the actual error for debugging
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
