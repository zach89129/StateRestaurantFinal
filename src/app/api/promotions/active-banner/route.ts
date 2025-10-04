import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const activeBanner = await prisma.promotionBanner.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(activeBanner);
  } catch (error) {
    console.error("Error fetching active banner:", error);
    return NextResponse.json(
      { error: "Failed to fetch active banner" },
      { status: 500 }
    );
  }
}
