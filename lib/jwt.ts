import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export function signToken(payload: any) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as {
    userId: string;
    email: string;
    role: string;
  };
}

export function createJwtToken(user: {
  id: string;
  email: string;
  role: string;
}) {
  return signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });
}
