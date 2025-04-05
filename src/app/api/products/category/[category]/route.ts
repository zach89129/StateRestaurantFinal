import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

interface RouteParams {
  params: Promise<{
    category: string;
  }>;
}

export async function GET(request: Request, context: RouteParams) {
  try {
    const params = await context.params;
    // First decode the URL component
    const decodedCategory = decodeURIComponent(params.category);

    // Then convert hyphens back to spaces
    const formattedCategory = decodedCategory.replace(/-/g, " ");

    const { searchParams } = new URL(request.url);

    // Special case for Speigelau category
    if (decodedCategory === "glassware-speigelau-masters-reserve") {
      console.log("Special case detected: Speigelau Masters Reserve");
      // Try exact match for this specific category with two spaces after the comma
      const speigelauCategory = "Glassware Speigelau,  Masters Reserve";

      // Check if this category exists in the database
      const categoryExists = await prisma.product.findFirst({
        where: {
          category: speigelauCategory,
        },
        select: { id: true },
      });

      if (categoryExists) {
        console.log(
          "Found exact match for special category:",
          speigelauCategory
        );
        // Use this category directly
        const where: Prisma.ProductWhereInput = {
          category: speigelauCategory,
        };

        // Get total count for pagination
        const total = await prisma.product.count({ where });

        // Get products with pagination
        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = parseInt(searchParams.get("pageSize") || "24");
        const skip = (page - 1) * pageSize;

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
          `Found ${products.length} products for special category ${speigelauCategory}`
        );

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
            categories: [speigelauCategory],
            manufacturers: [], // We'll skip computing these for this special case
            patterns: [],
            collections: [],
            hasStockItems: false,
            hasQuickShip: false,
          },
          pagination: {
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
            hasMore: page < Math.ceil(total / pageSize),
          },
        });
      }
    }

    // First, let's try to find all similar categories in the database to debug
    const allCategories = await prisma.product.findMany({
      select: {
        category: true,
      },
      distinct: ["category"],
      where: {
        category: {
          not: null,
        },
      },
    });

    console.log(
      "Available categories in database:",
      allCategories.map((c) => c.category).filter(Boolean)
    );

    // Try to find a close match if exact match fails
    let categoryToUse = formattedCategory;
    const exactMatch = allCategories.find(
      (c) => c.category?.toLowerCase() === formattedCategory.toLowerCase()
    );

    if (!exactMatch) {
      console.log("No exact match found, looking for similar categories...");
      // Look for a category that contains our search term or vice versa
      const similarCategory = allCategories.find(
        (c) =>
          c.category?.toLowerCase().includes(formattedCategory.toLowerCase()) ||
          formattedCategory
            .toLowerCase()
            .includes(c.category?.toLowerCase() || "")
      );

      if (similarCategory) {
        console.log("Found similar category:", similarCategory.category);
        categoryToUse = similarCategory.category || formattedCategory;
      }
    } else {
      console.log("Exact match found!");
    }

    // Build where clause - start with category match
    const where: Prisma.ProductWhereInput = {
      category: categoryToUse,
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
        category: categoryToUse,
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
      `Found ${products.length} products for category ${categoryToUse}`
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
        categories: [categoryToUse], // Only the current category
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
