import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { prisma } from "@/lib/prisma";

interface CartItem {
  id: string;
  sku: string;
  title: string;
  quantity: number;
  manufacturer: string | null;
  uom: string | null;
  price: number | null;
  venueId: string;
  venueName: string;
}

// POST: Create orders when a user checks out their cart
export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { items, comment, purchaseOrder } = await request.json();

    // Only process venue-specific items (venueId !== "0" and is a valid number)
    const venueItems = items.filter((item: CartItem) => {
      const venueIdNum = parseInt(item.venueId);
      return (
        item.venueId &&
        item.venueId !== "0" &&
        !isNaN(venueIdNum) &&
        venueIdNum > 0
      );
    });

    if (venueItems.length === 0) {
      // No venue-specific items to process
      return NextResponse.json({
        message: "No venue-specific items to create orders for",
        success: true,
      });
    }

    // Group items by venue
    const itemsByVenue = venueItems.reduce(
      (acc: Record<string, CartItem[]>, item: CartItem) => {
        if (!acc[item.venueId]) {
          acc[item.venueId] = [];
        }
        acc[item.venueId].push(item);
        return acc;
      },
      {}
    );

    // Create orders for each venue
    const orderResults = [];
    for (const [venueId, items] of Object.entries(itemsByVenue)) {
      // Type assertion to fix the unknown type
      const cartItems = items as CartItem[];

      // Parse and validate venueId
      const venueIdNum = parseInt(venueId);
      if (isNaN(venueIdNum) || venueIdNum <= 0) {
        console.error(`Invalid venueId: ${venueId}, skipping order creation`);
        continue;
      }

      // Create order in database
      const order = await prisma.order.create({
        data: {
          trxVenueId: venueIdNum,
          status: "new",
          customerPo: purchaseOrder || null,
          customerNote: comment || null,
          lineItems: {
            create: cartItems.map((item: CartItem) => ({
              trxProductId: BigInt(item.id),
              qty: item.quantity,
            })),
          },
        },
      });

      orderResults.push({
        venueId,
        orderId: order.id,
        itemCount: cartItems.length,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Orders created successfully",
      orders: orderResults,
    });
  } catch (error) {
    console.error("Error creating orders:", error);
    return NextResponse.json(
      { error: "Failed to create orders" },
      { status: 500 }
    );
  }
}

// GET: Get a list of orders (with optional filtering)
export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get status filter from URL params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    // Build where condition for filtering
    const whereCondition = status ? { status } : {};

    // Get orders with their items
    const orders = await prisma.order.findMany({
      where: whereCondition,
      include: {
        lineItems: true,
      },
      orderBy: {
        dateCreated: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Error retrieving orders:", error);
    return NextResponse.json(
      { error: "Failed to retrieve orders" },
      { status: 500 }
    );
  }
}
