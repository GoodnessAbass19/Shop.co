# 🔐 Authentication System - Complete File Reference

## Core Authentication Files

### Middleware & Security

**`middleware.ts`** (Root Directory)
- Edge-level authentication checks
- Token cookie validation
- Route protection (redirects/401s)
- Production-ready configuration
- Key functions:
  - `middleware()` - Main middleware function
  - `isPublicApiRoute()` - Check if API route is public

### Authentication Logic

**`lib/auth.ts`**
- `getCurrentUser()` - Get authenticated user from token
- `getCurrentRider()` - Get authenticated rider
- Verifies JWT and fetches user from database
- Handles all authentication logic

**`lib/jwt.ts`**
- `signToken()` - Create JWT token
- `verifyToken()` - Verify JWT token signature
- `createJwtToken()` - Create token for user object

### New Helper Files

**`lib/route-protection.ts`** (NEW)
- `protectRoute()` - Basic route protection
- `protectRiderRoute()` - Rider-specific protection
- `protectRouteWithRole()` - Role-based protection
- `isErrorResponse()` - Type guard for responses

**`lib/auth-testing.ts`** (NEW)
- `checkAuth()` - Test authentication status
- `testApiProtection()` - Test if route is protected
- `logCookies()` - Debug cookies
- `logout()` - Clear authentication
- For browser console testing

### Route Handlers Using Authentication

**Protected API Routes**
- `app/api/me/route.ts` - Get current user
- `app/api/cart/route.ts` - User cart (uses `getCurrentUser()`)
- `app/api/wishlist/route.ts` - User wishlist (uses `getCurrentUser()`)
- `app/api/notifications/route.ts` - User notifications (uses `getCurrentUser()`)
- `app/api/store/route.ts` - Seller store (uses `getCurrentUser()`)

**Authentication Routes**
- `app/api/initial-auth/route.ts` - Sign up/login
- `app/api/verify-otp/route.ts` - OTP verification (generates token)
- `app/api/logout/route.ts` - Logout

**OTP Sending**
- `lib/otp.ts` - `sendOtp()` function (uses Google OAuth email)

---

## Documentation Files

**`AUTH_SYSTEM.md`**
- Complete technical documentation
- Authentication flow explanation
- Public/Protected routes reference
- Cookie settings and JWT structure
- Testing guide with curl examples
- Troubleshooting section

**`AUTHENTICATION_SETUP.md`**
- Implementation status table
- Security features overview
- Deployment checklist
- Known limitations
- Next steps for improvement

**`AUTHENTICATION_READY.md`**
- Quick summary of implementation
- Usage examples
- Security architecture diagram
- Flow diagram (ASCII)
- Quick troubleshooting

**`verify-auth.js`**
- Verification script
- Checks all components exist
- Run with: `node verify-auth.js`

---

## Quick Reference

### To Protect a Route

```typescript
// Option 1: Using getCurrentUser() directly
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  
  // Use user
}

// Option 2: Using helper (cleaner)
import { protectRoute, isErrorResponse } from "@/lib/route-protection";

export async function GET() {
  const user = await protectRoute();
  if (isErrorResponse(user)) return user; // 401 response
  
  // Use user
}

// Option 3: Role-based protection
import { protectRouteWithRole } from "@/lib/route-protection";
import { Role } from "@prisma/client";

export async function GET() {
  const user = await protectRouteWithRole(Role.SELLER);
  if (isErrorResponse(user)) return user;
  
  // Guaranteed SELLER
}
```

### To Test Authentication (Browser Console)

```javascript
// From lib/auth-testing.ts
import { checkAuth, testApiProtection, logCookies, logout } from "@/lib/auth-testing";

await checkAuth()              // ✅ or ❌
await testApiProtection("/api/cart")
logCookies()
logout()
```

### Middleware Configuration

```typescript
// middleware.ts
PUBLIC_ROUTES = ["/", "/sign-in", "/sign-up", "/reset-password"]
PUBLIC_API_ROUTES = ["/api/initial-auth", "/api/verify-otp", ...]

// Middleware flow:
// 1. Public route? → Allow
// 2. No token? → Redirect (page) or 401 (API)
// 3. Token exists? → Allow (route handler validates)
```

---

## Environment Variables Required

```env
JWT_SECRET=your-secret-key-here
EMAIL_USER=your-email@gmail.com
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REFRESH_TOKEN=your-refresh-token
```

---

## Key Concepts

### Cookie Details
- Name: `token`
- Type: JWT (7-day expiration)
- HttpOnly: ✅ (prevents XSS)
- Secure: ✅ (production only, HTTPS)
- SameSite: `lax` (CSRF protection)

### Token Contents
```json
{
  "userId": "uuid-of-user",
  "email": "user@example.com",
  "role": "BUYER|SELLER|RIDER|ADMIN",
  "iat": 1705444800,
  "exp": 1706049600
}
```

### Roles Available
- `BUYER` - Customer
- `SELLER` - Store owner
- `RIDER` - Delivery person
- `ADMIN` - Administrator

---

## Testing Checklist

- [ ] Sign up creates user in database
- [ ] OTP is sent to email
- [ ] Verifying OTP creates token
- [ ] Token cookie is set with httpOnly flag
- [ ] Accessing `/api/me` returns user
- [ ] Accessing protected route without token returns 401
- [ ] Unauthenticated page access redirects to /sign-in
- [ ] Role-based routes check roles properly
- [ ] Token expires after 7 days
- [ ] Logout clears token cookie

---

## Performance Notes

- Middleware: ~1-5ms (edge runtime)
- JWT verification: ~5-10ms (crypto operation)
- Database user lookup: ~10-50ms (database query)
- Total: ~15-60ms for typical request

---

## Security Checklist

- ✅ Token stored in HttpOnly cookie
- ✅ Secure flag on HTTPS
- ✅ CSRF protection with SameSite
- ✅ JWT signed with secret
- ✅ Token expiration (7 days)
- ✅ Double-layer validation (middleware + handler)
- ⏳ TODO: Implement refresh tokens
- ⏳ TODO: Add session management
- ⏳ TODO: Add 2FA option

---

## Common Issues & Solutions

**Token not persisting after refresh**
- ✅ Cookie is HttpOnly (correct)
- ✅ Browser sending token in requests
- ✅ Check Network tab in DevTools

**Middleware blocking all requests**
- ✅ Check PUBLIC_ROUTES list is complete
- ✅ Check matcher regex is correct
- ✅ Restart dev server after changes

**JWT verification failing**
- ✅ Verify JWT_SECRET matches
- ✅ Check token hasn't expired
- ✅ Ensure cookie is being sent

---

For detailed information, see:
- `AUTH_SYSTEM.md` - Complete technical guide
- `AUTHENTICATION_SETUP.md` - Setup and deployment
- `AUTHENTICATION_READY.md` - Implementation summary
