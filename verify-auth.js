#!/usr/bin/env node

/**
 * Authentication System Verification Checklist
 *
 * Run this to verify all authentication components are properly set up
 */

import fs from "fs";
import path from "path";

const checks = [
  {
    name: "Middleware File Exists",
    path: "middleware.ts",
    type: "file",
  },
  {
    name: "Auth Module",
    path: "lib/auth.ts",
    type: "file",
  },
  {
    name: "JWT Module",
    path: "lib/jwt.ts",
    type: "file",
  },
  {
    name: "Route Protection Utils",
    path: "lib/route-protection.ts",
    type: "file",
  },
  {
    name: "Auth System Documentation",
    path: "AUTH_SYSTEM.md",
    type: "file",
  },
  {
    name: "Setup Documentation",
    path: "AUTHENTICATION_SETUP.md",
    type: "file",
  },
];

function verify() {
  console.log("\n🔐 Verifying Authentication System Setup\n");
  console.log("==========================================\n");

  let passed = 0;
  let failed = 0;

  checks.forEach((check) => {
    const filePath = path.join(process.cwd(), check.path);
    const exists = fs.existsSync(filePath);

    if (exists) {
      console.log(`✅ ${check.name}`);
      console.log(`   Location: ${check.path}\n`);
      passed++;
    } else {
      console.log(`❌ ${check.name}`);
      console.log(`   Missing: ${check.path}\n`);
      failed++;
    }
  });

  console.log("==========================================\n");
  console.log(`Results: ${passed} passed, ${failed} failed\n`);

  if (failed === 0) {
    console.log("✅ All authentication components are properly set up!");
    console.log("\nNext steps:");
    console.log("1. Review AUTH_SYSTEM.md for complete documentation");
    console.log("2. Test the authentication flow:");
    console.log("   - Sign up with email/password");
    console.log("   - Verify OTP");
    console.log("   - Access protected routes");
    console.log("3. Check browser DevTools for 'token' cookie\n");
  } else {
    console.log("⚠️  Some authentication components are missing!");
    console.log("Please ensure all files are in place.\n");
    process.exit(1);
  }
}

verify();
