import { NextResponse } from "next/server";
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
