import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";

export async function GET(request: Request) {
  try {
    // Get session to verify user is allowed to run this test
    const session = await getServerSession(authOptions);
    if (!session?.user?.isSuperuser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Superuser required" },
        { status: 401 }
      );
    }

    // Get all environment variables (safely)
    const envVars = {
      NODE_ENV: process.env.NODE_ENV || "not set",
      NEXTAUTH_URL: process.env.NEXTAUTH_URL ? "set (hidden)" : "not set",
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "set (hidden)" : "not set",
      DATABASE_URL: process.env.DATABASE_URL ? "set (hidden)" : "not set",
      PRICING_API_KEY: process.env.PRICING_API_KEY
        ? `set (length: ${process.env.PRICING_API_KEY.length})`
        : "not set",
      // Add any other environment variables you want to check
    };

    // Check for PRICING_API_KEY specifically
    let apiKeyInfo = null;
    const apiKey = process.env.PRICING_API_KEY;
    if (apiKey) {
      apiKeyInfo = {
        length: apiKey.length,
        firstFour: apiKey.substring(0, 4),
        lastFour: apiKey.substring(apiKey.length - 4),
        containsSpaces: apiKey.includes(" "),
        containsNewlines: apiKey.includes("\n"),
        base64Valid: isBase64(apiKey),
      };
    }

    return NextResponse.json({
      success: true,
      environment: process.env.NODE_ENV,
      environmentVariables: envVars,
      apiKeyInfo,
    });
  } catch (error) {
    console.error("Error in env test:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check environment variables",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// Utility function to check if a string is valid base64
function isBase64(str: string) {
  try {
    // Try to decode and encode back
    const decoded = Buffer.from(str, "base64").toString("base64");
    return decoded === str;
  } catch {
    return false;
  }
}
