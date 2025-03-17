import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: { category: string } }
) {
  try {
    const decodedCategory = decodeURIComponent(params.category);
    const { searchParams } = new URL(request.url);

    console.log("Searching for category:", decodedCategory);

    // Build where clause - start with exact category match
    const where: Prisma.ProductWhereInput = {
      category: decodedCategory,
    };

    const conditions: Prisma.ProductWhereInput[] = [];

    // Add manufacturer filter if present
    const manufacturer = searchParams.get("manufacturer");
    if (manufacturer) {
      const manufacturers = decodeURIComponent(manufacturer)
        .split(",")
        .filter(Boolean);
      if (manufacturers.length > 0) {
        conditions.push({
          OR: manufacturers.map((mfr) => ({
            manufacturer: {
              not: null,
              contains: mfr.toLowerCase(),
            },
          })),
        });
      }
    }

    // Add pattern filter if present
    const pattern = searchParams.get("pattern");
    if (pattern) {
      const patterns = decodeURIComponent(pattern).split(",").filter(Boolean);
      if (patterns.length > 0) {
        console.log("Searching for patterns:", patterns);
        conditions.push({
          OR: patterns.map((pat) => ({
            AND: [
              {
                tags: {
                  not: null,
                },
              },
              {
                tags: {
                  contains: `PATTERN_${pat}`,
                },
              },
            ],
          })),
        });
      }
    }

    // Add tags filter if present
    const tags = searchParams.get("tags")?.split(",").filter(Boolean) || [];
    if (tags.length > 0) {
      // Separate collection tags from other tags
      const collectionTags = tags.filter(
        (tag) =>
          !tag.startsWith("PATTERN_") &&
          !tag.startsWith("AQCAT_") &&
          !["Stock Item", "Quick Ship", "Stock Item / Quick Ship"].includes(tag)
      );

      const specialTags = tags.filter((tag) =>
        ["Stock Item", "Quick Ship", "Stock Item / Quick Ship"].includes(tag)
      );

      // Add collection tags with OR condition
      if (collectionTags.length > 0) {
        conditions.push({
          OR: collectionTags.map((tag) => ({
            tags: { contains: tag },
          })),
        });
      }

      // Add special tags (Stock Item, Quick Ship) with OR condition
      if (specialTags.length > 0) {
        conditions.push({
          OR: specialTags.map((tag) => ({
            tags: { contains: tag },
          })),
        });
      }
    }

    // Add all conditions to where clause with AND
    if (conditions.length > 0) {
      where.AND = conditions;
    }

    // Get total count for pagination
    const total = await prisma.product.count({ where });

    // Get products with pagination
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "24");
    const skip = (page - 1) * pageSize;

    // First get all products in this category for filter calculation
    const allCategoryProducts = await prisma.product.findMany({
      where: {
        category: decodedCategory,
      },
      select: {
        category: true,
        manufacturer: true,
        tags: true,
      },
    });

    console.log(
      "All products tags:",
      allCategoryProducts.map((p) => p.tags)
    );

    // Calculate filter options
    const manufacturers = [
      ...new Set(allCategoryProducts.map((p) => p.manufacturer)),
    ].filter(Boolean);

    // Extract patterns from tags
    const patterns = [
      ...new Set(
        allCategoryProducts
          .map((p) => p.tags?.split(",").map((t) => t.trim()) || [])
          .flat()
          .filter((tag) => tag?.startsWith("PATTERN_"))
          .map((tag) => tag?.replace("PATTERN_", ""))
      ),
    ].filter(Boolean);

    // Extract collections from tags
    const collections = [
      ...new Set(
        allCategoryProducts
          .map((p) => p.tags?.split(",").map((t) => t.trim()) || [])
          .flat()
          .filter((tag) => tag?.startsWith("AQCAT_"))
          .map((tag) => tag?.replace("AQCAT_", ""))
      ),
    ].filter(Boolean);

    // Check for stock items and quick ship
    const hasStockItems = allCategoryProducts.some((p) =>
      p.tags?.includes("Stock Item")
    );
    const hasQuickShip = allCategoryProducts.some((p) =>
      p.tags?.includes("Quick Ship")
    );

    // Get paginated products for display
    const products = await prisma.product.findMany({
      where,
      include: {
        images: true,
      },
      skip,
      take: pageSize,
      orderBy: {
        title: "asc",
      },
    });

    console.log(
      `Found ${products.length} products for category ${decodedCategory}`
    );
    if (products.length === 0) {
      console.log("Where clause used:", JSON.stringify(where, null, 2));
    }

    // Format the response
    const formattedProducts = products.map((product) => ({
      ...product,
      trx_product_id: Number(product.id),
      id: undefined,
      qtyAvailable: product.qtyAvailable ? Number(product.qtyAvailable) : 0,
      category: product.category || "",
      manufacturer: product.manufacturer || "",
      description: product.description || "",
      tags: product.tags ? `,${product.tags},` : "",
      images: product.images?.map((img) => ({ src: img.url })) || [],
    }));

    return NextResponse.json({
      success: true,
      products: formattedProducts,
      filters: {
        categories: [decodedCategory], // Only the current category
        manufacturers: manufacturers.sort(),
        patterns: patterns.sort(),
        collections: collections.sort(),
        hasStockItems,
        hasQuickShip,
      },
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        hasMore: page < Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
