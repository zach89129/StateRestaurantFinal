import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
// import { verifyApiKey } from "@/lib/api-auth";

export async function middleware(request: NextRequest) {
  // Check if this is a POST request to one of our API endpoints that requires an API key
  const requiresApiKey =
    request.method === "POST" &&
    (request.nextUrl.pathname === "/api/venue-products" ||
      request.nextUrl.pathname === "/api/products" ||
      request.nextUrl.pathname === "/api/customers");

  if (requiresApiKey) {
    // Temporarily commenting out API key verification
    /*
    const apiKey = request.headers.get("x-api-key");
    console.log("Received API Key:", apiKey);
    console.log("Request path:", request.nextUrl.pathname);
    console.log("Request method:", request.method);

    if (!apiKey) {
      console.log("No API key provided");
      return NextResponse.json({ error: "Missing API key" }, { status: 401 });
    }

    const isValid = await verifyApiKey(apiKey, process.env.API_KEY_HASH!);
    console.log("API Key validation result:", isValid);
    console.log("Stored hash:", process.env.API_KEY_HASH);
    console.log("Salt used:", process.env.API_KEY_SALT);

    if (!isValid) {
      console.log("Invalid API key");
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    console.log("API key validation successful");
    */
    return NextResponse.next();
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
    (request.nextUrl.pathname.startsWith("/api/venue-products") &&
      request.method === "GET");

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
    "/api/products/:path*",
    "/api/customers/:path*",
    "/reorder/:path*",
    "/admin/:path*",
    "/venues/:path*",
  ],
};
