import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

interface LoginRequestBody {
  email: string;
  otp: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LoginRequestBody;

    if (!body.email || !body.otp) {
      return NextResponse.json(
        { error: "Email and verification code are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = body.email.toLowerCase();

    // Get customer data
    const customer = await prisma.customer.findUnique({
      where: { email: normalizedEmail },
      include: {
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

    // Format venues for response
    const venues = customer.venues.map((venue) => ({
      trxVenueId: venue.trxVenueId,
      name: venue.venueName,
    }));

    return NextResponse.json({
      success: true,
      customer: {
        ...customer,
        venues,
      },
    });
  } catch (error) {
    console.error("Error during login:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
