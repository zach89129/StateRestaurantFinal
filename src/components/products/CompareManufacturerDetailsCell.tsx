"use client";

import DetailSection from "./DetailSection";
import { useManufacturerDetails } from "@/hooks/useManufacturerDetails";
import { ComparableProduct } from "@/types/compare";

interface CompareManufacturerDetailsCellProps {
  product: ComparableProduct;
  enabled: boolean;
}

export default function CompareManufacturerDetailsCell({
  product,
  enabled,
}: CompareManufacturerDetailsCellProps) {
  const detailsText =
    product.longDescription?.trim() || product.description?.trim() || "";

  const { manufacturerDetails, loading, error, cached, refresh } =
    useManufacturerDetails({
      sku: product.sku,
      manufacturer: product.manufacturer,
      details: detailsText,
      enabled: enabled && Boolean(product.manufacturer),
    });

  if (!product.manufacturer) {
    return (
      <p className="text-sm text-gray-500 italic">Manufacturer not available</p>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent" />
        <p className="mt-3 text-sm text-gray-600">Gathering manufacturer information...</p>
        <p className="text-xs text-gray-500 mt-1">This may take a moment</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <p className="text-yellow-800 font-medium text-sm">Information Not Available</p>
        <p className="text-yellow-700 text-xs mt-1">{error}</p>
        <button
          type="button"
          onClick={refresh}
          className="mt-2 text-xs text-yellow-700 hover:text-yellow-900 font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!manufacturerDetails) {
    return null;
  }

  return (
    <div className="space-y-1">
      {cached && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 flex items-center justify-between gap-2 mb-3">
          <p className="text-xs text-blue-800">Showing cached information</p>
          <button
            type="button"
            onClick={refresh}
            className="text-xs text-blue-700 hover:text-blue-900 font-medium whitespace-nowrap"
          >
            Refresh
          </button>
        </div>
      )}
      <DetailSection
        title="Technical Specifications"
        content={manufacturerDetails.specifications}
      />
      <DetailSection
        title="Warranty Information"
        content={manufacturerDetails.warranty}
      />
      <DetailSection
        title="Certifications & Compliance"
        content={manufacturerDetails.certifications}
      />
    </div>
  );
}
