import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { prisma } from "@/lib/prisma";
import { verifyApiKey } from "@/lib/api-auth";

// GET: Get a list of new orders for vendors
export async function GET(request: NextRequest) {
  try {
    // Check for API key authentication first
    const apiKey = request.headers.get("x-api-key");
    const storedHash = process.env.API_KEY_HASH;

    let authenticated = false;

    // If API key is provided, verify it
    if (apiKey && storedHash) {
      try {
        authenticated = await verifyApiKey(apiKey, storedHash);
      } catch (error) {
        console.error("API key verification error:", error);
      }
    }

    // If not authenticated with API key, check for session authentication
    if (!authenticated) {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      authenticated = true;
    }

    // Optional venue filter
    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get("venueId");

    // Build where conditions for filtering
    const whereConditions: any = { status: "new" };
    if (venueId) {
      whereConditions.trxVenueId = parseInt(venueId);
    }

    // Get new orders with their items
    const orders = await prisma.order.findMany({
      where: whereConditions,
      include: {
        lineItems: true,
      },
      orderBy: {
        dateCreated: "asc",
      },
    });

    // Format the response to match the expected format from the screenshot
    const formattedOrders = orders.map((order) => ({
      id: order.id,
      trx_venue_id: order.trxVenueId,
      status: order.status || "new",
      date_created: order.dateCreated,
      customer_po: order.customerPo,
      customer_note: order.customerNote,
      trx_order_id: null,
      trx_order_number: null,
      line_items: order.lineItems.map((item) => ({
        trx_product_id: item.trxProductId.toString(),
        qty: item.qty,
      })),
    }));

    return NextResponse.json({
      success: true,
      orders: formattedOrders,
    });
  } catch (error) {
    console.error("Error retrieving new orders:", error);
    return NextResponse.json(
      { error: "Failed to retrieve new orders" },
      { status: 500 }
    );
  }
}
