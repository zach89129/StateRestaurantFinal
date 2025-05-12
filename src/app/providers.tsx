"use client";

import { SessionProvider } from "next-auth/react";
import { CartProvider } from "@/contexts/CartContext";
import SessionHelper from "@/components/auth/SessionHelper";
import { SalesTeamVenueProvider } from "@/contexts/SalesTeamVenueContext";
export function Providers({ children }: { children: React.ReactNode }) {
  // Determine if we're in production or development
  const isProduction = process.env.NODE_ENV === "production";

  return (
    <SessionProvider
      // Less aggressive refresh for production and generally
      refetchInterval={isProduction ? 5 * 60 : 2 * 60} // 5 minutes in production, 2 minutes in dev
      refetchOnWindowFocus={false} // Only refresh when specifically needed, not on window focus
      refetchWhenOffline={false}
    >
      <SalesTeamVenueProvider>
        <SessionHelper />
        <CartProvider>{children}</CartProvider>
      </SalesTeamVenueProvider>
    </SessionProvider>
  );
}
