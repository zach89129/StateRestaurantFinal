import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";

export async function GET(request: Request) {
  const apiKey = process.env.PRICING_API_KEY;

  if (!apiKey) {
    console.error("API key is not set in environment variables");
    return NextResponse.json(
      { success: false, error: "API key is not set" },
      { status: 500 }
    );
  }

  try {
    // Get session to verify user is allowed to see prices
    const session = await getServerSession(authOptions);
    if (!session?.user?.isSuperuser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Superuser required" },
        { status: 401 }
      );
    }

    // Log information about the request and API key
    console.log("Testing pricing API connection");
    console.log("API Key length:", apiKey.length);
    console.log("API Key first 4 chars:", apiKey.substring(0, 4));

    // Test a request to the external pricing API
    try {
      // Use a test customerId and productId
      const testCustomerId = "123456"; // Replace with a valid test ID
      const testProductId = "123456"; // Replace with a valid test ID

      // Clean up API key in case there are whitespace issues
      const trimmedApiKey = apiKey.trim();

      console.log("API Key after trim (length):", trimmedApiKey.length);

      const pricingApiUrl = `https://customer-pricing-api.sunsofterp.com/price?customerId=${testCustomerId}&productId=${testProductId}`;
      console.log("Making test request to:", pricingApiUrl);

      // Try method 1: X-API-Key header
      console.log("Testing with X-API-Key header...");
      const response1 = await fetch(pricingApiUrl, {
        method: "GET",
        headers: {
          "X-API-Key": trimmedApiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        cache: "no-store",
      });

      const status1 = response1.status;
      const text1 = await response1.text();

      // Try method 2: Authorization Bearer header
      console.log("Testing with Authorization Bearer header...");
      const response2 = await fetch(pricingApiUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${trimmedApiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        cache: "no-store",
      });

      const status2 = response2.status;
      const text2 = await response2.text();

      // Try method 3: Both headers
      console.log("Testing with both headers...");
      const response3 = await fetch(pricingApiUrl, {
        method: "GET",
        headers: {
          "X-API-Key": trimmedApiKey,
          Authorization: `Bearer ${trimmedApiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        cache: "no-store",
      });

      const status3 = response3.status;
      const text3 = await response3.text();

      console.log("Response 1 status:", status1);
      console.log("Response 2 status:", status2);
      console.log("Response 3 status:", status3);

      // Return the test results
      return NextResponse.json({
        success: true,
        test_results: {
          method1_x_api_key: {
            status: status1,
            body: text1,
          },
          method2_bearer: {
            status: status2,
            body: text2,
          },
          method3_both: {
            status: status3,
            body: text3,
          },
          headers_info: {
            "X-API-Key":
              "****" +
              (trimmedApiKey.length > 4 ? trimmedApiKey.substring(4, 8) : ""),
            keyLength: trimmedApiKey.length,
          },
        },
      });
    } catch (error) {
      console.error("Test request error:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Error making test request",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error processing test request:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
