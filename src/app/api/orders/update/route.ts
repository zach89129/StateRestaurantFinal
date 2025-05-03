import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { prisma } from "@/lib/prisma";
import { verifyApiKey } from "@/lib/api-auth";

interface OrderUpdateRequest {
  id: number;
  status: string;
  trx_order_id: number;
  trx_order_number: string;
}

// POST: Update orders with vendor information
export async function POST(request: NextRequest) {
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

    // Get the updates from the request body
    const { orders } = await request.json();

    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      return NextResponse.json(
        {
          error: "Invalid request: orders array is required",
        },
        { status: 400 }
      );
    }

    // Update each order
    const updateResults = [];
    for (const order of orders) {
      const { id, status, trx_order_id, trx_order_number } =
        order as OrderUpdateRequest;

      if (!id || !status || !trx_order_id || !trx_order_number) {
        updateResults.push({
          id,
          success: false,
          message: "Missing required fields",
        });
        continue;
      }

      try {
        // Update the order in the database using Prisma's typed API
        await prisma.order.update({
          where: { id },
          data: {
            status: status,
            trxOrderId: trx_order_id,
            trxOrderNumber: trx_order_number,
          },
        });

        updateResults.push({
          id,
          success: true,
          message: "Order updated successfully",
        });
      } catch (error) {
        console.error(`Error updating order ${id}:`, error);
        updateResults.push({
          id,
          success: false,
          message: "Database error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Order updates processed",
      results: updateResults,
    });
  } catch (error) {
    console.error("Error updating orders:", error);
    return NextResponse.json(
      { error: "Failed to update orders" },
      { status: 500 }
    );
  }
}
