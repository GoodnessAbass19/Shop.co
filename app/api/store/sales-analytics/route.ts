// app/api/seller/sales-analytics/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { OrderStatus } from "@prisma/client";
import { getDateRange, DateRangeType } from "@/lib/date-filter"; // Assuming getDateRange is in @/lib/date-filter
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns"; // Import date-fns for chart date calculations

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
    // Default rangeType to "THIS_MONTH" if not provided
    const rangeType = (searchParams.get("rangeType") ||
      "THIS_MONTH") as DateRangeType;
    const customStart = searchParams.get("startDate");
    const customEnd = searchParams.get("endDate");

    // Get the date range for overall metrics based on user selection
    const { startDate, endDate } = getDateRange(
      rangeType,
      customStart || undefined, // Pass undefined if null for customStart
      customEnd || undefined // Pass undefined if null for customEnd
    );

    // console.log(`Selected Period for Overall Metrics: ${startDate.toISOString()} to ${endDate.toISOString()}`);

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

    // --- Overall Metrics (filtered by selected rangeType) ---
    const allTimeCompletedOrderItems = await prisma.orderItem.findMany({
      where: {
        storeId: storeId,
        order: {
          status: { in: [OrderStatus.PAID, OrderStatus.DELIVERED] },
          paidAt: {
            gte: startDate, // Use the calculated startDate
            lt: endDate, // Use the calculated endDate
          },
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
        status: { in: [OrderStatus.PAID, OrderStatus.DELIVERED] },
        paidAt: {
          gte: startDate, // Use the calculated startDate
          lt: endDate, // Use the calculated endDate
        },
        items: {
          some: {
            storeId: storeId,
          },
        },
      },
    });

    // --- Monthly Sales Data for Chart (Always Last 12 Full Months) ---
    const now = new Date(); // Current date and time
    // Calculate the start of the month 11 months ago from the current month
    const chartPeriodStart = startOfMonth(subMonths(now, 11));
    // Calculate the end of the current month
    const chartPeriodEnd = endOfMonth(now);

    // console.log(`Chart Period: ${chartPeriodStart.toISOString()} to ${chartPeriodEnd.toISOString()}`);

    const salesData: { [key: string]: number } = {}; // Format: { "YYYY-MM": revenue }
    const ordersData: { [key: string]: number } = {}; // Format: { "YYYY-MM": orderCount }

    const monthlySalesItems = await prisma.orderItem.findMany({
      where: {
        storeId: storeId,
        order: {
          status: { in: [OrderStatus.PAID, OrderStatus.DELIVERED] },
          paidAt: {
            gte: chartPeriodStart, // Use chart specific start date
            lt: chartPeriodEnd, // Use chart specific end date
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

    // Aggregate monthly revenue
    monthlySalesItems.forEach((item) => {
      if (item.order.paidAt) {
        const monthKey = format(item.order.paidAt, "yyyy-MM"); // Use date-fns for consistent formatting
        salesData[monthKey] =
          (salesData[monthKey] || 0) + item.price * item.quantity;
      }
    });

    // For monthly order count, query distinct orders
    const monthlyOrderCounts = await prisma.order.findMany({
      where: {
        status: { in: [OrderStatus.PAID, OrderStatus.DELIVERED] },
        paidAt: {
          gte: chartPeriodStart, // Use chart specific start date
          lt: chartPeriodEnd, // Use chart specific end date
        },
        items: {
          some: {
            storeId: storeId,
          },
        },
      },
      select: {
        paidAt: true,
      },
      orderBy: {
        paidAt: "asc",
      },
    });

    monthlyOrderCounts.forEach((order) => {
      if (order.paidAt) {
        const monthKey = format(order.paidAt, "yyyy-MM"); // Use date-fns for consistent formatting
        ordersData[monthKey] = (ordersData[monthKey] || 0) + 1;
      }
    });

    // Fill in missing months with zero revenue/orders for the chart
    const chartData = [];
    let currentMonthIterator = startOfMonth(chartPeriodStart); // Start from the beginning of the chart period
    while (currentMonthIterator <= chartPeriodEnd) {
      // Iterate until the end of the chart period
      const monthKey = format(currentMonthIterator, "yyyy-MM");

      chartData.push({
        name: format(currentMonthIterator, "MMM yy"), // e.g., "Jul 25"
        revenue: salesData[monthKey] || 0,
        orders: ordersData[monthKey] || 0,
      });

      currentMonthIterator = startOfMonth(subMonths(currentMonthIterator, -1)); // Move to the start of the next month
    }

    // --- Top Selling Products (by quantity sold, filtered by selected rangeType) ---
    const topSellingProductsRaw = await prisma.orderItem.groupBy({
      by: ["productVariantId"], // Group by variant to sum quantities
      where: {
        storeId: storeId,
        order: {
          status: { in: [OrderStatus.PAID, OrderStatus.DELIVERED] },
          paidAt: {
            gte: startDate, // Use the calculated startDate
            lt: endDate, // Use the calculated endDate
          },
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
            images: true, // Include product images (array of strings)
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
          productImage: variant.product.images?.[0] || null, // Access the first image URL
          totalSoldQuantity: totalSoldQuantity,
          variantName:
            `${variant.size ? `Size: ${variant.size}` : ""}: ""
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
