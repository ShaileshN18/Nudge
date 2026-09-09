import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET_STRING = process.env.JWT_SECRET || "fallback_default_nudge_secret_key_2026";
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

export const AUTH_COOKIE_NAME = "nudge_auth_token";

export interface AuthUserPayload {
  userId: string;
  email: string;
  name: string;
}

/**
 * Hashes a plain text password using bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compares a plain text password with a hashed password.
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Signs a JWT token containing user payload.
 */
export async function signToken(payload: AuthUserPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

/**
 * Verifies and decodes a JWT token.
 */
export async function verifyToken(
  token: string
): Promise<AuthUserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
    };
  } catch {
    return null;
  }
}

/**
 * Standard cookie configuration for authentication token.
 */
export const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 7 * 24 * 60 * 60, // 7 days
};

/**
 * Retrieves the current authenticated user session from HTTP-only cookie.
 */
export async function getAuthSession(): Promise<AuthUserPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}
