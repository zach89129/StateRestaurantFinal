"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function PromotionDetailsPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Small delay to show loading state
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B87B5C] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading promotion details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              A Taste of Vegas
            </h1>
            <p className="text-gray-600 mt-2">
              You&apos;re invited to a 2 day culinary, craft, and innovative
              event at Pro Rep&apos;s test kitchen.
            </p>
          </div>

          <div className="p-6">
            <div className="space-y-6">
              {/* First Promotion Image */}
              <div className="relative w-full">
                <Image
                  src="/promotions/promotion1.jpg"
                  alt="A Taste of Vegas Promotion - Page 1"
                  width={800}
                  height={600}
                  className="w-full h-auto rounded-lg shadow-md"
                  priority
                />
              </div>

              {/* Second Promotion Image */}
              <div className="relative w-full">
                <Image
                  src="/promotions/promotion2.jpg"
                  alt="A Taste of Vegas Promotion - Page 2"
                  width={800}
                  height={600}
                  className="w-full h-auto rounded-lg shadow-md"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
