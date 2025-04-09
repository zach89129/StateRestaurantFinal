import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { convertBigIntToString } from "@/utils/convertBigIntToString";
import { Prisma } from "@prisma/client";

interface RouteParams {
  params: {
    category: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { category: string } }
) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "24");
    const sort = searchParams.get("sort") || "";
    const manufacturers =
      searchParams
        .get("manufacturer")
        ?.split(",")
        .filter(Boolean)
        .map((m) => decodeURIComponent(m).trim()) || [];

    // Get collection and pattern filters
    const collection = searchParams.get("collection")?.trim();
    const pattern = searchParams.get("pattern")?.trim();
    const quickShip = searchParams.get("quickShip") === "true";

    // Calculate offset
    const offset = (page - 1) * pageSize;

    // Build where clause
    const whereClause: Prisma.ProductWhereInput = {
      category: {
        equals: decodeURIComponent(params.category),
      },
    };

    // Add manufacturer filter if present
    if (manufacturers.length > 0) {
      whereClause.manufacturer = {
        in: manufacturers,
      };
    }

    // Add collection filter if present
    if (collection) {
      whereClause.aqcat = {
        equals: collection,
      };
    }

    // Add pattern filter if present
    if (pattern) {
      whereClause.pattern = {
        equals: pattern,
      };
    }

    // Add quick ship filter if present
    if (quickShip) {
      whereClause.quickship = {
        equals: true,
      };
    }

    // Get total count for pagination
    const total = await prisma.product.count({
      where: whereClause,
    });

    // Get products with pagination
    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        images: true,
      },
      skip: offset,
      take: pageSize,
      orderBy: { title: sort === "name-desc" ? "desc" : "asc" },
    });

    // For filter options, get all available values
    let availableManufacturers: string[] = [];
    let availablePatterns: string[] = [];
    let availableCollections: string[] = [];
    let hasQuickShip = false;

    // If there are no filters applied, fetch all available options
    const noFiltersApplied =
      manufacturers.length === 0 && !collection && !pattern && !quickShip;

    if (noFiltersApplied) {
      // Fetch all available options
      const [allManufacturers, allPatterns, allCollections, quickShipCheck] =
        await Promise.all([
          // Get all manufacturers
          prisma.product.findMany({
            select: { manufacturer: true },
            distinct: ["manufacturer"],
            where: {
              category: {
                equals: decodeURIComponent(params.category),
              },
              manufacturer: { not: null },
            },
          }),
          // Get all patterns
          prisma.product.findMany({
            select: { pattern: true },
            distinct: ["pattern"],
            where: {
              category: {
                equals: decodeURIComponent(params.category),
              },
              pattern: { not: null },
            },
          }),
          // Get all collections
          prisma.product.findMany({
            select: { aqcat: true },
            distinct: ["aqcat"],
            where: {
              category: {
                equals: decodeURIComponent(params.category),
              },
              aqcat: { not: null },
            },
          }),
          // Check for quick ship items
          prisma.product.findFirst({
            where: {
              category: {
                equals: decodeURIComponent(params.category),
              },
              quickship: true,
            },
          }),
        ]);

      availableManufacturers = allManufacturers
        .map((m) => m.manufacturer)
        .filter((m): m is string => m !== null)
        .sort();

      availablePatterns = allPatterns
        .map((p) => p.pattern)
        .filter((p): p is string => p !== null)
        .sort();

      availableCollections = allCollections
        .map((c) => c.aqcat)
        .filter((c): c is string => c !== null)
        .sort();

      hasQuickShip = !!quickShipCheck;
    } else {
      // Use the current filtered products to determine available options
      const allFilteredProducts = await prisma.product.findMany({
        where: whereClause,
        select: {
          manufacturer: true,
          pattern: true,
          aqcat: true,
          quickship: true,
        },
      });

      availableManufacturers = [
        ...new Set(
          allFilteredProducts
            .map((p) => p.manufacturer)
            .filter((m): m is string => m !== null)
        ),
      ].sort();

      availablePatterns = [
        ...new Set(
          allFilteredProducts
            .map((p) => p.pattern)
            .filter((p): p is string => p !== null)
        ),
      ].sort();

      availableCollections = [
        ...new Set(
          allFilteredProducts
            .map((p) => p.aqcat)
            .filter((c): c is string => c !== null)
        ),
      ].sort();

      hasQuickShip = allFilteredProducts.some((p) => p.quickship);
    }

    // Convert BigInt to number and format the response
    const serializedProducts = products.map((product) => ({
      ...product,
      trx_product_id: Number(product.id),
      id: undefined,
      qtyAvailable: product.qtyAvailable ? Number(product.qtyAvailable) : 0,
      category: product.category || "",
      manufacturer: product.manufacturer || "",
      description: product.description || "",
    }));

    // Calculate pagination info
    const totalPages = Math.ceil(total / pageSize);
    const hasMore = page < totalPages;

    // Convert any remaining BigInt values to strings
    const safeProducts = convertBigIntToString(serializedProducts);

    // Ensure all response fields are defined
    const response = {
      success: true,
      products: safeProducts || [],
      pagination: {
        total,
        page,
        pageSize,
        totalPages,
        hasMore,
      },
      filters: {
        appliedManufacturers: manufacturers || [],
        appliedCollection: collection || "",
        appliedPattern: pattern || "",
        appliedQuickShip: quickShip,
        availableManufacturers,
        availablePatterns,
        availableCollections,
        hasQuickShip,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in GET /api/products/category/[category]:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch products",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}
