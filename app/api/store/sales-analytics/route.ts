// app/api/seller/sales-analytics/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { OrderStatus } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");

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

    // --- 1. Overall Metrics ---
    const allTimeCompletedOrderItems = await prisma.orderItem.findMany({
      where: {
        storeId: storeId,
        order: {
          status: OrderStatus.PAID,
        },
      },
      select: {
        price: true,
        quantity: true,
      },
    });
    const totalRevenue = allTimeCompletedOrderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const totalOrders = await prisma.order.count({
      where: {
        status: OrderStatus.PAID,
        items: {
          some: {
            storeId: storeId,
          },
        },
      },
    });

    // --- 2. Monthly Sales Data for Chart (Last 12 Months) ---
    const salesData: { [key: string]: number } = {}; // Format: { "YYYY-MM": revenue }
    const ordersData: { [key: string]: number } = {}; // Format: { "YYYY-MM": orderCount }

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11); // Go back 11 months to include current month = 12 months total
    twelveMonthsAgo.setDate(1); // Start from the first day of that month
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const monthlySalesItems = await prisma.orderItem.findMany({
      where: {
        storeId: storeId,
        order: {
          status: OrderStatus.PAID || OrderStatus.DELIVERED,
          paidAt: {
            gte: twelveMonthsAgo,
          },
        },
      },
      select: {
        price: true,
        quantity: true,
        order: {
          select: { paidAt: true },
        },
      },
      orderBy: {
        order: { paidAt: "asc" },
      },
    });

    // Aggregate monthly data
    monthlySalesItems.forEach((item) => {
      if (item.order.paidAt) {
        const monthKey = item.order.paidAt.toISOString().substring(0, 7); // YYYY-MM
        salesData[monthKey] =
          (salesData[monthKey] || 0) + item.price * item.quantity;
        // To count orders per month, we need to ensure each order is counted only once per month.
        // This requires a separate aggregation or a more complex query.
        // For simplicity, we'll approximate by just counting items, or assume a separate query.
        // Let's refine this to count distinct orders.
      }
    });

    // For monthly order count, it's better to query distinct orders
    const monthlyOrderCounts = await prisma.order.findMany({
      where: {
        status: OrderStatus.PAID || OrderStatus.DELIVERED,
        paidAt: {
          gte: twelveMonthsAgo,
        },
        items: {
          some: {
            storeId: storeId,
          },
        },
      },
      select: {
        paidAt: true,
        id: true, // To ensure distinct orders
      },
      orderBy: {
        paidAt: "asc",
      },
    });

    monthlyOrderCounts.forEach((order) => {
      if (order.paidAt) {
        const monthKey = order.paidAt.toISOString().substring(0, 7); // YYYY-MM
        ordersData[monthKey] = (ordersData[monthKey] || 0) + 1;
      }
    });

    // Fill in missing months with zero revenue/orders for the chart
    const chartData = [];
    let currentMonth = new Date(twelveMonthsAgo);
    const now = new Date(); // Define 'now' as the current date
    while (currentMonth <= now) {
      const monthKey = currentMonth.toISOString().substring(0, 7);
      chartData.push({
        name: currentMonth.toLocaleString("default", {
          month: "short",
          year: "2-digit",
        }), // e.g., "Jul 24"
        revenue: salesData[monthKey] || 0,
        orders: ordersData[monthKey] || 0,
      });
      currentMonth.setMonth(currentMonth.getMonth() + 1);
    }

    // --- 3. Top Selling Products (by quantity sold) ---
    const topSellingProductsRaw = await prisma.orderItem.groupBy({
      by: ["productVariantId"], // Group by variant to sum quantities
      where: {
        storeId: storeId,
        order: {
          status: OrderStatus.PAID,
        },
      },
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 5, // Top 5 products
    });

    const topSellingProductIds = topSellingProductsRaw.map(
      (item) => item.productVariantId
    );

    // Fetch product details for top selling products
    const topSellingProductsDetails = await prisma.productVariant.findMany({
      where: {
        id: { in: topSellingProductIds },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: true, // Include product images
          },
        },
      },
    });

    // Map top selling products with their total sold quantity
    const topSellingProducts = topSellingProductsDetails
      .map((variant) => {
        const totalSoldQuantity =
          topSellingProductsRaw.find(
            (raw) => raw.productVariantId === variant.id
          )?._sum.quantity || 0;
        return {
          productId: variant.product.id,
          productName: variant.product.name,
          productSlug: variant.product.slug,
          productImage: variant.product.images?.[0] || null, // First image
          totalSoldQuantity: totalSoldQuantity,
          variantName:
            `${variant.size ? `Size: ${variant.size}` : ""}${
              variant.color ? ` Color: ${variant.color}` : ""
            }`.trim() || "Default",
        };
      })
      .sort((a, b) => b.totalSoldQuantity - a.totalSoldQuantity); // Re-sort to ensure order

    return NextResponse.json(
      {
        totalRevenue,
        totalOrders,
        salesChartData: chartData,
        topSellingProducts,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API Error fetching sales analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales analytics data." },
      { status: 500 }
    );
  }
}
