import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSalesTeam } from "@/lib/sales-auth";
import {
  MAX_OUTBOUND_SHIPMENT_IMAGES,
  MAX_OUTBOUND_SHIPMENT_IMAGE_BYTES,
  MAX_OUTBOUND_SHIPMENT_UPLOAD_BYTES,
} from "@/lib/outbound-shipments/constants";
import {
  buildOutboundShipmentBlobPathname,
  deleteOutboundShipmentBlobs,
  putOutboundShipmentBlob,
} from "@/lib/outbound-shipments/blob";
import { isAllowedOutboundShipmentImage } from "@/lib/outbound-shipments/imageValidation";

const createFieldsSchema = z.object({
  customerName: z.string().trim().min(1).max(255),
  invoiceNumber: z.string().trim().min(1).max(255),
});

function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
}

function collectImageFiles(formData: FormData): File[] {
  const files: File[] = [];

  for (const value of formData.getAll("images")) {
    if (value instanceof File && value.size > 0) {
      files.push(value);
    }
  }

  const single = formData.get("file");
  if (single instanceof File && single.size > 0) {
    files.push(single);
  }

  return files;
}

export async function GET() {
  try {
    await requireSalesTeam();

    const shipments = await prisma.outboundShipment.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        customerName: true,
        invoiceNumber: true,
        createdByEmail: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      shipments: shipments.map((shipment) => ({
        ...shipment,
        createdAt: shipment.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("Error fetching outbound shipments:", error);
    return NextResponse.json(
      { error: "Failed to fetch outbound shipments" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const uploadedPathnames: string[] = [];
  let shipmentId: number | null = null;

  try {
    const session = await requireSalesTeam();
    const formData = await request.formData();

    const parsed = createFieldsSchema.safeParse({
      customerName: formData.get("customerName"),
      invoiceNumber: formData.get("invoiceNumber"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Customer name and invoice number are required" },
        { status: 400 }
      );
    }

    const files = collectImageFiles(formData);

    if (files.length > MAX_OUTBOUND_SHIPMENT_IMAGES) {
      return NextResponse.json(
        {
          error: `A maximum of ${MAX_OUTBOUND_SHIPMENT_IMAGES} images is allowed`,
        },
        { status: 400 }
      );
    }

    for (const file of files) {
      if (!isAllowedOutboundShipmentImage(file)) {
        return NextResponse.json(
          { error: "Only non-SVG image files are allowed" },
          { status: 400 }
        );
      }
      if (file.size > MAX_OUTBOUND_SHIPMENT_IMAGE_BYTES) {
        return NextResponse.json(
          { error: "Each image must be 5MB or smaller" },
          { status: 400 }
        );
      }
    }

    const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
    if (totalBytes > MAX_OUTBOUND_SHIPMENT_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "Total upload size is too large. Please use fewer photos." },
        { status: 400 }
      );
    }

    const createdByEmail = session.user.email.trim().toLowerCase();

    const shipment = await prisma.outboundShipment.create({
      data: {
        customerName: parsed.data.customerName,
        invoiceNumber: parsed.data.invoiceNumber,
        createdByEmail,
      },
    });
    shipmentId = shipment.id;

    const imageRecords: { blobPathname: string; contentType: string | null }[] =
      [];

    for (const file of files) {
      const pathname = buildOutboundShipmentBlobPathname(shipment.id, file.name);
      await putOutboundShipmentBlob(pathname, file, file.type || undefined);
      uploadedPathnames.push(pathname);
      imageRecords.push({
        blobPathname: pathname,
        contentType: file.type || null,
      });
    }

    if (imageRecords.length > 0) {
      await prisma.outboundShipmentImage.createMany({
        data: imageRecords.map((image) => ({
          shipmentId: shipment.id,
          blobPathname: image.blobPathname,
          contentType: image.contentType,
        })),
      });
    }

    const created = await prisma.outboundShipment.findUnique({
      where: { id: shipment.id },
      include: {
        images: {
          select: { id: true, contentType: true, createdAt: true },
          orderBy: { id: "asc" },
        },
      },
    });

    return NextResponse.json({
      success: true,
      shipment: {
        id: created!.id,
        customerName: created!.customerName,
        invoiceNumber: created!.invoiceNumber,
        createdByEmail: created!.createdByEmail,
        createdAt: created!.createdAt.toISOString(),
        images: created!.images.map((image) => ({
          id: image.id,
          contentType: image.contentType,
          createdAt: image.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    if (uploadedPathnames.length > 0) {
      try {
        await deleteOutboundShipmentBlobs(uploadedPathnames);
      } catch (cleanupError) {
        console.error(
          "Failed to clean up outbound shipment blobs after error:",
          cleanupError
        );
      }
    }

    if (shipmentId != null) {
      try {
        await prisma.outboundShipment.delete({ where: { id: shipmentId } });
      } catch (cleanupError) {
        console.error(
          "Failed to clean up outbound shipment row after error:",
          cleanupError
        );
      }
    }

    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("Error creating outbound shipment:", error);
    return NextResponse.json(
      { error: "Failed to create outbound shipment" },
      { status: 500 }
    );
  }
}
