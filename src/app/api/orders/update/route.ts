import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireIntegrationApiKey } from "@/lib/integration-auth";

interface OrderUpdateRequest {
  id: number;
  status: string;
  trx_order_id: number;
  trx_order_number: string;
}

export async function POST(request: NextRequest) {
  try {
    const authError = await requireIntegrationApiKey(request);
    if (authError) return authError;

    const { orders } = await request.json();

    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      return NextResponse.json(
        {
          error: "Invalid request: orders array is required",
        },
        { status: 400 },
      );
    }

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
      { status: 500 },
    );
  }
}
