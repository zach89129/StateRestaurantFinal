import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get("venueId");

    if (!venueId) {
      return new NextResponse(
        JSON.stringify({ error: "Venue ID is required" }),
        {
          status: 400,
        }
      );
    }

    // Get customer's venues
    const customer = await prisma.customer.findUnique({
      where: { trxCustomerId: parseInt(session.user.trxCustomerId) },
      include: {
        venues: {
          where: { trxVenueId: parseInt(venueId) },
        },
      },
    });

    if (!customer) {
      return new NextResponse(JSON.stringify({ error: "Customer not found" }), {
        status: 404,
      });
    }

    const hasAccess = customer.venues.length > 0;

    // If user doesn't have access, clear cart items for this venue
    if (!hasAccess) {
      try {
        // Get the user's cart
        const cart = await prisma.cart.findUnique({
          where: { customerId: parseInt(session.user.trxCustomerId) },
          include: { items: true },
        });

        if (cart) {
          // Remove items from the venue they no longer have access to
          await prisma.cartItem.deleteMany({
            where: {
              cartId: cart.id,
              venueId: parseInt(venueId),
            },
          });
        }
      } catch (error) {
        console.error("Error clearing cart items:", error);
        // Don't fail the request if cart clearing fails
      }
    }

    return new NextResponse(JSON.stringify({ hasAccess }), { status: 200 });
  } catch (error) {
    console.error("Error checking venue access:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}
