import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [categories, manufacturers, patterns, collections, quickShip] =
      await Promise.all([
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
          select: { pattern: true },
          distinct: ["pattern"],
          where: {
            pattern: {
              not: null,
            },
          },
        }),
        prisma.product.findMany({
          select: { aqcat: true },
          distinct: ["aqcat"],
          where: {
            aqcat: {
              not: null,
            },
          },
        }),
        prisma.product.findFirst({
          where: {
            quickship: true,
          },
        }),
      ]);

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
        patterns: patterns
          .map((p) => p.pattern)
          .filter(Boolean)
          .sort(),
        collections: collections
          .map((c) => c.aqcat)
          .filter(Boolean)
          .sort(),
        hasQuickShip: !!quickShip,
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
