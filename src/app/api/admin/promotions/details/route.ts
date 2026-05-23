import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireSuperuser } from "@/lib/admin-auth";

function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
}

export async function GET() {
  try {
    await requireSuperuser();

    const details = await prisma.promotionDetail.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(details);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("Error fetching promotion details:", error);
    return NextResponse.json(
      { error: "Failed to fetch promotion details" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSuperuser();

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const name = formData.get("name") as string;
    const order = parseInt(formData.get("order") as string) || 0;
    const targetUrl = formData.get("targetUrl") as string | null;

    if (!file || !name) {
      return NextResponse.json(
        { error: "File and name are required" },
        { status: 400 },
      );
    }

    const blob = await put(`promotions/details/${file.name}`, file, {
      access: "public",
    });

    const detail = await prisma.promotionDetail.create({
      data: {
        name,
        imageUrl: blob.url,
        targetUrl: targetUrl || null,
        order,
        isActive: true,
      },
    });

    return NextResponse.json(detail);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("Error creating promotion detail:", error);
    return NextResponse.json(
      { error: "Failed to create promotion detail" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireSuperuser();

    const { id, name, order, isActive } = await request.json();

    const detail = await prisma.promotionDetail.update({
      where: { id },
      data: { name, order, isActive },
    });

    return NextResponse.json(detail);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("Error updating promotion detail:", error);
    return NextResponse.json(
      { error: "Failed to update promotion detail" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireSuperuser();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Detail ID is required" },
        { status: 400 },
      );
    }

    await prisma.promotionDetail.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("Error deleting promotion detail:", error);
    return NextResponse.json(
      { error: "Failed to delete promotion detail" },
      { status: 500 },
    );
  }
}
