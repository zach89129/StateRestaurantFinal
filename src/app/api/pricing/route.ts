import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";

interface PricingSingleRequest {
  customerId: number;
  productId: number;
}

interface PricingBatchRequest {
  customerId: number;
  productIds: number[];
}

interface PricingError {
  productId: number;
  error: string;
}

export async function GET(request: Request) {
  const apiKey = process.env.PRICING_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "API key is not set" },
      { status: 500 }
    );
  }

  try {
    // Get session to verify user is allowed to see prices
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse URL parameters
    const url = new URL(request.url);
    const customerId = url.searchParams.get("customerId");
    const productId = url.searchParams.get("productId");
    const productIds = url.searchParams.get("productIds");

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: "Customer ID is required" },
        { status: 400 }
      );
    }

    // Handle single product request
    if (productId) {
      const response = await fetch(
        `https://customer-pricing-api.sunsofterp.com/price?customerId=${customerId}&productId=${productId}`,
        {
          headers: {
            "X-API-Key": apiKey,
          },
        }
      );

      if (!response.ok) {
        return NextResponse.json(
          { success: false, error: "Failed to fetch pricing data" },
          { status: response.status }
        );
      }

      const data = await response.json();
      return NextResponse.json({ success: true, ...data });
    }
    // Handle batch product request
    else if (productIds) {
      const ids = productIds.split(",").map((id) => parseInt(id.trim()));

      if (ids.length === 0) {
        return NextResponse.json(
          { success: false, error: "No valid product IDs provided" },
          { status: 400 }
        );
      }

      // Process requests in batches of maximum 10 at a time
      const batchSize = 10;
      const results = [];
      const errors: PricingError[] = [];

      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);
        const promises = batch.map(async (productId) => {
          try {
            const response = await fetch(
              `https://customer-pricing-api.sunsofterp.com/price?customerId=${customerId}&productId=${productId}`,
              {
                headers: {
                  "X-API-Key": apiKey,
                },
              }
            );

            if (!response.ok) {
              throw new Error(`Failed to fetch price for product ${productId}`);
            }

            const data = await response.json();
            return { productId, ...data };
          } catch (error) {
            errors.push({
              productId,
              error: error instanceof Error ? error.message : "Unknown error",
            });
            return null;
          }
        });

        const batchResults = await Promise.all(promises);
        results.push(...batchResults.filter((r) => r !== null));

        // Add a small delay between batches to avoid rate limiting
        if (i + batchSize < ids.length) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      return NextResponse.json({
        success: true,
        prices: results,
        errors: errors.length > 0 ? errors : undefined,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Either productId or productIds parameter is required",
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error processing pricing request:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
