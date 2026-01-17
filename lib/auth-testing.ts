/**
 * Authentication Testing Utilities
 *
 * Helper functions for testing authentication in development
 * Run these in your browser console when testing
 */

// Get current token from localStorage (if you store it there)
export function getToken() {
  return localStorage.getItem("token");
}

// Check if user is authenticated
export async function checkAuth() {
  try {
    const res = await fetch("/api/me");
    if (res.ok) {
      const data = await res.json();
      console.log("✅ Authenticated:", data.user);
      return true;
    } else {
      console.log("❌ Not authenticated. Status:", res.status);
      return false;
    }
  } catch (error) {
    console.error("❌ Auth check failed:", error);
    return false;
  }
}

// Test API route protection
export async function testApiProtection(apiRoute: string) {
  try {
    const res = await fetch(apiRoute);
    if (res.status === 401) {
      console.log(`✅ ${apiRoute} is protected (401)`);
    } else if (res.ok) {
      console.log(`✅ ${apiRoute} is accessible (${res.status})`);
    } else {
      console.log(`⚠️  ${apiRoute} returned ${res.status}`);
    }
    return res.status;
  } catch (error) {
    console.error(`❌ ${apiRoute} failed:`, error);
  }
}

// Simulate logout
export function logout() {
  localStorage.removeItem("token");
  document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  console.log("✅ Logged out");
}

// Log all cookies
export function logCookies() {
  const cookies = document.cookie.split("; ");
  console.log("Cookies:", cookies);
  const token = cookies.find((c) => c.startsWith("token="));
  console.log("Token cookie:", token ? "Present" : "Not found");
}

// Usage in console:
// checkAuth()  - Check if authenticated
// testApiProtection("/api/me")  - Test if route is protected
// logCookies()  - View all cookies
// logout()  - Clear auth
