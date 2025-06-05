import { prisma } from "@/lib/prisma";
import { CustomerInput, VenueData } from "@/types/api";
import { NextRequest, NextResponse } from "next/server";
import { convertBigIntToString } from "@/utils/convertBigIntToString";
import { sendSMS } from "@/lib/twilio";

const sendCustomerSMS = async (phone: string, email: string) => {
  if (!phone) return;
  const media = [
    "https://stateimages-3131.twil.io/stateiphone.jpg",
    "https://stateimages-3131.twil.io/stateandroid.jpg",
  ];

  try {
    const message = `Congratulations! Your State website login has been activated. You can now log in using your email address ${email} at https://www.staterestaurant.com. Add the State icon to your home screen so its aways available with a click! Follow the easy instructions for Apple or Android on the attached images.`;

    await sendSMS(phone, message, media);
  } catch (error) {
    console.error("Error sending customer SMS notification:", error);
    // We don't want to fail the whole operation if SMS fails, so just log the error
  }
};

export async function POST(req: NextRequest) {
  if (!req.body) {
    return NextResponse.json(
      { error: "Missing request body" },
      { status: 400 }
    );
  }

  try {
    const bodyText = await req.text();

    let body: CustomerInput;
    try {
      // Parse the JSON body
      body = JSON.parse(bodyText);
    } catch (parseError: any) {
      console.error("JSON parse error:", parseError);

      // Try to fix common issues with leading zeros in numeric IDs
      const fixedBodyText = bodyText.replace(
        /"trx_customer_id":\s*0+(\d+)/g,
        '"trx_customer_id": $1'
      );

      try {
        body = JSON.parse(fixedBodyText);
      } catch (secondError) {
        return NextResponse.json(
          { error: `Invalid JSON format: ${parseError.message}` },
          { status: 400 }
        );
      }
    }

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
        const { email, trx_customer_id, seePrices, venues, phone } =
          customerData;

        // Validate required fields
        if (!trx_customer_id) {
          errors.push({
            error: "Missing required field: trx_customer_id",
          });
          continue; // Skip to next customer
        }

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

        // Add venues connection only if venues exists and is not empty
        const venuesConnection =
          venues?.length > 0
            ? {
                venues: {
                  connect: venues.map((venue: VenueData | number) => {
                    // Handle both formats: number or object with trx_venue_id
                    const venueId =
                      typeof venue === "number" ? venue : venue.trx_venue_id;

                    return { trxVenueId: venueId };
                  }),
                },
              }
            : {};

        let customer;

        if (existingCustomer) {
          // If customer exists, update it instead of deleting and recreating
          // First disconnect all venues
          if (existingCustomer.venues.length > 0) {
            await prisma.customer.update({
              where: { trxCustomerId: trx_customer_id },
              data: {
                venues: {
                  disconnect: existingCustomer.venues.map((venue) => ({
                    trxVenueId: venue.trxVenueId,
                  })),
                },
              },
            });
          }

          // Then update the customer with new data and connect new venues
          customer = await prisma.customer.update({
            where: { trxCustomerId: trx_customer_id },
            data: {
              ...baseCustomerData,
              ...venuesConnection,
            },
            include: {
              venues: true,
            },
          });
        } else {
          // If customer doesn't exist, create it
          customer = await prisma.customer.create({
            data: {
              ...baseCustomerData,
              ...venuesConnection,
            },
            include: {
              venues: true,
            },
          });

          // Send SMS notification for new customer
          if (phone && email) {
            await sendCustomerSMS(phone, email);
          }
        }

        // Format the customer response to use trx_venue_id instead of trxVenueId
        const {
          trxCustomerId,
          venues: customerVenues,
          ...customerRest
        } = customer;
        const formattedCustomer = {
          trx_customer_id: trxCustomerId,
          ...customerRest,
          venues: customerVenues.map((venue) => ({
            trx_venue_id: venue.trxVenueId,
            venueName: venue.venueName,
          })),
        };

        results.push(formattedCustomer);
      } catch (err) {
        errors.push({
          customer_id: customerData.trx_customer_id,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    // Convert any remaining BigInt values to strings
    const safeResults = convertBigIntToString(results);
    console.log(safeResults, errors);
    return NextResponse.json({
      success: true,
      processed: results.length,
      errors: errors.length > 0 ? errors : undefined,
      results: safeResults,
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

      // Format the customer response to use trx_venue_id instead of trxVenueId
      const { trxCustomerId: _, venues, ...customerRest } = customer;
      const formattedCustomer = {
        trx_customer_id: trxCustomerId,
        ...customerRest,
        venues: venues.map((venue) => ({
          trx_venue_id: venue.trxVenueId,
          venueName: venue.venueName,
        })),
      };

      // Convert any remaining BigInt values to strings
      const safeCustomer = convertBigIntToString(formattedCustomer);

      return NextResponse.json({
        success: true,
        customer: safeCustomer,
      });
    }

    // If no trxCustomerId is provided, return all customers
    const customers = await prisma.customer.findMany({
      include: { venues: true },
    });

    // Format all customers to use trx_venue_id instead of trxVenueId
    const formattedCustomers = customers.map((customer) => {
      const {
        trxCustomerId,
        venues: customerVenues,
        ...customerRest
      } = customer;
      return {
        trx_customer_id: trxCustomerId,
        ...customerRest,
        venues: customerVenues.map((venue) => ({
          trx_venue_id: venue.trxVenueId,
          venueName: venue.venueName,
        })),
      };
    });

    // Convert any remaining BigInt values to strings
    const safeCustomers = convertBigIntToString(formattedCustomers);

    return NextResponse.json({
      success: true,
      customers: safeCustomers,
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
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Request body must be a JSON object" },
        { status: 400 }
      );
    }

    if (!body.trx_customer_ids || !Array.isArray(body.trx_customer_ids)) {
      return NextResponse.json(
        { error: "Invalid request format. Expected array of trx_customer_ids" },
        { status: 400 }
      );
    }

    if (body.trx_customer_ids.length === 0) {
      return NextResponse.json(
        { error: "trx_customer_ids array cannot be empty" },
        { status: 400 }
      );
    }

    // Validate that all IDs are numbers
    const validIds = body.trx_customer_ids.every(
      (id: number) => typeof id === "number"
    );
    if (!validIds) {
      return NextResponse.json(
        { error: "All trx_customer_ids must be numbers" },
        { status: 400 }
      );
    }

    // First, delete all _CustomerToVenue relations for these customers
    for (const customerId of body.trx_customer_ids) {
      await prisma.$executeRaw`DELETE FROM _CustomerToVenue WHERE A = ${customerId}`;
    }

    // Delete associated cart items and carts first
    await prisma.cartItem.deleteMany({
      where: {
        cart: {
          customerId: {
            in: body.trx_customer_ids,
          },
        },
      },
    });

    await prisma.cart.deleteMany({
      where: {
        customerId: {
          in: body.trx_customer_ids,
        },
      },
    });

    // Then delete the customers
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
