"use client";

import { SessionProvider } from "next-auth/react";
import { CartProvider } from "@/contexts/CartContext";
import SessionHelper from "@/components/auth/SessionHelper";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      // Use more reasonable refresh interval to prevent loops
      refetchInterval={30} // Check every 30 seconds instead of 5
      refetchOnWindowFocus={true}
      refetchWhenOffline={false}
    >
      <SessionHelper />
      <CartProvider>{children}</CartProvider>
    </SessionProvider>
  );
}
