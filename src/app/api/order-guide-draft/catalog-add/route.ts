import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customerId = parseInt(session.user.trxCustomerId);
    const customer = await prisma.customer.findUnique({
      where: { trxCustomerId: customerId },
      select: { isNewOrderGuideUser: true },
    });

    if (!customer?.isNewOrderGuideUser) {
      return NextResponse.json(
        { success: false, error: "Feature not enabled" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const productId = Number(body.productId);
    const quantity = Math.max(1, Number(body.quantity) || 1);

    if (Number.isNaN(productId) || productId <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid productId" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: BigInt(productId) },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    const draft = await prisma.orderGuideDraft.upsert({
      where: { customerId },
      update: {},
      create: { customerId },
      select: { id: true, isLocked: true },
    });

    if (draft.isLocked) {
      return NextResponse.json(
        { success: false, error: "Draft is locked. Ask admin to reactivate it." },
        { status: 409 }
      );
    }

    const item = await prisma.orderGuideDraftItem.upsert({
      where: {
        draftId_productId: {
          draftId: draft.id,
          productId: BigInt(productId),
        },
      },
      update: {
        quantity: { increment: quantity },
        sourceType: "GENERAL_CATALOG",
      },
      create: {
        draftId: draft.id,
        productId: BigInt(productId),
        quantity,
        sourceType: "GENERAL_CATALOG",
      },
      select: {
        id: true,
        productId: true,
        quantity: true,
        sourceType: true,
      },
    });

    return NextResponse.json({
      success: true,
      item: {
        ...item,
        productId: Number(item.productId),
      },
    });
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
