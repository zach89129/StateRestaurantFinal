import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/auth-options";
import { Product, VenueProduct } from "@prisma/client";

interface ProductWithVenues extends Product {
  venueProducts: (VenueProduct & {
    venue: {
      id: number;
      venueName: string;
    };
  })[];
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    if (!session?.user?.isSuperuser) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = new URL(request.url).searchParams;
    const id = searchParams.get("id");
    const includeVenues = searchParams.get("includeVenues") === "true";

    // If ID is provided, fetch a single product
    if (id) {
      const product = await prisma.product.findUnique({
        where: { id: BigInt(id) },
        include: includeVenues
          ? {
              venueProducts: {
                include: {
                  venue: {
                    select: {
                      id: true,
                      venueName: true,
                    },
                  },
                },
              },
            }
          : undefined,
      });

      if (!product) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        );
      }

      // Convert BigInt to string for JSON serialization
      const serializedProduct = {
        ...product,
        id: String(product.id),
        qtyAvailable: product.qtyAvailable
          ? Number(product.qtyAvailable)
          : null,
        venueProducts: includeVenues
          ? (product as ProductWithVenues).venueProducts.map((vp) => ({
              id: vp.id,
              venueId: vp.venue.id,
              venueName: vp.venue.venueName,
              price: null, // Add these fields when they're added to the schema
              qtyAvailable: null,
              isActive: true,
            }))
          : undefined,
      };

      return NextResponse.json({ product: serializedProduct });
    }

    // Otherwise, handle paginated list
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const search = searchParams.get("search") || "";
    const sort = searchParams.get("sort") || "title:asc";
    const [sortField, sortOrder] = sort.split(":");

    // Calculate offset
    const offset = (page - 1) * pageSize;

    // Build where clause for search
    const whereClause = search
      ? {
          OR: [
            // Try to parse the search term as a number for trx_product_id search
            ...(!isNaN(Number(search)) ? [{ id: BigInt(search) }] : []),
            { sku: { contains: search } },
            { title: { contains: search } },
            { manufacturer: { contains: search } },
            { category: { contains: search } },
          ],
        }
      : {};

    // Get total count for pagination
    const total = await prisma.product.count({
      where: whereClause,
    });

    // Fetch products
    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: {
        [sortField]: sortOrder,
      },
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

    // Convert BigInt to string for JSON serialization
    const serializedProducts = products.map((product) => ({
      ...product,
      id: String(product.id),
      qtyAvailable: product.qtyAvailable ? Number(product.qtyAvailable) : null,
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
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    if (!session?.user?.isSuperuser) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }

    const data = await request.json();

    // Validate required fields
    const requiredFields = ["sku", "title"];
    const missingFields = requiredFields.filter((field) => !data[field]);
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        id: BigInt(data.trx_product_id || Date.now()),
        sku: data.sku,
        title: data.title,
        description: data.description || null,
        manufacturer: data.manufacturer || null,
        category: data.category || null,
        uom: data.uom || null,
        qtyAvailable: data.qtyAvailable || 0,
        tags: data.tags || null,
        imageSrc: data.imageSrc || null,
      },
    });

    return NextResponse.json({
      success: true,
      product: {
        ...product,
        id: Number(product.id),
        qtyAvailable: product.qtyAvailable
          ? Number(product.qtyAvailable)
          : null,
      },
    });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    if (!session?.user?.isSuperuser) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }

    const data = await request.json();
    if (!data.id) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Convert string values to appropriate types
    const qtyAvailable = data.qtyAvailable ? parseInt(data.qtyAvailable) : 0;
    if (isNaN(qtyAvailable)) {
      return NextResponse.json(
        { error: "Invalid quantity value" },
        { status: 400 }
      );
    }

    // Update product
    const product = await prisma.product.update({
      where: { id: BigInt(data.id) },
      data: {
        sku: data.sku,
        title: data.title,
        description: data.description || null,
        manufacturer: data.manufacturer || null,
        category: data.category || null,
        uom: data.uom || null,
        qtyAvailable: qtyAvailable,
        tags: data.tags || null,
        imageSrc: data.imageSrc || null,
      },
    });

    return NextResponse.json({
      success: true,
      product: {
        ...product,
        id: String(product.id),
        qtyAvailable: product.qtyAvailable
          ? Number(product.qtyAvailable)
          : null,
      },
    });
  } catch (error) {
    console.error("Error updating product:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    if (!session?.user?.isSuperuser) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }

    const data = await request.json();
    if (!data.id) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Delete product
    await prisma.product.delete({
      where: { id: BigInt(data.id) },
    });

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
