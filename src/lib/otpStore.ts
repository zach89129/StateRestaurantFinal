import { prisma } from "./prisma";

interface OTPData {
  otp: string;
  timestamp: number;
}

const OTP_EXPIRY = 5 * 60 * 1000; // 5 minutes in milliseconds

export async function storeOTP(email: string, otp: string) {
  const normalizedEmail = email.toLowerCase();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY);

  console.log("Storing OTP:", {
    email: normalizedEmail,
    otp,
    expiresAt,
  });

  // Use upsert to handle both creation and update cases
  const result = await prisma.otp.upsert({
    where: { email: normalizedEmail },
    update: {
      code: otp,
      expiresAt,
    },
    create: {
      email: normalizedEmail,
      code: otp,
      expiresAt,
    },
  });

  console.log("OTP stored result:", result);
}

export async function getOTP(email: string): Promise<OTPData | null> {
  const normalizedEmail = email.toLowerCase();
  console.log("Getting OTP for email:", normalizedEmail);

  const otpRecord = await prisma.otp.findUnique({
    where: { email: normalizedEmail },
  });

  console.log("Raw OTP record from database:", otpRecord);

  if (!otpRecord) {
    console.log("No OTP record found");
    return null;
  }

  // Check if OTP is expired
  if (otpRecord.expiresAt < new Date()) {
    console.log("OTP is expired:", {
      expiresAt: otpRecord.expiresAt,
      now: new Date(),
    });
    // Delete expired OTP
    await deleteOTP(normalizedEmail);
    return null;
  }

  const result = {
    otp: otpRecord.code,
    timestamp: otpRecord.createdAt.getTime(),
  };

  console.log("Returning OTP data:", result);
  return result;
}

export async function deleteOTP(email: string) {
  const normalizedEmail = email.toLowerCase();
  console.log("Deleting OTP for email:", normalizedEmail);

  await prisma.otp
    .delete({
      where: { email: normalizedEmail },
    })
    .catch((error) => {
      console.log("Error deleting OTP:", error);
      // Ignore deletion errors
    });
}

// Cleanup function to remove expired OTPs
export async function cleanupExpiredOTPs() {
  await prisma.otp.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
}
