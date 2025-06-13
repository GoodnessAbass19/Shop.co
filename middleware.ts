import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};

// middleware.ts
// middleware.ts
// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";
// import { verifyToken } from "./lib/jwt";
// import { match } from "path-to-regexp";

// // Explicitly public routes
// const publicRoutes = [
//   "/",
//   "/sign-in",
//   "/sign-up",
//   "/api/auth/initiate-auth",
//   "/api/auth/verify-otp",
//   "/api/auth/logout",
//   "/api/products",
//   "/api/products/top-selling",
//   "/api/products/new-arrivals",
//   "/api/products/:slug",
// ];

// // Build matchers for dynamic public routes
// const publicMatchers = publicRoutes.map((route) =>
//   match(route, { decode: decodeURIComponent })
// );

// export async function middleware(request: NextRequest) {
//   const { pathname } = request.nextUrl;
//   const token = request.cookies.get("token")?.value;

//   // Check if path matches any public route
//   const isPublicRoute = publicMatchers.some((m) => m(pathname));

//   if (isPublicRoute) {
//     return NextResponse.next();
//   }

//   // Handle missing token
//   if (!token) {
//     const url = request.nextUrl.clone();
//     url.pathname = "/sign-in";
//     url.searchParams.set("redirectUrl", pathname + request.nextUrl.search);
//     return NextResponse.redirect(url);
//   }

//   // Verify token
//   try {
//     verifyToken(token);
//     return NextResponse.next();
//   } catch (error) {
//     console.warn("Invalid or expired token in middleware:", error);
//     const url = new URL("/sign-in", request.url);
//     url.searchParams.set("redirectUrl", pathname + request.nextUrl.search);
//     const response = NextResponse.redirect(url);
//     response.cookies.delete("token");
//     return response;
//   }
// }

// // Middleware config
// export const config = {
//   matcher: [
//     /*
//      * Match all routes except:
//      * - static/image/_next files
//      * - favicon and public assets
//      * - open auth/product APIs
//      */
//     // "/((?!_next/static|_next/image|favicon.ico|.*\\.(svg|png|jpg|jpeg|gif|webp)|api/auth|api/products|api/webhook).*)",
//     // Skip Next.js internals and all static files, unless found in search params
//     "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
//     // Always run for API routes
//     "/(api|trpc)(.*)",
//   ],
// };
