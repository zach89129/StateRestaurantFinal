import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
// import { verifyApiKey } from "@/lib/api-auth";

export async function middleware(request: NextRequest) {
  console.log("Middleware running for path:", request.nextUrl.pathname);
  console.log("Cookies received:", request.cookies.toString());
  console.log("Request URL:", request.url);

  // Log specific cookies to check for session token
  const sessionCookie =
    request.cookies.get("__Secure-next-auth.session-token") ||
    request.cookies.get("next-auth.session-token");

  console.log("Session cookie found:", sessionCookie ? "Yes" : "No");
  if (sessionCookie) {
    console.log("Session cookie name:", sessionCookie.name);
  }

  // Check if this is a POST request to one of our API endpoints that requires an API key
  const requiresApiKey =
    request.method === "POST" &&
    (request.nextUrl.pathname === "/api/venue-products" ||
      request.nextUrl.pathname === "/api/products" ||
      request.nextUrl.pathname === "/api/customers");

  if (requiresApiKey) {
    return NextResponse.next();
  }

  // Check if this is a next-auth API route or callback
  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/api/auth") ||
    request.nextUrl.pathname.includes("/callback");

  if (isAuthRoute) {
    console.log(
      "Auth route detected, bypassing auth check:",
      request.nextUrl.pathname
    );
    return NextResponse.next();
  }

  // Handle authentication for protected routes
  console.log("Getting token for path:", request.nextUrl.pathname);
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: true,
    });

    console.log("Token found:", token ? "Yes" : "No");
    if (token) {
      console.log("User email:", token.email);
    }

    // Check if trying to access protected routes
    const isProtectedRoute =
      request.nextUrl.pathname.startsWith("/reorder") ||
      request.nextUrl.pathname.startsWith("/venues") ||
      (request.nextUrl.pathname.startsWith("/api/venue-products") &&
        request.method === "GET");

    if (isProtectedRoute && !token) {
      console.log(
        "Redirecting to login, no token found for protected route:",
        request.nextUrl.pathname
      );
      const url = new URL("/login", request.url);
      url.searchParams.set("callbackUrl", request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    // Check if trying to access admin routes
    const isAdminPath = request.nextUrl.pathname.startsWith("/admin");
    if (isAdminPath) {
      if (!token) {
        console.log(
          "Redirecting to login, no token found for admin route:",
          request.nextUrl.pathname
        );
        return NextResponse.redirect(new URL("/login", request.url));
      }

      if (token.email !== process.env.SUPERUSER_ACCT) {
        console.log("Redirecting to home, not a superuser:", token.email);
        return NextResponse.redirect(new URL("/", request.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Error in auth middleware:", error);
    // Allow request to continue if there's an error with auth
    return NextResponse.next();
  }
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
