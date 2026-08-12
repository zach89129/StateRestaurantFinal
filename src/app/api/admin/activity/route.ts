import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/auth-options";
import {
  buildVenueNamesByEmail,
  enrichActivityLogs,
  filterActivityLogsByVenue,
  parseVenueFilter,
} from "@/lib/activityLogs";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.isSuperuser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const venueFilter = parseVenueFilter(
      request.nextUrl.searchParams.get("venue")
    );

    const [logs, customersWithVenue] = await Promise.all([
      prisma.userActivityLog.findMany({
        orderBy: {
          TIMESTAMP: "desc",
        },
      }),
      prisma.customer.findMany({
        where: {
          venues: {
            some: {},
          },
        },
        select: {
          email: true,
          venues: {
            select: {
              venueName: true,
            },
            orderBy: {
              venueName: "asc",
            },
          },
        },
      }),
    ]);

    const venueNamesByEmail = buildVenueNamesByEmail(
      customersWithVenue.map((customer) => ({
        email: customer.email,
        venueNames: customer.venues.map((venue) => venue.venueName),
      }))
    );
    const enrichedLogs = enrichActivityLogs(logs, venueNamesByEmail);
    const filteredLogs = filterActivityLogsByVenue(enrichedLogs, venueFilter);

    return NextResponse.json(filteredLogs);
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
