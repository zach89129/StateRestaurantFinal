import { NextResponse } from "next/server";
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
      select: {
        isNewOrderGuideUser: true,
        orderGuidePricingVenueId: true,
      },
    });

    if (!customer?.isNewOrderGuideUser) {
      return NextResponse.json(
        { success: false, error: "Feature not enabled" },
        { status: 403 }
      );
    }

    const items = await prisma.orderGuideItem.findMany({
      where: { included: true },
      include: {
        product: {
          include: {
            images: true,
          },
        },
      },
      orderBy: [
        { orderGuideGroup: "asc" },
        { product: { category: "asc" } },
        { orderGuideQuality: "asc" },
        { product: { title: "asc" } },
      ],
    });

    return NextResponse.json({
      success: true,
      defaultVenueId: customer.orderGuidePricingVenueId,
      items: items.map((item) => ({
        id: item.id,
        productId: Number(item.productId),
        orderGuideGroup: item.orderGuideGroup,
        orderGuideQuality: item.orderGuideQuality,
        included: item.included,
        product: {
          id: Number(item.product.id),
          sku: item.product.sku,
          title: item.product.title,
          description: item.product.description,
          manufacturer: item.product.manufacturer,
          category: item.product.category,
          aqcat: item.product.aqcat,
          uom: item.product.uom,
          qtyAvailable: item.product.qtyAvailable
            ? Number(item.product.qtyAvailable)
            : null,
          images: item.product.images.map((image) => ({ src: image.url })),
        },
      })),
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
