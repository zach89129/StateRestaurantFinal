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

    console.log("Raw categories from URL:", searchParams.get("category"));
    console.log("Processed categories:", categories);

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
    const patternTags = tags.filter((tag) => tag.startsWith("PATTERN_"));
    const stockAndQuickShipTags = tags.filter((tag) =>
      ["Stock Item", "Quick Ship", "Stock Item / Quick Ship"].includes(tag)
    );
    const collectionTags = tags.filter((tag) => {
      // If it doesn't have any special prefix and isn't a stock/quick ship tag
      if (
        !tag.startsWith("PATTERN_") &&
        !tag.startsWith("AQCAT_") &&
        !["Stock Item", "Quick Ship", "Stock Item / Quick Ship"].includes(tag)
      ) {
        return true;
      }
      // Or if it already has the AQCAT_ prefix
      return tag.startsWith("AQCAT_");
    });

    // Add null/empty tag handling for proper filtering
    if (
      tags.includes("null") ||
      tags.includes("undefined") ||
      tags.includes("")
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
      conditions.push({
        OR: collectionTags.map((tag) => ({
          tags: {
            contains: tag.startsWith("AQCAT_") ? tag : `AQCAT_${tag}`,
          },
        })),
      });
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

    // Build order by clause
    let orderBy: Prisma.ProductOrderByWithRelationInput = { title: "asc" };
    if (sort === "name-desc") {
      orderBy = { title: "desc" };
    }

    // Fetch products
    console.log("Executing query with params:", {
      where: whereClause,
      orderBy,
      skip: offset,
      take: pageSize,
    });

    const products = await prisma.product
      .findMany({
        where: whereClause,
        orderBy,
        skip: offset,
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

    // Convert any remaining BigInt values to strings
    const safeProducts = convertBigIntToString(serializedProducts);

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
