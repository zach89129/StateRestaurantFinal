"use client";

import { useState, useEffect } from "react";

interface VendorLink {
  id: number;
  name: string;
  url: string;
  imageUrl: string | null;
  type: string;
  order: number;
}

function VendorCard({ vendor }: { vendor: VendorLink }) {
  const [imgError, setImgError] = useState(false);

  const imageSrc =
    vendor.imageUrl && !imgError ? vendor.imageUrl : null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => window.open(vendor.url, "_blank")}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          window.open(vendor.url, "_blank");
        }
      }}
      className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
    >
      <div className="h-24 sm:h-32 lg:h-40 bg-white p-3 sm:p-4 flex items-center justify-center">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={vendor.name}
            className="max-h-full w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-400">
            <span className="text-sm font-medium text-center px-2 line-clamp-2">
              {vendor.name}
            </span>
          </div>
        )}
      </div>
      <div className="p-3 sm:p-6 bg-gradient-to-b from-zinc-50 to-white">
        <h3 className="text-sm sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 text-center truncate px-1">
          {vendor.name}
        </h3>
        <div className="flex justify-center">
          <a
            href={vendor.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="bg-[#B87B5C] text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-[#A66D4F] transition-all duration-300 inline-flex items-center gap-1 sm:gap-2 shadow-md hover:shadow-lg text-xs sm:text-base w-full sm:w-auto justify-center"
          >
            <span>View Catalog</span>
            <svg
              className="w-3 h-3 sm:w-4 sm:h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}

export default function ChinaFlatwareVendors() {
  const [vendors, setVendors] = useState<VendorLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const res = await fetch("/api/vendors?type=china_flatware");
        if (!res.ok) throw new Error("Failed to fetch vendors");
        const data = await res.json();
        setVendors(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load partners");
      } finally {
        setLoading(false);
      }
    };
    fetchVendors();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-gray-600">
        <p>{error}</p>
      </div>
    );
  }

  if (vendors.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600">
        <p>No partners available at this time.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8">
      {vendors.map((vendor) => (
        <VendorCard key={vendor.id} vendor={vendor} />
      ))}
    </div>
  );
}
