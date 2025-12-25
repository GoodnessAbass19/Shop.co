import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { subcategory: string } }
) {
  try {
    const { subcategory } = await params;
    if (!subcategory) {
      return NextResponse.json(
        { error: "Category slug is required." },
        { status: 400 }
      );
    }
    // Fetch all top-level categories and eagerly load their nested sub-categories
    // and sub-sub-categories using Prisma's `include` functionality.
    const categories = await prisma.subCategory.findUnique({
      where: {
        slug: subcategory,
      },
      include: {
        products: {
          where: {
            store: {
              isActive: true,
            },
          },
        },
        subSubCategories: {
          include: {
            subCategory: {
              include: {
                category: true,
              },
            }, // Include the parent category relation for subSubCategories
          },
        },
      },
    });

    // Return the full nested category structure
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Failed to fetch categories:", error); // Log the actual error for debugging
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
