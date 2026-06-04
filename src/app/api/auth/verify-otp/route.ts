import { findCustomerByEmail, normalizeEmail } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";
import { sendOTP } from "@/lib/twilio";
import { storeOTP } from "@/lib/otpStore";
import { isOtpLocked } from "@/lib/otp-attempts";
import {
  checkRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rate-limit";

const FIFTEEN_MINUTES = 15 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const ipLimit = checkRateLimit(`verify-otp:ip:${ip}`, 10, FIFTEEN_MINUTES);
    if (!ipLimit.allowed) {
      return rateLimitResponse(ipLimit.retryAfterSec);
    }

    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = normalizeEmail(email);
    const emailLimit = checkRateLimit(
      `verify-otp:email:${normalizedEmail}`,
      5,
      FIFTEEN_MINUTES,
    );
    if (!emailLimit.allowed) {
      return rateLimitResponse(emailLimit.retryAfterSec);
    }

    if (isOtpLocked(normalizedEmail)) {
      return NextResponse.json(
        {
          error: "Too many failed attempts. Please try again later.",
        },
        { status: 429 },
      );
    }

    const customer = await findCustomerByEmail(normalizedEmail);

    if (!customer) {
      return NextResponse.json(
        { error: "Unable to send verification code for this email" },
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

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await storeOTP(normalizedEmail, otp);
    await sendOTP(customer.phone, otp);

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
