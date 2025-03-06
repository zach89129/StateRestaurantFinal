import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        email: true,
        phone: true,
        trxCustomerId: true,
        seePrices: true,
        venues: {
          select: {
            trxVenueId: true,
            venueName: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Transform the data to match our frontend expectations
    const venues = customer.venues.map((venue) => ({
      name: venue.venueName,
      // Since we don't have address info in the schema, we'll just show the venue name
      address: "",
      city: "",
      state: "",
    }));

    return NextResponse.json({
      success: true,
      customer: {
        email: customer.email,
        phone: customer.phone || "Not provided",
        name: customer.email.split("@")[0], // Use email username as name since we don't have names
        venues: venues,
      },
    });
  } catch (error) {
    console.error("Error fetching customer info:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer information" },
      { status: 500 }
    );
  }
}
