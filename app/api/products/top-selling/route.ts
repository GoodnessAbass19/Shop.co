// /api/products/top-selling.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const products = await prisma.product.findMany({
    where: {
      status: "ACTIVE", // Only fetch active products
    },
    take: 10,
    orderBy: {
      soldCount: "desc", // you can add a soldCount field you update when orders are completed
    },
  });

  return NextResponse.json(products);
}
