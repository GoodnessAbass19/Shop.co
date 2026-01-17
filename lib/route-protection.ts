/**
 * Route Protection Utilities
 *
 * Provides helpers for protecting API routes and ensuring proper authentication
 * This works in conjunction with middleware.ts for defense-in-depth authentication
 */

import { NextResponse } from "next/server";
import { getCurrentUser, getCurrentRider } from "./auth";
import { Role } from "@prisma/client";

/**
 * Protect an API route - ensures user is authenticated
 * Returns user if authenticated, otherwise sends 401 response
 *
 * Usage:
 * ```
 * export async function GET(request: Request) {
 *   const protectedRoute = await protectRoute();
 *   if (protectedRoute instanceof NextResponse) return protectedRoute;
 *   const user = protectedRoute;
 *   // ... rest of handler
 * }
 * ```
 */
export async function protectRoute() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized - Authentication required" },
      { status: 401 },
    );
  }

  return user;
}

/**
 * Protect a rider-specific API route
 */
export async function protectRiderRoute() {
  const rider = await getCurrentRider();

  if (!rider) {
    return NextResponse.json(
      { error: "Unauthorized - Rider authentication required" },
      { status: 401 },
    );
  }

  return rider;
}

/**
 * Protect route and check for specific role
 */
export async function protectRouteWithRole(...allowedRoles: Role[]) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized - Authentication required" },
      { status: 401 },
    );
  }

  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json(
      { error: "Forbidden - Insufficient permissions" },
      { status: 403 },
    );
  }

  return user;
}

/**
 * Check if a result is an error response (for use in route handlers)
 */
export function isErrorResponse(result: any): result is NextResponse {
  return result instanceof NextResponse;
}
