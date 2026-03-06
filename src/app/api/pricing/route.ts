import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { prisma } from "@/lib/prisma";

interface PricingError {
  productId: number;
  error: string;
}

type PricingFetchResult =
  | { ok: true; productId: number; data: Record<string, unknown> }
  | { ok: false; productId: number; error: string; details: string };

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
    // Parse URL parameters
    const url = new URL(request.url);
    const venueId = url.searchParams.get("venueId");
    const productId = url.searchParams.get("productId");
    const productIds = url.searchParams.get("productIds");
    const isDeadInventory = url.searchParams.get("isDeadInventory") === "true";

    // Get session to verify user is allowed to see prices
    // Allow unauthenticated requests only for dead inventory items
    const session = await getServerSession(authOptions);
    if (!session?.user && !isDeadInventory) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    let resolvedVenueId = venueId;
    if (!resolvedVenueId && session?.user?.newOrderGuideEnabled) {
      if (session.user.venues?.length === 1) {
        resolvedVenueId = String(session.user.venues[0].trxVenueId);
      } else if (session.user.defaultOrderGuideVenueId) {
        resolvedVenueId = String(session.user.defaultOrderGuideVenueId);
      }
    }

    if (!resolvedVenueId) {
      return NextResponse.json(
        { success: false, error: "Venue ID is required" },
        { status: 400 }
      );
    }

    const isRestrictedCategory = async (targetProductId: number) => {
      const product = await prisma.product.findUnique({
        where: { id: BigInt(targetProductId) },
        select: { category: true },
      });
      return (product?.category || "").trim().toLowerCase() === "equipment";
    };

    // Handle single product request
    if (productId) {
      const parsedProductId = parseInt(productId, 10);
      if (!Number.isNaN(parsedProductId)) {
        const isRestricted = await isRestrictedCategory(parsedProductId);
        if (isRestricted) {
          return NextResponse.json({
            success: true,
            productId: parsedProductId,
            price: null,
            restricted: true,
          });
        }
      }

      //the route says customerId but Joe changed it to take venueId instead.
      const pricingApiUrl = `https://customer-pricing-api.sunsofterp.com/price?customerId=${resolvedVenueId}&productId=${productId}`;

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
        } catch {
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

      const results = [];
      const errors: PricingError[] = [];
      const restrictedProductIds = new Set<number>();

      const restrictedProducts = await prisma.product.findMany({
        where: {
          id: { in: ids.map((id) => BigInt(id)) },
          category: { equals: "Equipment" },
        },
        select: { id: true },
      });
      for (const restrictedProduct of restrictedProducts) {
        restrictedProductIds.add(Number(restrictedProduct.id));
      }

      const idsToFetch = ids.filter((id) => !restrictedProductIds.has(id));
      const fetchPrice = async (
        currentProductId: number
      ): Promise<PricingFetchResult> => {
        try {
          const pricingApiUrl = `https://customer-pricing-api.sunsofterp.com/price?customerId=${resolvedVenueId}&productId=${currentProductId}`;
          const response = await fetch(pricingApiUrl, {
            method: "GET",
            headers: {
              "X-API-Key": apiKey,
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            cache: "no-store",
          });

          const responseText = await response.text();
          if (!response.ok) {
            return {
              ok: false,
              productId: currentProductId,
              error: `Failed to fetch price for product ${currentProductId}`,
              details: responseText,
            };
          }

          try {
            const data = JSON.parse(responseText);
            return { ok: true, productId: currentProductId, data };
          } catch {
            return {
              ok: false,
              productId: currentProductId,
              error: `Invalid response format for product ${currentProductId}`,
              details: responseText,
            };
          }
        } catch (error) {
          return {
            ok: false,
            productId: currentProductId,
            error: error instanceof Error ? error.message : "Unknown error",
            details: "",
          };
        }
      };

      const concurrencySteps = [10, 5, 2];
      let pendingIds = [...idsToFetch];
      const failedErrorMap = new Map<number, string>();
      const failedDetailMap = new Map<number, string>();

      for (const batchSize of concurrencySteps) {
        if (pendingIds.length === 0) {
          break;
        }

        const nextPending: number[] = [];
        let failedInStep = 0;
        for (let i = 0; i < pendingIds.length; i += batchSize) {
          const batch = pendingIds.slice(i, i + batchSize);
          const batchResults = await Promise.all(batch.map(fetchPrice));

          for (const batchResult of batchResults) {
            if (batchResult.ok) {
              results.push({ productId: batchResult.productId, ...batchResult.data });
            } else {
              failedInStep += 1;
              nextPending.push(batchResult.productId);
              failedErrorMap.set(batchResult.productId, batchResult.error);
              if (batchResult.details) {
                failedDetailMap.set(batchResult.productId, batchResult.details);
              }
            }
          }

          if (i + batchSize < pendingIds.length) {
            await new Promise((resolve) => setTimeout(resolve, 200));
          }
        }

        if (failedInStep > 0) {
          const sampleFailures = Array.from(nextPending)
            .slice(0, 3)
            .map((productId) => ({
              productId,
              details: failedDetailMap.get(productId) || failedErrorMap.get(productId),
            }));
          console.warn(
            `[pricing] step batchSize=${batchSize} failures=${failedInStep} sample=${JSON.stringify(sampleFailures)}`
          );
        }

        pendingIds = nextPending;
        if (pendingIds.length > 0) {
          await new Promise((resolve) => setTimeout(resolve, 350));
        }
      }

      for (const failedId of pendingIds) {
        errors.push({
          productId: failedId,
          error: failedErrorMap.get(failedId) || `Failed to fetch price for product ${failedId}`,
        });
      }

      for (const restrictedProductId of restrictedProductIds) {
        results.push({
          productId: restrictedProductId,
          price: null,
          restricted: true,
        });
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
