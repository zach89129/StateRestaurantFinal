import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../auth/[...nextauth]/auth-options";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: NextRequest, context: RouteParams) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    if (!session?.user?.isSuperuser) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }

    const data = await request.json();
    const params = await context.params;
    const venue = await prisma.venue.findUnique({
      where: { trxVenueId: Number(params.id) },
    });

    if (!venue) {
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    }

    // Create or update venue product
    const venueProduct = await prisma.venueProduct.upsert({
      where: {
        trxVenueId: venue.trxVenueId,
      },
      create: {
        trxVenueId: venue.trxVenueId,
        products: {
          connect: {
            id: BigInt(data.productId),
          },
        },
      },
      update: {
        products: {
          connect: {
            id: BigInt(data.productId),
          },
        },
      },
      include: {
        products: {
          select: {
            id: true,
            sku: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      venueProduct: {
        ...venueProduct,
        id: Number(venueProduct.id),
        products: venueProduct.products.map((product) => ({
          ...product,
          id: String(product.id),
        })),
      },
    });
  } catch (error) {
    console.error("Error creating venue product:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, context: RouteParams) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    if (!session?.user?.isSuperuser) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }

    const params = await context.params;
    const venue = await prisma.venue.findUnique({
      where: { trxVenueId: Number(params.id) },
      include: {
        venueProduct: {
          include: {
            products: {
              select: {
                id: true,
                sku: true,
                title: true,
              },
            },
          },
        },
      },
    });

    if (!venue) {
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      venueProduct: venue.venueProduct
        ? {
            ...venue.venueProduct,
            id: Number(venue.venueProduct.id),
            products: venue.venueProduct.products.map((product) => ({
              ...product,
              id: String(product.id),
            })),
          }
        : null,
    });
  } catch (error) {
    console.error("Error fetching venue products:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
