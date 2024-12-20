"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CartSuccessPage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!session?.user) {
      router.push("/login");
    }
  }, [session, router]);

  const getContinueShoppingUrl = () => {
    if (session?.user?.venues && session.user.venues.length > 0) {
      return `/venues/${session.user.venues[0].trxVenueId}`;
    }
    return "/products";
  };

  if (!session?.user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="bg-white shadow-lg rounded-lg p-8 text-center">
          <div className="mb-6">
            <svg
              className="w-16 h-16 text-green-500 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Order Submitted Successfully!
          </h1>

          <p className="text-gray-600 mb-8">
            Thank you for your order. Our sales team will review your request
            and contact you shortly with pricing and availability information.
          </p>

          <div className="space-y-4">
            <Link
              href={getContinueShoppingUrl()}
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
            >
              Continue Shopping
            </Link>

            <div className="text-sm text-gray-500 mt-6">
              Have questions about your order?{" "}
              <Link
                href="/contact"
                className="text-blue-600 hover:text-blue-800"
              >
                Contact our team
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
