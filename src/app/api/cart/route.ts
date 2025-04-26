import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { prisma } from "@/lib/prisma";

interface CartItemRequest {
  id: string;
  quantity: number;
  venueId: string;
}

interface CartItemWithDetails {
  id: string;
  sku: string;
  title: string;
  quantity: number;
  manufacturer: string | null;
  category: string | null;
  uom: string | null;
  imageSrc: string | null;
  venueId: string;
  venueName: string;
  price: number | null;
}

interface PriceInfo {
  productId: number | string;
  price: number;
  [key: string]: any;
}

export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const trxCustomerId = parseInt(session.user.trxCustomerId as string);
    const canSeePrices = session.user.seePrices === true;

    try {
      // Get cart for the user
      const userCart = await prisma.cart.findFirst({
        where: {
          customerId: trxCustomerId,
        },
        include: {
          items: true,
        },
      });

      if (!userCart || userCart.items.length === 0) {
        // Return empty cart if not exists or is empty
        return NextResponse.json({ items: [] });
      }

      // Get product IDs from cart items
      const productIds = userCart.items.map((item) => item.productId);

      // Fetch detailed product information for all products in the cart
      const products = await prisma.product.findMany({
        where: {
          id: {
            in: productIds,
          },
        },
        include: {
          images: true,
          venueProducts: {
            include: {
              venue: true,
            },
          },
        },
      });

      // Prepare items with product details
      const cartItemsWithDetailsOrNull: (CartItemWithDetails | null)[] =
        userCart.items.map((cartItem) => {
          const product = products.find((p) => p.id === cartItem.productId);

          if (!product) {
            return null; // Skip if product not found
          }

          // Get venue information
          let venueName = "Main Catalog";
          const venueId = cartItem.venueId.toString();

          // If this is a venue-specific product, get the venue name
          if (venueId !== "0") {
            const venueProduct = product.venueProducts.find(
              (vp) => vp.venue.trxVenueId === cartItem.venueId
            );
            if (venueProduct) {
              venueName = venueProduct.venue.venueName;
            }
          }

          // Get the first image URL if available
          const imageSrc =
            product.images.length > 0 ? product.images[0].url : null;

          // Return cart item with product details (without pricing yet)
          return {
            id: product.id.toString(),
            sku: product.sku,
            title: product.title,
            quantity: cartItem.quantity,
            manufacturer: product.manufacturer,
            category: product.category,
            uom: product.uom,
            imageSrc,
            venueId,
            venueName,
            price: null, // Will be populated from pricing API
          };
        });

      // Filter out null items
      const cartItemsWithDetails: CartItemWithDetails[] =
        cartItemsWithDetailsOrNull.filter(Boolean) as CartItemWithDetails[];

      // If user can see prices, fetch pricing data
      if (canSeePrices && cartItemsWithDetails.length > 0) {
        try {
          // Group items by venue for batch processing
          const itemsByVenue: { [venueId: string]: CartItemWithDetails[] } = {};

          cartItemsWithDetails.forEach((item) => {
            // Skip items from the regular catalog (venue "0") as they need a quote
            if (item.venueId === "0") {
              return;
            }

            const venueId = item.venueId;
            if (!itemsByVenue[venueId]) {
              itemsByVenue[venueId] = [];
            }
            itemsByVenue[venueId].push(item);
          });

          // Process each venue's items separately (skip empty venues)
          for (const [venueId, items] of Object.entries(itemsByVenue)) {
            if (items.length === 0) continue;

            // Split into batches to avoid overwhelming the pricing API
            const batchSize = 5;
            const batches = [];

            for (let i = 0; i < items.length; i += batchSize) {
              batches.push(items.slice(i, i + batchSize));
            }

            // Process each batch
            for (const batch of batches) {
              const productIds = batch.map((item) => item.id).join(",");

              try {
                // Get auth cookie to pass along to the pricing API
                const sessionCookie = request.headers.get("cookie");

                const pricingResponse = await fetch(
                  `${request.nextUrl.origin}/api/pricing?venueId=${venueId}&productIds=${productIds}`,
                  {
                    method: "GET",
                    headers: {
                      "Content-Type": "application/json",
                      Cookie: sessionCookie || "", // Forward the session cookie
                    },
                    cache: "no-store",
                    credentials: "include", // Include credentials in the request
                  }
                );

                if (pricingResponse.ok) {
                  const pricingData = await pricingResponse.json();

                  if (pricingData.success && pricingData.prices) {
                    // Apply prices to cart items
                    pricingData.prices.forEach((priceInfo: PriceInfo) => {
                      if (
                        priceInfo &&
                        priceInfo.productId &&
                        priceInfo.price !== undefined
                      ) {
                        // Find the item in the cartItemsWithDetails array
                        const item = cartItemsWithDetails.find(
                          (item) =>
                            item.id.toString() ===
                            priceInfo.productId.toString()
                        );

                        if (item) {
                          item.price = priceInfo.price;
                        }
                      }
                    });
                  } else {
                    console.error(
                      `Pricing API error for venue ${venueId}:`,
                      pricingData.error || "Unknown pricing error"
                    );
                  }
                } else {
                  console.error(
                    `Failed to fetch pricing data for venue ${venueId}:`,
                    pricingResponse.statusText
                  );
                }

                // Add a small delay between batches to prevent overwhelming the database
                await new Promise((resolve) => setTimeout(resolve, 500));
              } catch (err) {
                console.error(
                  `Error fetching prices for batch in venue ${venueId}:`,
                  err
                );
                // Continue with next batch even if this one fails
              }
            }
          }
        } catch (pricingError) {
          console.error("Error fetching pricing data:", pricingError);
          // Continue without prices if there's an error
        }
      }

      return NextResponse.json({ items: cartItemsWithDetails });
    } catch (error) {
      console.error("Database error:", error);
      return NextResponse.json({ items: [] });
    }
  } catch (error) {
    console.error("Error retrieving cart:", error);
    return NextResponse.json(
      { error: "Failed to retrieve cart" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const trxCustomerId = parseInt(session.user.trxCustomerId as string);
    const { items } = (await request.json()) as { items: CartItemRequest[] };

    try {
      // Get or create cart for the user
      let userCart = await prisma.cart.findFirst({
        where: {
          customerId: trxCustomerId,
        },
      });

      if (!userCart) {
        userCart = await prisma.cart.create({
          data: {
            customerId: trxCustomerId,
          },
        });
      }

      // Clear existing items
      await prisma.cartItem.deleteMany({
        where: {
          cartId: userCart.id,
        },
      });

      // Add new items
      if (items.length > 0) {
        // Validate and prepare items for insertion
        const validItems = items
          .map((item) => {
            // Ensure venueId is valid
            let venueId = parseInt(item.venueId || "0");
            if (isNaN(venueId)) venueId = 0;

            // Convert product ID to BigInt, defaulting to 0 if invalid
            let productId;
            try {
              productId = BigInt(item.id);
            } catch (e) {
              console.error("Invalid product ID:", item.id);
              return null;
            }

            // Ensure quantity is valid
            let quantity = item.quantity;
            if (isNaN(quantity) || quantity <= 0) quantity = 1;

            return {
              cartId: userCart!.id,
              productId,
              quantity,
              venueId,
            };
          })
          .filter(Boolean);

        if (validItems.length > 0) {
          await prisma.cartItem.createMany({
            // @ts-expect-error - TypeScript doesn't handle the null filtering well
            data: validItems,
          });
        }
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Database operation failed" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error saving cart:", error);
    return NextResponse.json({ error: "Failed to save cart" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const trxCustomerId = parseInt(session.user.trxCustomerId as string);

    try {
      // Find user's cart
      const userCart = await prisma.cart.findFirst({
        where: {
          customerId: trxCustomerId,
        },
      });

      if (userCart) {
        // Delete all cart items
        await prisma.cartItem.deleteMany({
          where: {
            cartId: userCart.id,
          },
        });
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to clear cart in database" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error clearing cart:", error);
    return NextResponse.json(
      { error: "Failed to clear cart" },
      { status: 500 }
    );
  }
}
