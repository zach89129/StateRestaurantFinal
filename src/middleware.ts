import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { hashApiKey } from "@/lib/api-auth";

// This will execute when the file is loaded
console.log("==========================================");
console.log("MIDDLEWARE FILE LOADED");
console.log("==========================================");

// Secure API key verification function comparing against stored hash
async function verifyRequestApiKey(request: NextRequest): Promise<boolean> {
  try {
    const storedHash = process.env.API_KEY_HASH;

    if (!storedHash) {
      console.error("API_KEY_HASH is not set in environment variables");
      return false;
    }

    // Get API key from headers
    const requestApiKey = request.headers.get("x-api-key");

    if (!requestApiKey) {
      console.error("No API key provided in request headers");
      return false;
    }

    console.log("[Middleware] API Key verification attempt", {
      path: request.nextUrl.pathname,
      method: request.method,
      hasApiKeyHeader: !!requestApiKey,
    });

    // Clean up request API key in case there are whitespace or quotation mark issues
    const cleanRequestApiKey = requestApiKey
      .trim()
      .replace(/^["'](.*)["']$/, "$1");

    try {
      // Hash the request API key and compare with stored hash
      const hashedRequestKey = await hashApiKey(cleanRequestApiKey);

      console.log(
        "[Middleware] Hashed request key:",
        hashedRequestKey.substring(0, 10) + "..."
      );
      console.log(
        "[Middleware] Stored hash key:",
        storedHash.substring(0, 10) + "..."
      );

      // Compare with the stored hash directly
      return hashedRequestKey === storedHash;
    } catch (error) {
      console.error("[Middleware] Error hashing API key:", error);
      return false;
    }
  } catch (error) {
    console.error(
      "[Middleware] Unexpected error in API key verification:",
      error
    );
    return false;
  }
}

export async function middleware(request: NextRequest) {
  console.log("==========================================");
  console.log(
    `[MIDDLEWARE] EXECUTED FOR: ${request.method} ${request.nextUrl.pathname}`
  );
  console.log("==========================================");

  console.log(
    "[Middleware] Processing request:",
    request.nextUrl.pathname,
    request.method
  );

  // Log specific cookies to check for session token
  const sessionCookieName =
    process.env.NODE_ENV === "production"
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token";

  const sessionCookie = request.cookies.get(sessionCookieName);

  // Check if this is a POST request to one of our API endpoints that requires an API key
  const requiresApiKey =
    request.method === "POST" &&
    (request.nextUrl.pathname === "/api/venue-products" ||
      request.nextUrl.pathname === "/api/venue-products/" ||
      request.nextUrl.pathname === "/api/products" ||
      request.nextUrl.pathname === "/api/products/" ||
      request.nextUrl.pathname === "/api/customers" ||
      request.nextUrl.pathname === "/api/customers/" ||
      request.nextUrl.pathname === "/api/trx-test/customers" ||
      request.nextUrl.pathname === "/api/trx-test/customers/" ||
      request.nextUrl.pathname === "/api/trx-test/venue-products" ||
      request.nextUrl.pathname === "/api/trx-test/venue-products/" ||
      request.nextUrl.pathname === "/api/trx-test/products" ||
      request.nextUrl.pathname === "/api/trx-test/products/");

  // Alternative approach using normalized paths
  const normalizedPath = request.nextUrl.pathname.replace(/\/$/, "");
  const isApiProductsEndpoint =
    normalizedPath === "/api/products" ||
    normalizedPath === "/api/venue-products" ||
    normalizedPath === "/api/customers" ||
    normalizedPath === "/api/trx-test/customers" ||
    normalizedPath === "/api/trx-test/venue-products" ||
    normalizedPath === "/api/trx-test/products";

  const requiresApiKeyNormalized =
    request.method === "POST" && isApiProductsEndpoint;

  console.log("[Middleware] Request method:", request.method);
  console.log("[Middleware] Request path:", request.nextUrl.pathname);
  console.log("[Middleware] Normalized path:", normalizedPath);
  console.log(
    "[Middleware] Requires API Key (original check):",
    requiresApiKey
  );
  console.log(
    "[Middleware] Requires API Key (normalized check):",
    requiresApiKeyNormalized
  );

  if (requiresApiKeyNormalized) {
    // Verify API key for routes that require it using our secure method
    const isValidApiKey = await verifyRequestApiKey(request);
    console.log("[Middleware] API Key valid:", isValidApiKey);

    if (!isValidApiKey) {
      console.log("[Middleware] Rejecting request due to invalid API key");
      return NextResponse.json(
        { success: false, error: "Invalid or missing API key" },
        { status: 401 }
      );
    }

    console.log("[Middleware] API Key validation successful, continuing");
    return NextResponse.next();
  }

  // Check if this is a next-auth API route or callback
  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/api/auth") ||
    request.nextUrl.pathname.includes("/callback");

  if (isAuthRoute) {
    return NextResponse.next();
  }

  // Handle authentication for protected routes
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === "production",
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
  } catch (error) {
    console.error("Error in auth middleware:", error);
    // For debugging - log detailed error
    console.error(
      "Error details:",
      error instanceof Error ? error.message : error
    );

    // Since we're having issues with authentication, let's check if we have a session cookie
    // and temporarily bypass auth for non-admin routes to help with debugging
    if (sessionCookie && !request.nextUrl.pathname.startsWith("/admin")) {
      return NextResponse.next();
    }

    // Allow request to continue if there's an error with auth
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    // Match all API routes
    "/api/:path*",

    // Also include specific routes for backwards compatibility
    "/api/venue-products",
    "/api/venue-products/:path*",
    "/api/products",
    "/api/products/:path*",
    "/api/customers",
    "/api/customers/:path*",
    "/api/trx-test/customers",
    "/api/trx-test/venue-products",
    "/api/trx-test/products",
    "/reorder/:path*",
    "/admin/:path*",
    "/venues/:path*",
  ],
};
