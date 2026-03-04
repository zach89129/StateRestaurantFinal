import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isSuperuser) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "30");
    const search = (searchParams.get("search") || "").trim();
    const includeExcluded = searchParams.get("includeExcluded") === "true";

    const where = {
      ...(includeExcluded ? {} : { included: true }),
      ...(search
        ? {
            product: {
              OR: [
                { title: { contains: search } },
                { sku: { contains: search } },
                { manufacturer: { contains: search } },
                { category: { contains: search } },
              ],
            },
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      prisma.orderGuideItem.count({ where }),
      prisma.orderGuideItem.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              sku: true,
              title: true,
              manufacturer: true,
              category: true,
            },
          },
        },
        orderBy: [
          { orderGuideGroup: "asc" },
          { product: { category: "asc" } },
          { orderGuideQuality: "asc" },
          { product: { title: "asc" } },
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return NextResponse.json({
      success: true,
      items: items.map((item) => ({
        ...item,
        productId: Number(item.productId),
        product: {
          ...item.product,
          id: Number(item.product.id),
        },
      })),
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isSuperuser) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const data = await request.json();
    const productId = Number(data.productId);
    const orderGuideGroup = (data.orderGuideGroup || "").trim();
    const orderGuideQuality = (data.orderGuideQuality || "").trim();
    const included = data.included !== false;

    if (!productId || Number.isNaN(productId)) {
      return NextResponse.json({ error: "Invalid productId" }, { status: 400 });
    }
    if (!orderGuideGroup || !orderGuideQuality) {
      return NextResponse.json(
        { error: "orderGuideGroup and orderGuideQuality are required" },
        { status: 400 }
      );
    }

    const item = await prisma.orderGuideItem.upsert({
      where: { productId: BigInt(productId) },
      update: { orderGuideGroup, orderGuideQuality, included },
      create: {
        productId: BigInt(productId),
        orderGuideGroup,
        orderGuideQuality,
        included,
      },
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            title: true,
            manufacturer: true,
            category: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      item: {
        ...item,
        productId: Number(item.productId),
        product: {
          ...item.product,
          id: Number(item.product.id),
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isSuperuser) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const data = await request.json();
    const id = Number(data.id);

    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const updateData: {
      orderGuideGroup?: string;
      orderGuideQuality?: string;
      included?: boolean;
    } = {};

    if (Object.prototype.hasOwnProperty.call(data, "orderGuideGroup")) {
      updateData.orderGuideGroup = (data.orderGuideGroup || "").trim();
    }
    if (Object.prototype.hasOwnProperty.call(data, "orderGuideQuality")) {
      updateData.orderGuideQuality = (data.orderGuideQuality || "").trim();
    }
    if (Object.prototype.hasOwnProperty.call(data, "included")) {
      updateData.included = Boolean(data.included);
    }

    if (
      updateData.orderGuideGroup !== undefined &&
      updateData.orderGuideGroup.length === 0
    ) {
      return NextResponse.json(
        { error: "orderGuideGroup cannot be empty" },
        { status: 400 }
      );
    }

    if (
      updateData.orderGuideQuality !== undefined &&
      updateData.orderGuideQuality.length === 0
    ) {
      return NextResponse.json(
        { error: "orderGuideQuality cannot be empty" },
        { status: 400 }
      );
    }

    const item = await prisma.orderGuideItem.update({
      where: { id },
      data: updateData,
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            title: true,
            manufacturer: true,
            category: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      item: {
        ...item,
        productId: Number(item.productId),
        product: {
          ...item.product,
          id: Number(item.product.id),
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
