"use client";

import { useEffect, useState } from "react";
import PromotionDetails from "@/components/promotions/PromotionDetails";
import PromotionContent from "@/components/promotions/PromotionContent";

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
          <PromotionContent />

          <div className="p-6">
            <PromotionDetails />
          </div>
        </div>
      </div>
    </div>
  );
}
