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
        try {
          if (!credentials?.email || !credentials?.otp) {
            throw new Error("Email and verification code required");
          }

          const normalizedEmail = credentials.email.toLowerCase();

          // Get stored OTP
          const storedData = await getOTP(normalizedEmail);

          if (!storedData) {
            throw new Error("Verification code expired or not found");
          }

          // Validate OTP
          const isValidOTP = storedData.otp === credentials.otp;

          if (!isValidOTP) {
            throw new Error("Invalid verification code");
          }

          try {
            // Get customer data
            const customer = await prisma.customer.findUnique({
              where: { email: normalizedEmail },
              include: {
                venues: {
                  select: {
                    trxVenueId: true,
                    venueName: true,
                  },
                },
              },
            });

            if (!customer) {
              throw new Error("Customer not found");
            }

            // Check if user is superuser
            const isSuperuser = customer.email === process.env.SUPERUSER_ACCT;

            // Format venues for session
            const venues = customer.venues.map((venue) => ({
              id: venue.trxVenueId.toString(),
              trxVenueId: venue.trxVenueId,
              venueName: venue.venueName,
            }));

            // Clear the used OTP only after successful authentication
            try {
              await deleteOTP(normalizedEmail);
            } catch (deleteError) {
              console.error("Error deleting OTP:", deleteError);
              // Continue even if OTP deletion fails
            }

            // Create the user object to return
            const user = {
              id: customer.trxCustomerId.toString(),
              email: customer.email,
              venues: venues,
              isSuperuser,
              trxCustomerId: customer.trxCustomerId.toString(),
            } as User;

            return user;
          } catch (customerError) {
            console.error("Error retrieving customer data:", customerError);
            throw new Error("Error retrieving your account information");
          }
        } catch (error) {
          console.error("Authentication error:", error);
          throw error;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
        domain:
          process.env.NODE_ENV === "production" ? ".vercel.app" : undefined,
      },
    },
    callbackUrl: {
      name: `__Secure-next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
        domain:
          process.env.NODE_ENV === "production" ? ".vercel.app" : undefined,
      },
    },
    csrfToken: {
      name: `__Secure-next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
        domain:
          process.env.NODE_ENV === "production" ? ".vercel.app" : undefined,
      },
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      console.log("JWT callback - token:", token);
      console.log("JWT callback - user:", user);

      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.venues = user.venues;
        token.isSuperuser = user.isSuperuser;
        token.trxCustomerId = user.trxCustomerId;
        token.name = user.email; // Add name to ensure compatibility

        // Add explicit expiration time
        token.iat = Math.floor(Date.now() / 1000);
        token.exp = Math.floor(Date.now() / 1000) + 24 * 60 * 60; // 24 hours
      }

      console.log("JWT callback - updated token:", token);
      return token;
    },
    async session({ session, token }) {
      console.log("Session callback - session:", session);
      console.log("Session callback - token:", token);

      if (token && session.user) {
        session.user.id = token.sub as string;
        session.user.email = token.email as string;
        session.user.venues = token.venues as {
          id: string;
          trxVenueId: number;
          venueName: string;
        }[];
        session.user.isSuperuser = token.isSuperuser as boolean;
        session.user.trxCustomerId = token.trxCustomerId as string;
        session.user.name = token.email as string; // Add name to ensure compatibility

        // Add session expiry
        session.expires = new Date(
          Date.now() + 24 * 60 * 60 * 1000
        ).toISOString();
      }

      console.log("Session callback - updated session:", session);
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl) || url.startsWith("/")) {
        return url;
      }
      return baseUrl;
    },
  },
  debug: true, // Enable debug mode to see detailed logs
};
