import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";

async function requireSuperuser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isSuperuser) {
    throw new Error("Unauthorized");
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireSuperuser();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as "manufacturer" | "china_flatware" | null;

    const where = type && ["manufacturer", "china_flatware"].includes(type) ? { type } : {};

    const vendors = await prisma.vendorLink.findMany({
      where,
      orderBy: [{ type: "asc" }, { order: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(vendors);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }
    console.error("Error fetching vendors:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendors" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSuperuser();

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const url = formData.get("url") as string;
    const type = formData.get("type") as string;
    const order = parseInt((formData.get("order") as string) || "0", 10);
    const file = formData.get("file") as File | null;

    if (!name || !url || !type || !["manufacturer", "china_flatware"].includes(type)) {
      return NextResponse.json(
        { error: "Name, url, and valid type (manufacturer or china_flatware) are required" },
        { status: 400 }
      );
    }

    let imageUrl: string | null = null;
    if (type === "china_flatware" && file && file.size > 0) {
      const blob = await put(`vendors/china-flatware/${Date.now()}-${file.name}`, file, {
        access: "public",
      });
      imageUrl = blob.url;
    }

    const vendor = await prisma.vendorLink.create({
      data: {
        name,
        url,
        imageUrl,
        type,
        order,
      },
    });

    return NextResponse.json(vendor);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }
    console.error("Error creating vendor:", error);
    return NextResponse.json(
      { error: "Failed to create vendor" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireSuperuser();

    const formData = await request.formData();
    const id = parseInt(formData.get("id") as string, 10);
    const name = formData.get("name") as string | null;
    const url = formData.get("url") as string | null;
    const order = formData.get("order");
    const file = formData.get("file") as File | null;

    if (!id || isNaN(id)) {
      return NextResponse.json({ error: "Valid id is required" }, { status: 400 });
    }

    const existing = await prisma.vendorLink.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    const data: { name?: string; url?: string; order?: number; imageUrl?: string | null } = {};
    if (name != null) data.name = name;
    if (url != null) data.url = url;
    if (order != null) data.order = parseInt(order as string, 10);

    if (existing.type === "china_flatware" && file && file.size > 0) {
      const blob = await put(`vendors/china-flatware/${Date.now()}-${file.name}`, file, {
        access: "public",
      });
      data.imageUrl = blob.url;
    }

    const vendor = await prisma.vendorLink.update({
      where: { id },
      data,
    });

    return NextResponse.json(vendor);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }
    console.error("Error updating vendor:", error);
    return NextResponse.json(
      { error: "Failed to update vendor" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireSuperuser();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Vendor id is required" }, { status: 400 });
    }

    await prisma.vendorLink.delete({
      where: { id: parseInt(id, 10) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }
    console.error("Error deleting vendor:", error);
    return NextResponse.json(
      { error: "Failed to delete vendor" },
      { status: 500 }
    );
  }
}
