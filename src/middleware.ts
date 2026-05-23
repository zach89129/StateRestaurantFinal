import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { hashApiKey } from "@/lib/api-auth";
import { isSuperuserEmail } from "@/lib/superuser";

async function verifyRequestApiKey(request: NextRequest): Promise<boolean> {
  try {
    const storedHash = process.env.API_KEY_HASH;

    if (!storedHash) {
      console.error("API_KEY_HASH is not set in environment variables");
      return false;
    }

    const requestApiKey = request.headers.get("x-api-key");

    if (!requestApiKey) {
      return false;
    }

    const cleanRequestApiKey = requestApiKey
      .trim()
      .replace(/^["'](.*)["']$/, "$1");

    const hashedRequestKey = await hashApiKey(cleanRequestApiKey);
    return hashedRequestKey === storedHash;
  } catch (error) {
    console.error(
      "[Middleware] Unexpected error in API key verification:",
      error,
    );
    return false;
  }
}

const INTEGRATION_PATHS = new Set([
  "/api/products",
  "/api/customers",
  "/api/venue-products",
  "/api/trx-test/customers",
  "/api/trx-test/venue-products",
  "/api/trx-test/products",
  "/api/orders/update",
]);

export async function middleware(request: NextRequest) {
  const normalizedPath = request.nextUrl.pathname.replace(/\/$/, "");

  if (
    process.env.NODE_ENV === "production" &&
    normalizedPath.startsWith("/api/trx-test")
  ) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isIntegrationPath = INTEGRATION_PATHS.has(normalizedPath);
  const isGetOrdersNewEndpoint =
    request.method === "GET" && normalizedPath === "/api/orders/new";
  const isGetCustomersEndpoint =
    request.method === "GET" && normalizedPath === "/api/customers";

  const requiresApiKey =
    isGetOrdersNewEndpoint ||
    isGetCustomersEndpoint ||
    ((request.method === "POST" || request.method === "DELETE") &&
      isIntegrationPath);

  if (requiresApiKey) {
    const isValidApiKey = await verifyRequestApiKey(request);

    if (!isValidApiKey) {
      return NextResponse.json(
        { success: false, error: "Invalid or missing API key" },
        { status: 401 },
      );
    }

    return NextResponse.next();
  }

  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/api/auth") ||
    request.nextUrl.pathname.includes("/callback");

  if (isAuthRoute) {
    return NextResponse.next();
  }

  const isProtectedRoute =
    request.nextUrl.pathname.startsWith("/reorder") ||
    request.nextUrl.pathname.startsWith("/venues") ||
    request.nextUrl.pathname.startsWith("/new-order-guide") ||
    (request.nextUrl.pathname.startsWith("/api/venue-products") &&
      request.method === "GET");

  const isAdminPath = request.nextUrl.pathname.startsWith("/admin");
  const isApiRoute = request.nextUrl.pathname.startsWith("/api/");

  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === "production",
    });

    if (isProtectedRoute && !token) {
      const url = new URL("/login", request.url);
      url.searchParams.set("callbackUrl", request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    if (isAdminPath) {
      if (!token) {
        return NextResponse.redirect(new URL("/login", request.url));
      }

      const tokenEmail = typeof token.email === "string" ? token.email : "";
      if (!isSuperuserEmail(tokenEmail)) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Error in auth middleware:", error);

    if (isAdminPath || isProtectedRoute) {
      if (isApiRoute) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/api/:path*",
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
    "/new-order-guide/:path*",
    "/admin/:path*",
    "/venues/:path*",
  ],
};
