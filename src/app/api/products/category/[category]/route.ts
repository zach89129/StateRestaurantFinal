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
    const manufacturers = (
      searchParams.get("manufacturer_b64")?.split(",").filter(Boolean) || []
    ).map((m) => atob(m));
    const patterns = (
      searchParams.get("pattern_b64")?.split(",").filter(Boolean) || []
    ).map((p) => atob(p));
    const collections = (
      searchParams.get("collection_b64")?.split(",").filter(Boolean) || []
    ).map((c) => atob(c));
    const quickShip = searchParams.get("quickShip") === "true";
    const category = decodeURIComponent(params.category);

    // Calculate offset for pagination
    const offset = (page - 1) * pageSize;

    // Build where clause
    const whereClause: any = {
      category: category,
    };

    // Add manufacturer filter if present
    if (manufacturers.length > 0) {
      whereClause.manufacturer = {
        in: manufacturers.map((m) => decodeURIComponent(m)),
      };
    }

    // Add pattern filter if present
    if (patterns.length > 0) {
      whereClause.pattern = {
        in: patterns.map((p) => decodeURIComponent(p)),
      };
    }

    // Add collection filter if present
    if (collections.length > 0) {
      whereClause.aqcat = {
        in: collections.map((c) => decodeURIComponent(c)),
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

    // Fetch products with pagination
    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: { title: "asc" },
      skip: offset,
      take: pageSize,
      include: {
        images: true,
      },
    });

    // Convert BigInt to number in the products array
    const serializedProducts = products.map((product) => ({
      ...product,
      trx_product_id: Number(product.id),
      id: Number(product.id),
      qtyAvailable: Number(product.qtyAvailable),
      images: product.images.map((img) => ({ url: img.url })),
    }));

    // Get all products for filter options
    const allProducts = await prisma.product.findMany({
      where: { category },
      select: {
        manufacturer: true,
        pattern: true,
        aqcat: true,
        quickship: true,
      },
    });

    // Extract available filter options
    const availableManufacturers = [
      ...new Set(allProducts.map((p) => p.manufacturer)),
    ]
      .filter(
        (manufacturer): manufacturer is string =>
          manufacturer !== null && manufacturer !== undefined
      )
      .sort();

    const availablePatterns = [...new Set(allProducts.map((p) => p.pattern))]
      .filter((pattern): pattern is string => pattern !== null)
      .sort();

    const availableCollections = [...new Set(allProducts.map((p) => p.aqcat))]
      .filter((collection): collection is string => collection !== null)
      .sort();

    const hasQuickShip = allProducts.some((p) => p.quickship);

    // Calculate pagination info
    const totalPages = Math.ceil(total / pageSize);
    const hasMore = page < totalPages;

    return NextResponse.json({
      success: true,
      products: serializedProducts,
      pagination: {
        total,
        page,
        pageSize,
        totalPages,
        hasMore,
      },
      filters: {
        availableManufacturers,
        availablePatterns,
        availableCollections,
        hasQuickShip,
        appliedManufacturers: manufacturers || [],
        appliedPattern: patterns.join(",") || "",
        appliedCollection: collections.join(",") || "",
        appliedQuickShip: quickShip,
      },
    });
  } catch (error) {
    console.error("Error in category route:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
