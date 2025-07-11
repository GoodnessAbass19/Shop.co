// app/api/products/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // Your Prisma client instance
import { generateUniqueSlug } from "@/utils/generate-slug";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const subCategoryId = searchParams.get("subCategoryId");
    const subSubCategoryId = searchParams.get("subSubCategoryId");
    const featuredOnly = searchParams.get("featured") === "true"; // New filter for featured products

    const whereClause: any = {};
    if (categoryId) {
      whereClause.categoryId = categoryId;
    }
    if (subCategoryId) {
      whereClause.subCategoryId = subCategoryId;
    }
    if (subSubCategoryId) {
      whereClause.subSubCategoryId = subSubCategoryId;
    }
    if (featuredOnly) {
      whereClause.isFeatured = true;
    }

    // Fetch products with all necessary relations
    const products = await prisma.product.findMany({
      where: whereClause && {
        status: "ACTIVE", // Only fetch active products
        ...whereClause, // Include any additional filters
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
          orderBy: { price: "asc" }, // Order variants to easily get the lowest price
          select: {
            id: true,
            price: true,
            size: true,
            color: true,
            stock: true,
          },
        },
        store: {
          select: { id: true, name: true, slug: true }, // Include store name and slug
        },
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
      orderBy: {
        createdAt: "desc", // Most recent products first
      },
    });

    // Process products to include lowest price and discounted price
    const processedProducts = products.map((product) => {
      // Determine the base price (lowest variant price or product's direct price)
      const lowestPrice =
        product.variants.length > 0
          ? product.variants[0].price // Already sorted by price: 'asc'
          : product.price || 0; // Fallback if no variants or base price

      let discountedPrice: number | null = null;
      let bestDiscountPercentage = 0;

      // Find the best single discount percentage for this product
      if (product.discounts && product.discounts.length > 0) {
        bestDiscountPercentage = product.discounts[0].percentage; // Already ordered by desc percentage
        if (bestDiscountPercentage > 0) {
          discountedPrice = lowestPrice * (1 - bestDiscountPercentage / 100);
        }
      }

      // Return product data in a format compatible with your ProductCard
      return {
        ...product, // Keep original product data
        productName: product.name, // Map 'name' to 'productName'
        price: lowestPrice, // Use lowest price as base price
        discountedPrice: discountedPrice, // Calculated discounted price
        // Transform images to match { url: string } format if your ProductCard expects it
        images: product.images.map((url) => ({ url })),
      };
    });

    return NextResponse.json({ products: processedProducts }, { status: 200 });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// app/api/products/route.ts (POST method excerpt)

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      description,
      price,
      images,
      categoryId,
      subCategoryId,
      subSubCategoryId,
      storeId,
      stock,
      isFeatured,
    } = body;

    // Basic validation
    if (!name || !description || !price || !images || !categoryId || !storeId) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    // --- NEW: Generate unique slug explicitly ---
    const slug = await generateUniqueSlug("Product", name);

    const product = await prisma.product.create({
      data: {
        name,
        slug, // Use the generated unique slug
        description,
        price: parseFloat(price),
        images,
        categoryId,
        subCategoryId,
        subSubCategoryId,
        storeId,
        stock: parseInt(stock, 10),
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    // Handle other errors, e.g., if sellerId/categoryId doesn't exist
    return NextResponse.json(
      { error: "Failed to create product." },
      { status: 500 }
    );
  }
}
