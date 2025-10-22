"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface PromotionDetail {
  id: number;
  name: string;
  imageUrl: string;
  targetUrl: string | null;
  order: number;
  isActive: boolean;
}

export default function PromotionDetails() {
  const [details, setDetails] = useState<PromotionDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await fetch("/api/admin/promotions/details");
        if (response.ok) {
          const data = await response.json();
          setDetails(data);
        }
      } catch (error) {
        console.error("Error fetching promotion details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2].map((i) => (
          <div key={i} className="relative w-full">
            <div className="w-full h-[600px] bg-gray-200 rounded-lg animate-pulse flex items-center justify-center">
              <div className="text-gray-500">Loading promotion details...</div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (details.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No promotion details available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {details.map((detail) => (
        <div key={detail.id} className="relative w-full">
          <Image
            src={detail.imageUrl}
            alt={detail.name}
            width={800}
            height={600}
            className="w-full h-auto rounded-lg shadow-md"
            priority={detail.order === 0}
          />
          {detail.targetUrl && (
            <div className="mt-4 text-center">
              <a
                href={detail.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-[#B87B5C] text-white px-6 py-3 rounded-lg hover:bg-[#A66D4F] transition-colors text-base font-medium shadow-md"
              >
                Learn More →
              </a>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
