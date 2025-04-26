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
  // Get API key from environment variables
  let apiKey = process.env.PRICING_API_KEY;

  if (!apiKey) {
    console.error("API key is not set in environment variables");
    return NextResponse.json(
      { success: false, error: "API key is not set" },
      { status: 500 }
    );
  }

  // Clean up API key in case there are whitespace issues from environment variables
  apiKey = apiKey.trim();

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
    const venueId = url.searchParams.get("venueId");
    const productId = url.searchParams.get("productId");
    const productIds = url.searchParams.get("productIds");

    if (!venueId) {
      return NextResponse.json(
        { success: false, error: "Venue ID is required" },
        { status: 400 }
      );
    }

    // Handle single product request
    if (productId) {
      //the route says customerId but Joe changed it to take venueId instead.
      const pricingApiUrl = `https://customer-pricing-api.sunsofterp.com/price?customerId=${venueId}&productId=${productId}`;

      try {
        const response = await fetch(pricingApiUrl, {
          method: "GET",
          headers: {
            "X-API-Key": apiKey,
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${apiKey}`, // Try alternative auth method
          },
          cache: "no-store",
        });

        const responseText = await response.text();

        if (!response.ok) {
          return NextResponse.json(
            {
              success: false,
              error: `Failed to fetch pricing data: ${response.statusText}`,
              details: responseText,
            },
            { status: response.status }
          );
        }

        let data;
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          return NextResponse.json(
            {
              success: false,
              error: "Invalid JSON response from pricing API",
              details: responseText,
            },
            { status: 500 }
          );
        }

        return NextResponse.json({ success: true, ...data });
      } catch (error) {
        console.error(`Error fetching price for product ${productId}:`, error);
        return NextResponse.json(
          {
            success: false,
            error: `Error fetching price: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          },
          { status: 500 }
        );
      }
    }
    // Handle batch product request
    else if (productIds) {
      const ids = productIds
        .split(",")
        .map((id) => parseInt(id.trim()))
        .filter((id) => !isNaN(id));

      if (ids.length === 0) {
        return NextResponse.json(
          { success: false, error: "No valid product IDs provided" },
          { status: 400 }
        );
      }

      // Process requests in batches of maximum 5 at a time to avoid timeouts
      const batchSize = 5;
      const results = [];
      const errors: PricingError[] = [];

      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);

        const promises = batch.map(async (productId) => {
          try {
            //the route says customerId but Joe changed it to take venueId instead.
            const pricingApiUrl = `https://customer-pricing-api.sunsofterp.com/price?customerId=${venueId}&productId=${productId}`;
            const response = await fetch(pricingApiUrl, {
              method: "GET",
              headers: {
                "X-API-Key": apiKey,
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${apiKey}`, // Try alternative auth method
              },
              cache: "no-store",
            });

            const responseText = await response.text();

            if (!response.ok) {
              console.error(
                `Error response for product ${productId}: ${responseText}`
              );
              errors.push({
                productId,
                error: `Failed to fetch price for product ${productId}`,
              });
              return null;
            }

            let data;
            try {
              data = JSON.parse(responseText);
              return { productId, ...data };
            } catch (e) {
              console.error(
                `Invalid JSON response for product ${productId}: ${responseText}`
              );
              errors.push({
                productId,
                error: `Invalid response format for product ${productId}`,
              });
              return null;
            }
          } catch (error) {
            console.error(
              `Error fetching price for product ${productId}:`,
              error
            );
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
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
