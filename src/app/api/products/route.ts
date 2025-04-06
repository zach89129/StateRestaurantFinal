import { prisma } from "@/lib/prisma";
import { ProductInput } from "@/types/api";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { convertBigIntToString } from "@/utils/convertBigIntToString";

const MAX_PAGE_SIZE = 100;

type ProductUpdateData = Prisma.ProductUpdateInput;

export async function POST(request: NextRequest) {
  if (!request.body) {
    return NextResponse.json(
      { error: "Missing request body" },
      { status: 400 }
    );
  }

  try {
    const bodyText = await request.text();
    const body: ProductInput = JSON.parse(bodyText);

    if (!body.products || !Array.isArray(body.products)) {
      return NextResponse.json(
        { error: "Invalid products format" },
        { status: 400 }
      );
    }

    if (body.products.length > MAX_PAGE_SIZE) {
      return NextResponse.json(
        { error: `Maximum batch size is ${MAX_PAGE_SIZE} products` },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    for (const product of body.products) {
      try {
        if (!product.trx_product_id) {
          throw new Error("Missing trx_product_id");
        }

        const existingProduct = await prisma.product.findUnique({
          where: { id: BigInt(product.trx_product_id) },
          include: { images: true },
        });

        if (existingProduct) {
          const updateData: ProductUpdateData = {};
          if (product.sku !== undefined) updateData.sku = product.sku;
          if (product.title !== undefined) updateData.title = product.title;
          if (product.description !== undefined)
            updateData.description = product.description;
          if (product.manufacturer !== undefined)
            updateData.manufacturer = product.manufacturer;
          if (product.category !== undefined)
            updateData.category = product.category;
          if (product.uom !== undefined) updateData.uom = product.uom;
          if (product.qty_available !== undefined)
            updateData.qtyAvailable = product.qty_available;
          if (product.tags !== undefined) updateData.tags = product.tags || "";

          // Handle image updates
          if (product.images?.length) {
            // Delete existing images
            await prisma.productImage.deleteMany({
              where: { productId: BigInt(product.trx_product_id) },
            });

            // Add new images
            updateData.images = {
              createMany: {
                data: product.images.map((img) => ({ url: img.src })),
              },
            };
          }

          const updatedProduct = await prisma.product.update({
            where: { id: BigInt(product.trx_product_id) },
            data: updateData,
            include: { images: true },
          });

          results.push({
            trx_product_id: Number(updatedProduct.id),
            ...updatedProduct,
            id: undefined,
            images: updatedProduct.images.map((img) => ({ src: img.url })),
          });
        } else {
          // Validate all required fields for creation
          const requiredFields = [
            "sku",
            "title",
            "description",
            "manufacturer",
            "category",
            "uom",
            "qty_available",
          ] as const;

          const missingFields = requiredFields.filter((field) => {
            const value =
              field === "qty_available" ? product[field] : product[field];
            return value === undefined || value === null || value === "";
          });

          if (missingFields.length > 0) {
            throw new Error(
              `Missing required fields for new product: ${missingFields.join(
                ", "
              )}`
            );
          }

          const newProduct = await prisma.product.create({
            data: {
              id: BigInt(product.trx_product_id),
              sku: product.sku,
              title: product.title,
              description: product.description,
              manufacturer: product.manufacturer,
              category: product.category,
              uom: product.uom,
              qtyAvailable: product.qty_available,
              tags: product.tags || "",
              images: product.images?.length
                ? {
                    createMany: {
                      data: product.images.map((img) => ({ url: img.src })),
                    },
                  }
                : undefined,
            },
            include: { images: true },
          });

          results.push({
            ...newProduct,
            trx_product_id: Number(newProduct.id),
            images: newProduct.images.map((img) => ({ src: img.url })),
          });
        }
      } catch (err) {
        errors.push({
          product_id: product.trx_product_id,
          sku: product.sku,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    // Convert any remaining BigInt values to strings
    const safeResults = convertBigIntToString(results);

    return NextResponse.json({
      success: true,
      processed: results.length,
      errors: errors.length > 0 ? errors : undefined,
      results: safeResults,
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "24");
    const sort = searchParams.get("sort") || "";
    const categories =
      searchParams
        .get("category")
        ?.split(",")
        .filter(Boolean)
        .map((c) => decodeURIComponent(c).trim()) || [];
    const manufacturers =
      searchParams
        .get("manufacturer")
        ?.split(",")
        .filter(Boolean)
        .map((m) => decodeURIComponent(m).trim()) || [];
    const tags = searchParams.get("tags")?.split(",").filter(Boolean) || [];

    // Get tags parameter and parse it
    const tagsParam = searchParams.get("tags");
    const isExactMatch = searchParams.get("exact") === "true";
    console.log("Raw tags parameter:", tagsParam);
    console.log("Exact match requested:", isExactMatch);

    let processedTags: string[] = [];

    if (
      tagsParam &&
      tagsParam.startsWith("AQCAT_") &&
      (tagsParam.includes("%2C") || isExactMatch)
    ) {
      // This is likely a single AQCAT_ tag with URL-encoded commas
      console.log("Detected AQCAT_ tag with special handling");
      processedTags = [tagsParam];
    } else {
      // Normal tag splitting
      processedTags = tags;
    }

    console.log("Processed tags array:", processedTags);

    // Calculate offset
    const offset = (page - 1) * pageSize;

    // Build where clause
    const whereClause: Prisma.ProductWhereInput = {};
    const conditions: Prisma.ProductWhereInput[] = [];

    // Add category filter if present
    if (categories.length > 0) {
      const categoryCondition = {
        OR: categories.map((category) => ({
          category: {
            not: null,
            contains: category.toLowerCase(),
          },
        })),
      };
      conditions.push(categoryCondition);
      console.log(
        "Category condition:",
        JSON.stringify(categoryCondition, null, 2)
      );
    }

    // Add manufacturer filter if present
    if (manufacturers.length > 0) {
      conditions.push({
        OR: manufacturers.map((manufacturer) => ({
          manufacturer: {
            not: null,
            contains: manufacturer.toLowerCase(),
          },
        })),
      });
    }

    // Separate tags by type
    console.log("Original tags from URL:", processedTags);

    // First decode any URL-encoded tags
    const decodedTags = processedTags.map((tag) => decodeURIComponent(tag));
    console.log("Decoded tags:", decodedTags);

    const patternTags = decodedTags.filter((tag) => tag.startsWith("PATTERN_"));
    console.log("Pattern tags:", patternTags);

    const stockAndQuickShipTags = decodedTags.filter((tag) =>
      ["Stock Item", "Quick Ship", "Stock Item / Quick Ship"].includes(tag)
    );
    console.log("Stock/QuickShip tags:", stockAndQuickShipTags);

    const collectionTags = decodedTags.filter((tag) => {
      // If it's an AQCAT_ tag, include it
      if (tag.startsWith("AQCAT_")) {
        return true;
      }

      // If it doesn't have any special prefix and isn't a stock/quick ship tag
      if (
        !tag.startsWith("PATTERN_") &&
        !["Stock Item", "Quick Ship", "Stock Item / Quick Ship"].includes(tag)
      ) {
        return true;
      }

      return false;
    });
    console.log("Collection tags:", collectionTags);

    // Add null/empty tag handling for proper filtering
    if (
      decodedTags.includes("null") ||
      decodedTags.includes("undefined") ||
      decodedTags.includes("")
    ) {
      conditions.push({
        OR: [{ tags: null }, { tags: "" }],
      });
    }

    // Get patterns from the pattern parameter
    const patterns =
      searchParams.get("pattern")?.split(",").filter(Boolean) || [];
    if (patterns.length > 0) {
      conditions.push({
        OR: patterns.map((pattern) => ({
          AND: [
            {
              tags: {
                not: null,
              },
            },
            {
              tags: {
                contains: `PATTERN_${pattern}`,
              },
            },
          ],
        })),
      });
    }

    // Add collection tags with OR condition
    if (collectionTags.length > 0) {
      // Log the exact collection tags we're looking for to help debug
      console.log("Collection tags to match:", collectionTags);

      // Check if we have a single AQCAT_ tag that might contain a comma
      if (
        collectionTags.length === 1 &&
        collectionTags[0].startsWith("AQCAT_")
      ) {
        const singleTag = collectionTags[0];
        console.log("Single AQCAT_ tag detected:", singleTag);

        // Log the exact tag we're looking for to compare with database values
        console.log("Looking for tag in database exactly as:", singleTag);

        // If exact match is requested, use direct equality or contains with specific formatting
        if (isExactMatch) {
          console.log("Using strict exact matching for AQCAT_ tag");

          // Normalize the tag, removing URL encoding
          const decodedTag = decodeURIComponent(singleTag);
          console.log("Decoded tag for direct comparison:", decodedTag);

          // Direct equality match
          conditions.push({
            OR: [
              // Exact match as the only tag
              { tags: { equals: decodedTag } },
              // Match surrounded by commas (tag in the middle of a list)
              { tags: { contains: `,${decodedTag},` } },
              // Match at start with comma after
              { tags: { startsWith: `${decodedTag},` } },
              // Match at end with comma before
              { tags: { endsWith: `,${decodedTag}` } },
            ],
          });

          console.log("Using direct equality conditions");
          // Continue processing instead of returning
        } else {
          // Handle non-exact match case here
          // For debugging, let's see what tags exist in the database
          const searchTagBase = singleTag.includes("%20")
            ? singleTag.replace(/%20/g, " ")
            : singleTag;

          console.log(
            "Non-exact match - using search tag base:",
            searchTagBase
          );

          // Add more flexible matching conditions
          conditions.push({
            OR: [
              // Exact match
              { tags: { equals: decodeURIComponent(singleTag) } },
              // More flexible matching for similar tags
              { tags: { contains: searchTagBase.split("%2C")[0] } },
            ],
          });
        }
      } else {
        conditions.push({
          OR: collectionTags.map((tag) => {
            // For URL-encoded tags, decode them first
            const decodedTag = decodeURIComponent(tag);
            console.log(
              `Processing collection tag: ${tag}, decoded: ${decodedTag}`
            );

            // For tags that already include AQCAT_, use exact matching
            if (decodedTag.startsWith("AQCAT_")) {
              console.log(`Using exact match for AQCAT_ tag: ${decodedTag}`);
              return {
                OR: [
                  // Match where the tag appears exactly, surrounded by commas or at start/end
                  {
                    tags: {
                      contains: `,${decodedTag},`,
                    },
                  },
                  // Match at the start of the tags string, followed by a comma
                  {
                    tags: {
                      startsWith: `${decodedTag},`,
                    },
                  },
                  // Match at the end of the tags string, preceded by a comma
                  {
                    tags: {
                      endsWith: `,${decodedTag}`,
                    },
                  },
                  // Match as the only tag
                  {
                    tags: {
                      equals: decodedTag,
                    },
                  },
                ],
              };
            }

            // For regular collection tags (without AQCAT_ prefix), use the old approach but with more precision
            console.log(`Using regular match for tag: ${decodedTag}`);
            const tagWithPrefix = `AQCAT_${decodedTag}`;
            return {
              OR: [
                {
                  tags: {
                    contains: `,${tagWithPrefix},`,
                  },
                },
                {
                  tags: {
                    startsWith: `${tagWithPrefix},`,
                  },
                },
                {
                  tags: {
                    endsWith: `,${tagWithPrefix}`,
                  },
                },
                {
                  tags: {
                    equals: tagWithPrefix,
                  },
                },
              ],
            };
          }),
        });
      }
    }

    // Add stock/quick ship tags with OR condition
    if (stockAndQuickShipTags.length > 0) {
      conditions.push({
        OR: stockAndQuickShipTags.map((tag) => ({
          tags: {
            contains: tag,
          },
        })),
      });
    }

    // Combine all conditions with AND
    if (conditions.length > 0) {
      whereClause.AND = conditions;
    }
    console.log("Final where clause:", JSON.stringify(whereClause, null, 2));

    // Get total count for pagination
    const total = await prisma.product
      .count({
        where: whereClause,
      })
      .catch((error) => {
        console.error("Error counting products:", error);
        throw new Error("Failed to count products");
      });

    console.log("Total products found:", total);
    console.log("Page size:", pageSize);
    console.log("Current page:", page);

    // Build order by clause
    let orderBy: Prisma.ProductOrderByWithRelationInput = { title: "asc" };
    if (sort === "name-desc") {
      orderBy = { title: "desc" };
    }

    // Calculate skip value
    const skip = (page - 1) * pageSize;
    console.log("Skip value:", skip, "Take value:", pageSize);

    // Fetch products
    console.log("Executing query with params:", {
      where: whereClause,
      orderBy,
      skip: skip,
      take: pageSize,
    });

    const products = await prisma.product
      .findMany({
        where: whereClause,
        orderBy,
        skip: skip,
        take: pageSize,
        include: {
          images: true,
        },
      })
      .catch((error) => {
        console.error("Error fetching products:", error);
        throw new Error("Failed to fetch products");
      });

    console.log("Query returned products:", products.length);

    // Convert BigInt to number and format the response
    const serializedProducts = products.map((product) => ({
      ...product,
      trx_product_id: Number(product.id),
      id: undefined,
      qtyAvailable: product.qtyAvailable ? Number(product.qtyAvailable) : 0,
      category: product.category || "",
      manufacturer: product.manufacturer || "",
      description: product.description || "",
      tags: product.tags || "",
      images: product.images?.map((img) => ({ src: img.url })) || [],
    }));

    // Calculate pagination info
    const totalPages = Math.ceil(total / pageSize);
    const hasMore = page < totalPages;

    console.log("Total pages calculated:", totalPages);
    console.log("Has more pages:", hasMore);

    // Convert any remaining BigInt values to strings
    const safeProducts = convertBigIntToString(serializedProducts);

    // Get the available manufacturers, patterns, and collections from the filtered products
    let availableManufacturers: string[] = [];
    let availablePatterns: string[] = [];
    let availableCollections: string[] = [];
    let availableCategories: string[] = [];
    let hasStockItems = false;
    let hasQuickShip = false;

    // If there are no filters applied, fetch all available options
    const noFiltersApplied =
      categories.length === 0 &&
      manufacturers.length === 0 &&
      patterns.length === 0 &&
      collectionTags.length === 0 &&
      stockAndQuickShipTags.length === 0;

    if (noFiltersApplied) {
      // Fetch all available options
      const [
        allCategories,
        allManufacturers,
        allPatterns,
        allCollections,
        stockItemCheck,
        quickShipCheck,
      ] = await Promise.all([
        // Get all categories
        prisma.product.findMany({
          select: { category: true },
          distinct: ["category"],
          where: { category: { not: null } },
        }),
        // Get all manufacturers
        prisma.product.findMany({
          select: { manufacturer: true },
          distinct: ["manufacturer"],
          where: { manufacturer: { not: null } },
        }),
        // Get all patterns
        prisma.product.findMany({
          select: { tags: true },
          where: { tags: { contains: "PATTERN_" } },
        }),
        // Get all collections
        prisma.product.findMany({
          select: { tags: true },
          where: { tags: { contains: "AQCAT_" } },
        }),
        // Check for stock items
        prisma.product.findFirst({
          where: { tags: { contains: "Stock Item" } },
        }),
        // Check for quick ship
        prisma.product.findFirst({
          where: { tags: { contains: "Quick Ship" } },
        }),
      ]);

      availableCategories = allCategories
        .map((c) => c.category)
        .filter(
          (category): category is string =>
            category !== null && category !== undefined
        )
        .sort();

      availableManufacturers = allManufacturers
        .map((m) => m.manufacturer)
        .filter(
          (manufacturer): manufacturer is string =>
            manufacturer !== null && manufacturer !== undefined
        )
        .sort();

      // Extract patterns
      const patternsSet = new Set<string>();
      allPatterns.forEach((product) => {
        const tags = product.tags?.split(",") || [];
        tags.forEach((tag) => {
          const trimmedTag = tag.trim();
          if (trimmedTag.startsWith("PATTERN_")) {
            patternsSet.add(trimmedTag.replace("PATTERN_", ""));
          }
        });
      });
      availablePatterns = Array.from(patternsSet).sort();

      // Extract collections
      const collectionsSet = new Set<string>();
      allCollections.forEach((product) => {
        const tags = product.tags?.split(",") || [];
        tags.forEach((tag) => {
          const trimmedTag = tag.trim();
          if (trimmedTag.startsWith("AQCAT_")) {
            collectionsSet.add(trimmedTag.replace("AQCAT_", ""));
          }
        });
      });
      availableCollections = Array.from(collectionsSet).sort();

      hasStockItems = !!stockItemCheck;
      hasQuickShip = !!quickShipCheck;
    } else {
      // Use the current filtered products to determine available options
      // First get all products that match the filters (without pagination)
      const allFilteredProducts = await prisma.product.findMany({
        where: whereClause,
        select: {
          category: true,
          manufacturer: true,
          tags: true,
        },
      });

      availableManufacturers = [
        ...new Set(
          allFilteredProducts
            .map((p) => p.manufacturer)
            .filter(
              (manufacturer): manufacturer is string =>
                manufacturer !== null && manufacturer !== undefined
            )
        ),
      ].sort();

      // Extract patterns from products
      const availablePatternsSet = new Set<string>();
      allFilteredProducts.forEach((product) => {
        const tags = product.tags?.split(",") || [];
        tags.forEach((tag) => {
          const trimmedTag = tag.trim();
          if (trimmedTag.startsWith("PATTERN_")) {
            availablePatternsSet.add(trimmedTag.replace("PATTERN_", ""));
          }
        });
      });
      availablePatterns = Array.from(availablePatternsSet).sort();

      // Extract collections from products
      const availableCollectionsSet = new Set<string>();
      allFilteredProducts.forEach((product) => {
        const tags = product.tags?.split(",") || [];
        tags.forEach((tag) => {
          const trimmedTag = tag.trim();
          if (trimmedTag.startsWith("AQCAT_")) {
            availableCollectionsSet.add(trimmedTag.replace("AQCAT_", ""));
          }
        });
      });
      availableCollections = Array.from(availableCollectionsSet).sort();

      // Check for stock items and quick ship
      hasStockItems = allFilteredProducts.some((p) =>
        p.tags?.includes("Stock Item")
      );
      hasQuickShip = allFilteredProducts.some((p) =>
        p.tags?.includes("Quick Ship")
      );

      // Get available categories within the filtered products
      availableCategories = [
        ...new Set(
          allFilteredProducts
            .map((p) => p.category)
            .filter(
              (category): category is string =>
                category !== null && category !== undefined
            )
        ),
      ].sort();

      // If category filter is applied, we need to show all categories
      if (categories.length > 0) {
        const allCategories = await prisma.product.findMany({
          select: { category: true },
          distinct: ["category"],
          where: { category: { not: null } },
        });
        availableCategories = allCategories
          .map((c) => c.category)
          .filter(
            (category): category is string =>
              category !== null && category !== undefined
          )
          .sort();
      }
    }

    // Ensure all response fields are defined
    const response = {
      success: true,
      products: safeProducts || [],
      pagination: {
        total: total || 0,
        page: page || 1,
        pageSize: pageSize || 24,
        totalPages: totalPages || 0,
        hasMore: hasMore || false,
      },
      filters: {
        appliedCategories: categories || [],
        appliedManufacturers: manufacturers || [],
        appliedPatterns: patternTags || [],
        appliedTags: [
          ...(collectionTags || []),
          ...(stockAndQuickShipTags || []),
        ],
        // Add available filter options based on current filtered products
        availableCategories,
        availableManufacturers,
        availablePatterns,
        availableCollections,
        hasStockItems,
        hasQuickShip,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in GET /api/products:", error);

    // Return a properly formatted error response
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

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.trx_product_ids || !Array.isArray(body.trx_product_ids)) {
      return NextResponse.json(
        { error: "Invalid request format. Expected array of trx_product_ids" },
        { status: 400 }
      );
    }

    const productIds = body.trx_product_ids.map((id: number) => BigInt(id));

    // Images will be automatically deleted due to cascade delete
    const result = await prisma.product.deleteMany({
      where: {
        id: {
          in: productIds,
        },
      },
    });

    return NextResponse.json({
      success: true,
      deleted: result.count,
    });
  } catch (error) {
    console.error("Error deleting products:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
