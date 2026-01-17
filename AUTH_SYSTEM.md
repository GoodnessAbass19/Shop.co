# Authentication System Documentation

## Overview

Your application uses a **dual-layer authentication system** for maximum security and reliability:

1. **Layer 1: Middleware (Edge Runtime)**
   - Located: `middleware.ts`
   - Purpose: Quick checks at the edge before requests reach your server
   - Checks: Token existence only (no crypto operations)
   - Benefits: Fast, stops unauthenticated requests early

2. **Layer 2: Route Handlers (Server Runtime)**
   - Located: Individual route files and `lib/auth.ts`
   - Purpose: Full authentication verification
   - Checks: JWT token validation, user data retrieval
   - Benefits: Complete auth validation, database lookups, role checking

## How It Works

### Authentication Flow

1. **User Signs Up/In**
   - POST `/api/initial-auth` with email & password
   - Server creates JWT token and sets `token` cookie

2. **User Makes Request**
   - Browser sends request with `token` cookie
   - Middleware checks if token exists
   - If no token → redirect to `/sign-in` (pages) or return 401 (API)
   - If token exists → allow request to proceed

3. **Route Handler Validates**
   - Route imports `getCurrentUser()` from `lib/auth.ts`
   - Calls `getCurrentUser()` to verify JWT and get user data
   - If JWT invalid → returns null
   - If valid → returns user object with full details

## Public Routes (No Auth Required)

### Pages
- `/`
- `/sign-in`
- `/sign-up`
- `/reset-password`

### API Routes
- `/api/initial-auth` - Sign up/login
- `/api/verify-otp` - OTP verification
- `/api/logout`
- `/api/products` - Browse products
- `/api/categories` - Browse categories
- `/api/brands` - Browse brands
- `/api/search-products` - Search
- `/api/store/resendOtp` - Resend OTP
- `/api/me/password/forgot-password` - Password reset

## Protected Routes (Auth Required)

Any route NOT in the public routes list requires authentication.

Common protected routes:
- `/api/me` - Get current user
- `/api/cart` - User cart operations
- `/api/wishlist` - User wishlist
- `/api/orders` - User orders
- `/api/store/*` - Seller dashboard
- `/me/*` - User profile pages

## Using Middleware

The middleware automatically handles:
1. Checking for `token` cookie
2. Redirecting unauthenticated users to `/sign-in`
3. Returning 401 for unauthenticated API requests

**Benefits:**
- Fast edge-level checks
- Works on all platforms (Vercel, Railway, self-hosted)
- Doesn't access database

## Using Route Protection

For additional safety, protected routes use `getCurrentUser()`:

```typescript
// Example: /api/me/route.ts
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // User is authenticated, proceed with handler
  return NextResponse.json({ user });
}
```

### Using the Route Protection Helper

```typescript
// Example using helper utilities
import { protectRoute, protectRouteWithRole, isErrorResponse } from "@/lib/route-protection";
import { Role } from "@prisma/client";

// Basic protection
export async function GET() {
  const user = await protectRoute();
  if (isErrorResponse(user)) return user;
  // user is now guaranteed to be non-null
  
  return NextResponse.json({ user });
}

// Protect route with specific role
export async function PATCH(request: Request) {
  const user = await protectRouteWithRole(Role.SELLER, Role.ADMIN);
  if (isErrorResponse(user)) return user;
  // user is now guaranteed to be seller or admin
  
  return NextResponse.json({ user });
}
```

## Cookie Settings

Token cookie is set with:
- `httpOnly: true` - Cannot be accessed by JavaScript
- `secure: true` (production) - Only sent over HTTPS
- `maxAge: 604800000` - 7 days expiration
- `sameSite: "lax"` - CSRF protection

## Token Structure

JWT token contains:
```typescript
{
  userId: string;
  email: string;
  role: string; // "BUYER" | "SELLER" | "RIDER" | "ADMIN"
  iat: number;  // Issued at
  exp: number;  // Expires at (7 days)
}
```

## Environment Variables Required

```env
JWT_SECRET=your-jwt-secret-key
```

## Testing

### Test Authenticated Request
```bash
curl -b "token=YOUR_JWT_TOKEN" http://localhost:3000/api/me
```

### Test Unauthenticated Request
```bash
# Should return 401
curl http://localhost:3000/api/me
```

### Test Redirect on Protected Page
```bash
# Should redirect to /sign-in
curl -L http://localhost:3000/me/orders
```

## Troubleshooting

### "Unauthorized" on Protected Routes
- Check that token cookie is being set during login
- Verify JWT_SECRET env var matches between server and client
- Check cookie is marked as `httpOnly: true` (view in DevTools)

### Middleware Not Working
- Ensure `middleware.ts` exists in root directory
- Check that `export const config` has correct `matcher`
- Look for TypeScript errors in middleware

### Token Expires Too Quickly
- Check `maxAge` in cookie settings (should be 604800000 for 7 days)
- Verify `expiresIn` in JWT signing (should be "7d")

## Future Improvements

- [ ] Implement refresh tokens for better security
- [ ] Add role-based access control (RBAC) helpers
- [ ] Implement session management
- [ ] Add IP whitelisting for admins
- [ ] Implement 2FA for sensitive operations
