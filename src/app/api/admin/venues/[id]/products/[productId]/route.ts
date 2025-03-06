import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../auth/[...nextauth]/auth-options";

interface RouteParams {
  params: Promise<{
    id: string;
    productId: string;
  }>;
}

export async function DELETE(request: NextRequest, context: RouteParams) {
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
        venueProduct: true,
      },
    });

    if (!venue || !venue.venueProduct) {
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    }

    // Remove product from venue
    await prisma.venueProduct.update({
      where: {
        id: venue.venueProduct.id,
      },
      data: {
        products: {
          disconnect: {
            id: BigInt(params.productId),
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Product removed from venue successfully",
    });
  } catch (error) {
    console.error("Error removing product from venue:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
