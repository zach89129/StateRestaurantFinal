import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { getOTP, deleteOTP } from "@/lib/otpStore";

// Define custom user type
interface User {
  id: string;
  email: string;
  venues: {
    id: string;
    trxVenueId: number;
    venueName: string;
  }[];
  isSuperuser: boolean;
  trxCustomerId: string;
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        otp: { label: "Verification Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.otp) {
          console.log("Missing credentials:", {
            email: credentials?.email,
            otp: credentials?.otp,
          });
          throw new Error("Email and verification code required");
        }

        const normalizedEmail = credentials.email.toLowerCase();
        console.log("Attempting OTP validation:", {
          email: normalizedEmail,
          otp: credentials.otp,
        });

        // Get stored OTP
        const storedData = await getOTP(normalizedEmail);
        console.log("Stored OTP data from database:", storedData);

        if (!storedData) {
          console.log("No stored OTP found in database");
          throw new Error("Verification code expired or not found");
        }

        // Validate OTP
        const isValidOTP = storedData.otp === credentials.otp;
        console.log("OTP validation result:", {
          storedOTP: storedData.otp,
          receivedOTP: credentials.otp,
          isValid: isValidOTP,
          timestamp: new Date(storedData.timestamp).toISOString(),
        });

        if (!isValidOTP) {
          throw new Error("Invalid verification code");
        }

        // Get customer data
        const customer = await prisma.customer.findUnique({
          where: { email: normalizedEmail },
          include: {
            venues: {
              select: {
                id: true,
                trxVenueId: true,
                venueName: true,
              },
            },
          },
        });

        if (!customer) {
          console.log("Customer not found for email:", normalizedEmail);
          throw new Error("Customer not found");
        }

        // Check if user is superuser
        const isSuperuser = customer.email === process.env.SUPERUSER_ACCT;

        // Format venues for session
        const venues = customer.venues.map((venue) => ({
          id: venue.id.toString(),
          trxVenueId: venue.trxVenueId,
          venueName: venue.venueName,
        }));

        // Clear the used OTP only after successful authentication
        await deleteOTP(normalizedEmail);

        return {
          id: customer.id.toString(),
          email: customer.email,
          venues: venues,
          isSuperuser,
          trxCustomerId: customer.id.toString(),
        } as User;
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.venues = user.venues;
        token.isSuperuser = user.isSuperuser;
        token.trxCustomerId = user.trxCustomerId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string;
        session.user.venues = token.venues as {
          id: string;
          trxVenueId: number;
          venueName: string;
        }[];
        session.user.isSuperuser = token.isSuperuser as boolean;
        session.user.trxCustomerId = token.trxCustomerId as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl) || url.startsWith("/")) {
        return url;
      }
      return baseUrl;
    },
  },
};
