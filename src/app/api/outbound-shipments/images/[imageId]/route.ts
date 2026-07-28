import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSalesTeam } from "@/lib/sales-auth";
import { getOutboundShipmentBlob } from "@/lib/outbound-shipments/blob";

function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ imageId: string }> }
) {
  try {
    await requireSalesTeam();
    const { imageId: imageIdParam } = await context.params;
    const imageId = Number.parseInt(imageIdParam, 10);

    if (!Number.isFinite(imageId) || imageId <= 0) {
      return NextResponse.json({ error: "Invalid image id" }, { status: 400 });
    }

    const image = await prisma.outboundShipmentImage.findUnique({
      where: { id: imageId },
      select: {
        blobPathname: true,
        contentType: true,
      },
    });

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    const ifNoneMatch = request.headers.get("if-none-match") ?? undefined;
    const result = await getOutboundShipmentBlob(image.blobPathname, {
      ifNoneMatch,
    });

    if (!result) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    if (result.statusCode === 304) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: result.blob.etag,
          "Cache-Control": "private, max-age=3600",
        },
      });
    }

    return new NextResponse(result.stream, {
      status: 200,
      headers: {
        "Content-Type":
          result.blob.contentType || image.contentType || "application/octet-stream",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, max-age=3600",
        ETag: result.blob.etag,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("Error fetching outbound shipment image:", error);
    return NextResponse.json(
      { error: "Failed to fetch outbound shipment image" },
      { status: 500 }
    );
  }
}
