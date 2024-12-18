import { prisma } from "@/lib/prisma";
import { VenueProductInput, VenueProductData } from "@/types/api";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";

export async function POST(request: Request) {
  if (!request.body) {
    return NextResponse.json(
      { success: false, error: "Missing request body" },
      { status: 400 }
    );
  }

  try {
    const body: VenueProductInput = await request.json();
    console.log("Received body:", body);

    if (!body.venue_products || !Array.isArray(body.venue_products)) {
      return NextResponse.json(
        { success: false, error: "Invalid venue_products format" },
        { status: 400 }
      );
    }

    const venueProducts: VenueProductData[] = body.venue_products;
    const results = [];
    const errors = [];

    for (const vp of venueProducts) {
      try {
        const existingVenue = await prisma.venue.findUnique({
          where: { trxVenueId: vp.trx_venue_id },
          include: {
            venueProduct: {
              include: {
                products: true,
              },
            },
          },
        });

        if (existingVenue) {
          // Update existing venue by adding new products
          const venue = await prisma.venue.update({
            where: { trxVenueId: vp.trx_venue_id },
            data: {
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
                      connect: vp.products.map((id: number) => ({
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

          const formattedVenue = {
            ...venue,
            venueProduct: venue.venueProduct
              ? {
                  ...venue.venueProduct,
                  products: venue.venueProduct.products.map((product) => ({
                    ...product,
                    id: Number(product.id),
                  })),
                }
              : null,
          };

          results.push(formattedVenue);
        } else {
          // Create new venue with products
          const venue = await prisma.venue.create({
            data: {
              trxVenueId: vp.trx_venue_id,
              venueName: `Venue ${vp.trx_venue_id}`,
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

          const formattedVenue = {
            ...venue,
            venueProduct: venue.venueProduct
              ? {
                  ...venue.venueProduct,
                  products: venue.venueProduct.products.map((product) => ({
                    ...product,
                    id: Number(product.id),
                  })),
                }
              : null,
          };

          results.push(formattedVenue);
        }
      } catch (err) {
        errors.push({
          venue_id: vp.trx_venue_id,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      errors: errors.length > 0 ? errors : undefined,
      results,
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
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
              products: true,
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
          imageSrc: product.imageSrc || null,
        })) || [];

      console.log("Product with image:", products[0]);

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
    console.log("Received body:", body);

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
