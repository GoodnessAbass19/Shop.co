import { getCurrentUser } from "@/lib/auth";
import { signToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";
import { endOfDay, startOfDay, startOfMonth, startOfWeek } from "date-fns";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const { email } = body;

    // Check if the user already has a rider profile
    const existingRider = await prisma.rider.findUnique({
      where: { userId: user.id },
    });

    if (existingRider) {
      return NextResponse.json(
        { error: "You already have a rider profile." },
        { status: 400 }
      );
    }

    const newRider = await prisma.rider.create({
      data: {
        ...body,
        userId: user.id,
      },
    });

    // Update user role if not already RIDER
    if (user.role !== Role.RIDER) {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: Role.RIDER, isRider: true },
      });
      console.log(`User ${user.id} role updated to RIDER.`);
    }

    const token = signToken({
      userId: user.id,
      email: email,
      role: Role.RIDER,
    });

    const cookieStore = await cookies();
    cookieStore.set("rider-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      maxAge: 60 * 60 * 6, // 6 hour
      sameSite: "lax",
      path: "/",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Rider created successfully!",
        rider: newRider,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("API Error creating rider profile:", error);

    return NextResponse.json(
      { error: "Failed to create rider profile." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const rider = await prisma.rider.findUnique({
      where: { userId: user.id },
      include: {
        deliveries: {
          include: {
            orderItem: {
              include: {
                productVariant: {
                  include: {
                    product: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!rider) {
      return NextResponse.json({ error: "Rider not found" }, { status: 404 });
    }

    // --- Active Delivery ---
    const activeDelivery = await prisma.deliveryItem.findFirst({
      where: {
        riderId: rider.id,
        status: { in: ["READY_FOR_PICKUP", "OUT_FOR_DELIVERY"] },
      },
      include: {
        orderItem: {
          include: {
            productVariant: { include: { product: true } },
            order: {
              include: {
                address: true,
              },
            },
            store: true,
          },
        },
      },
    });

    // --- Acceptance Rate ---
    const totalOffers = await prisma.deliveryItem.count({
      where: { createdAt: { gte: startOfMonth(new Date()) } },
    });

    const acceptedOffers = await prisma.deliveryItem.count({
      where: { riderId: rider.id, acceptedAt: { not: null } },
    });

    const acceptanceRate =
      totalOffers > 0
        ? ((acceptedOffers / totalOffers) * 100).toFixed(1)
        : "0.0";

    // --- Rating (Only completed deliveries) ---
    const completedDeliveries = await prisma.deliveryItem.findMany({
      where: {
        riderId: rider.id,
        status: "DELIVERED",
      },
      select: { id: true },
    });

    const completedIds = completedDeliveries.map((d) => d.id);

    // const ratingData = await prisma.riderReview.aggregate({
    //   where: {
    //     deliveryItemId: { in: completedIds },
    //     riderId: rider.id,
    //   },
    //   _avg: { rating: true },
    // });

    // const rating = ratingData._avg.rating
    //   ? ratingData._avg.rating.toFixed(1)
    //   : "0.0";

    // --- Earnings ---
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());
    const weekStart = startOfWeek(new Date());
    const monthStart = startOfMonth(new Date());

    const [todayEarnings, weekEarnings, monthEarnings] = await Promise.all([
      prisma.deliveryItem.aggregate({
        where: {
          riderId: rider.id,
          deliveredAt: { gte: todayStart, lte: todayEnd },
        },
        _sum: { riderEarnings: true },
      }),
      prisma.deliveryItem.aggregate({
        where: {
          riderId: rider.id,
          deliveredAt: { gte: weekStart },
        },
        _sum: { riderEarnings: true },
      }),
      prisma.deliveryItem.aggregate({
        where: {
          riderId: rider.id,
          deliveredAt: { gte: monthStart },
        },
        _sum: { riderEarnings: true },
      }),
    ]);

    const earnings = {
      today: todayEarnings._sum.riderEarnings || 0,
      week: weekEarnings._sum.riderEarnings || 0,
      month: monthEarnings._sum.riderEarnings || 0,
    };

    console.log(
      rider,
      // rating,
      acceptanceRate,
      earnings,
      activeDelivery
    );
    return NextResponse.json(
      {
        rider,
        // rating,
        acceptanceRate,
        earnings,
        activeDelivery,
        completedDeliveries: completedDeliveries.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API Error fetching rider profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch rider profile." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const updatedRider = await prisma.rider.update({
      where: { userId: user.id },
      data: { ...body },
    });
    return NextResponse.json(
      { success: true, rider: updatedRider },
      { status: 200 }
    );
  } catch (error) {
    console.error("API Error updating rider profile:", error);
    return NextResponse.json(
      { error: "Failed to update rider profile." },
      { status: 500 }
    );
  }
}
