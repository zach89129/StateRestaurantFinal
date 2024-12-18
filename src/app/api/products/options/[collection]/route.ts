import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{
    collection: string;
  }>;
}

export async function GET(
  request: NextRequest,
  context: RouteParams
): Promise<NextResponse> {
  try {
    const params = await context.params;
    const { collection } = params;
    const searchPattern = `COLLECTION_${collection.toLowerCase()}`;

    const products = await prisma.product.findMany({
      where: {
        tags: {
          contains: searchPattern,
        },
      },
      select: {
        category: true,
        manufacturer: true,
        tags: true,
      },
    });

    // Extract unique categories and manufacturers
    const categories = [...new Set(products.map((p) => p.category))].filter(
      Boolean
    );
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

    // Extract collections from tags
    const collections = products
      .map((p) => {
        const tags = p.tags?.split(",").map((t) => t.trim()) || [];
        return tags
          .filter((tag) => tag.startsWith("COLLECTION_"))
          .map((tag) => tag.replace("COLLECTION_", ""));
      })
      .flat();
    const uniqueCollections = [...new Set(collections)];

    // Check if any products have stock items or quick ship
    const hasStockItems = products.some(
      (p) => p.tags?.includes("stock-item") || false
    );
    const hasQuickShip = products.some(
      (p) => p.tags?.includes("quick-ship") || false
    );

    return NextResponse.json({
      success: true,
      options: {
        categories: categories.sort(),
        manufacturers: manufacturers.sort(),
        patterns: uniquePatterns.sort(),
        collections: uniqueCollections.sort(),
        hasStockItems,
        hasQuickShip,
      },
    });
  } catch (error) {
    console.error("Error fetching filter options:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch filter options" },
      { status: 500 }
    );
  }
}
