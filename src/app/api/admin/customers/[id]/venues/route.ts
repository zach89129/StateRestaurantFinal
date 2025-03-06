import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !session.user.isSuperuser) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const params = await context.params;
    const customerId = parseInt(params.id);

    if (isNaN(customerId)) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid customer ID" }),
        {
          status: 400,
        }
      );
    }

    const customer = await prisma.customer.findUnique({
      where: { trxCustomerId: customerId },
      include: {
        venues: true,
      },
    });

    if (!customer) {
      return new NextResponse(JSON.stringify({ error: "Customer not found" }), {
        status: 404,
      });
    }

    return new NextResponse(JSON.stringify({ venues: customer.venues }));
  } catch (error) {
    console.error("Error fetching customer venues:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, context: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !session.user.isSuperuser) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const params = await context.params;
    const customerId = parseInt(params.id);

    if (isNaN(customerId)) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid customer ID" }),
        {
          status: 400,
        }
      );
    }

    const body = await request.json();
    const { venueId } = body;

    if (!venueId) {
      return new NextResponse(
        JSON.stringify({ error: "Venue ID is required" }),
        {
          status: 400,
        }
      );
    }

    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { trxCustomerId: customerId },
    });

    if (!customer) {
      return new NextResponse(JSON.stringify({ error: "Customer not found" }), {
        status: 404,
      });
    }

    // Check if venue exists
    const venue = await prisma.venue.findUnique({
      where: { trxVenueId: venueId },
    });

    if (!venue) {
      return new NextResponse(JSON.stringify({ error: "Venue not found" }), {
        status: 404,
      });
    }

    // Add venue to customer
    const updatedCustomer = await prisma.customer.update({
      where: { trxCustomerId: customerId },
      data: {
        venues: {
          connect: { trxVenueId: venueId },
        },
      },
      include: {
        venues: true,
      },
    });

    return new NextResponse(JSON.stringify({ venues: updatedCustomer.venues }));
  } catch (error) {
    console.error("Error adding venue to customer:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}
