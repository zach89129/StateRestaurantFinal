import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperuser } from "@/lib/admin-auth";

function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
}

export async function GET() {
  try {
    await requireSuperuser();

    const content = await prisma.promotionContent.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(content);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("Error fetching promotion content:", error);
    return NextResponse.json(
      { error: "Failed to fetch promotion content" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSuperuser();

    const { title, description } = await request.json();

    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 },
      );
    }

    await prisma.promotionContent.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    const content = await prisma.promotionContent.create({
      data: {
        title,
        description,
        isActive: true,
      },
    });

    return NextResponse.json(content);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("Error creating promotion content:", error);
    return NextResponse.json(
      { error: "Failed to create promotion content" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireSuperuser();

    const { id, title, description, isActive } = await request.json();

    if (isActive) {
      await prisma.promotionContent.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }

    const content = await prisma.promotionContent.update({
      where: { id },
      data: { title, description, isActive },
    });

    return NextResponse.json(content);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("Error updating promotion content:", error);
    return NextResponse.json(
      { error: "Failed to update promotion content" },
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
        { error: "Content ID is required" },
        { status: 400 },
      );
    }

    await prisma.promotionContent.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error("Error deleting promotion content:", error);
    return NextResponse.json(
      { error: "Failed to delete promotion content" },
      { status: 500 },
    );
  }
}
