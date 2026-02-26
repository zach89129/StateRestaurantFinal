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

export default function VendorCatalogsList() {
  const [vendors, setVendors] = useState<VendorLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const res = await fetch("/api/vendors?type=manufacturer");
        if (!res.ok) throw new Error("Failed to fetch vendors");
        const data = await res.json();
        setVendors(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load vendors");
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
        <p>No manufacturer links available at this time.</p>
      </div>
    );
  }

  return (
    <div className="max-h-[60vh] overflow-y-auto sm:max-h-full sm:overflow-visible">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
        {vendors.map((vendor) => (
          <a
            key={vendor.id}
            href={vendor.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 hover:bg-zinc-50 p-3 rounded-lg transition-colors border border-gray-100"
          >
            <span className="text-sm sm:text-base text-gray-700 group-hover:text-blue-600">
              {vendor.name}
            </span>
            <svg
              className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0"
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
        ))}
      </div>
    </div>
  );
}
