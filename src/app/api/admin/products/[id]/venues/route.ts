import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: Request, context: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !session.user.isSuperuser) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const params = await context.params;
    const productId = BigInt(params.id);
    if (!productId) {
      return new NextResponse(JSON.stringify({ error: "Invalid product ID" }), {
        status: 400,
      });
    }

    const body = await request.json();
    const { venueId } = body;

    if (typeof venueId !== "number") {
      return new NextResponse(JSON.stringify({ error: "Invalid venue ID" }), {
        status: 400,
      });
    }

    // Check if venue exists
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

    if (!venue) {
      return new NextResponse(JSON.stringify({ error: "Venue not found" }), {
        status: 404,
      });
    }

    // If venue doesn't have a venueProduct record, create one
    let venueProduct = venue.venueProduct;
    if (!venueProduct) {
      // First create the VenueProduct with required fields
      venueProduct = await prisma.venueProduct.create({
        data: {
          trxVenueId: venue.trxVenueId,
          products: {
            create: [],
          },
        },
        include: {
          products: true,
        },
      });
    }

    // Add product to venue
    const updatedVenueProduct = await prisma.venueProduct.update({
      where: { id: venueProduct.id },
      data: {
        products: {
          connect: { id: productId },
        },
      },
      include: {
        products: true,
      },
    });

    return new NextResponse(
      JSON.stringify({ venueProduct: updatedVenueProduct })
    );
  } catch (error) {
    console.error("Error adding product to venue:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}

export async function GET(request: Request, context: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !session.user.isSuperuser) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const params = await context.params;
    const productId = BigInt(params.id);
    if (!productId) {
      return new NextResponse(JSON.stringify({ error: "Invalid product ID" }), {
        status: 400,
      });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        venueProducts: {
          include: {
            venue: true,
          },
        },
      },
    });

    if (!product) {
      return new NextResponse(JSON.stringify({ error: "Product not found" }), {
        status: 404,
      });
    }

    return new NextResponse(
      JSON.stringify({ venueProducts: product.venueProducts }),
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error fetching venue products:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}
