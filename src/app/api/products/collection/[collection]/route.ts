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

    // Calculate offset for pagination
    const offset = (page - 1) * pageSize;

    // Decode categories properly
    const categories =
      searchParams
        .get("category")
        ?.split(",")
        .map((c) => {
          try {
            // Try double decode first
            return decodeURIComponent(decodeURIComponent(c.trim()));
          } catch {
            // If that fails, try single decode
            return decodeURIComponent(c.trim());
          }
        })
        .filter(Boolean) || [];

    const manufacturers =
      searchParams
        .get("manufacturer")
        ?.split(",")
        .map((m) => decodeURIComponent(m)) || [];
    const tags = searchParams.get("tags")?.split(",") || [];

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let whereClause: any = {
      tags: {
        contains: `COLLECTION_${collection.toLowerCase()}`,
      },
    };

    // Add category filter if present
    if (categories.length > 0) {
      whereClause = {
        AND: [
          {
            tags: {
              contains: `COLLECTION_${collection.toLowerCase()}`,
            },
          },
          {
            OR: categories.map((category) => ({
              category: {
                contains: category,
              },
            })),
          },
        ],
      };
    }

    // Add manufacturer filter if present
    if (manufacturers.length > 0) {
      if (!whereClause.AND) {
        whereClause = {
          AND: [
            whereClause,
            {
              manufacturer: {
                in: manufacturers,
              },
            },
          ],
        };
      } else {
        whereClause.AND.push({
          manufacturer: {
            in: manufacturers,
          },
        });
      }
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let orderBy: any = { title: "asc" };
    if (sort === "price-asc") {
      orderBy = { price: "asc" };
    } else if (sort === "price-desc") {
      orderBy = { price: "desc" };
    } else if (sort === "name-desc") {
      orderBy = { title: "desc" };
    }

    // Fetch products with offset
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
