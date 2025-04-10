"use client";

import { SessionProvider } from "next-auth/react";
import { CartProvider } from "@/contexts/CartContext";
import SessionHelper from "@/components/auth/SessionHelper";

export function Providers({ children }: { children: React.ReactNode }) {
  // Check if we're in development mode
  const isDevelopment = process.env.NODE_ENV === "development";

  return (
    <SessionProvider
      // In development, we can refetch to ensure we have the latest session
      // In production, we disable refetching to avoid auth issues
      refetchInterval={isDevelopment ? 60 : 0}
      refetchOnWindowFocus={isDevelopment}
    >
      <SessionHelper />
      <CartProvider>{children}</CartProvider>
    </SessionProvider>
  );
}
