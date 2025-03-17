import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { category: string } }
) {
  try {
    const { category } = params;

    const products = await prisma.product.findMany({
      where: {
        category: category,
      },
      select: {
        tags: true,
        manufacturer: true,
      },
    });

    // Extract unique manufacturers
    const manufacturers = [
      ...new Set(products.map((p) => p.manufacturer)),
    ].filter(Boolean);

    // Extract patterns from tags
    const patterns = products
      .map((p) => {
        const tags = p.tags?.split(",").map((t) => t.trim()) || [];
        return tags
          .filter((tag) => tag.startsWith("PATTERN_"))
          .map((tag) => tag.replace("PATTERN_", ""));
      })
      .flat();
    const uniquePatterns = [...new Set(patterns)];

    // Check if any products have stock items or quick ship
    const hasStockItems = products.some(
      (p) => p.tags?.includes("Stock Item") || false
    );
    const hasQuickShip = products.some(
      (p) => p.tags?.includes("Quick Ship") || false
    );

    return NextResponse.json({
      success: true,
      options: {
        manufacturers: manufacturers.sort(),
        patterns: uniquePatterns.sort(),
        hasStockItems,
        hasQuickShip,
      },
    });
  } catch (error) {
    console.error("Error fetching filter options:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
