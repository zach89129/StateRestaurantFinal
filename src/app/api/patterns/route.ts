import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  buildPatternBrowseByCategory,
  PATTERN_BROWSE_CATEGORIES,
} from "@/lib/patternBrowse";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: {
        category: { in: [...PATTERN_BROWSE_CATEGORIES] },
        pattern: { not: null },
        OR: [{ dead: false }, { dead: null }],
      },
      select: {
        title: true,
        category: true,
        pattern: true,
        images: {
          take: 1,
          select: { url: true },
        },
      },
    });

    const patterns = buildPatternBrowseByCategory(
      products.map((product) => ({
        title: product.title,
        category: product.category ?? "",
        pattern: product.pattern ?? "",
        images: product.images,
      })),
    );

    return NextResponse.json({ success: true, patterns });
  } catch (error) {
    console.error("Error in GET /api/patterns:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch patterns",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
