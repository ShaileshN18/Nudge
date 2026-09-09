import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET_STRING = process.env.JWT_SECRET || "fallback_default_nudge_secret_key_2026";
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect project workspace routes
  if (pathname.startsWith("/projects/")) {
    const token = request.cookies.get("nudge_auth_token")?.value;

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      await jwtVerify(token, JWT_SECRET);
      return NextResponse.next();
    } catch {
      // Invalid or expired token
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete("nudge_auth_token");
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/projects/:path*"],
};
