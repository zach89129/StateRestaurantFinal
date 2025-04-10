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
  const { status } = useSession();

  useEffect(() => {
    // Only add error handling in production mode
    if (process.env.NODE_ENV === "production") {
      // Add a global error handler for fetch requests
      const originalFetch = window.fetch;
      window.fetch = async function (...args) {
        try {
          const response = await originalFetch(...args);
          return response;
        } catch (error) {
          console.error("Fetch error in SessionHelper:", error);
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
    }

    // In development mode, we don't need to modify fetch
    return () => {};
  }, []);

  // This component doesn't render anything visible
  return null;
}
