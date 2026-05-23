import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rate-limit";

const FIFTEEN_MINUTES = 15 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const ipLimit = checkRateLimit(`check-email:ip:${ip}`, 20, FIFTEEN_MINUTES);
    if (!ipLimit.allowed) {
      return rateLimitResponse(ipLimit.retryAfterSec);
    }

    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const emailLimit = checkRateLimit(
      `check-email:email:${normalizedEmail}`,
      10,
      FIFTEEN_MINUTES,
    );
    if (!emailLimit.allowed) {
      return rateLimitResponse(emailLimit.retryAfterSec);
    }

    const customer = await prisma.customer.findUnique({
      where: { email: normalizedEmail },
      select: {
        trxCustomerId: true,
        email: true,
        phone: true,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Unable to continue with this email" },
        { status: 400 },
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
        { status: 400 },
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
      { status: 500 },
    );
  }
}
