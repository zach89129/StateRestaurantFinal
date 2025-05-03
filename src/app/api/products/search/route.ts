import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const searchTerm = searchParams.get("q") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "24");

    // Helper function to decode base64 parameters
    const decodeParams = (paramName: string): string[] => {
      return (searchParams.get(paramName)?.split(",").filter(Boolean) || [])
        .map((p) => {
          try {
            return decodeURIComponent(atob(p));
          } catch (e) {
            console.error(`Error decoding ${paramName}:`, e);
            return "";
          }
        })
        .filter(Boolean);
    };

    // Parse filter parameters
    const categories = decodeParams("category_b64");
    const manufacturers = decodeParams("manufacturer_b64");
    const patterns = decodeParams("pattern_b64");
    const collections = decodeParams("collection_b64");
    const quickShip = searchParams.get("quickShip") === "true";

    // Build search criteria
    const whereClause: Prisma.ProductWhereInput = {
      OR: [
        { title: { contains: searchTerm } },
        { sku: { contains: searchTerm } },
        { description: { contains: searchTerm } },
        { longDescription: { contains: searchTerm } },
        { manufacturer: { contains: searchTerm } },
        { category: { contains: searchTerm } },
        { uom: { contains: searchTerm } },
        { aqcat: { contains: searchTerm } },
        { pattern: { contains: searchTerm } },
      ],
    };

    // Add filters if present
    if (categories.length > 0) whereClause.category = { in: categories };
    if (manufacturers.length > 0)
      whereClause.manufacturer = { in: manufacturers };
    if (collections.length > 0) whereClause.aqcat = { in: collections };
    if (patterns.length > 0) whereClause.pattern = { in: patterns };
    if (quickShip) whereClause.quickship = { equals: true };

    // Get total count for pagination
    const total = await prisma.product.count({ where: whereClause });

    // Fetch products with pagination
    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: { title: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { images: true },
    });

    // Format product data
    const serializedProducts = products.map((product) => ({
      ...product,
      trx_product_id: Number(product.id),
      id: Number(product.id),
      qtyAvailable: Number(product.qtyAvailable),
      images: product.images.map((img) => ({ url: img.url })),
    }));

    // Get all products matching the criteria for filter options
    const allMatchingProducts = await prisma.product.findMany({
      where: whereClause,
      select: {
        category: true,
        manufacturer: true,
        pattern: true,
        aqcat: true,
        quickship: true,
      },
    });

    // Extract available filter options
    const filterOptions = {
      availableCategories: [
        ...new Set(allMatchingProducts.map((p) => p.category).filter(Boolean)),
      ].sort(),
      availableManufacturers: [
        ...new Set(
          allMatchingProducts.map((p) => p.manufacturer).filter(Boolean)
        ),
      ].sort(),
      availablePatterns: [
        ...new Set(allMatchingProducts.map((p) => p.pattern).filter(Boolean)),
      ].sort(),
      availableCollections: [
        ...new Set(allMatchingProducts.map((p) => p.aqcat).filter(Boolean)),
      ].sort(),
      hasQuickShip: allMatchingProducts.some((p) => p.quickship),
    };

    // Calculate pagination info
    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      success: true,
      products: serializedProducts,
      pagination: {
        total,
        page,
        pageSize,
        totalPages,
        hasMore: page < totalPages,
      },
      filters: {
        ...filterOptions,
        appliedCategories: categories || [],
        appliedManufacturers: manufacturers || [],
        appliedCollection: collections.join(",") || "",
        appliedPattern: patterns.join(",") || "",
        appliedQuickShip: quickShip,
      },
    });
  } catch (error) {
    console.error("Error in search:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
