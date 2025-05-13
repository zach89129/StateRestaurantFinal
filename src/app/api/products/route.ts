import { prisma } from "@/lib/prisma";
import { ProductInput } from "@/types/api";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { convertBigIntToString } from "@/utils/convertBigIntToString";

const MAX_PAGE_SIZE = 100;

type ProductUpdateData = Prisma.ProductUpdateInput;

export async function POST(request: NextRequest) {
  console.log("POST /api/products - Starting request processing");

  if (!request.body) {
    console.log("POST /api/products - Missing request body");
    return NextResponse.json(
      { error: "Missing request body" },
      { status: 400 }
    );
  }

  try {
    const body: ProductInput = await request.json();
    console.log("POST /api/products - Received request body:", {
      productCount: body.products?.length || 0,
      products: body.products?.map((p) => ({
        trx_product_id: p.trx_product_id,
        sku: p.sku,
        title: p.title,
      })),
    });

    if (
      !body.products ||
      !Array.isArray(body.products) ||
      body.products.length > MAX_PAGE_SIZE
    ) {
      const error = body.products
        ? `Maximum batch size is ${MAX_PAGE_SIZE} products`
        : "Invalid products format";
      console.log("POST /api/products - Validation error:", {
        error,
        receivedProducts: body.products,
      });
      return NextResponse.json({ error }, { status: 400 });
    }

    const results = [];
    const errors = [];

    for (const product of body.products) {
      try {
        console.log(
          `Processing product: ${product.trx_product_id} (SKU: ${product.sku})`
        );

        if (!product.trx_product_id) {
          throw new Error("Missing trx_product_id");
        }

        const existingProduct = await prisma.product.findUnique({
          where: { id: BigInt(product.trx_product_id) },
          include: { images: true },
        });

        if (existingProduct) {
          console.log(`Updating existing product: ${product.trx_product_id}`);
          // Update existing product
          const updateData: ProductUpdateData = {
            sku: product.sku,
            title: product.title,
            description: product.description,
            longDescription: product.longDescription,
            manufacturer: product.manufacturer,
            category: product.category,
            uom: product.uom,
            qtyAvailable: product.qty_available,
            tags: product.tags,
            aqcat: product.metaData?.aqcat,
            pattern: product.metaData?.pattern,
            quickship: product.metaData?.quickship,
          };

          // Only include defined fields in update
          Object.keys(updateData).forEach((key) => {
            if (updateData[key as keyof ProductUpdateData] === undefined) {
              delete updateData[key as keyof ProductUpdateData];
            }
          });

          // Handle image updates
          if (product.images?.length) {
            await prisma.productImage.deleteMany({
              where: { productId: BigInt(product.trx_product_id) },
            });

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

          console.log(
            `Successfully updated product: ${product.trx_product_id}`,
            {
              sku: updatedProduct.sku,
              imageCount: updatedProduct.images.length,
            }
          );

          results.push({
            trx_product_id: Number(updatedProduct.id),
            ...updatedProduct,
            id: undefined,
            images: updatedProduct.images.map((img) => ({ url: img.url })),
          });
        } else {
          console.log(`Creating new product: ${product.trx_product_id}`);
          // Create new product - validate required fields
          const requiredFields = [
            "sku",
            "title",
            "description",
            "manufacturer",
            "category",
            "uom",
            "qty_available",
          ];
          const missingFields = requiredFields.filter((field) => {
            const value =
              field === "qty_available"
                ? product[field as keyof typeof product]
                : product[field as keyof typeof product];
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
              quickship: product.metaData?.quickship || false,
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

          console.log(
            `Successfully created new product: ${product.trx_product_id}`,
            {
              sku: newProduct.sku,
              imageCount: newProduct.images.length,
            }
          );

          results.push({
            trx_product_id: Number(newProduct.id),
            ...newProduct,
            id: undefined,
            images: newProduct.images.map((img) => ({ src: img.url })),
          });
        }
      } catch (err) {
        console.error(
          `Error processing product ${product.trx_product_id}:`,
          err
        );
        errors.push({
          product_id: product.trx_product_id,
          sku: product.sku,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    console.log("POST /api/products - Completed processing", {
      successCount: results.length,
      errorCount: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    });

    return NextResponse.json({
      success: true,
      processed: results.length,
      errors: errors.length > 0 ? errors : undefined,
      results: convertBigIntToString(results),
    });
  } catch (error) {
    console.error("POST /api/products - Fatal error:", error);
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

    // Helper function to decode base64 values safely
    const decodeBase64 = (value: string | null) => {
      if (!value) return null;
      try {
        return Buffer.from(decodeURIComponent(value), "base64")
          .toString("utf-8")
          .trim();
      } catch (e) {
        console.error("Error decoding value:", value, e);
        return null;
      }
    };

    // Handle filters with base64 support
    const categoryParam = searchParams.get("category_b64");
    const categories = categoryParam
      ? (categoryParam.split(",").map(decodeBase64).filter(Boolean) as string[])
      : searchParams
          .get("category")
          ?.split(",")
          .filter(Boolean)
          .map((c) => decodeURIComponent(c).trim()) || [];

    const manufacturerParam = searchParams.get("manufacturer_b64");
    const manufacturers = manufacturerParam
      ? (manufacturerParam
          .split(",")
          .map(decodeBase64)
          .filter(Boolean) as string[])
      : searchParams
          .get("manufacturer")
          ?.split(",")
          .filter(Boolean)
          .map((m) => decodeURIComponent(m).trim()) || [];

    const collection = searchParams.get("collection_b64")
      ? decodeBase64(searchParams.get("collection_b64"))
      : null;
    const pattern = searchParams.get("pattern_b64")
      ? decodeBase64(searchParams.get("pattern_b64"))
      : searchParams.get("pattern")?.trim();

    const quickShip = searchParams.get("quickShip") === "true";

    // Build where clause
    const whereClause: Prisma.ProductWhereInput = {};
    const conditions: Prisma.ProductWhereInput[] = [];

    if (categories.length > 0)
      conditions.push({ category: { in: categories } });
    if (manufacturers.length > 0)
      conditions.push({ manufacturer: { in: manufacturers } });
    if (collection) conditions.push({ aqcat: collection });
    if (pattern) conditions.push({ pattern: { equals: pattern } });
    if (quickShip) conditions.push({ quickship: { equals: true } });

    // Add conditions if there are any
    if (conditions.length > 0) {
      whereClause.AND = conditions;
    }

    // Get total count for pagination
    const total = await prisma.product.count({ where: whereClause });

    // Get products with pagination
    const products = await prisma.product.findMany({
      where: whereClause,
      include: { images: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { title: sort === "name-desc" ? "desc" : "asc" },
    });

    // Fetch filter options
    const noFiltersApplied = conditions.length === 0;

    let filterOptions;
    if (noFiltersApplied) {
      // Fetch all available options when no filters are applied
      const [
        allCategories,
        allManufacturers,
        allPatterns,
        allCollections,
        quickShipCheck,
      ] = await Promise.all([
        prisma.product.findMany({
          select: { category: true },
          distinct: ["category"],
          where: { category: { not: null } },
        }),
        prisma.product.findMany({
          select: { manufacturer: true },
          distinct: ["manufacturer"],
          where: { manufacturer: { not: null } },
        }),
        prisma.product.findMany({
          select: { pattern: true },
          distinct: ["pattern"],
          where: { pattern: { not: null } },
        }),
        prisma.product.findMany({
          select: { aqcat: true },
          distinct: ["aqcat"],
          where: { aqcat: { not: null } },
        }),
        prisma.product.findFirst({ where: { quickship: true } }),
      ]);

      filterOptions = {
        availableCategories: allCategories
          .map((c) => c.category)
          .filter(Boolean)
          .sort(),
        availableManufacturers: allManufacturers
          .map((m) => m.manufacturer)
          .filter(Boolean)
          .sort(),
        availablePatterns: allPatterns
          .map((p) => p.pattern)
          .filter(Boolean)
          .sort(),
        availableCollections: allCollections
          .map((c) => c.aqcat)
          .filter(Boolean)
          .sort(),
        hasQuickShip: !!quickShipCheck,
      };
    } else {
      // Get filtered options based on current filter state
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

      // Get all categories if category filter is applied
      const availableCategories =
        categories.length > 0
          ? (
              await prisma.product.findMany({
                select: { category: true },
                distinct: ["category"],
                where: { category: { not: null } },
              })
            )
              .map((c) => c.category)
              .filter(Boolean)
              .sort()
          : [
              ...new Set(
                allFilteredProducts.map((p) => p.category).filter(Boolean)
              ),
            ].sort();

      filterOptions = {
        availableCategories,
        availableManufacturers: [
          ...new Set(
            allFilteredProducts.map((p) => p.manufacturer).filter(Boolean)
          ),
        ].sort(),
        availablePatterns: [
          ...new Set(allFilteredProducts.map((p) => p.pattern).filter(Boolean)),
        ].sort(),
        availableCollections: [
          ...new Set(allFilteredProducts.map((p) => p.aqcat).filter(Boolean)),
        ].sort(),
        hasQuickShip: allFilteredProducts.some((p) => p.quickship),
      };
    }

    // Map the products with consistent formatting
    const mappedProducts = products.map((product) => ({
      ...product,
      trx_product_id: Number(product.id),
      id: undefined,
      qtyAvailable: product.qtyAvailable ? Number(product.qtyAvailable) : 0,
      category: product.category || "",
      manufacturer: product.manufacturer || "",
      description: product.description || "",
      images: product.images.map((img) => ({ url: img.url })),
    }));

    // Calculate pagination info
    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      success: true,
      products: convertBigIntToString(mappedProducts),
      pagination: {
        total,
        page,
        pageSize,
        totalPages,
        hasMore: page < totalPages,
      },
      filters: {
        appliedCategories: categories || [],
        appliedManufacturers: manufacturers || [],
        appliedPattern: pattern || "",
        appliedCollection: collection || "",
        appliedQuickShip: quickShip,
        ...filterOptions,
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
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { trx_product_ids } = await request.json();

    if (!trx_product_ids || !Array.isArray(trx_product_ids)) {
      return NextResponse.json(
        { error: "Invalid request format. Expected array of trx_product_ids" },
        { status: 400 }
      );
    }

    const result = await prisma.product.deleteMany({
      where: { id: { in: trx_product_ids.map((id: number) => BigInt(id)) } },
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
