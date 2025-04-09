import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type SerializedProduct = {
  id: string;
  sku: string;
  title: string;
  description: string | null;
  manufacturer: string | null;
  category: string | null;
  uom: string | null;
  qtyAvailable: number;
  aqcat: string | null;
  pattern: string | null;
  quickship: boolean;
  images: {
    id: string;
    url: string;
    productId: string;
    createdAt: Date;
  }[];
  venueProducts?: {
    id: string;
    trxVenueId: number;
    venue: {
      trxVenueId: number;
      venueName: string;
    };
  }[];
};

type ApiResponse = {
  products: SerializedProduct[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasMore: boolean;
  };
};

type SingleProductResponse = {
  product: SerializedProduct;
};

// Helper function to serialize a product
function serializeProduct(product: any): SerializedProduct {
  return {
    id: String(product.id),
    sku: product.sku,
    title: product.title,
    description: product.description,
    manufacturer: product.manufacturer,
    category: product.category,
    uom: product.uom,
    qtyAvailable: product.qtyAvailable ? Number(product.qtyAvailable) : 0,
    aqcat: product.aqcat,
    pattern: product.pattern,
    quickship: product.quickship || false,
    images: product.images.map((img: any) => ({
      id: String(img.id),
      url: img.url,
      productId: String(img.productId),
      createdAt: img.createdAt,
    })),
    venueProducts: product.venueProducts?.map((vp: any) => ({
      id: String(vp.id),
      trxVenueId: vp.trxVenueId,
      venue: {
        trxVenueId: vp.venue.trxVenueId,
        venueName: vp.venue.venueName,
      },
    })),
  };
}

export async function GET(
  request: Request
): Promise<NextResponse<ApiResponse | SingleProductResponse>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const includeVenues = searchParams.get("includeVenues") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const search = searchParams.get("search") || "";
    const sort = searchParams.get("sort") || "title:asc";
    const [sortField, sortOrder] = sort.split(":");

    // If ID is provided, fetch a single product
    if (id) {
      const product = await prisma.product.findUnique({
        where: { id: BigInt(id) },
        include: {
          images: true,
          venueProducts: includeVenues
            ? {
                include: {
                  venue: {
                    select: {
                      trxVenueId: true,
                      venueName: true,
                    },
                  },
                },
              }
            : undefined,
        },
      });

      if (!product) {
        return new NextResponse("Product not found", { status: 404 });
      }

      return NextResponse.json({ product: serializeProduct(product) });
    }

    // Calculate offset for pagination
    const offset = (page - 1) * pageSize;

    // Build where clause for search
    const whereClause = search
      ? {
          OR: [
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

    // Fetch products with pagination, sorting, and filtering
    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: {
        [sortField]: sortOrder.toLowerCase(),
      },
      skip: offset,
      take: pageSize,
      include: {
        images: true,
        venueProducts: includeVenues
          ? {
              include: {
                venue: {
                  select: {
                    trxVenueId: true,
                    venueName: true,
                  },
                },
              },
            }
          : undefined,
      },
    });

    // Calculate pagination info
    const totalPages = Math.ceil(total / pageSize);
    const hasMore = page < totalPages;

    // Convert BigInt values to strings
    const serializedProducts = products.map(serializeProduct);

    return NextResponse.json({
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
    console.error("[PRODUCTS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function POST(
  req: Request
): Promise<NextResponse<SingleProductResponse>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const {
      sku,
      title,
      description,
      manufacturer,
      category,
      uom,
      qtyAvailable,
      aqcat,
      pattern,
      quickship,
      images,
    } = body;

    const product = await prisma.product.create({
      data: {
        id: BigInt(Date.now()),
        sku,
        title,
        description,
        manufacturer,
        category,
        uom,
        qtyAvailable,
        aqcat: aqcat || null,
        pattern: pattern || null,
        quickship: quickship || false,
        images: {
          createMany: {
            data: images.map((url: string) => ({ url })),
          },
        },
      },
      include: {
        images: true,
        venueProducts: {
          include: {
            venue: {
              select: {
                trxVenueId: true,
                venueName: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ product: serializeProduct(product) });
  } catch (error) {
    console.error("[PRODUCTS_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PUT(
  req: Request
): Promise<NextResponse<SingleProductResponse>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const {
      id,
      sku,
      title,
      description,
      manufacturer,
      category,
      uom,
      qtyAvailable,
      aqcat,
      pattern,
      quickship,
      images,
    } = body;

    // Delete existing images
    await prisma.productImage.deleteMany({
      where: { productId: BigInt(id) },
    });

    const product = await prisma.product.update({
      where: { id: BigInt(id) },
      data: {
        sku,
        title,
        description,
        manufacturer,
        category,
        uom,
        qtyAvailable,
        aqcat: aqcat || null,
        pattern: pattern || null,
        quickship: quickship || false,
        images: {
          createMany: {
            data: images.map((url: string) => ({ url })),
          },
        },
      },
      include: {
        images: true,
        venueProducts: {
          include: {
            venue: {
              select: {
                trxVenueId: true,
                venueName: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ product: serializeProduct(product) });
  } catch (error) {
    console.error("[PRODUCTS_PUT]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  req: Request
): Promise<NextResponse<{ success: true }>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return new NextResponse("Product ID is required", { status: 400 });
    }

    // Delete the product (cascade will handle images)
    await prisma.product.delete({
      where: { id: BigInt(productId) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PRODUCTS_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
