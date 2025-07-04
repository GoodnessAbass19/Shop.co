import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";

export async function GET(
  req: Request,
  { params }: { params: { category: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const sort = searchParams.get("sort") || "recent";
    const page = parseInt(searchParams.get("page") || "1");

    const orderByOptions: Record<string, any> = {
      highest_price: { price: "desc" },
      lowest_price: { price: "asc" },
      recent: { createdAt: "desc" },
      // top_reviews: { averageRating: "desc" }, // For later
    };

    // Count total products
    const total = await prisma.product.count({
      where: {
        category: {
          slug: params.category,
        },
      },
    });

    const products = await prisma.product.findMany({
      where: {
        category: {
          slug: params.category,
        },
      },
      orderBy: orderByOptions[sort] || orderByOptions["recent"],
      include: {
        variants: true,
        reviews: true,
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (page - 1),
    });

    const totalPages = Math.ceil(total / ITEM_PER_PAGE);

    return NextResponse.json({
      products,
      total,
      page,
    });
  } catch (error) {
    console.error("Error fetching category products:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
