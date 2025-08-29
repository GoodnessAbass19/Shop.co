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
// import { NextResponse, type NextRequest } from "next/server";
// import { verifyToken } from "./lib/jwt";
// import { match } from "path-to-regexp";
// import { cookies } from "next/headers";

// const publicRoutes = [
//   "/",
//   "/sign-in",
//   "/sign-up",
//   "/api/initial-auth",
//   "/api/verify-otp", // ✅ corrected path
//   "/api/logout",
//   "/api/products",
//   "/api/products/top-selling",
//   "/api/products/new-arrivals",
//   "/api/products/:slug",
//   "/api/search-products",
//   "/api/categories/:category",
//   "/api/categories/:category/products",
//   "/api/subcategories/:subcategory/products",
//   "/api/subsubcategories/:slug/products",
// ];

// const publicMatchers = publicRoutes.map((route) =>
//   match(route, { decode: decodeURIComponent })
// );

// export async function middleware(request: NextRequest) {
//   const { pathname } = request.nextUrl;

//   const cookieStore = cookies(); // ✅ no await
//   // @ts-ignore
//   const token = cookieStore.get("token")?.value;

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
