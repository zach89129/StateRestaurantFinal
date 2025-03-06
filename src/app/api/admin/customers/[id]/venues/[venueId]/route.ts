import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";

interface RouteParams {
  params: Promise<{
    id: string;
    venueId: string;
  }>;
}

export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !session.user.isSuperuser) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const params = await context.params;
    const customerId = parseInt(params.id);
    const venueId = parseInt(params.venueId);

    if (isNaN(customerId) || isNaN(venueId)) {
      return new NextResponse(JSON.stringify({ error: "Invalid ID" }), {
        status: 400,
      });
    }

    // Check if the customer exists and has the venue
    const customer = await prisma.customer.findUnique({
      where: { trxCustomerId: customerId },
      include: {
        venues: {
          where: { trxVenueId: venueId },
        },
      },
    });

    if (!customer) {
      return new NextResponse(JSON.stringify({ error: "Customer not found" }), {
        status: 404,
      });
    }

    if (customer.venues.length === 0) {
      return new NextResponse(
        JSON.stringify({ error: "Venue not associated with customer" }),
        {
          status: 404,
        }
      );
    }

    // Remove the venue from the customer's venues
    await prisma.customer.update({
      where: { trxCustomerId: customerId },
      data: {
        venues: {
          disconnect: { trxVenueId: venueId },
        },
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting customer-venue association:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
      }
    );
  }
}
