import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !session.user.isSuperuser) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");

    if (!query) {
      return new NextResponse(JSON.stringify({ venues: [] }), { status: 200 });
    }

    const numericQuery = parseInt(query);
    const venues = await prisma.venue.findMany({
      where: {
        OR: [
          { venueName: { contains: query } },
          { trxVenueId: !isNaN(numericQuery) ? numericQuery : undefined },
        ],
      },
      select: {
        trxVenueId: true,
        venueName: true,
      },
      take: 10,
    });

    return new NextResponse(JSON.stringify({ venues }), { status: 200 });
  } catch (error) {
    console.error("Error searching venues:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
      }
    );
  }
}
