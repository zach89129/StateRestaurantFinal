import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{
    trxCustomerId: string;
  }>;
};

export async function DELETE(
  request: NextRequest,
  props: Props
): Promise<NextResponse> {
  try {
    const params = await props.params;
    const trx_customer_id = parseInt(params.trxCustomerId);
    const body = await request.json();

    if (!body.trx_venue_id) {
      return NextResponse.json(
        { success: false, error: "Missing trxVenueId in request body" },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.update({
      where: { trxCustomerId: trx_customer_id },
      data: {
        venues: {
          disconnect: {
            trxVenueId: body.trx_venue_id,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      customer,
    });
  } catch (error) {
    console.error("Error removing venue from customer:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
