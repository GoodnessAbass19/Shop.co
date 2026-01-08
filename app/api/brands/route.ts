import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const brands = await prisma.product.findMany({
      where: { brand: { not: null } },
      distinct: ["brand"],
      select: { brand: true },
    });

    const formatted = brands.map((b) => b.brand).filter(Boolean) as string[];

    return NextResponse.json({ brands: formatted });
  } catch (err) {
    console.error("Failed to fetch brands", err);
    return NextResponse.json({ brands: [] }, { status: 500 });
  }
}
