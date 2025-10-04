import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const content = await prisma.promotionContent.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(content);
  } catch (error) {
    console.error("Error fetching promotion content:", error);
    return NextResponse.json(
      { error: "Failed to fetch promotion content" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, description } = await request.json();

    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 }
      );
    }

    // Deactivate all existing content first
    await prisma.promotionContent.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Create new content
    const content = await prisma.promotionContent.create({
      data: {
        title,
        description,
        isActive: true,
      },
    });

    return NextResponse.json(content);
  } catch (error) {
    console.error("Error creating promotion content:", error);
    return NextResponse.json(
      { error: "Failed to create promotion content" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, title, description, isActive } = await request.json();

    if (isActive) {
      // Deactivate all other content first
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
    console.error("Error updating promotion content:", error);
    return NextResponse.json(
      { error: "Failed to update promotion content" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Content ID is required" },
        { status: 400 }
      );
    }

    await prisma.promotionContent.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting promotion content:", error);
    return NextResponse.json(
      { error: "Failed to delete promotion content" },
      { status: 500 }
    );
  }
}
