import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

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

    let customers;

    // If ids array is empty, return all customers
    if (ids.length === 0) {
      customers = await prisma.customer.findMany({
        include: {
          venues: {
            select: {
              trxVenueId: true,
              venueName: true,
            },
          },
        },
      });
    } else {
      // Convert all ids to numbers
      const customerIds = ids.map((id) => Number(id));

      // Return only the customers with the specified ids
      customers = await prisma.customer.findMany({
        where: {
          trxCustomerId: {
            in: customerIds,
          },
        },
        include: {
          venues: {
            select: {
              trxVenueId: true,
              venueName: true,
            },
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      customers,
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
