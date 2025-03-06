import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/auth-options";
import { Prisma } from "@prisma/client";

// Define the product shape we want in our response
interface ProductResponse {
  id: string;
  sku: string;
  title: string;
}

interface VenueProductWithProducts {
  id: number;
  products: ProductResponse[];
}

interface VenueResponse {
  trxVenueId: number;
  venueName: string;
  venueProduct: VenueProductWithProducts | null;
}

const venueWithProducts = Prisma.validator<Prisma.VenueDefaultArgs>()({
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

type VenueWithProducts = Prisma.VenueGetPayload<typeof venueWithProducts>;

// Helper function to format venue response
function formatVenueResponse(venue: VenueWithProducts): VenueResponse {
  return {
    ...venue,
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
  };
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    if (!session?.user?.isSuperuser) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = new URL(request.url).searchParams;
    const id = searchParams.get("id");

    // If ID is provided, fetch a single venue
    if (id) {
      const venue = await prisma.venue.findUnique({
        where: { trxVenueId: Number(id) },
        ...venueWithProducts,
      });

      if (!venue) {
        return NextResponse.json({ error: "Venue not found" }, { status: 404 });
      }

      return NextResponse.json({
        venue: formatVenueResponse(venue),
      });
    }

    // Otherwise, handle paginated list
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const search = searchParams.get("search") || "";
    const sort = searchParams.get("sort") || "venueName:asc";
    const [sortField, sortOrder] = sort.split(":");

    // Calculate offset
    const offset = (page - 1) * pageSize;

    // Build where clause for search
    const whereClause = search
      ? {
          OR: [
            // Try to parse the search term as a number for trx_venue_id search
            ...(!isNaN(Number(search))
              ? [{ trxVenueId: parseInt(search) }]
              : []),
            { venueName: { contains: search } },
          ],
        }
      : {};

    // Get total count for pagination
    const total = await prisma.venue.count({
      where: whereClause,
    });

    // Fetch venues
    const venues = await prisma.venue.findMany({
      where: whereClause,
      orderBy: {
        [sortField]: sortOrder,
      },
      skip: offset,
      take: pageSize,
      ...venueWithProducts,
    });

    // Calculate pagination info
    const totalPages = Math.ceil(total / pageSize);
    const hasMore = page < totalPages;

    return NextResponse.json({
      success: true,
      venues: venues.map(formatVenueResponse),
      pagination: {
        total,
        page,
        pageSize,
        totalPages,
        hasMore,
      },
    });
  } catch (error) {
    console.error("Error fetching venues:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
    if (!data.trxVenueId) {
      return NextResponse.json(
        { error: "Venue ID is required" },
        { status: 400 }
      );
    }

    // Convert string values to appropriate types
    const trxVenueId = parseInt(data.trxVenueId);
    if (isNaN(trxVenueId)) {
      return NextResponse.json(
        { error: "Invalid trxVenueId value" },
        { status: 400 }
      );
    }

    // Update venue
    const venue = await prisma.venue.update({
      where: { trxVenueId: Number(data.trxVenueId) },
      data: {
        venueName: data.venueName,
      },
      ...venueWithProducts,
    });

    return NextResponse.json({
      success: true,
      venue: formatVenueResponse(venue),
    });
  } catch (error) {
    console.error("Error updating venue:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { error: "Failed to update venue: " + error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    // Validate required fields
    const requiredFields = ["venueName", "trxVenueId"];
    const missingFields = requiredFields.filter((field) => !data[field]);
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    // Convert string values to appropriate types
    const trxVenueId = parseInt(data.trxVenueId);
    if (isNaN(trxVenueId)) {
      return NextResponse.json(
        { error: "Invalid trxVenueId value" },
        { status: 400 }
      );
    }

    // Create venue
    const venue = await prisma.venue.create({
      data: {
        venueName: data.venueName,
        trxVenueId: trxVenueId,
        venueProduct: data.productIds?.length
          ? {
              create: {
                products: {
                  connect: data.productIds.map((id: string) => ({
                    id: BigInt(id),
                  })),
                },
              },
            }
          : undefined,
      },
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

    return NextResponse.json({
      success: true,
      venue: formatVenueResponse(venue),
    });
  } catch (error) {
    console.error("Error creating venue:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { error: "Failed to create venue: " + error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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
    if (!data.trxVenueId) {
      return NextResponse.json(
        { error: "Venue ID is required" },
        { status: 400 }
      );
    }

    // Delete venue
    await prisma.venue.delete({
      where: { trxVenueId: Number(data.trxVenueId) },
    });

    return NextResponse.json({
      success: true,
      message: "Venue deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting venue:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { error: "Failed to delete venue: " + error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
