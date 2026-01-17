import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Public page routes (exact matches)
 */
const PUBLIC_ROUTES = new Set(["/", "/sign-in", "/sign-up", "/reset-password"]);

/**
 * Public API routes (prefix-safe)
 */
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

function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    /\.(js|css|png|jpg|jpeg|svg|gif|webp|ico|woff|woff2|ttf|eot)$/i.test(
      pathname,
    )
  );
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Skip static assets early
  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  const isPublicPage = PUBLIC_ROUTES.has(pathname);
  const isPublicApi = isPublicApiRoute(pathname);

  // Allow public access
  if (isPublicPage || isPublicApi) {
    return NextResponse.next();
  }

  // Read token (Edge-compatible)
  const token = request.cookies.get("token")?.value;

  console.log("COOKIE:", request.cookies.get("token"));

  if (!token) {
    // API → return 401
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Pages → redirect to sign-in with full return URL
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("redirectUrl", pathname + search);

    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /**
     * Run middleware on all routes except:
     * - static files
     * - Next.js internals
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
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
