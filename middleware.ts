// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";

// /**
//  * Public page routes (exact matches)
//  */
// const PUBLIC_ROUTES = new Set(["/", "/sign-in", "/sign-up", "/reset-password"]);

// /**
//  * Public API routes (prefix-safe)
//  */
// const PUBLIC_API_ROUTES = [
// "/api/initial-auth",
// "/api/verify-otp",
// "/api/logout",
// "/api/login",
// "/api/products",
// "/api/categories",
// "/api/brands",
// "/api/search-products",
// "/api/store/resendOtp",
// "/api/me/password/forgot-password",
// ];

// const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

// function isPublicApiRoute(pathname: string): boolean {
//   return PUBLIC_API_ROUTES.some(
//     (route) => pathname === route || pathname.startsWith(`${route}/`),
//   );
// }

// function isStaticAsset(pathname: string): boolean {
//   return (
//     pathname.startsWith("/_next") ||
//     pathname === "/favicon.ico" ||
//     /\.(js|css|png|jpg|jpeg|svg|gif|webp|ico|woff|woff2|ttf|eot)$/i.test(
//       pathname,
//     )
//   );
// }

// export function middleware(request: NextRequest) {
//   const { pathname, search } = request.nextUrl;

//   // Skip static assets early
//   if (isStaticAsset(pathname)) {
//     return NextResponse.next();
//   }

//   const isPublicPage = PUBLIC_ROUTES.has(pathname);
//   const isPublicApi = isPublicApiRoute(pathname);

//   // Allow public access
//   if (isPublicPage || isPublicApi) {
//     return NextResponse.next();
//   }

//   // Read token (Edge-compatible)
//   const token = request.cookies.get("token")?.value;

//   if (!token) {
//     // API → return 401
//     if (pathname.startsWith("/api")) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     // Pages → redirect to sign-in with full return URL
//     const signInUrl = new URL("/sign-in", request.url);
//     signInUrl.searchParams.set("redirectUrl", pathname + search);

//     return NextResponse.redirect(signInUrl);
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: [
//     /**
//      * Run middleware on all routes except:
//      * - static files
//      * - Next.js internals
//      */
//     "/((?!_next/static|_next/image|favicon.ico).*)",
//   ],
// };

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

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose"; // You'll need to install this: npm install jose

const PUBLIC_ROUTES = new Set([
  "/",
  "/sign-in",
  "/sign-up",
  "/reset-password",
  "/api/initial-auth",
  "/api/verify-otp",
  "/api/logout",
  "/api/login",
  "/api/products",
  "/api/products/top-selling",
  "/api/products/new-arrivals",
  "/api/products/top-deals",
  "/api/products/:slug",
  "/api/search-products",
  "/api/categories/:category",
  "/api/categories/:category/products",
  "/api/subcategories/:subcategory/products",
  "/api/subsubcategories/:slug/products",
  "/api/categories",
  "/api/brands",
  "/api/search-products",
  "/api/store/resendOtp",
  "/api/me/password/forgot-password",
]);
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Skip middleware for static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/_next") ||
    pathname.startsWith("/static") ||
    pathname.match(
      /\.(js|css|png|jpg|jpeg|svg|gif|webp|ico|woff|woff2|ttf|eot)$/i,
    ) ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // 2. Allow public routes
  if (PUBLIC_ROUTES.has(pathname)) {
    return NextResponse.next();
  }

  // 3. Get token from cookies
  const token = req.cookies.get("token")?.value;

  if (!token) {
    return handleUnauthorized(req, pathname);
  }

  try {
    // 4. Verify the JWT
    // This ensures the token hasn't been tampered with or expired
    await jwtVerify(token, JWT_SECRET);

    return NextResponse.next();
  } catch (error) {
    console.error("JWT Verification failed:", error);
    return handleUnauthorized(req, pathname);
  }
}

function handleUnauthorized(req: NextRequest, pathname: string) {
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const signInUrl = new URL("/sign-in", req.url);
  signInUrl.searchParams.set("redirectUrl", pathname);
  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
