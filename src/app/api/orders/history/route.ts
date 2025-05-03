import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { prisma } from "@/lib/prisma";

// GET: Get order history for the current user
export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse customer ID from the session
    const trxCustomerId = session.user.trxCustomerId
      ? parseInt(session.user.trxCustomerId as string)
      : null;

    if (!trxCustomerId) {
      return NextResponse.json(
        { error: "No customer ID associated with this account" },
        { status: 400 }
      );
    }

    // Get customer's associated venues
    const customer = await prisma.customer.findUnique({
      where: { trxCustomerId },
      include: { venues: true },
    });

    if (!customer || !customer.venues || customer.venues.length === 0) {
      return NextResponse.json({
        success: true,
        orders: [],
      });
    }

    // Get venue IDs associated with this customer
    const venueIds = customer.venues.map((venue) => venue.trxVenueId);

    // Get orders for those venues
    const orders = await prisma.order.findMany({
      where: {
        trxVenueId: {
          in: venueIds,
        },
      },
      include: {
        lineItems: true,
      },
      orderBy: {
        dateCreated: "desc",
      },
    });

    // Format the response with venue names
    const venueMap = new Map(
      customer.venues.map((venue) => [venue.trxVenueId, venue.venueName])
    );

    const formattedOrders = await Promise.all(
      orders.map(async (order) => {
        // Fetch product details for each line item
        const lineItemsWithDetails = await Promise.all(
          order.lineItems.map(async (item) => {
            const product = await prisma.product.findUnique({
              where: { id: item.trxProductId },
            });

            return {
              product_id: item.trxProductId.toString(),
              description: product?.description || "Unknown Product",
              title: product?.title || "Unknown Product",
              sku: product?.sku || "Unknown SKU",
              qty: item.qty,
            };
          })
        );

        return {
          id: order.id,
          venue_id: order.trxVenueId,
          venue_name: venueMap.get(order.trxVenueId) || "Unknown Venue",
          date: order.dateCreated,
          status: order.status,
          customer_po: order.customerPo,
          items: lineItemsWithDetails,
          trx_order_number: order.trxOrderNumber,
        };
      })
    );

    return NextResponse.json({
      success: true,
      orders: formattedOrders,
    });
  } catch (error) {
    console.error("Error retrieving order history:", error);
    return NextResponse.json(
      { error: "Failed to retrieve order history" },
      { status: 500 }
    );
  }
}
