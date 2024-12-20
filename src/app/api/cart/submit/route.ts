import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";

const transporter = nodemailer.createTransport({
  host: "relay.dnsexit.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.DNSEXIT_ACCOUNT,
    pass: process.env.DNSEXIT_PASSWORD,
  },
});

interface CartItem {
  id: string;
  sku: string;
  title: string;
  quantity: number;
  manufacturer: string | null;
  uom: string | null;
}

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { items, comment, purchaseOrder, venue, trxCustomerId } =
      await request.json();

    // Prepare email content
    const emailContent = `
      New Order from ${session.user.email}
      TRX Customer ID: ${trxCustomerId}
      Venue: ${venue?.venueName || "N/A"} (ID: ${venue?.trxVenueId || "N/A"})
      Purchase Order: ${purchaseOrder || "N/A"}

      Comments:
      ${comment || "No comments provided"}

      Items:
      ${items
        .map(
          (item: any) => `
        - ${item.title}
        SKU: ${item.sku}
        Quantity: ${item.quantity}
      `
        )
        .join("\n")}
    `;

    // Send email
    await transporter.sendMail({
      from: process.env.DNSEXIT_EMAIL,
      to: process.env.ADMIN_EMAIL!,
      subject: `New Order from ${session.user.email}`,
      text: emailContent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error submitting cart:", error);
    return NextResponse.json(
      { error: "Failed to submit cart" },
      { status: 500 }
    );
  }
}
