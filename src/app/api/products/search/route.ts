import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const searchTerm = searchParams.get("q") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "24");
    const categories = (
      searchParams.get("category_b64")?.split(",").filter(Boolean) || []
    ).map((c) => atob(c));
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

    // Calculate offset
    const offset = (page - 1) * pageSize;

    // Build where clause
    const whereClause: any = {
      OR: [
        { title: { contains: searchTerm } },
        { sku: { contains: searchTerm } },
        { description: { contains: searchTerm } },
        { longDescription: { contains: searchTerm } },
        { manufacturer: { contains: searchTerm } },
        { category: { contains: searchTerm } },
        { uom: { contains: searchTerm } },
        { aqcat: { contains: searchTerm } },
        { pattern: { contains: searchTerm } },
      ],
    };

    // Add category filter if present
    if (categories.length > 0) {
      whereClause.category = {
        in: categories.map((c) => decodeURIComponent(c)),
      };
    }

    // Add manufacturer filter if present
    if (manufacturers.length > 0) {
      whereClause.manufacturer = {
        in: manufacturers.map((m) => decodeURIComponent(m)),
      };
    }

    // Add collection filter if present
    if (collections.length > 0) {
      whereClause.aqcat = {
        in: collections.map((c) => decodeURIComponent(c)),
      };
    }

    // Add pattern filter if present
    if (patterns.length > 0) {
      whereClause.pattern = {
        in: patterns.map((p) => decodeURIComponent(p)),
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

    // Convert BigInt to number in the products array and format response
    const serializedProducts = products.map((product) => ({
      ...product,
      trx_product_id: Number(product.id),
      id: Number(product.id),
      qtyAvailable: Number(product.qtyAvailable),
      images: product.images.map((img) => ({ url: img.url })),
    }));

    // Determine if any filters are applied
    const noFiltersApplied =
      categories.length === 0 &&
      manufacturers.length === 0 &&
      collections.length === 0 &&
      patterns.length === 0 &&
      !quickShip;

    let availableCategories: string[] = [];
    let availableManufacturers: string[] = [];
    let availablePatterns: string[] = [];
    let availableCollections: string[] = [];
    let hasQuickShip = false;

    if (noFiltersApplied && searchTerm) {
      // Even with search term, we want to get all matching products for filter options
      // Get all products that match the search term without pagination
      const allSearchMatchingProducts = await prisma.product.findMany({
        where: whereClause,
        select: {
          category: true,
          manufacturer: true,
          pattern: true,
          aqcat: true,
          quickship: true,
        },
      });

      // Extract filter options from all search results
      availableCategories = [
        ...new Set(
          allSearchMatchingProducts
            .map((p) => p.category)
            .filter(
              (category): category is string =>
                category !== null && category !== undefined
            )
        ),
      ].sort();

      availableManufacturers = [
        ...new Set(
          allSearchMatchingProducts
            .map((p) => p.manufacturer)
            .filter(
              (manufacturer): manufacturer is string =>
                manufacturer !== null && manufacturer !== undefined
            )
        ),
      ].sort();

      // Get patterns directly from pattern column
      availablePatterns = [
        ...new Set(
          allSearchMatchingProducts
            .map((p) => p.pattern)
            .filter((p): p is string => p !== null)
        ),
      ].sort();

      // Get collections directly from aqcat column
      availableCollections = [
        ...new Set(
          allSearchMatchingProducts
            .map((p) => p.aqcat)
            .filter((c): c is string => c !== null)
        ),
      ].sort();

      hasQuickShip = allSearchMatchingProducts.some((p) => p.quickship);
    } else {
      // Get available filter options from all filtered search results, not just the current page
      const allFilteredProducts = await prisma.product.findMany({
        where: whereClause,
        select: {
          category: true,
          manufacturer: true,
          pattern: true,
          aqcat: true,
          quickship: true,
        },
      });

      // Get available filter options from filtered search results
      availableCategories = [
        ...new Set(allFilteredProducts.map((p) => p.category)),
      ]
        .filter(
          (category): category is string =>
            category !== null && category !== undefined
        )
        .sort();

      availableManufacturers = [
        ...new Set(allFilteredProducts.map((p) => p.manufacturer)),
      ]
        .filter(
          (manufacturer): manufacturer is string =>
            manufacturer !== null && manufacturer !== undefined
        )
        .sort();

      // Get patterns directly from pattern column
      availablePatterns = [
        ...new Set(
          allFilteredProducts
            .map((p) => p.pattern)
            .filter((p): p is string => p !== null)
        ),
      ].sort();

      // Get collections directly from aqcat column
      availableCollections = [
        ...new Set(
          allFilteredProducts
            .map((p) => p.aqcat)
            .filter((c): c is string => c !== null)
        ),
      ].sort();

      hasQuickShip = allFilteredProducts.some((p) => p.quickship);
    }

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
        availableCategories,
        availableManufacturers,
        availablePatterns,
        availableCollections,
        hasQuickShip,
        appliedCategories: categories || [],
        appliedManufacturers: manufacturers || [],
        appliedCollection: collections.join(",") || "",
        appliedPattern: patterns.join(",") || "",
        appliedQuickShip: quickShip,
      },
    });
  } catch (error) {
    console.error("Error in search:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
