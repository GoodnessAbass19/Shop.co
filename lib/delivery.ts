import crypto from "crypto";
import bcrypt from "bcryptjs";

export function generateDeliveryCode(): string {
  // 6-digit numeric, no leading zero issues
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function hashCode(code: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(code, salt);
}

export async function verifyCode(code: string, hash: string) {
  return bcrypt.compare(code, hash);
}

export function codeExpiresIn(hours = 24) {
  const d = new Date();
  d.setHours(d.getHours() + hours);
  return d;
}
