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

    // Get available filter options from search results
    const availableCategories = [
      ...new Set(products.map((p) => p.category)),
    ].filter(Boolean);
    const availableManufacturers = [
      ...new Set(products.map((p) => p.manufacturer)),
    ].filter(Boolean);
    const availablePatterns = [
      ...new Set(
        products
          .map((p) =>
            p.tags
              ?.split(",")
              .filter((tag) => tag.startsWith("PATTERN_"))
              .map((tag) => tag.replace("PATTERN_", ""))
          )
          .flat()
      ),
    ].filter(Boolean);
    const availableCollections = [
      ...new Set(
        products
          .map((p) =>
            p.tags
              ?.split(",")
              .filter((tag) => tag.startsWith("AQCAT_"))
              .map((tag) => tag.replace("AQCAT_", ""))
          )
          .flat()
      ),
    ].filter(Boolean);

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
        hasStockItems: products.some((p) => p.tags?.includes("stock-item")),
        hasQuickShip: products.some((p) => p.tags?.includes("quick-ship")),
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
