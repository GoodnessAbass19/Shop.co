import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { match } from "path-to-regexp";

const publicRoutes = [
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
  "/api/products/:slug",
  "/api/search-products",
  "/api/categories/:category",
  "/api/categories/:category/products",
  "/api/subcategories/:subcategory/products",
  "/api/subsubcategories/:slug/products",
  "/api/brands",
  "/api/store/resendOtp",
  "/api/me/password/forgot-password",
];

const publicMatchers = publicRoutes.map((route) =>
  match(route, { decode: decodeURIComponent }),
);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read token from request cookies
  const token = request.cookies.get("token")?.value;

  const isPublicRoute = publicMatchers.some((matcher) => matcher(pathname));

  // Allow public routes
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // For protected routes, check if token exists
  // Note: JWT verification is done server-side in route handlers, not in middleware
  // because middleware runs on Edge Runtime which doesn't support crypto
  if (!token) {
    // If it's an API route, return 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // If it's a page route, redirect to sign-in
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // Token exists, allow the request to proceed
  // Actual JWT verification will happen in route handlers
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};

//   const isPublicRoute = publicMatchers.some((m) => m(pathname));

//   console.log("Middleware:", { pathname, isPublicRoute, token });

//   if (isPublicRoute) {
//     return NextResponse.next();
//   }

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
