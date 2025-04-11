import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/auth-options";

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

    const searchParams = new URL(request.url).searchParams;
    const query = searchParams.get("query") || "";

    // Only proceed if query is numeric
    if (!/^\d*$/.test(query)) {
      return NextResponse.json({ products: [] });
    }

    if (!query) {
      return NextResponse.json({ products: [] });
    }

    // Create range for numeric search (product IDs are 13 digits)
    const minValue = BigInt(query + "0".repeat(13 - query.length));
    const maxValue = BigInt(query + "9".repeat(13 - query.length));

    // Search for products where trx_product_id is in range
    const products = await prisma.product.findMany({
      where: {
        id: {
          gte: minValue,
          lte: maxValue,
        },
      },
      select: {
        id: true,
        sku: true,
        title: true,
      },
      take: 10, // Limit results
      orderBy: {
        id: "asc",
      },
    });

    return NextResponse.json({
      products: products.map((product) => ({
        ...product,
        id: String(product.id),
      })),
    });
  } catch (error) {
    console.error("Error searching products:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: "Failed to search products" },
      { status: 500 }
    );
  }
}
