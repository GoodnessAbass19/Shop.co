// app/api/seller/orders/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { OrderStatus, Role } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");
    const statusFilter = searchParams.get("status"); // e.g., "PAID", "PENDING", "SHIPPED"
    const searchQuery = searchParams.get("search"); // Search by order ID
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);

    if (!storeId) {
      return NextResponse.json(
        { error: "Store ID is required." },
        { status: 400 }
      );
    }

    // Verify user owns this store
    const store = await prisma.store.findUnique({
      where: { id: storeId, userId: user.id },
      select: { id: true },
    });
    if (!store) {
      return NextResponse.json(
        { error: "Forbidden: Store not found or not owned by user." },
        { status: 403 }
      );
    }

    // Construct the WHERE clause for Prisma
    const whereClause: any = {
      items: {
        some: {
          storeId: storeId, // Ensure orders are related to this store
        },
      },
      // ALWAYS exclude PENDING orders from this API by default
      // status: { not: OrderStatus.PENDING },
    };

    if (
      statusFilter &&
      Object.values(OrderStatus).includes(statusFilter as OrderStatus)
    ) {
      whereClause.status = statusFilter as OrderStatus;
    }

    if (searchQuery) {
      whereClause.id = {
        contains: searchQuery, // Search by order ID (case-sensitive by default for MongoDB IDs)
        mode: "insensitive", // For case-insensitive search on non-ID fields, but IDs are usually exact
      };
    }

    // Calculate skip for offset pagination
    const skip = (page - 1) * pageSize;

    // Fetch orders and total count
    const [orders, totalOrders] = await prisma.$transaction([
      prisma.order.findMany({
        where: {
          ...whereClause,
        },
        include: {
          buyer: {
            select: { id: true, name: true, email: true }, // Include buyer details
          },
          address: true, // Include shipping address
          items: {
            include: {
              productVariant: {
                include: {
                  product: {
                    select: { name: true, images: true, slug: true }, // Include product name/image for order item display
                  },
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc", // Most recent orders first
        },
        skip: skip,
        take: pageSize,
      }),
      prisma.order.count({
        where: whereClause,
      }),
    ]);

    const totalPages = Math.ceil(totalOrders / pageSize);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;
    console.log(orders);
    return NextResponse.json(
      {
        orders,
        totalOrders,
        totalPages,
        currentPage: page,
        pageSize,
        hasNextPage,
        hasPreviousPage,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API Error fetching seller orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch seller orders." },
      { status: 500 }
    );
  }
}
