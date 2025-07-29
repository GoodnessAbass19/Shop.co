// app/api/notifications/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Role } from "@prisma/client"; // Import UserRole enum

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.log(
        "Unauthorized access attempt to get notifications: No user found."
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const readFilter = searchParams.get("read"); // "true", "false", or null for all
    const roleFilter = searchParams.get("role"); // "BUYER", "SELLER", or null for all roles
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);

    const whereClause: any = {
      userId: user.id, // Always filter by the current user's ID
    };

    // Apply read status filter if provided
    if (readFilter === "true") {
      whereClause.read = true;
    } else if (readFilter === "false") {
      whereClause.read = false;
    }

    // Apply role filter if provided and valid
    if (roleFilter && Object.values(Role).includes(roleFilter as Role)) {
      whereClause.userRole = roleFilter as Role;
    } else if (roleFilter) {
      console.warn(
        `Invalid roleFilter provided: ${roleFilter}. Ignoring filter.`
      );
    }

    // Calculate skip for offset pagination
    const skip = (page - 1) * pageSize;

    // Fetch notifications and total count
    const [notifications, totalNotifications] = await prisma.$transaction([
      prisma.notification.findMany({
        where: whereClause,
        orderBy: {
          createdAt: "desc", // Most recent notifications first
        },
        skip: skip,
        take: pageSize,
      }),
      prisma.notification.count({
        where: whereClause,
      }),
    ]);

    const totalPages = Math.ceil(totalNotifications / pageSize);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json(
      {
        notifications,
        totalNotifications,
        totalPages,
        currentPage: page,
        pageSize,
        hasNextPage,
        hasPreviousPage,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications." },
      { status: 500 }
    );
  }
}
