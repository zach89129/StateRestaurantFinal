import { prisma } from "@/lib/prisma";
import { ProductInput } from "@/types/api";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { convertBigIntToString } from "@/utils/convertBigIntToString";

const MAX_PAGE_SIZE = 100;

type ProductUpdateData = Prisma.ProductUpdateInput;
type ProductCreateData = Prisma.ProductCreateInput;

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
          if (product.longDescription !== undefined) {
            updateData.longDescription = product.longDescription;
          }
          if (product.manufacturer !== undefined)
            updateData.manufacturer = product.manufacturer;
          if (product.category !== undefined)
            updateData.category = product.category;
          if (product.uom !== undefined) updateData.uom = product.uom;
          if (product.qty_available !== undefined)
            updateData.qtyAvailable = product.qty_available;
          if (product.tags !== undefined) updateData.tags = product.tags;
          if (product.metaData?.aqcat !== undefined)
            updateData.aqcat = product.metaData.aqcat;
          if (product.metaData?.pattern !== undefined)
            updateData.pattern = product.metaData.pattern;
          if (product.metaData?.quickShip !== undefined)
            updateData.quickship = product.metaData.quickShip;

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
            images: updatedProduct.images.map((img) => ({ url: img.url })),
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
              longDescription: product.longDescription,
              manufacturer: product.manufacturer,
              category: product.category,
              uom: product.uom,
              qtyAvailable: product.qty_available,
              aqcat: product.metaData?.aqcat,
              pattern: product.metaData?.pattern,
              quickship: product.metaData?.quickShip || false,
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
            trx_product_id: Number(newProduct.id),
            ...newProduct,
            id: undefined,
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

    // Handle base64 encoded category
    const categoryB64 = searchParams.get("category_b64");
    const categories = categoryB64
      ? categoryB64
          .split(",")
          .map((cat) => {
            try {
              return Buffer.from(decodeURIComponent(cat), "base64")
                .toString("utf-8")
                .trim();
            } catch (e) {
              console.error("Error decoding category:", cat, e);
              return "";
            }
          })
          .filter(Boolean)
      : searchParams
          .get("category")
          ?.split(",")
          .filter(Boolean)
          .map((c) => decodeURIComponent(c).trim()) || [];

    // Handle base64 encoded manufacturer
    const manufacturerB64 = searchParams.get("manufacturer_b64");
    const manufacturers = manufacturerB64
      ? [atob(manufacturerB64)]
      : searchParams
          .get("manufacturer")
          ?.split(",")
          .filter(Boolean)
          .map((m) => decodeURIComponent(m).trim()) || [];

    // Get collection and pattern filters with base64 support
    const collectionB64 = searchParams.get("collection_b64");
    const collection = collectionB64 ? atob(collectionB64) : null;

    const patternB64 = searchParams.get("pattern_b64");
    const pattern = patternB64
      ? atob(patternB64)
      : searchParams.get("pattern")?.trim();

    const quickShip = searchParams.get("quickShip") === "true";

    // Calculate offset
    const offset = (page - 1) * pageSize;

    // Build where clause
    const whereClause: Prisma.ProductWhereInput = {};
    const conditions: Prisma.ProductWhereInput[] = [];

    // Add category filter if present
    if (categories.length > 0) {
      conditions.push({
        category: {
          in: categories,
        },
      });
    }

    // Add manufacturer filter if present
    if (manufacturers.length > 0) {
      conditions.push({
        manufacturer: {
          in: manufacturers,
        },
      });
    }

    // Add collection filter if present
    if (collection) {
      conditions.push({
        aqcat: collection,
      });
    }

    // Add pattern filter if present
    if (pattern) {
      conditions.push({
        pattern: {
          equals: pattern,
        },
      });
    }

    // Add quick ship filter if present
    if (quickShip) {
      conditions.push({
        quickship: {
          equals: true,
        },
      });
    }

    // Combine all conditions with AND
    if (conditions.length > 0) {
      whereClause.AND = conditions;
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
    let availableCategories: string[] = [];
    let availableManufacturers: string[] = [];
    let availablePatterns: string[] = [];
    let availableCollections: string[] = [];
    let hasQuickShip = false;

    // If there are no filters applied, fetch all available options
    const noFiltersApplied =
      categories.length === 0 &&
      manufacturers.length === 0 &&
      !collection &&
      !pattern &&
      !quickShip;

    if (noFiltersApplied) {
      // Fetch all available options
      const [
        allCategories,
        allManufacturers,
        allPatterns,
        allCollections,
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
          select: { pattern: true },
          distinct: ["pattern"],
          where: { pattern: { not: null } },
        }),
        // Get all collections
        prisma.product.findMany({
          select: { aqcat: true },
          distinct: ["aqcat"],
          where: { aqcat: { not: null } },
        }),
        // Check for quick ship items
        prisma.product.findFirst({
          where: { quickship: true },
        }),
      ]);

      availableCategories = allCategories
        .map((c) => c.category)
        .filter((c): c is string => c !== null)
        .sort();

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
          category: true,
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

    // Map the products to include trx_product_id and maintain all fields
    const mappedProducts = products.map((product) => {
      const { id, ...rest } = product;
      return {
        ...rest,
        trx_product_id: Number(id),
        qtyAvailable: product.qtyAvailable ? Number(product.qtyAvailable) : 0,
        category: product.category || "",
        manufacturer: product.manufacturer || "",
        description: product.description || "",
        longDescription: product.longDescription,
        images: product.images.map((img) => ({ url: img.url })),
      };
    });

    // Convert BigInt values to strings
    const safeProducts = convertBigIntToString(mappedProducts);

    // Calculate pagination info
    const totalPages = Math.ceil(total / pageSize);
    const hasMore = page < totalPages;

    return NextResponse.json({
      success: true,
      products: safeProducts,
      pagination: {
        total,
        page,
        pageSize,
        totalPages,
        hasMore,
      },
      filters: {
        appliedCategories: categories || [],
        appliedManufacturers: manufacturers || [],
        appliedPattern: pattern || "",
        appliedCollection: collection || "",
        appliedQuickShip: quickShip,
        availableCategories,
        availableManufacturers,
        availablePatterns,
        availableCollections,
        hasQuickShip,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/products:", error);
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
