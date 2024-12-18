import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "relay.dnsexit.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.DNSEXIT_ACCOUNT,
    pass: process.env.DNSEXIT_PASSWORD,
  },
});

export async function POST(request: NextRequest) {
  try {
    const { email, firstName, lastName, companyName, phoneNumber, message } =
      await request.json();

    if (!email || !firstName || !lastName || !companyName || !phoneNumber) {
      return NextResponse.json(
        { error: "All fields are required except message" },
        { status: 400 }
      );
    }

    const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>New Account Request</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #003087; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background-color: #f9f9f9; }
              .field { margin-bottom: 15px; }
              .label { font-weight: bold; color: #666; }
              .value { color: #333; }
              .message { margin-top: 20px; padding: 15px; background-color: #fff; border-left: 4px solid #003087; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>New Account Request</h1>
              </div>
              <div class="content">
                <div class="field">
                  <div class="label">Company:</div>
                  <div class="value">${companyName}</div>
                </div>
                <div class="field">
                  <div class="label">Contact Name:</div>
                  <div class="value">${firstName} ${lastName}</div>
                </div>
                <div class="field">
                  <div class="label">Email:</div>
                  <div class="value">${email}</div>
                </div>
                <div class="field">
                  <div class="label">Phone:</div>
                  <div class="value">${phoneNumber}</div>
                </div>
                ${
                  message
                    ? `
                  <div class="message">
                    <div class="label">Additional Message:</div>
                    <div class="value">${message}</div>
                  </div>
                `
                    : ""
                }
              </div>
            </div>
          </body>
        </html>
    `;

    await transporter.sendMail({
      from: process.env.DNSEXIT_EMAIL,
      to: process.env.ADMIN_EMAIL,
      subject: `New Account Request - ${companyName}`,
      html: htmlContent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing account request:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
