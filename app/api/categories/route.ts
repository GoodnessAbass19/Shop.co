// app/api/categories/route.ts
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Fetch all top-level categories and eagerly load their nested sub-categories
    // and sub-sub-categories using Prisma's `include` functionality.
    const categories = await prisma.category.findMany({
      include: {
        subCategories: {
          // Include the subCategories relation
          include: {
            subSubCategories: true, // Include the subSubCategories relation nested within subCategories
          },
          orderBy: {
            // Optional: order sub-categories by name
            name: "asc",
          },
        },
      },
      orderBy: {
        // Optional: order top-level categories by name
        name: "asc",
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
