import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteOutboundShipmentBlobs } from "@/lib/outbound-shipments/blob";
import { getRetentionCutoff } from "@/lib/outbound-shipments/retention";

function isAuthorizedCron(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return false;
  }

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  try {
    if (!isAuthorizedCron(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cutoff = getRetentionCutoff();

    const expired = await prisma.outboundShipment.findMany({
      where: { createdAt: { lt: cutoff } },
      select: {
        id: true,
        images: { select: { blobPathname: true } },
      },
    });

    if (expired.length === 0) {
      return NextResponse.json({
        success: true,
        deletedShipments: 0,
        deletedImages: 0,
        cutoff: cutoff.toISOString(),
      });
    }

    const pathnames = expired.flatMap((shipment) =>
      shipment.images.map((image) => image.blobPathname)
    );

    if (pathnames.length > 0) {
      await deleteOutboundShipmentBlobs(pathnames);
    }

    const deleteResult = await prisma.outboundShipment.deleteMany({
      where: { id: { in: expired.map((shipment) => shipment.id) } },
    });

    return NextResponse.json({
      success: true,
      deletedShipments: deleteResult.count,
      deletedImages: pathnames.length,
      cutoff: cutoff.toISOString(),
    });
  } catch (error) {
    console.error("Error cleaning up outbound shipments:", error);
    return NextResponse.json(
      { error: "Failed to clean up outbound shipments" },
      { status: 500 }
    );
  }
}
