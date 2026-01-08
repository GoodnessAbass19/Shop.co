import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // 1. Extract and Parse Parameters
    const categoryId = searchParams.get("categoryId");
    const brand = searchParams.get("brand");
    const minPrice = Number(searchParams.get("min")) || 0;
    const maxPrice = Number(searchParams.get("max")) || 1000000;
    const rating = Number(searchParams.get("rating")) || 0;
    const sort = searchParams.get("sort") || "newest";
    const page = Number(searchParams.get("page")) || 1;
    const perPage = Number(searchParams.get("perPage")) || 24;
    const skip = (page - 1) * perPage;

    // 2. Build the 'where' clause dynamically
    const where: any = {
      status: "ACTIVE",
      store: {
        isActive: true,
        status: "ACTIVE",
      },
      // Price filtering (checking variants price)
      variants: {
        some: {
          price: { gte: minPrice, lte: maxPrice },
        },
      },
    };

    if (categoryId && categoryId !== "all") {
      where.categoryId = categoryId;
    }

    if (brand && brand !== "all") {
      where.brand = brand;
    }

    // 3. Determine Sorting
    let orderBy: any = { createdAt: "desc" };
    if (sort === "price_asc") orderBy = { variants: { _count: "asc" } }; // Simplified: Prisma sorting by relation values requires specific setup, usually you'd sort by a 'basePrice' column
    if (sort === "price_desc") orderBy = { variants: { _count: "desc" } };
    if (sort === "rating") orderBy = { rating: "desc" };

    // 4. Fetch Data and Total Count in Parallel
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        take: ITEM_PER_PAGE,
        skip: skip,
        orderBy,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          store: { select: { id: true, name: true, slug: true } },
          variants: {
            orderBy: { price: "asc" },
            select: {
              id: true,
              price: true,
              salePrice: true,
              saleEndDate: true,
              saleStartDate: true,
              size: true,
              quantity: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    // 5. Process products for the frontend
    const processedProducts = products.map((product) => {
      const firstVariant = product.variants[0];
      const lowestPrice = firstVariant?.price || 0;
      const salePrice = firstVariant?.salePrice || null;

      return {
        ...product,
        productName: product.name,
        price: lowestPrice,
        discountedPrice: salePrice,
        images: product.images.map((url: string) => ({ url })),
      };
    });

    return NextResponse.json({
      products: processedProducts,
      total,
      page,
      perPage,
    });
  } catch (error) {
    console.error("Products fetch failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
