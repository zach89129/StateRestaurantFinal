import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { prisma } from "@/lib/prisma";

interface PricingBatchEntry {
  productId: number;
  price?: number;
  customerPrice?: number;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customerId = parseInt(session.user.trxCustomerId);
    const { comment, purchaseOrder } = await request.json();

    const customer = await prisma.customer.findUnique({
      where: { trxCustomerId: customerId },
      include: {
        venues: {
          select: {
            trxVenueId: true,
            venueName: true,
          },
        },
      },
    });

    if (!customer?.isNewOrderGuideUser) {
      return NextResponse.json(
        { success: false, error: "Feature not enabled" },
        { status: 403 }
      );
    }

    let resolvedVenueId: number | null = null;
    if (customer.venues.length === 1) {
      resolvedVenueId = customer.venues[0].trxVenueId;
    } else if (
      customer.venues.length > 1 &&
      customer.orderGuidePricingVenueId &&
      customer.venues.some(
        (venue) => venue.trxVenueId === customer.orderGuidePricingVenueId
      )
    ) {
      resolvedVenueId = customer.orderGuidePricingVenueId;
    }

    if (!resolvedVenueId) {
      return NextResponse.json(
        { success: false, error: "No valid pricing venue configured" },
        { status: 400 }
      );
    }

    const draft = await prisma.orderGuideDraft.findUnique({
      where: { customerId },
      include: {
        items: {
          where: { quantity: { gt: 0 } },
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                title: true,
                manufacturer: true,
                uom: true,
              },
            },
          },
        },
      },
    });

    if (!draft || draft.items.length === 0) {
      return NextResponse.json(
        { success: false, error: "No draft items to submit" },
        { status: 400 }
      );
    }

    if (draft.isLocked) {
      return NextResponse.json(
        { success: false, error: "Draft is locked. Ask admin to reactivate it." },
        { status: 409 }
      );
    }

    const productIds = draft.items.map((item) => Number(item.productId)).join(",");
    const pricingResponse = await fetch(
      `${request.nextUrl.origin}/api/pricing?venueId=${resolvedVenueId}&productIds=${productIds}`,
      {
        method: "GET",
        headers: {
          Cookie: request.headers.get("cookie") || "",
        },
      }
    );

    const pricingData = pricingResponse.ok ? await pricingResponse.json() : null;
    const pricingMap = new Map<number, number | null>();
    if (pricingData?.prices && Array.isArray(pricingData.prices)) {
      for (const row of pricingData.prices as PricingBatchEntry[]) {
        const resolvedPrice =
          typeof row.customerPrice === "number"
            ? row.customerPrice
            : typeof row.price === "number"
            ? row.price
            : null;
        pricingMap.set(row.productId, resolvedPrice);
      }
    }

    const venueName =
      customer.venues.find((venue) => venue.trxVenueId === resolvedVenueId)?.venueName ??
      `Venue ${resolvedVenueId}`;

    const items = draft.items.map((item) => ({
      id: String(item.productId),
      sku: item.product.sku,
      title: item.product.title,
      quantity: item.quantity,
      manufacturer: item.product.manufacturer,
      uom: item.product.uom,
      price: pricingMap.get(Number(item.productId)) ?? null,
      venueId: String(resolvedVenueId),
      venueName,
    }));

    const submitResponse = await fetch(`${request.nextUrl.origin}/api/cart/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: request.headers.get("cookie") || "",
      },
      body: JSON.stringify({
        items,
        comment,
        purchaseOrder,
      }),
    });

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      return NextResponse.json(
        { success: false, error: errorText || "Failed to submit order" },
        { status: 500 }
      );
    }

    await prisma.orderGuideDraft.update({
      where: { id: draft.id },
      data: {
        isLocked: true,
        submittedAt: new Date(),
      },
    });

    await prisma.customer.update({
      where: { trxCustomerId: customerId },
      data: {
        isNewOrderGuideUser: false,
        orderGuidePricingVenueId: null,
      },
    });

    await prisma.customerOrderGuideFeature.updateMany({
      where: { customerId },
      data: {
        enabled: false,
        defaultVenueId: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
