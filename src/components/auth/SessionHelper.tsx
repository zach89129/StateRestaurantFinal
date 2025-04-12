"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

/**
 * SessionHelper Component
 *
 * This component ensures that the NextAuth session is properly initialized
 * on the client side. This helps with environments where session handling
 * might be problematic.
 *
 * This component does not render any visible UI.
 */
export default function SessionHelper() {
  const { data: session, status, update } = useSession();

  // Force update session state when page loads
  useEffect(() => {
    const checkSession = async () => {
      // Force update of session
      if (status === "loading") {
        await new Promise((resolve) => setTimeout(resolve, 500)); // Small delay
        await update();
      }
    };

    checkSession();
  }, [status, update]);

  useEffect(() => {
    // Error handling for fetch requests
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
      try {
        const response = await originalFetch(...args);
        return response;
      } catch (error) {
        console.error("Fetch error:", error);
        return new Response(JSON.stringify({ error: "Failed to fetch" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    };

    return () => {
      // Restore original fetch when component unmounts
      window.fetch = originalFetch;
    };
  }, []);

  // This component doesn't render anything visible
  return null;
}
