import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { sendOTP } from "@/lib/twilio";
import { storeOTP } from "@/lib/otpStore";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    console.log("Generating OTP for email:", email);

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!customer) {
      console.log("Customer not found:", email);
      return NextResponse.json(
        { error: "Customer not found", redirect: "/account-request" },
        { status: 404 }
      );
    }

    if (!customer.phone) {
      console.log("No phone number for customer:", email);
      return NextResponse.json(
        {
          error: "No phone number on file",
          message:
            "Please contact State Restaurant to add a phone number to your account.",
          code: "NO_PHONE",
        },
        { status: 400 }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("Generated OTP:", { email, otp });

    // Store OTP
    await storeOTP(email.toLowerCase(), otp);
    console.log("Stored OTP in cache");

    // Send OTP via Twilio
    await sendOTP(customer.phone, otp);
    console.log("Sent OTP via Twilio");

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
