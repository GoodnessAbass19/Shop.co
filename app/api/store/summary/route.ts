// // app/api/seller/dashboard-summary/route.ts
// import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";
// import { getCurrentUser } from "@/lib/auth";
// import { OrderStatus, Role } from "@prisma/client";

// export async function GET(request: Request) {
//   try {
//     const user = await getCurrentUser();
//     if (!user) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const { searchParams } = new URL(request.url);
//     const storeId = searchParams.get("storeId");

//     if (!storeId) {
//       return NextResponse.json(
//         { error: "Store ID is required." },
//         { status: 400 }
//       );
//     }

//     // Optional: Verify user owns this store if not already done by getCurrentUser
//     const store = await prisma.store.findUnique({
//       where: { id: storeId, userId: user.id },
//       select: { id: true },
//     });
//     if (!store) {
//       return NextResponse.json(
//         { error: "Forbidden: Store not found or not owned by user." },
//         { status: 403 }
//       );
//     }

//     // Calculate Total Revenue
//     const completedOrderItems = await prisma.orderItem.findMany({
//       where: {
//         storeId: storeId,
//         order: {
//           status: OrderStatus.DELIVERED,
//         },
//       },
//       select: {
//         price: true,
//         quantity: true,
//       },
//     });
//     const totalRevenue = completedOrderItems.reduce(
//       (sum, item) => sum + item.price * item.quantity,
//       0
//     );

//     // Calculate Total Orders (paid orders)
//     const totalOrders = await prisma.order.count({
//       where: {
//         status: OrderStatus.PAID,
//         items: {
//           some: {
//             storeId: storeId,
//           },
//         },
//       },
//     });

//     // Calculate Total Products
//     const totalProducts = await prisma.product.count({
//       where: { storeId: storeId },
//     });

//     // Calculate Total Customers (unique buyers who bought from this store)
//     const uniqueBuyerIds = await prisma.order.findMany({
//       where: {
//         status: OrderStatus.PAID,
//         items: {
//           some: {
//             storeId: storeId,
//           },
//         },
//       },
//       select: { buyerId: true },
//       distinct: ["buyerId"],
//     });
//     const totalCustomers = uniqueBuyerIds.length;

//     // Fetch Recent Activities (e.g., last 5 orders, low stock alerts, reviews)
//     // This part can be complex and might involve multiple queries or a more sophisticated activity log.
//     // For now, let's mock some recent activities or fetch recent orders/reviews.
//     const recentOrders = await prisma.order.findMany({
//       where: {
//         items: {
//           some: {
//             storeId: storeId,
//           },
//         },
//       },
//       orderBy: { createdAt: "desc" },
//       take: 5,
//       include: { buyer: { select: { name: true } } },
//     });

//     const recentActivities = recentOrders.map((order) => ({
//       id: order.id,
//       type: "ORDER" as "ORDER",
//       message: `New order #${order.id.substring(0, 7)} from ${
//         order.buyer?.name || "Guest"
//       } (${order.status})`,
//       timestamp: order.createdAt.toISOString(),
//     }));
//     // You can add more activity types (e.g., low stock, new review) by fetching relevant data

//     return NextResponse.json(
//       {
//         totalRevenue,
//         totalOrders,
//         totalProducts,
//         totalCustomers,
//         recentActivities,
//       },
//       { status: 200 }
//     );
//   } catch (error) {
//     console.error("API Error fetching dashboard summary:", error);
//     return NextResponse.json(
//       { error: "Failed to fetch dashboard summary." },
//       { status: 500 }
//     );
//   }
// }

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

    // Check ownership of the store
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

    // === Total Revenue (DELIVERED orders only) ===
    const deliveredItems = await prisma.orderItem.findMany({
      where: {
        storeId,
        order: {
          status: OrderStatus.DELIVERED,
        },
      },
      select: { price: true, quantity: true },
    });

    const totalRevenue = deliveredItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // === Total Orders (PAID only) ===
    const totalOrders = await prisma.order.count({
      where: {
        status: OrderStatus.PAID,
        items: {
          some: { storeId },
        },
      },
    });

    // === Monthly Revenue & Orders (grouped by month) ===
    const monthlyRaw = await prisma.order.findMany({
      where: {
        status: OrderStatus.PAID,
        items: {
          some: { storeId },
        },
      },
      select: {
        createdAt: true,
        items: {
          where: { storeId },
          select: { price: true, quantity: true },
        },
      },
    });

    const monthlyData: Record<string, { revenue: number; orders: number }> = {};

    for (const order of monthlyRaw) {
      const date = new Date(order.createdAt);
      const month = `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`; // e.g., 2025-07

      const orderRevenue = order.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      if (!monthlyData[month]) {
        monthlyData[month] = { revenue: 0, orders: 0 };
      }

      monthlyData[month].revenue += orderRevenue;
      monthlyData[month].orders += 1;
    }

    const monthlyStats = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, stats]) => ({
        month,
        revenue: stats.revenue,
        orders: stats.orders,
      }));

    // === Total Products ===
    const totalProducts = await prisma.product.count({
      where: { storeId },
    });

    const topProducts = await prisma.product.findMany({
      where: { storeId },
      orderBy: {
        soldCount: "desc",
      },
      take: 5,
      select: {
        id: true,
        name: true,
        soldCount: true,
      },
    });

    // === Unique Customers ===
    const buyers = await prisma.order.findMany({
      where: {
        status: OrderStatus.PAID,
        items: {
          some: { storeId },
        },
      },
      select: { buyerId: true },
      distinct: ["buyerId"],
    });
    const totalCustomers = buyers.length;

    // === Recent Activities (Latest 5 Orders) ===
    const recentOrders = await prisma.order.findMany({
      where: {
        items: {
          some: { storeId },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        buyer: { select: { name: true } },
      },
    });

    const recentActivities = recentOrders.map((order) => ({
      id: order.id,
      type: "ORDER" as const,
      message: `New order #${order.id.slice(0, 7)} from ${
        order.buyer?.name || "Guest"
      } (${order.status})`,
      timestamp: order.createdAt.toISOString(),
    }));

    return NextResponse.json(
      {
        totalRevenue,
        totalOrders,
        totalProducts,
        topProducts, // contains: [{ id, name, soldCount }, ...]
        totalCustomers,
        recentActivities,
        monthlyStats, // contains: [{ month: "2025-07", revenue: ..., orders: ... }, ...]
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API Error fetching dashboard summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard summary." },
      { status: 500 }
    );
  }
}
