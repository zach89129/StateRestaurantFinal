import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

interface DeleteProductsFromVenueBody {
  trx_venue_id: number;
  trx_product_ids: number[];
}

export async function DELETE(request: NextRequest) {
  try {
    const body = (await request.json()) as DeleteProductsFromVenueBody;

    if (
      !body.trx_venue_id ||
      !body.trx_product_ids ||
      !Array.isArray(body.trx_product_ids)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid request format. Expected trx_venue_id and array of trx_product_ids",
        },
        { status: 400 }
      );
    }

    const venue = await prisma.venue.findUnique({
      where: { trxVenueId: body.trx_venue_id },
      include: {
        venueProduct: true,
      },
    });

    if (!venue || !venue.venueProduct) {
      return NextResponse.json(
        { success: false, error: "Venue or venue products not found" },
        { status: 404 }
      );
    }

    const productIds = body.trx_product_ids.map((id: number) => BigInt(id));

    const updatedVenue = await prisma.venue.update({
      where: { trxVenueId: body.trx_venue_id },
      data: {
        venueProduct: {
          update: {
            products: {
              disconnect: productIds.map((id: bigint) => ({ id })),
            },
          },
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

    const formattedVenue = {
      ...updatedVenue,
      venueProduct: updatedVenue.venueProduct
        ? {
            ...updatedVenue.venueProduct,
            products: updatedVenue.venueProduct.products.map((product) => ({
              ...product,
              id: Number(product.id),
            })),
          }
        : null,
    };

    return NextResponse.json({
      success: true,
      venue: formattedVenue,
    });
  } catch (error) {
    console.error("Error removing products from venue:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
