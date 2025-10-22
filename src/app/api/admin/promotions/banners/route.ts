import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const banners = await prisma.promotionBanner.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(banners);
  } catch (error) {
    console.error("Error fetching banners:", error);
    return NextResponse.json(
      { error: "Failed to fetch banners" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const name = formData.get("name") as string;
    const targetUrl = formData.get("targetUrl") as string | null;

    if (!file || !name) {
      return NextResponse.json(
        { error: "File and name are required" },
        { status: 400 }
      );
    }

    // Upload to Vercel Blob
    const blob = await put(`promotions/banners/${file.name}`, file, {
      access: "public",
    });

    // Save to database
    const banner = await prisma.promotionBanner.create({
      data: {
        name,
        imageUrl: blob.url,
        targetUrl: targetUrl || null,
        isActive: false, // New banners are inactive by default
      },
    });

    return NextResponse.json(banner);
  } catch (error) {
    console.error("Error creating banner:", error);
    return NextResponse.json(
      { error: "Failed to create banner" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, isActive } = await request.json();

    if (isActive) {
      // Deactivate all other banners first
      await prisma.promotionBanner.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }

    const banner = await prisma.promotionBanner.update({
      where: { id },
      data: { isActive },
    });

    return NextResponse.json(banner);
  } catch (error) {
    console.error("Error updating banner:", error);
    return NextResponse.json(
      { error: "Failed to update banner" },
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
        { error: "Banner ID is required" },
        { status: 400 }
      );
    }

    await prisma.promotionBanner.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting banner:", error);
    return NextResponse.json(
      { error: "Failed to delete banner" },
      { status: 500 }
    );
  }
}
