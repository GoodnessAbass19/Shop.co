// app/api/products/[slug]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } } // Access dynamic slug parameter
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: "Product slug is required." },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: {
        slug: slug, // Find product by its unique slug
      },
      include: {
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
          orderBy: { price: "asc" }, // Get all variants, ordered by price
        },
        store: {
          select: { id: true, name: true, slug: true },
        },
        discounts: {
          where: {
            expiresAt: {
              gte: new Date(), // Only active discounts
            },
          },
          orderBy: {
            percentage: "desc", // Best discount first
          },
        },
        reviews: {
          // Include product reviews for the detail page
          include: {
            user: {
              // Include user who made the review
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    // Process product data to match frontend expectations (ProductCardItem or similar)
    const lowestPrice =
      product.variants.length > 0
        ? product.variants.sort((a, b) => a.price - b.price)[0].price
        : product.price || 0;

    let discountedPrice: number | null = null;
    if (product.discounts && product.discounts.length > 0) {
      const bestDiscountPercentage = product.discounts[0].percentage;
      if (bestDiscountPercentage > 0) {
        discountedPrice = lowestPrice * (1 - bestDiscountPercentage / 100);
      }
    }

    const processedProduct = {
      ...product, // Include all original product fields
      productName: product.name, // Map 'name' to 'productName'
      basePrice: lowestPrice, // Explicitly name the base price
      // price: lowestPrice, // For consistency with ProductCard's 'price'
      discountedPrice: discountedPrice, // Calculated discounted price
      images: product.images.map((url) => ({ url })), // Transform images to { url: string }[]
      // You might also want to add average rating here if needed on frontend
    };

    return NextResponse.json({ product: processedProduct }, { status: 200 });
  } catch (error) {
    console.error("Error fetching single product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
