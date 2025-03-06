import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";

interface RouteParams {
  params: Promise<{
    id: string;
    venueId: string;
  }>;
}

export async function DELETE(request: Request, context: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !session.user.isSuperuser) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const params = await context.params;
    const productId = BigInt(params.id);
    const venueId = parseInt(params.venueId);

    if (!productId || isNaN(venueId)) {
      return new NextResponse(JSON.stringify({ error: "Invalid ID" }), {
        status: 400,
      });
    }

    // Find the venue and its associated products
    const venue = await prisma.venue.findUnique({
      where: { trxVenueId: venueId },
      include: {
        venueProduct: {
          include: {
            products: true,
          },
        },
      },
    });

    if (!venue || !venue.venueProduct) {
      return new NextResponse(
        JSON.stringify({ error: "Venue or venue product not found" }),
        {
          status: 404,
        }
      );
    }

    // Check if the product is associated with this venue
    const isProductAssociated = venue.venueProduct.products.some(
      (p) => p.id === productId
    );

    if (!isProductAssociated) {
      return new NextResponse(
        JSON.stringify({ error: "Product not associated with this venue" }),
        { status: 404 }
      );
    }

    // Remove the product from the venue's products
    await prisma.venueProduct.update({
      where: { id: venue.venueProduct.id },
      data: {
        products: {
          disconnect: { id: productId },
        },
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error removing product from venue:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
      }
    );
  }
}
