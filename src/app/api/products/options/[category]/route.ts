import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{
    category: string;
  }>;
}

export async function GET(request: Request, context: RouteParams) {
  try {
    const params = await context.params;
    const decodedCategory = decodeURIComponent(params.category);

    const products = await prisma.product.findMany({
      where: {
        category: decodedCategory,
      },
      select: {
        manufacturer: true,
        pattern: true,
        aqcat: true,
        quickship: true,
      },
    });

    // Extract unique manufacturers
    const manufacturers = [
      ...new Set(products.map((p) => p.manufacturer)),
    ].filter(Boolean);

    // Extract patterns
    const patterns = products
      .map((p) => p.pattern)
      .filter((p): p is string => p !== null);
    const uniquePatterns = [...new Set(patterns)];

    // Check if any products have quick ship
    const hasQuickShip = products.some((p) => p.quickship);

    return NextResponse.json({
      success: true,
      options: {
        manufacturers: manufacturers.sort(),
        patterns: uniquePatterns.sort(),
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
