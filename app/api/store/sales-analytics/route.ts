// app/api/seller/sales-analytics/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { OrderStatus } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.log(
        "Unauthorized access attempt to sales-analytics: No user found."
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");

    if (!storeId) {
      console.log("Bad Request: Missing storeId for sales-analytics.");
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
      console.log(
        `Forbidden: Store ${storeId} not found or not owned by user ${user.id}.`
      );
      return NextResponse.json(
        { error: "Forbidden: Store not found or not owned by user." },
        { status: 403 }
      );
    }

    // --- Date calculations for current month and last 12 months ---
    const now = new Date();
    now.setDate(1);
    now.setHours(0, 0, 0, 0);
    const twelveMonthsAgo = new Date(now);
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setMilliseconds(0); // Ensure no ms issues

    // console.log(`--- Sales Analytics Debugging for Store: ${storeId} ---`);
    // console.log(`Current Server Time (UTC): ${now.toISOString()}`);
    // console.log(
    //   `Analytics Period Start (12 months ago): ${twelveMonthsAgo.toISOString()}`
    // );

    // --- 1. Overall Metrics ---
    const allTimeCompletedOrderItems = await prisma.orderItem.findMany({
      where: {
        storeId: storeId,
        order: {
          status: { in: [OrderStatus.PAID, OrderStatus.DELIVERED] },
          paidAt: { not: null },
        },
      },
      select: {
        id: true, // Select ID for logging
        price: true,
        quantity: true,
      },
    });
    const totalRevenue = allTimeCompletedOrderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    // console.log(
    //   `Total All-Time Completed Order Items found: ${allTimeCompletedOrderItems.length}`
    // );
    // console.log(`Total Revenue (All Time): $${totalRevenue.toFixed(2)}`);

    const totalOrders = await prisma.order.count({
      where: {
        status: { in: [OrderStatus.PAID, OrderStatus.DELIVERED] },
        paidAt: { not: null },
        items: {
          some: {
            storeId: storeId,
          },
        },
      },
    });
    // console.log(`Total Orders (All Time) counted: ${totalOrders}`);

    // --- 2. Monthly Sales Data for Chart (Last 12 Months) ---
    const salesData: { [key: string]: number } = {}; // Format: { "YYYY-MM": revenue }
    const ordersData: { [key: string]: number } = {}; // Format: { "YYYY-MM": orderCount }

    const monthlySalesItems = await prisma.orderItem.findMany({
      where: {
        storeId: storeId,
        order: {
          status: { in: [OrderStatus.PAID, OrderStatus.DELIVERED] },
          paidAt: {
            gte: twelveMonthsAgo,
            not: null, // Explicitly ensure paidAt is not null
          },
        },
      },
      select: {
        id: true, // Include item ID for debugging
        price: true,
        quantity: true,
        order: {
          select: { id: true, paidAt: true }, // Include order ID and paidAt for debugging
        },
      },
      orderBy: {
        order: { paidAt: "asc" },
      },
    });
    // console.log(
    //   `Fetched ${monthlySalesItems.length} monthly sales items within the 12-month period for aggregation.`
    // );

    // Aggregate monthly revenue
    monthlySalesItems.forEach((item) => {
      if (item.order.paidAt) {
        const monthKey = item.order.paidAt.toISOString().substring(0, 7); // YYYY-MM
        salesData[monthKey] =
          (salesData[monthKey] || 0) + item.price * item.quantity;
        console.log(
          `Aggregating revenue: Order ${item.order.id} | Item ${
            item.id
          } | PaidAt: ${item.order.paidAt.toISOString()} -> monthKey ${monthKey}. Revenue added: $${(
            item.price * item.quantity
          ).toFixed(2)}. Current total for ${monthKey}: $${salesData[
            monthKey
          ].toFixed(2)}`
        );
      }
    });
    // console.log("Raw Monthly Revenue Data (salesData):", salesData);

    // For monthly order count, query distinct orders
    const monthlyOrderCounts = await prisma.order.findMany({
      where: {
        status: { in: [OrderStatus.PAID, OrderStatus.DELIVERED] },
        paidAt: {
          gte: twelveMonthsAgo,
          not: null, // Explicitly ensure paidAt is not null
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
    // console.log(
    //   `Fetched ${monthlyOrderCounts.length} distinct monthly orders within the 12-month period for aggregation.`
    // );

    monthlyOrderCounts.forEach((order) => {
      if (order.paidAt) {
        const monthKey = order.paidAt.toISOString().substring(0, 7); // YYYY-MM
        ordersData[monthKey] = (ordersData[monthKey] || 0) + 1;
        console.log(
          `Aggregating order count: Order ${
            order.id
          } | PaidAt: ${order.paidAt.toISOString()} -> monthKey ${monthKey}. Current count for ${monthKey}: ${
            ordersData[monthKey]
          }`
        );
      }
    });
    // console.log("Raw Monthly Orders Data (ordersData):", ordersData);

    // Fill in missing months with zero revenue/orders for the chart
    const chartData = [];
    let currentMonth = new Date(twelveMonthsAgo);
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
    // console.log(
    //   "Generated Sales Chart Data (final array for frontend):",
    //   JSON.stringify(chartData, null, 2)
    // );

    // --- 3. Top Selling Products (by quantity sold) ---
    const topSellingProductsRaw = await prisma.orderItem.groupBy({
      by: ["productVariantId"], // Group by variant to sum quantities
      where: {
        storeId: storeId,
        order: {
          status: { in: [OrderStatus.PAID, OrderStatus.DELIVERED] },
          paidAt: { not: null }, // Ensure paidAt is not null
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
    // console.log(
    //   `Raw Top Selling Products Data (from groupBy):`,
    //   topSellingProductsRaw
    // );

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
            images: true, // Include product images (array of strings)
          },
        },
      },
    });
    // console.log(
    //   `Details for Top Selling Products (from ProductVariant fetch):`,
    //   topSellingProductsDetails
    // );

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
          // Corrected: Access the first image URL directly from the array
          productImage: variant.product.images?.[0] || null,
          totalSoldQuantity: totalSoldQuantity,
          variantName:
            `${variant.size ? `Size: ${variant.size}` : ""}${
              variant.color ? ` Color: ${variant.color}` : ""
            }`.trim() || "Default",
        };
      })
      .sort((a, b) => b.totalSoldQuantity - a.totalSoldQuantity); // Re-sort to ensure order
    // console.log(
    //   "Final Top Selling Products (mapped for frontend):",
    //   topSellingProducts
    // );

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
