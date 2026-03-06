import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET() {
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

    const draft = await prisma.orderGuideDraft.findUnique({
      where: { customerId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true,
                orderGuideItem: true,
              },
            },
          },
          orderBy: { updatedAt: "desc" },
        },
      },
    });

    return NextResponse.json({
      success: true,
      isLocked: draft?.isLocked ?? false,
      submittedAt: draft?.submittedAt ?? null,
      lastSavedAt: draft?.updatedAt ?? null,
      items:
        draft?.items.map((item) => ({
          id: item.id,
          productId: Number(item.productId),
          quantity: item.quantity,
          sourceType: item.sourceType,
          orderGuideGroup: item.product.orderGuideItem?.orderGuideGroup ?? null,
          orderGuideQuality: item.product.orderGuideItem?.orderGuideQuality ?? null,
          product: {
            id: Number(item.product.id),
            sku: item.product.sku,
            title: item.product.title,
            manufacturer: item.product.manufacturer,
            category: item.product.category,
            aqcat: item.product.aqcat,
            uom: item.product.uom,
            images: item.product.images.map((image) => ({ src: image.url })),
          },
        })) ?? [],
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

export async function PUT(request: NextRequest) {
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

    const data = await request.json();
    const productId = Number(data.productId);
    const quantity = Number(data.quantity);
    const sourceType =
      data.sourceType === "GENERAL_CATALOG" ? "GENERAL_CATALOG" : "ORDER_GUIDE";
    const forceSave = Boolean(data.forceSave);

    if (Number.isNaN(productId) || productId <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid productId" },
        { status: 400 }
      );
    }

    if (Number.isNaN(quantity)) {
      return NextResponse.json(
        { success: false, error: "Invalid quantity" },
        { status: 400 }
      );
    }

    const draft = await prisma.orderGuideDraft.upsert({
      where: { customerId },
      update: {},
      create: { customerId },
      select: { id: true, isLocked: true },
    });

    if (draft.isLocked && !forceSave) {
      return NextResponse.json(
        { success: false, error: "Draft is locked. Ask admin to reactivate it." },
        { status: 409 }
      );
    }

    if (quantity <= 0) {
      await prisma.orderGuideDraftItem.deleteMany({
        where: {
          draftId: draft.id,
          productId: BigInt(productId),
        },
      });
      return NextResponse.json({ success: true, removed: true });
    }

    const item = await prisma.orderGuideDraftItem.upsert({
      where: {
        draftId_productId: {
          draftId: draft.id,
          productId: BigInt(productId),
        },
      },
      update: {
        quantity,
        sourceType,
      },
      create: {
        draftId: draft.id,
        productId: BigInt(productId),
        quantity,
        sourceType,
      },
      select: {
        id: true,
        quantity: true,
        sourceType: true,
      },
    });

    return NextResponse.json({
      success: true,
      item,
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
