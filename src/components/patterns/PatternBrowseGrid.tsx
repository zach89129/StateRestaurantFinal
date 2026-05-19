/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useState } from "react";
import type { PatternBrowseEntry } from "@/lib/patternBrowse";

const PLACEHOLDER_IMAGE = "/noImageState.jpg";

interface PatternBrowseGridProps {
  category: string;
  patterns: PatternBrowseEntry[];
}

function PatternTile({
  category,
  pattern,
}: {
  category: string;
  pattern: PatternBrowseEntry;
}) {
  const [imgError, setImgError] = useState(false);
  const imageSrc =
    pattern.imageUrl && !imgError ? pattern.imageUrl : PLACEHOLDER_IMAGE;
  const href = `/products/${encodeURIComponent(category)}?pattern_b64=${btoa(pattern.name)}&page=1`;

  return (
    <Link
      href={href}
      className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300"
    >
      <div className="h-36 sm:h-40 bg-white p-3 flex items-center justify-center">
        <img
          src={imageSrc}
          alt={pattern.name}
          className="max-h-full max-w-full w-auto object-contain transition-transform duration-300 group-hover:scale-105"
          onError={() => setImgError(true)}
          loading="lazy"
        />
      </div>
      <div className="p-3 bg-gradient-to-b from-zinc-50 to-white border-t border-gray-100">
        <h3 className="text-sm sm:text-base font-semibold text-gray-900 text-center line-clamp-2">
          {pattern.name}
        </h3>
        <p className="text-xs text-gray-500 text-center mt-1">
          {pattern.productCount}{" "}
          {pattern.productCount === 1 ? "product" : "products"}
        </p>
      </div>
    </Link>
  );
}

export default function PatternBrowseGrid({
  category,
  patterns,
}: PatternBrowseGridProps) {
  if (patterns.length === 0) {
    return (
      <p className="text-gray-600 text-center py-12">
        No patterns found for this category.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
      {patterns.map((pattern) => (
        <PatternTile
          key={pattern.name}
          category={category}
          pattern={pattern}
        />
      ))}
    </div>
  );
}
