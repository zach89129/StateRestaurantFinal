import { prisma } from "@/lib/prisma";
import { VenueProductInput, VenueProductData } from "@/types/api";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { convertBigIntToString } from "@/utils/convertBigIntToString";

export async function POST(request: Request) {
  if (!request.body) {
    return NextResponse.json(
      { success: false, error: "Missing request body" },
      { status: 400 }
    );
  }

  try {
    const body: VenueProductInput = await request.json();

    if (!body.venue_products || !Array.isArray(body.venue_products)) {
      return NextResponse.json(
        { success: false, error: "Invalid venue_products format" },
        { status: 400 }
      );
    }

    const venueProducts: VenueProductData[] = body.venue_products;
    const results = [];
    const errors = [];

    // Process venues in batches of 5 to avoid overwhelming the database
    const batchSize = 5;
    for (let i = 0; i < venueProducts.length; i += batchSize) {
      const batch = venueProducts.slice(i, i + batchSize);

      try {
        // Use a transaction for each batch to ensure consistency
        const batchResults = await prisma.$transaction(async (tx) => {
          const batchResults = [];

          for (const vp of batch) {
            try {
              // First check if venue exists
              const existingVenue = await tx.venue.findUnique({
                where: { trxVenueId: vp.trx_venue_id },
                include: {
                  venueProduct: {
                    include: {
                      products: true,
                    },
                  },
                },
              });

              let venue;
              if (existingVenue) {
                // Update existing venue
                venue = await tx.venue.update({
                  where: { trxVenueId: vp.trx_venue_id },
                  data: {
                    ...(vp.venueName && { venueName: vp.venueName }),
                    venueProduct: {
                      upsert: {
                        create: {
                          products: {
                            connect: vp.products.map((id: number) => ({
                              id: BigInt(id),
                            })),
                          },
                        },
                        update: {
                          products: {
                            set: vp.products.map((id: number) => ({
                              id: BigInt(id),
                            })),
                          },
                        },
                      },
                    },
                  },
                  include: {
                    venueProduct: {
                      include: {
                        products: true,
                      },
                    },
                  },
                });
              } else {
                // Create new venue
                venue = await tx.venue.create({
                  data: {
                    trxVenueId: vp.trx_venue_id,
                    venueName: vp.venueName || `Venue ${vp.trx_venue_id}`,
                    venueProduct: {
                      create: {
                        products: {
                          connect: vp.products.map((id: number) => ({
                            id: BigInt(id),
                          })),
                        },
                      },
                    },
                  },
                  include: {
                    venueProduct: {
                      include: {
                        products: true,
                      },
                    },
                  },
                });
              }

              batchResults.push({
                trx_venue_id: venue.trxVenueId,
                venueName: venue.venueName,
                products: venue.venueProduct
                  ? venue.venueProduct.products.map((product) =>
                      String(product.id)
                    )
                  : [],
              });
            } catch (err) {
              errors.push({
                venue_id: vp.trx_venue_id,
                error: err instanceof Error ? err.message : "Unknown error",
              });
            }
          }

          return batchResults;
        });

        results.push(...batchResults);
      } catch (batchError) {
        console.error("Error processing batch:", batchError);
        errors.push({
          batch: i,
          error:
            batchError instanceof Error
              ? batchError.message
              : "Unknown batch error",
        });
      }
    }

    // Convert any remaining BigInt values to strings
    const safeResults = convertBigIntToString(results);
    console.log(safeResults, errors);
    return NextResponse.json({
      success: true,
      venueProducts: safeResults,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const venueId = searchParams.get("trx_venue_id");

    if (!venueId) {
      return NextResponse.json(
        { success: false, error: "Missing trx_venue_id parameter" },
        { status: 400 }
      );
    }

    try {
      const venue = await prisma.venue.findUnique({
        where: { trxVenueId: parseInt(venueId) },
        include: {
          venueProduct: {
            include: {
              products: {
                include: {
                  images: true,
                },
              },
            },
          },
        },
      });

      if (!venue) {
        return NextResponse.json(
          { success: false, error: "Venue not found" },
          { status: 404 }
        );
      }

      const customer = await prisma.customer.findFirst({
        where: {
          email: session.user.email,
          venues: {
            some: {
              trxVenueId: parseInt(venueId),
            },
          },
        },
      });

      if (!customer) {
        return NextResponse.json(
          { success: false, error: "Not authorized to view this venue" },
          { status: 403 }
        );
      }

      const products =
        venue.venueProduct?.products.map((product) => ({
          ...product,
          id: Number(product.id),
          images: product.images.map((img) => ({ src: img.url })),
        })) || [];

      return NextResponse.json({
        success: true,
        trxVenueId: venue.trxVenueId,
        venueName: venue.venueName,
        products: products,
      });
    } catch (error) {
      console.error("Error fetching venue products:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Internal Server Error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error fetching venue products:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.trx_venue_ids || !Array.isArray(body.trx_venue_ids)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request format. Expected array of trx_venue_ids",
        },
        { status: 400 }
      );
    }

    await prisma.venueProduct.deleteMany({
      where: {
        venue: {
          trxVenueId: {
            in: body.trx_venue_ids,
          },
        },
      },
    });

    const result = await prisma.venue.deleteMany({
      where: {
        trxVenueId: {
          in: body.trx_venue_ids,
        },
      },
    });

    return NextResponse.json({
      success: true,
      deleted: result.count,
    });
  } catch (error) {
    console.error("Error deleting venues:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
