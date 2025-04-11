"use client";

import { SessionProvider } from "next-auth/react";
import { CartProvider } from "@/contexts/CartContext";
import SessionHelper from "@/components/auth/SessionHelper";

export function Providers({ children }: { children: React.ReactNode }) {
  // Determine if we're in production or development
  const isProduction = process.env.NODE_ENV === "production";

  return (
    <SessionProvider
      // Less aggressive refresh for production
      refetchInterval={isProduction ? 60 : 30}
      refetchOnWindowFocus={true}
      refetchWhenOffline={false}
    >
      <SessionHelper />
      <CartProvider>{children}</CartProvider>
    </SessionProvider>
  );
}
