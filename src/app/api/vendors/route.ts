import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as "manufacturer" | "china_flatware" | null;

    if (!type || !["manufacturer", "china_flatware"].includes(type)) {
      return NextResponse.json(
        { error: "Valid type query param required: manufacturer or china_flatware" },
        { status: 400 }
      );
    }

    const vendors = await prisma.vendorLink.findMany({
      where: { type },
      orderBy:
        type === "china_flatware"
          ? [{ order: "asc" }, { name: "asc" }]
          : { name: "asc" },
    });

    return NextResponse.json(vendors);
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendors" },
      { status: 500 }
    );
  }
}
