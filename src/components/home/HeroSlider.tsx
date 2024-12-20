"use client";

import Image from "next/image";
import Link from "next/link";

export default function HeroSlider() {
  return (
    <section className="relative h-[400px] md:h-[600px]">
      <div className="relative h-full">
        <Image
          src="/StateHeroImage.webp"
          alt="Commercial Kitchen Equipment"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-black/20 flex items-center">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl">
              <h1 className="text-3xl md:text-5xl font-bold mb-4 text-white">
                Commercial Kitchen Equipment & Restaurant Supplies, Specializing
                in Tabletop
              </h1>
              <p className="text-lg md:text-xl mb-6 md:mb-8 text-gray-100">
                Serving the Food Service Industry Since 1967
              </p>
              <Link
                href="/products"
                className="bg-[#B87B5C] text-white px-6 md:px-8 py-2 md:py-3 rounded-md inline-flex items-center gap-2 hover:bg-[#A66D4F] transition-colors text-sm md:text-base group"
              >
                Browse Catalog
                <svg
                  className="w-4 h-4 transform transition-transform group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
