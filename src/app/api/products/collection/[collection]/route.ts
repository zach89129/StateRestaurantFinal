import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{
    collection: string;
  }>;
}

export async function GET(
  request: NextRequest,
  context: RouteParams
): Promise<NextResponse> {
  try {
    const params = await context.params;
    const { collection } = params;
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
    const whereClause: any = {
      tags: {
        contains: `COLLECTION_${collection.toLowerCase()}`,
      },
    };

    // Add category filter if present
    if (categories.length > 0) {
      whereClause.category = {
        in: categories,
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
