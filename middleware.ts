import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that don't require authentication
const PUBLIC_ROUTES = new Set(["/", "/sign-in", "/sign-up", "/reset-password"]);

// API routes that don't require authentication
const PUBLIC_API_ROUTES = [
  "/api/initial-auth",
  "/api/verify-otp",
  "/api/logout",
  "/api/login",
  "/api/products",
  "/api/categories",
  "/api/brands",
  "/api/search-products",
  "/api/store/resendOtp",
  "/api/me/password/forgot-password",
];

/**
 * Check if a pathname matches a public API route
 * Handles both exact matches and prefix matches (e.g., /api/products/123)
 */
function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some((route) => {
    if (pathname === route) return true;
    if (pathname.startsWith(route + "/")) return true;
    return false;
  });
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/_next") ||
    pathname === "/favicon.ico" ||
    pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|webp|ico|woff|woff2)$/)
  ) {
    return NextResponse.next();
  }

  // Check if it's a public route or API route
  const isPublicPage = PUBLIC_ROUTES.has(pathname);
  const isPublicApi = isPublicApiRoute(pathname);

  if (isPublicPage || isPublicApi) {
    return NextResponse.next();
  }

  // Get token from cookies
  const token = request.cookies.get("token")?.value;

  // No token on protected route
  if (!token) {
    // For API routes, return 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 },
      );
    }

    // For page routes, redirect to sign-in with return URL
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("redirectUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Token exists - allow the request to proceed
  // Route handlers will perform full JWT verification via getCurrentUser()
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run middleware on all routes except static files
    "/((?!_next/static|_next/image|favicon\\.ico).*)",
  ],
};

//   if (!token) {
//     const url = request.nextUrl.clone();
//     url.pathname = "/sign-in";
//     url.searchParams.set("redirect_url", pathname + request.nextUrl.search);
//     return NextResponse.redirect(url);
//   }

//   try {
//     verifyToken(token);
//     return NextResponse.next();
//   } catch (error) {
//     console.warn("Invalid or expired token in middleware:", error);

//     const url = request.nextUrl.clone();
//     url.pathname = "/sign-in";
//     url.searchParams.set("redirect_url", pathname + request.nextUrl.search);

//     const response = NextResponse.redirect(url);
//     response.cookies.delete("token"); // ✅ only deletes when invalid
//     return response;
//   }
// }

// export const config = {
//   matcher: [
//     "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
//     "/(api|trpc)(.*)",
//   ],
// };
