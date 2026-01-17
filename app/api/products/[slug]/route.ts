// app/api/products/[slug]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateUniqueSlug } from "@/utils/generate-slug";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> } // Access dynamic slug parameter
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
          select: {
            id: true,
            name: true,
            slug: true,
            productVariantType: true,
          },
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
            startsAt: {
              lte: new Date(), // Only discounts that have started
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
        : 0;

    let discountedPrice: number | null = null;
    if (product.discounts && product.discounts.length > 0) {
      const bestDiscountPercentage = product.discounts[0].percentage;
      if (bestDiscountPercentage! > 0) {
        discountedPrice = lowestPrice * (1 - bestDiscountPercentage! / 100);
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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const {
      name,
      description,
      price,
      images,
      categoryId,
      subCategoryId,
      subSubCategoryId,
      stock,
      isFeatured,
    } = body;

    let updateData: any = {};
    if (name) {
      // --- NEW: Generate unique slug when name is updated ---
      updateData.slug = await generateUniqueSlug("Product", name, slug);
      updateData.name = name;
    }
    if (description) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (images) updateData.images = images;
    if (categoryId) updateData.categoryId = categoryId;
    if (subCategoryId) updateData.subCategoryId = subCategoryId;
    if (subSubCategoryId !== undefined)
      updateData.subSubCategoryId = subSubCategoryId;
    if (stock !== undefined) updateData.stock = parseInt(stock, 10);
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;

    const updatedProduct = await prisma.product.update({
      where: { id: slug },
      data: updateData,
    });

    return NextResponse.json(updatedProduct, { status: 200 });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product." },
      { status: 500 }
    );
  }
}
