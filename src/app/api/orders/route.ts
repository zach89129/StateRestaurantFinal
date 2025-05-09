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
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { items, comment, purchaseOrder, quoteVenueAssignments } =
      await request.json();

    // Process venue-specific items with prices (regular orders)
    const venueItems = items.filter(
      (item: CartItem) => item.venueId && String(item.venueId) !== "0"
    );

    // Process quote items (catalog items without venue)
    const quoteItems = items.filter(
      (item: CartItem) => !item.venueId || String(item.venueId) === "0"
    );

    // Track all created orders
    const orderResults = [];

    // 1. Create regular orders for venue-specific items
    if (venueItems.length > 0) {
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
      for (const [venueId, items] of Object.entries(itemsByVenue)) {
        const cartItems = items as CartItem[];

        const order = await prisma.order.create({
          data: {
            trxVenueId: parseInt(venueId),
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
          status: "new",
        });
      }
    }

    // 2. Create quote orders for catalog items
    if (quoteItems.length > 0) {
      // If quoteVenueAssignments is provided, use it to assign quote items to venues
      if (
        quoteVenueAssignments &&
        Object.keys(quoteVenueAssignments).length > 0
      ) {
        // Group quote items by the assigned venue from quoteVenueAssignments
        const quoteItemsByVenue: Record<string, CartItem[]> = {};

        quoteItems.forEach((item: CartItem) => {
          const venueId = quoteVenueAssignments[item.id] || "000000";
          if (!quoteItemsByVenue[venueId]) {
            quoteItemsByVenue[venueId] = [];
          }
          quoteItemsByVenue[venueId].push(item);
        });

        // Create quote orders for each venue
        for (const [venueId, items] of Object.entries(quoteItemsByVenue)) {
          const order = await prisma.order.create({
            data: {
              trxVenueId: parseInt(venueId),
              status: "quote",
              customerPo: purchaseOrder || null,
              customerNote: comment || null,
              lineItems: {
                create: items.map((item: CartItem) => ({
                  trxProductId: BigInt(item.id),
                  qty: item.quantity,
                })),
              },
            },
          });

          orderResults.push({
            venueId,
            orderId: order.id,
            itemCount: items.length,
            status: "quote",
          });
        }
      }
      // If only one venue exists for the user, assign all quote items to that venue
      else if (session.user.venues && session.user.venues.length === 1) {
        const venueId = session.user.venues[0].trxVenueId.toString();

        const order = await prisma.order.create({
          data: {
            trxVenueId: parseInt(venueId),
            status: "quote",
            customerPo: purchaseOrder || null,
            customerNote: comment || null,
            lineItems: {
              create: quoteItems.map((item: CartItem) => ({
                trxProductId: BigInt(item.id),
                qty: item.quantity,
              })),
            },
          },
        });

        orderResults.push({
          venueId,
          orderId: order.id,
          itemCount: quoteItems.length,
          status: "quote",
        });
      }
      // If user has no venues or multiple venues but no assignment, default to the first venue or 0
      else {
        // For users with multiple venues but no assignments provided
        let venueId = "0";

        // Try to use the first venue if available
        if (session.user.venues && session.user.venues.length > 0) {
          venueId = session.user.venues[0].trxVenueId.toString();
        }

        const order = await prisma.order.create({
          data: {
            trxVenueId: parseInt(venueId),
            status: "quote",
            customerPo: purchaseOrder || null,
            customerNote: comment || null,
            lineItems: {
              create: quoteItems.map((item: CartItem) => ({
                trxProductId: BigInt(item.id),
                qty: item.quantity,
              })),
            },
          },
        });

        orderResults.push({
          venueId,
          orderId: order.id,
          itemCount: quoteItems.length,
          status: "quote",
        });
      }
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
