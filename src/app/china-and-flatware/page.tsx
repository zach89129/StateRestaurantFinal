/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import ChinaFlatwareVendors from "@/app/china-and-flatware/ChinaFlatwareVendors";

export default function ChinaAndFlatwarePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="relative bg-zinc-900 text-white py-32 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-50 transform scale-105">
          <img
            src="/StateHeroImage.webp"
            alt="China and Flatware Background"
            className="w-full h-full object-cover transform scale-105 motion-safe:animate-subtle-zoom"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/50 to-zinc-900/80" />
        <div className="relative z-10 container mx-auto px-4">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-center">
            China and Flatware
          </h1>
          <p className="text-xl md:text-2xl text-center max-w-3xl mx-auto text-gray-200 mb-8">
            Explore our premium selection of china and flatware manufacturers
          </p>
          <div className="flex justify-center">
            <a
              href="#vendors"
              className="inline-flex items-center gap-2 text-white hover:text-gray-200 transition-colors"
            >
              <span>View Catalogs</span>
              <svg
                className="w-5 h-5 animate-bounce"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>

      <div className="bg-zinc-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Premium Quality Tableware
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              We partner with the world's leading manufacturers to bring you an
              exceptional selection of china and flatware. Each piece is
              carefully chosen for its quality, durability, and design
              excellence to meet the demanding standards of the hospitality
              industry.
            </p>
          </div>
        </div>
      </div>

      <div id="vendors" className="container mx-auto px-4 py-16">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Our Trusted Partners
          </h2>
          <ChinaFlatwareVendors />
        </div>
      </div>

      <div className="bg-zinc-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Need Assistance?</h2>
            <p className="text-lg text-gray-300 mb-8">
              Our team of experts is here to help you find the perfect tableware
              solutions for your business.
            </p>
            <a
              href="tel:+17027331515"
              className="inline-flex items-center gap-2 bg-white text-zinc-900 px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              <span className="font-semibold">Contact Us</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
