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
  price: number | null;
  venueId: string;
  venueName: string;
}

interface VenueGroup {
  venueName: string;
  items: CartItem[];
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

    // Group items by venue
    const itemsByVenue = items.reduce(
      (acc: Record<string, VenueGroup>, item: CartItem) => {
        const venueKey = `${item.venueId}-${item.venueName}`;
        if (!acc[venueKey]) {
          acc[venueKey] = {
            venueName: item.venueName,
            items: [],
          };
        }
        acc[venueKey].items.push(item);
        return acc;
      },
      {}
    );

    // Prepare email content
    const emailContent = `
      New Order from ${session.user.email}
      TRX Customer ID: ${trxCustomerId}
      Purchase Order: ${purchaseOrder || "N/A"}

      Comments:
      ${comment || "No comments provided"}

      Items by Venue:
      ${(Object.entries(itemsByVenue) as [string, VenueGroup][])
        .map(
          ([_, venueGroup]) => `
        Venue: ${venueGroup.venueName ? venueGroup.venueName : "Main Catalog"}
        ${venueGroup.items
          .map(
            (item: CartItem) => `
          - ${item.title}
            SKU: ${item.sku}
            UOM: ${item.uom || "N/A"}
            Price: ${
              item.price ? `$${item.price.toFixed(2)}` : "Quote Required"
            }
            Quantity: ${item.quantity}
            Subtotal: ${
              item.price
                ? `$${(item.price * item.quantity).toFixed(2)}`
                : "Quote Required"
            }
        `
          )
          .join("\n")}
        ${
          venueGroup.items.some((item: CartItem) => item.price)
            ? `Venue Total: $${venueGroup.items
                .reduce(
                  (total: number, item: CartItem) =>
                    total + (item.price || 0) * item.quantity,
                  0
                )
                .toFixed(2)}`
            : "Venue Total: Quote Required"
        }
      `
        )
        .join("\n")}

      ${
        items.some((item: CartItem) => item.price)
          ? `Order Total: $${items
              .reduce(
                (total: number, item: CartItem) =>
                  total + (item.price || 0) * item.quantity,
                0
              )
              .toFixed(2)}`
          : "Order Total: Quote Required"
      }
    `;

    // Send email
    await transporter.sendMail({
      from: process.env.DNSEXIT_EMAIL,
      to: process.env.ADMIN_EMAIL!,
      subject: `New Order from ${session.user.email}`,
      text: emailContent,
    });

    // Prepare email content
    const emailContentCustomer = `
        Thank you for your order, below is a copy for your records. You will receive a separate acknowledgement once order is entered into our system confirming pricing and availability by the next business day.
        
        New Order from ${session.user.email}
        TRX Customer ID: ${trxCustomerId}
        Purchase Order: ${purchaseOrder || "N/A"}
  
        Comments:
        ${comment || "No comments provided"}
  
        Items by Venue:
        ${(Object.entries(itemsByVenue) as [string, VenueGroup][])
          .map(
            ([_, venueGroup]) => `
          Venue: ${venueGroup.venueName ? venueGroup.venueName : "Main Catalog"}
          ${venueGroup.items
            .map(
              (item: CartItem) => `
            - ${item.title}
              SKU: ${item.sku}
              UOM: ${item.uom || "N/A"}
              Price: ${
                item.price ? `$${item.price.toFixed(2)}` : "Quote Required"
              }
              Quantity: ${item.quantity}
              Subtotal: ${
                item.price
                  ? `$${(item.price * item.quantity).toFixed(2)}`
                  : "Quote Required"
              }
          `
            )
            .join("\n")}
          ${
            venueGroup.items.some((item: CartItem) => item.price)
              ? `Venue Total: $${venueGroup.items
                  .reduce(
                    (total: number, item: CartItem) =>
                      total + (item.price || 0) * item.quantity,
                    0
                  )
                  .toFixed(2)}`
              : "Venue Total: Quote Required"
          }
        `
          )
          .join("\n")}
  
        ${
          items.some((item: CartItem) => item.price)
            ? `Order Total: $${items
                .reduce(
                  (total: number, item: CartItem) =>
                    total + (item.price || 0) * item.quantity,
                  0
                )
                .toFixed(2)}`
            : "Order Total: Quote Required"
        }
      `;

    await transporter.sendMail({
      from: process.env.DNSEXIT_EMAIL,
      to: session.user.email,
      subject: `New Order from ${session.user.email}`,
      text: emailContentCustomer,
    });

    //TODO: Uncomment this when joe finishes his orders api and add quote logic
    // Also save orders to the database (only for venue-specific items)
    try {
      // Get authorization cookie for the internal API call
      const sessionCookie = request.headers.get("cookie");

      // Call the orders API to create orders in the database
      const orderResponse = await fetch(
        `${request.nextUrl.origin}/api/orders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: sessionCookie || "", // Forward the session cookie
          },
          body: JSON.stringify({
            items,
            comment,
            purchaseOrder,
          }),
        }
      );

      const orderResult = await orderResponse.json();

      if (!orderResponse.ok) {
        console.error("Error creating orders:", orderResult);
      }
    } catch (error) {
      // Log the error but don't fail the entire checkout
      console.error("Error saving orders to database:", error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error submitting cart:", error);
    return NextResponse.json(
      { error: "Failed to submit cart" },
      { status: 500 }
    );
  }
}
