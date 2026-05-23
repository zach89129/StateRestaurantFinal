import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = new URL(request.url).searchParams;
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 },
      );
    }

    const normalizedEmail = email.toLowerCase();
    const sessionEmail = session.user.email.toLowerCase();

    if (
      !session.user.isSuperuser &&
      normalizedEmail !== sessionEmail
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const customer = await prisma.customer.findUnique({
      where: { email: normalizedEmail },
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
        { status: 404 },
      );
    }

    const venues = customer.venues.map((venue) => ({
      name: venue.venueName,
      address: "",
      city: "",
      state: "",
    }));

    return NextResponse.json({
      success: true,
      customer: {
        email: customer.email,
        phone: customer.phone || "Not provided",
        name: customer.email.split("@")[0],
        venues: venues,
      },
    });
  } catch (error) {
    console.error("Error fetching customer info:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer information" },
      { status: 500 },
    );
  }
}
