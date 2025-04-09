import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { convertBigIntToString } from "@/utils/convertBigIntToString";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids = [] } = body;

    // Validate that ids is an array
    if (!Array.isArray(ids)) {
      return NextResponse.json(
        { error: "Invalid request format. Expected 'ids' to be an array." },
        { status: 400 }
      );
    }

    let venueProducts;

    // If ids array is empty, return all venue products
    if (ids.length === 0) {
      venueProducts = await prisma.venue.findMany({
        include: {
          venueProduct: {
            include: {
              products: {
                select: {
                  id: true,
                  sku: true,
                  title: true,
                  description: true,
                  manufacturer: true,
                  category: true,
                  uom: true,
                  qtyAvailable: true,
                  aqcat: true,
                  pattern: true,
                  quickship: true,
                  images: {
                    select: {
                      url: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Format the response with a simplified structure
      venueProducts = venueProducts.map((venue) => ({
        trx_venue_id: venue.trxVenueId,
        venueName: venue.venueName,
        products:
          venue.venueProduct?.products.map((product) => {
            // Create a new object with all properties except id
            const { id, ...rest } = product;
            return {
              // Convert all BigInt values to strings
              trx_product_id: String(id),
              ...rest,
            };
          }) || [],
      }));
    } else {
      // Convert all ids to numbers
      const venueIds = ids.map((id) => Number(id));

      // Return only the venue products with the specified venue ids
      venueProducts = await prisma.venue.findMany({
        where: {
          trxVenueId: {
            in: venueIds,
          },
        },
        include: {
          venueProduct: {
            include: {
              products: {
                select: {
                  id: true,
                  sku: true,
                  title: true,
                  description: true,
                  manufacturer: true,
                  category: true,
                  uom: true,
                  qtyAvailable: true,
                  aqcat: true,
                  pattern: true,
                  quickship: true,
                  images: {
                    select: {
                      url: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Format the response with a simplified structure
      venueProducts = venueProducts.map((venue) => ({
        trx_venue_id: venue.trxVenueId,
        venueName: venue.venueName,
        products:
          venue.venueProduct?.products.map((product) => {
            // Create a new object with all properties except id
            const { id, ...rest } = product;
            return {
              // Convert all BigInt values to strings
              trx_product_id: String(id),
              ...rest,
            };
          }) || [],
      }));
    }

    // Convert any remaining BigInt values to strings
    const safeVenueProducts = convertBigIntToString(venueProducts);

    return NextResponse.json({
      success: true,
      venueProducts: safeVenueProducts,
    });
  } catch (error) {
    console.error("Error fetching venue products:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
