import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        trxCustomerId: true,
        email: true,
        phone: true,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found", redirect: "/account-request" },
        { status: 404 }
      );
    }

    if (!customer.phone) {
      return NextResponse.json(
        {
          error: "No phone number on file",
          message:
            "Oops! We couldn't find a phone number on file for your account. Please contact State Restaurant to add a phone number to your account.",
          code: "NO_PHONE",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Customer verified",
    });
  } catch (error) {
    console.error("Error checking email:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
