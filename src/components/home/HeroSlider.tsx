"use client";

import Image from "next/image";
import Link from "next/link";

export default function HeroSlider() {
  return (
    <>
      {/* Hero Section with Slideshow */}
      <section className="relative h-[600px]">
        <div className="relative h-full">
          <Image
            src="/StateHeroImage.webp"
            alt="Commercial Kitchen Equipment"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/20 flex items-center">
            <div className="container mx-auto px-4">
              <div className="max-w-2xl">
                <h1 className="text-white text-5xl font-bold mb-4">
                  Commercial Kitchen Equipment & Restaurant Supplies
                </h1>
                <p className="text-white text-xl mb-8">
                  Serving the Food Service Industry Since 1951
                </p>
                <Link
                  href="/products"
                  className="bg-[#B87B5C] text-white px-8 py-3 rounded-md inline-block hover:bg-[#A66D4F]  transition-colors"
                >
                  Browse Catalog
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
