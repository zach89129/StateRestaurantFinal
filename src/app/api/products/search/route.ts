import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const searchTerm = searchParams.get("q") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "24");
    const categories = searchParams.get("category")?.split(",") || [];
    const manufacturers = searchParams.get("manufacturer")?.split(",") || [];
    const tags = searchParams.get("tags")?.split(",") || [];

    // Calculate offset
    const offset = (page - 1) * pageSize;

    // Build where clause
    const whereClause: any = {
      OR: [
        { title: { contains: searchTerm } },
        { sku: { contains: searchTerm } },
        { description: { contains: searchTerm } },
        { manufacturer: { contains: searchTerm } },
        { category: { contains: searchTerm } },
        { uom: { contains: searchTerm } },
        { tags: { contains: searchTerm } },
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

    // Add tags filter if present
    if (tags.length > 0) {
      whereClause.AND = [
        {
          OR: tags.map((tag) => ({
            tags: {
              contains: tag,
            },
          })),
        },
      ];
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
      id: Number(product.id),
      qtyAvailable: Number(product.qtyAvailable),
      images: product.images.map((img) => ({ src: img.url })),
    }));

    // Determine if any filters are applied
    const noFiltersApplied =
      categories.length === 0 &&
      manufacturers.length === 0 &&
      tags.length === 0;

    let availableCategories: string[] = [];
    let availableManufacturers: string[] = [];
    let availablePatterns: string[] = [];
    let availableCollections: string[] = [];
    let hasStockItems = false;
    let hasQuickShip = false;

    if (noFiltersApplied && searchTerm) {
      // Even with search term, we want to get all matching products for filter options
      // Get all products that match the search term without pagination
      const allSearchMatchingProducts = await prisma.product.findMany({
        where: whereClause,
        select: {
          category: true,
          manufacturer: true,
          tags: true,
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

      // Extract patterns from matching products
      const patternsSet = new Set<string>();
      allSearchMatchingProducts.forEach((product) => {
        const tags = product.tags?.split(",") || [];
        tags.forEach((tag) => {
          const trimmedTag = tag.trim();
          if (trimmedTag.startsWith("PATTERN_")) {
            patternsSet.add(trimmedTag.replace("PATTERN_", ""));
          }
        });
      });
      availablePatterns = Array.from(patternsSet).sort();

      // Extract collections from matching products
      const collectionsSet = new Set<string>();
      allSearchMatchingProducts.forEach((product) => {
        const tags = product.tags?.split(",") || [];
        tags.forEach((tag) => {
          const trimmedTag = tag.trim();
          if (trimmedTag.startsWith("AQCAT_")) {
            collectionsSet.add(trimmedTag.replace("AQCAT_", ""));
          }
        });
      });
      availableCollections = Array.from(collectionsSet).sort();

      hasStockItems = allSearchMatchingProducts.some((p) =>
        p.tags?.includes("Stock Item")
      );
      hasQuickShip = allSearchMatchingProducts.some((p) =>
        p.tags?.includes("Quick Ship")
      );
    } else {
      // Get available filter options from all filtered search results, not just the current page
      const allFilteredProducts = await prisma.product.findMany({
        where: whereClause,
        select: {
          category: true,
          manufacturer: true,
          tags: true,
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

      // Extract patterns from all filtered products
      const availablePatternsArray = allFilteredProducts
        .map((p) =>
          p.tags
            ?.split(",")
            .filter((tag) => tag.startsWith("PATTERN_"))
            .map((tag) => tag.replace("PATTERN_", ""))
        )
        .flat()
        .filter(
          (pattern): pattern is string =>
            pattern !== null && pattern !== undefined
        );

      availablePatterns = [...new Set(availablePatternsArray)].sort();

      // Extract collections from all filtered products
      const availableCollectionsArray = allFilteredProducts
        .map((p) =>
          p.tags
            ?.split(",")
            .filter((tag) => tag.startsWith("AQCAT_"))
            .map((tag) => tag.replace("AQCAT_", ""))
        )
        .flat()
        .filter(
          (collection): collection is string =>
            collection !== null && collection !== undefined
        );

      availableCollections = [...new Set(availableCollectionsArray)].sort();

      hasStockItems = allFilteredProducts.some((p) =>
        p.tags?.includes("Stock Item")
      );
      hasQuickShip = allFilteredProducts.some((p) =>
        p.tags?.includes("Quick Ship")
      );
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
        hasStockItems,
        hasQuickShip,
      },
    });
  } catch (error) {
    console.error("Error searching products:", error);
    return NextResponse.json(
      { success: false, error: "Failed to search products" },
      { status: 500 }
    );
  }
}
