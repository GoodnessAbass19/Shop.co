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
    const tag = searchParams.get("tag");
    const brand = searchParams.get("brand");
    const min = searchParams.get("min")
      ? Number(searchParams.get("min"))
      : undefined;
    const max = searchParams.get("max")
      ? Number(searchParams.get("max"))
      : undefined;
    const sort = searchParams.get("sort");
    const page = searchParams.get("page")
      ? Number(searchParams.get("page"))
      : 1;
    const perPage = searchParams.get("perPage")
      ? Number(searchParams.get("perPage"))
      : 24;
    const rating = searchParams.get("rating")
      ? Number(searchParams.get("rating"))
      : undefined;

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
    if (tag) {
      // assume tag stored in a productTag field or similar; adapt if different
      whereClause.productTag = { has: tag } as any;
    }
    if (brand) {
      whereClause.brand = brand;
    }
    if (min != null) {
      // ensure at least one variant has price >= min
      whereClause.variants = { some: { price: { gte: min } } };
    }
    if (max != null) {
      whereClause.variants = whereClause.variants
        ? { ...whereClause.variants, some: { price: { lte: max } } }
        : { some: { price: { lte: max } } };
    }
    if (rating != null) {
      // Prisma doesn't support filtering by average relation aggregate in where;
      // approximate by requiring at least one review with rating >= value
      whereClause.reviews = { some: { rating: { gte: rating } } };
    }

    // Fetch products with all necessary relations
    // Build ordering based on `sort` param; prefer Prisma-level ordering for performance.
    const orderBy: any = [];
    if (sort === "price_asc") {
      orderBy.push({ variants: { _min: { price: "asc" } } });
    } else if (sort === "price_desc") {
      orderBy.push({ variants: { _max: { price: "desc" } } });
    } else if (sort === "newest") {
      orderBy.push({ createdAt: "desc" });
    } else if (sort === "top_selling") {
      orderBy.push({ soldCount: "desc" });
    } else if (sort === "rating") {
      orderBy.push({ store: { rating: "desc" } });
    } else {
      orderBy.push({ createdAt: "desc" });
    }

    const take = perPage;
    const skip = (page - 1) * perPage;

    const products = await prisma.product.findMany({
      where: {
        status: "ACTIVE",
        store: { isActive: true },
        ...whereClause,
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        subCategory: { select: { id: true, name: true, slug: true } },
        subSubCategory: { select: { id: true, name: true, slug: true } },
        variants: {
          orderBy: { price: "asc" },
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
        store: { select: { id: true, name: true, slug: true, rating: true } },
        discounts: {
          where: { expiresAt: { gte: new Date() } },
          orderBy: { percentage: "desc" },
        },
        reviews: { select: { rating: true } },
      },
      orderBy,
      take,
      skip,
    });

    // Process products to include lowest price and discounted price
    const processedProducts = products.map((product) => {
      // Determine the base price (lowest variant price or product's direct price)
      const lowestPrice =
        product.variants.length > 0 && (product.variants[0].price as any); // Already sorted by price: 'asc'
      // Fallback if no variants or base price

      let discountedPrice: number | null = null;
      let bestDiscountPercentage: number | null = null;

      if (product.discounts && product.discounts.length > 0) {
        bestDiscountPercentage = product.discounts[0].percentage;
        if (bestDiscountPercentage! > 0) {
          discountedPrice = lowestPrice * (1 - bestDiscountPercentage! / 100);
        }
      }

      // Return product data in a format compatible with your ProductCard
      // compute average rating if reviews present
      const avgRating =
        product.reviews && product.reviews.length
          ? product.reviews.reduce((s, r) => s + (r.rating || 0), 0) /
            product.reviews.length
          : null;

      return {
        ...product,
        productName: product.name,
        price: lowestPrice,
        discountedPrice: discountedPrice,
        images: product.images.map((url) => ({ url })),
        averageRating: avgRating,
      };
    });
    // Optionally include pagination meta
    const total = await prisma.product.count({
      where: { status: "ACTIVE", store: { isActive: true }, ...whereClause },
    });

    return NextResponse.json(
      { products: processedProducts, page, perPage, total },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// app/api/products/route.ts (POST method excerpt)

// export async function POST(req: Request) {
//   try {
//     const body = await req.json();
//     const {
//       name,
//       description,
//       price,
//       images,
//       categoryId,
//       subCategoryId,
//       subSubCategoryId,
//       storeId,
//       stock,
//       isFeatured,
//     } = body;

//     // Basic validation
//     if (!name || !description || !price || !images || !categoryId || !storeId) {
//       return NextResponse.json(
//         { error: "Missing required fields." },
//         { status: 400 }
//       );
//     }

//     // --- NEW: Generate unique slug explicitly ---
//     const slug = await generateUniqueSlug("Product", name);

//     const product = await prisma.product.create({
//       data: {
//         name,
//         slug, // Use the generated unique slug
//         description,
//         images,
//         categoryId,
//         subCategoryId,
//         subSubCategoryId,
//         storeId,
//       },
//     });

//     return NextResponse.json(product, { status: 201 });
//   } catch (error) {
//     console.error("Error creating product:", error);
//     // Handle other errors, e.g., if sellerId/categoryId doesn't exist
//     return NextResponse.json(
//       { error: "Failed to create product." },
//       { status: 500 }
//     );
//   }
// }
