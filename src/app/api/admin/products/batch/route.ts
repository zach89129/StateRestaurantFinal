import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/auth-options";

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    if (!session?.user?.isSuperuser) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }

    const data = await request.json();
    if (!data.productIds || !Array.isArray(data.productIds)) {
      return NextResponse.json(
        { error: "Product IDs array is required" },
        { status: 400 }
      );
    }

    // Convert all IDs to BigInt
    const productIds = data.productIds.map((id: number) => BigInt(id));

    // Delete products
    const result = await prisma.product.deleteMany({
      where: {
        id: {
          in: productIds,
        },
      },
    });

    return NextResponse.json({
      success: true,
      deleted: result.count,
    });
  } catch (error) {
    console.error("Error deleting products:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    if (!session?.user?.isSuperuser) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }

    const data = await request.json();
    if (!data.productIds || !Array.isArray(data.productIds)) {
      return NextResponse.json(
        { error: "Product IDs array is required" },
        { status: 400 }
      );
    }

    // Convert all IDs to BigInt
    const productIds = data.productIds.map((id: number) => BigInt(id));

    // Update products with the provided data
    const result = await prisma.product.updateMany({
      where: {
        id: {
          in: productIds,
        },
      },
      data: {
        ...(data.category && { category: data.category }),
        ...(data.manufacturer && { manufacturer: data.manufacturer }),
        ...(data.uom && { uom: data.uom }),
        ...(data.qtyAvailable && { qtyAvailable: data.qtyAvailable }),
        ...(data.aqcat !== undefined && { aqcat: data.aqcat }),
        ...(data.pattern !== undefined && { pattern: data.pattern }),
        ...(data.quickship !== undefined && { quickship: data.quickship }),
      },
    });

    return NextResponse.json({
      success: true,
      updated: result.count,
    });
  } catch (error) {
    console.error("Error updating products:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
