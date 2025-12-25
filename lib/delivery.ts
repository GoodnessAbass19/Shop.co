import crypto from "crypto";
import bcrypt from "bcryptjs";

export function generateDeliveryCode(): string {
  // 4-digit numeric code (1000-9999)
  // use crypto.randomInt for better randomness than Math.random
  return crypto.randomInt(1000, 10000).toString();
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
