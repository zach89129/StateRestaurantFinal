import { prisma } from "@/lib/prisma";
import { ProductInput } from "@/types/api";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

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
          if (product.tags !== undefined) updateData.tags = product.tags;
          if (product.images?.length)
            updateData.imageSrc = product.images[0].src;

          const updatedProduct = await prisma.product.update({
            where: { id: BigInt(product.trx_product_id) },
            data: updateData,
          });

          results.push({
            ...updatedProduct,
            id: Number(updatedProduct.id),
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
            "tags",
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
              tags: product.tags,
              imageSrc: product.images?.[0]?.src || null,
            },
          });

          results.push({
            ...newProduct,
            id: Number(newProduct.id),
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

    return NextResponse.json({
      success: true,
      processed: results.length,
      errors: errors.length > 0 ? errors : undefined,
      results,
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
    const categories = searchParams.get("category")?.split(",") || [];
    const manufacturers = searchParams.get("manufacturer")?.split(",") || [];
    const tags = searchParams.get("tags")?.split(",") || [];

    // Calculate offset
    const offset = (page - 1) * pageSize;

    // Build where clause
    const whereClause: any = {};

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
      whereClause.OR = tags.map((tag) => ({
        tags: {
          contains: tag,
        },
      }));
    }

    // Get total count for pagination
    const total = await prisma.product.count({
      where: whereClause,
    });

    // Build order by clause
    let orderBy: any = { title: "asc" };
    if (sort === "price-asc") {
      orderBy = { price: "asc" };
    } else if (sort === "price-desc") {
      orderBy = { price: "desc" };
    } else if (sort === "name-desc") {
      orderBy = { title: "desc" };
    }

    // Fetch products
    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy,
      skip: offset,
      take: pageSize,
      select: {
        id: true,
        sku: true,
        title: true,
        description: true,
        manufacturer: true,
        category: true,
        uom: true,
        qtyAvailable: true,
        tags: true,
        imageSrc: true,
      },
    });

    // Convert BigInt to number in the products array
    const serializedProducts = products.map((product) => ({
      ...product,
      id: Number(product.id),
      qtyAvailable: Number(product.qtyAvailable),
    }));

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
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 }
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
