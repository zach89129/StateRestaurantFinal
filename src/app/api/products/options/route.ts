import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [
      categories,
      manufacturers,
      patterns,
      collections,
      stockItems,
      quickShip,
    ] = await Promise.all([
      prisma.product.findMany({
        select: { category: true },
        distinct: ["category"],
        where: {
          category: {
            not: null,
          },
        },
      }),
      prisma.product.findMany({
        select: { manufacturer: true },
        distinct: ["manufacturer"],
        where: {
          manufacturer: {
            not: null,
          },
        },
      }),
      prisma.product.findMany({
        select: { tags: true },
        where: {
          tags: {
            contains: "PATTERN_",
          },
        },
      }),
      prisma.product.findMany({
        select: { tags: true },
        where: {
          tags: {
            contains: "COLLECTION_",
          },
        },
      }),
      prisma.product.findMany({
        select: { tags: true },
        where: {
          tags: {
            contains: "Stock Item",
          },
        },
      }),
      prisma.product.findMany({
        select: { tags: true },
        where: {
          tags: {
            contains: "Quick Ship",
          },
        },
      }),
    ]);

    // Process tags to extract unique values
    const patternSet = new Set<string>();
    const collectionSet = new Set<string>();
    const hasStockItems = stockItems.length > 0;
    const hasQuickShip = quickShip.length > 0;

    patterns.forEach((product) => {
      const tags = product.tags?.split(",") || [];
      tags.forEach((tag) => {
        if (tag.includes("PATTERN_")) {
          patternSet.add(tag.split("PATTERN_")[1].trim());
        }
      });
    });

    collections.forEach((product) => {
      const tags = product.tags?.split(",") || [];
      tags.forEach((tag) => {
        if (tag.includes("COLLECTION_")) {
          collectionSet.add(tag.split("COLLECTION_")[1].trim());
        }
      });
    });

    return NextResponse.json({
      success: true,
      options: {
        categories: categories
          .map((c) => c.category)
          .filter(Boolean)
          .sort(),
        manufacturers: manufacturers
          .map((m) => m.manufacturer)
          .filter(Boolean)
          .sort(),
        patterns: Array.from(patternSet).sort(),
        collections: Array.from(collectionSet).sort(),
        hasStockItems,
        hasQuickShip,
      },
    });
  } catch (error) {
    console.error("Error fetching sort options:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
