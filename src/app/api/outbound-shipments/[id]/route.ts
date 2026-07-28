import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSalesTeam } from "@/lib/sales-auth";

function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireSalesTeam();
    const { id: idParam } = await context.params;
    const id = Number.parseInt(idParam, 10);

    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "Invalid shipment id" }, { status: 400 });
    }

    const shipment = await prisma.outboundShipment.findUnique({
      where: { id },
      include: {
        images: {
          select: { id: true, contentType: true, createdAt: true },
          orderBy: { id: "asc" },
        },
      },
    });

    if (!shipment) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      shipment: {
        id: shipment.id,
        customerName: shipment.customerName,
        invoiceNumber: shipment.invoiceNumber,
        createdByEmail: shipment.createdByEmail,
        createdAt: shipment.createdAt.toISOString(),
        images: shipment.images.map((image) => ({
          id: image.id,
          contentType: image.contentType,
          createdAt: image.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("Error fetching outbound shipment:", error);
    return NextResponse.json(
      { error: "Failed to fetch outbound shipment" },
      { status: 500 }
    );
  }
}
