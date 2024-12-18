import { prisma } from "@/lib/prisma";
import { CustomerInput, VenueData } from "@/types/api";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  if (!req.body) {
    return NextResponse.json(
      { error: "Missing request body" },
      { status: 400 }
    );
  }

  try {
    const bodyText = await req.text();
    console.log("Raw request body:", bodyText);

    const body: CustomerInput = JSON.parse(bodyText);

    if (!body || !body.customers || !body.customers.length) {
      return NextResponse.json(
        { error: "Missing customers data in request" },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    for (const customerData of body.customers) {
      try {
        const { email, trx_customer_id, seePrices, venueData, phone } =
          customerData;

        // Check if phone number is already in use by another customer
        if (phone) {
          const existingCustomerWithPhone = await prisma.customer.findFirst({
            where: {
              phone,
              trxCustomerId: {
                not: trx_customer_id, // Exclude current customer from check
              },
            },
          });

          if (existingCustomerWithPhone) {
            // Skip this customer and add to errors array
            errors.push({
              customer_id: trx_customer_id,
              error: `Skipped: Phone number ${phone} is already registered to another account`,
            });
            continue; // Skip to next customer in the loop
          }
        }

        // Create base customer data without venues
        const baseCustomerData = {
          email,
          trxCustomerId: trx_customer_id,
          seePrices,
          phone: phone || null,
        };

        // Check if customer exists to handle venue updates properly
        const existingCustomer = await prisma.customer.findUnique({
          where: { trxCustomerId: trx_customer_id },
          include: { venues: true },
        });

        // Add venues connection only if venueData exists and is not empty
        const venuesConnection =
          venueData?.length > 0
            ? {
                venues: {
                  connect: venueData.map((venue: VenueData) => ({
                    trxVenueId: venue.trx_venue_id,
                  })),
                },
              }
            : {};

        const customer = await prisma.customer.upsert({
          where: { trxCustomerId: trx_customer_id },
          update: {
            ...baseCustomerData,
            ...(existingCustomer ? venuesConnection : {}),
          },
          create: {
            ...baseCustomerData,
            ...venuesConnection,
          },
        });

        results.push(customer);
      } catch (err) {
        errors.push({
          customer_id: customerData.trx_customer_id,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      errors: errors.length > 0 ? errors : undefined,
      results,
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const trxCustomerId = searchParams.get("trx_customer_id");

    if (trxCustomerId) {
      // Convert to number since trxCustomerId is numeric in the database
      const customerId = parseInt(trxCustomerId);

      if (isNaN(customerId)) {
        return NextResponse.json(
          { error: "Invalid trx_customer_id parameter" },
          { status: 400 }
        );
      }

      const customer = await prisma.customer.findUnique({
        where: { trxCustomerId: customerId },
        include: { venues: true },
      });

      if (!customer) {
        return NextResponse.json(
          { error: "Customer not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        customer,
      });
    }

    // If no trxCustomerId is provided, return all customers
    const customers = await prisma.customer.findMany({
      include: { venues: true },
    });

    return NextResponse.json({
      success: true,
      customers,
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

//deleting entire customer record
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.trx_customer_ids || !Array.isArray(body.trx_customer_ids)) {
      return NextResponse.json(
        { error: "Invalid request format. Expected array of trx_customer_ids" },
        { status: 400 }
      );
    }

    const result = await prisma.customer.deleteMany({
      where: {
        trxCustomerId: {
          in: body.trx_customer_ids,
        },
      },
    });

    return NextResponse.json({
      success: true,
      deleted: result.count,
    });
  } catch (error) {
    console.error("Error deleting customers:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
