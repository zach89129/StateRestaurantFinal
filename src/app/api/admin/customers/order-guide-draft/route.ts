import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isSuperuser) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await request.json();
    const customerId = Number(body.customerId);
    const action = String(body.action || "");

    if (Number.isNaN(customerId) || customerId <= 0) {
      return NextResponse.json({ error: "Invalid customerId" }, { status: 400 });
    }

    if (action !== "clear" && action !== "reactivate") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({
      where: { trxCustomerId: customerId },
      include: {
        venues: {
          select: {
            trxVenueId: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const draft = await prisma.orderGuideDraft.findUnique({
      where: { customerId },
      select: { id: true },
    });

    if (!draft) {
      return NextResponse.json(
        { error: "No order guide draft exists for this customer" },
        { status: 404 }
      );
    }

    if (action === "clear") {
      await prisma.$transaction([
        prisma.orderGuideDraftItem.deleteMany({
          where: { draftId: draft.id },
        }),
        prisma.orderGuideDraft.update({
          where: { id: draft.id },
          data: {
            isLocked: false,
            submittedAt: null,
          },
        }),
      ]);
      return NextResponse.json({ success: true });
    }

    let pricingVenueId: number | null = customer.orderGuidePricingVenueId;
    if (!pricingVenueId && customer.venues.length === 1) {
      pricingVenueId = customer.venues[0].trxVenueId;
    }

    await prisma.$transaction([
      prisma.orderGuideDraft.update({
        where: { id: draft.id },
        data: {
          isLocked: false,
        },
      }),
      prisma.customer.update({
        where: { trxCustomerId: customerId },
        data: {
          isNewOrderGuideUser: true,
          orderGuidePricingVenueId: pricingVenueId,
          seePrices: true,
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
