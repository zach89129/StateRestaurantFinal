import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/auth-options";
import { Prisma } from "@prisma/client";

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

    // If ID is provided, fetch a single customer
    if (id) {
      const customer = await prisma.customer.findUnique({
        where: { trxCustomerId: Number(id) },
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

      return NextResponse.json({
        customer: {
          ...customer,
          venues: customer.venues.map((venue) => ({
            ...venue,
          })),
        },
      });
    }

    // Otherwise, handle paginated list
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const search = searchParams.get("search") || "";
    const sort = searchParams.get("sort") || "email:asc";
    const [sortField, sortOrder] = sort.split(":");

    // Calculate offset
    const offset = (page - 1) * pageSize;

    // Build where clause for search
    const whereClause = search
      ? {
          OR: [
            // Try to parse the search term as a number for trx_customer_id search
            ...(!isNaN(Number(search))
              ? [{ trxCustomerId: parseInt(search) }]
              : []),
            { email: { contains: search } },
            { phone: { contains: search } },
          ],
        }
      : {};

    // Get total count for pagination
    const total = await prisma.customer.count({
      where: whereClause,
    });

    // Fetch customers
    const customers = await prisma.customer.findMany({
      where: whereClause,
      orderBy: {
        [sortField]: sortOrder,
      },
      skip: offset,
      take: pageSize,
      include: {
        venues: {
          select: {
            trxVenueId: true,
            venueName: true,
          },
        },
      },
    });

    // Calculate pagination info
    const totalPages = Math.ceil(total / pageSize);
    const hasMore = page < totalPages;

    return NextResponse.json({
      success: true,
      customers: customers.map((customer) => ({
        ...customer,
        venues: customer.venues.map((venue) => ({
          ...venue,
        })),
      })),
      pagination: {
        total,
        page,
        pageSize,
        totalPages,
        hasMore,
      },
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
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
    const requiredFields = ["email", "trxCustomerId"];
    const missingFields = requiredFields.filter((field) => !data[field]);
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    // Check if customer with same email or trxCustomerId already exists
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        OR: [
          { email: data.email.toLowerCase() },
          { trxCustomerId: data.trxCustomerId },
        ],
      },
    });

    if (existingCustomer) {
      return NextResponse.json(
        { error: "Customer with this email or ID already exists" },
        { status: 400 }
      );
    }

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        email: data.email.toLowerCase(),
        phone: data.phone || null,
        trxCustomerId: data.trxCustomerId,
        seePrices: data.seePrices || false,
        venues: data.venueIds?.length
          ? {
              connect: data.venueIds.map((id: number) => ({ trxVenueId: id })),
            }
          : undefined,
      },
      include: {
        venues: true,
      },
    });

    return NextResponse.json({
      success: true,
      customer: {
        ...customer,
        venues: customer.venues.map((venue) => ({
          ...venue,
        })),
      },
    });
  } catch (error) {
    console.error("Error creating customer:", error);
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
    if (!data.trxCustomerId) {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 }
      );
    }

    // Convert string values to appropriate types
    const trxCustomerId = parseInt(data.trxCustomerId);
    if (isNaN(trxCustomerId)) {
      return NextResponse.json(
        { error: "Invalid trxCustomerId value" },
        { status: 400 }
      );
    }

    // Update customer
    const customer = await prisma.customer.update({
      where: { trxCustomerId: trxCustomerId },
      data: {
        email: data.email?.toLowerCase(),
        phone: data.phone || null,
        seePrices: Boolean(data.seePrices),
      },
      include: {
        venues: true,
      },
    });

    return NextResponse.json({
      success: true,
      customer: {
        ...customer,
        venues: customer.venues.map((venue) => ({
          ...venue,
        })),
      },
    });
  } catch (error) {
    console.error("Error updating customer:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { error: "Failed to update customer: " + error.message },
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
    if (!data.trxCustomerId) {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 }
      );
    }

    // Delete customer
    await prisma.customer.delete({
      where: { trxCustomerId: parseInt(data.trxCustomerId) },
    });

    return NextResponse.json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
