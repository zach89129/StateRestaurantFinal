import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  buildManufacturersByCategory,
  buildPatternBrowseByCategory,
  PATTERN_BROWSE_CATEGORIES,
  type PatternBrowseProduct,
} from "@/lib/patternBrowse";

export async function GET(request: NextRequest) {
  try {
    const manufacturerFilter =
      request.nextUrl.searchParams.get("manufacturer")?.trim() || null;

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
        manufacturer: true,
        images: {
          take: 1,
          select: { url: true },
        },
      },
    });

    const mappedProducts: PatternBrowseProduct[] = products.map((product) => ({
      title: product.title,
      category: product.category ?? "",
      pattern: product.pattern ?? "",
      manufacturer: product.manufacturer,
      images: product.images,
    }));

    const manufacturersByCategory =
      buildManufacturersByCategory(mappedProducts);

    const filteredProducts = manufacturerFilter
      ? mappedProducts.filter(
          (product) => product.manufacturer?.trim() === manufacturerFilter,
        )
      : mappedProducts;

    const patterns = buildPatternBrowseByCategory(filteredProducts);

    return NextResponse.json({
      success: true,
      patterns,
      manufacturersByCategory,
    });
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
