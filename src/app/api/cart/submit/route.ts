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
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }

    const { items } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Invalid cart data" }, { status: 400 });
    }

    const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>New Order Request</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #003087; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background-color: #f9f9f9; }
              .order-details { margin-top: 20px; }
              .product-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
              .product-table th, .product-table td { 
                border: 1px solid #ddd; 
                padding: 8px; 
                text-align: left; 
              }
              .product-table th { background-color: #f2f2f2; }
              .customer-info { margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>New Order Request</h1>
              </div>
              <div class="content">
                <div class="customer-info">
                  <h2>Customer Information</h2>
                  <p><strong>Email:</strong> ${session.user.email}</p>
                </div>
                <div class="order-details">
                  <h2>Order Details</h2>
                  <table class="product-table">
                    <thead>
                      <tr>
                        <th>SKU</th>
                        <th>Product</th>
                        <th>Manufacturer</th>
                        <th>UOM</th>
                        <th>Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${items
                        .map(
                          (item: CartItem) => `
                        <tr>
                          <td>${item.sku}</td>
                          <td>${item.title}</td>
                          <td>${item.manufacturer || "-"}</td>
                          <td>${item.uom || "-"}</td>
                          <td>${item.quantity}</td>
                        </tr>
                      `
                        )
                        .join("")}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </body>
        </html>
    `;

    await transporter.sendMail({
      from: process.env.DNSEXIT_EMAIL,
      to: process.env.ADMIN_EMAIL,
      subject: `New Order Request - ${session.user.email}`,
      html: htmlContent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing order request:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
