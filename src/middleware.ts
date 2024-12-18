import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function middleware(request: NextRequest) {
  // Check if this is an admin API route that requires an API key
  const requiresApiKey = request.nextUrl.pathname.startsWith("/api/admin/");

  if (requiresApiKey) {
    const apiKey = request.headers.get("x-api-key");

    if (!apiKey) {
      return NextResponse.json({ error: "Missing API key" }, { status: 401 });
    }

    const hashedApiKey = await hashApiKey(apiKey);

    if (hashedApiKey !== process.env.API_KEY_HASH) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }
  }

  // Handle authentication for protected routes
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Check if trying to access protected routes
  const isProtectedRoute =
    request.nextUrl.pathname.startsWith("/reorder") ||
    request.nextUrl.pathname.startsWith("/venues") ||
    request.nextUrl.pathname.startsWith("/api/venue-products");

  if (isProtectedRoute && !token) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Check if trying to access admin routes
  const isAdminPath = request.nextUrl.pathname.startsWith("/admin");
  if (isAdminPath) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (token.email !== process.env.SUPERUSER_ACCT) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/venue-products/:path*",
    "/reorder/:path*",
    "/admin/:path*",
    "/venues/:path*",
  ],
};
