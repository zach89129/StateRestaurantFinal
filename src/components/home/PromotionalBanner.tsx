"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface PromotionBanner {
  id: number;
  name: string;
  imageUrl: string;
  targetUrl: string | null;
  isActive: boolean;
}

export default function PromotionalBanner() {
  const [banner, setBanner] = useState<PromotionBanner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const response = await fetch("/api/promotions/active-banner");
        if (response.ok) {
          const data = await response.json();
          setBanner(data);
        }
      } catch (error) {
        console.error("Error fetching banner:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBanner();
  }, []);

  if (loading) {
    return (
      <div className="mb-6 sm:mb-8">
        <div className="relative h-[300px] sm:h-[350px] md:h-[400px] overflow-hidden rounded-lg bg-gray-200 animate-pulse">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-gray-500">Loading banner...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!banner) {
    return null;
  }

  // Determine the target URL
  const targetUrl = banner.targetUrl || "/promotion-details";

  // Check if it's an external link (not staterestaurant.com)
  const isExternal =
    banner.targetUrl &&
    !banner.targetUrl.includes("staterestaurant.com") &&
    (banner.targetUrl.startsWith("http://") ||
      banner.targetUrl.startsWith("https://"));

  // For internal links or staterestaurant.com links, use Next.js Link
  if (!isExternal) {
    return (
      <div className="mb-6 sm:mb-8">
        <Link href={targetUrl}>
          <div className="relative h-[300px] sm:h-[350px] md:h-[400px] overflow-hidden rounded-lg group cursor-pointer bg-white">
            <Image
              src={banner.imageUrl}
              alt={banner.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw"
              className="object-contain transition-transform duration-300 group-hover:scale-105"
              priority
            />
            <div className="absolute inset-0" />
          </div>
        </Link>
      </div>
    );
  }

  // For external links, use regular anchor tag with target="_blank"
  return (
    <div className="mb-6 sm:mb-8">
      <a href={targetUrl} target="_blank" rel="noopener noreferrer">
        <div className="relative h-[300px] sm:h-[350px] md:h-[400px] overflow-hidden rounded-lg group cursor-pointer bg-white">
          <Image
            src={banner.imageUrl}
            alt={banner.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw"
            className="object-contain transition-transform duration-300 group-hover:scale-105"
            priority
          />
          <div className="absolute inset-0" />
        </div>
      </a>
    </div>
  );
}
