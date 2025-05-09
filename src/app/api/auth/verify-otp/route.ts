import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { sendOTP } from "@/lib/twilio";
import { storeOTP } from "@/lib/otpStore";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({
      where: { email: email.toLowerCase() },
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

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP
    await storeOTP(email.toLowerCase(), otp);

    // Send OTP via Twilio
    await sendOTP(customer.phone, otp);

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
