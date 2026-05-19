"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PatternBrowseGrid from "@/components/patterns/PatternBrowseGrid";
import {
  PATTERN_BROWSE_CATEGORIES,
  type PatternBrowseByCategory,
  type PatternBrowseCategory,
} from "@/lib/patternBrowse";

const TAB_SLUGS: Record<PatternBrowseCategory, string> = {
  China: "china",
  Flatware: "flatware",
  Glassware: "glassware",
};

const SLUG_TO_CATEGORY = Object.fromEntries(
  Object.entries(TAB_SLUGS).map(([category, slug]) => [slug, category]),
) as Record<string, PatternBrowseCategory>;

function PatternsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [patternsByCategory, setPatternsByCategory] =
    useState<PatternBrowseByCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tabSlug = searchParams.get("tab")?.toLowerCase() ?? "china";
  const activeCategory: PatternBrowseCategory =
    SLUG_TO_CATEGORY[tabSlug] ?? "China";

  useEffect(() => {
    const fetchPatterns = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/patterns");
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to fetch patterns");
        }
        setPatternsByCategory(data.patterns);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load patterns");
      } finally {
        setLoading(false);
      }
    };

    fetchPatterns();
  }, []);

  const activePatterns = useMemo(
    () => patternsByCategory?.[activeCategory] ?? [],
    [patternsByCategory, activeCategory],
  );

  const setActiveTab = (category: PatternBrowseCategory) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", TAB_SLUGS[category]);
    router.push(`/patterns?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Browse Patterns
          </h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-2xl">
            Explore china, flatware, and glassware patterns. Select a pattern to
            view matching products in the catalog.
          </p>
        </div>

        <div className="border-b border-gray-200 mb-8 overflow-x-auto">
          <nav className="-mb-px flex space-x-6 sm:space-x-8 min-w-max">
            {PATTERN_BROWSE_CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveTab(category)}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeCategory === category
                    ? "border-[#B87B5C] text-[#B87B5C]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {category}
              </button>
            ))}
          </nav>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {Array.from({ length: 10 }).map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md h-48 animate-pulse"
              />
            ))}
          </div>
        ) : error ? (
          <p className="text-red-600 text-center py-12">{error}</p>
        ) : (
          <PatternBrowseGrid
            category={activeCategory}
            patterns={activePatterns}
          />
        )}
      </div>
    </div>
  );
}

export default function PatternsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <p className="text-gray-600">Loading patterns...</p>
        </div>
      }
    >
      <PatternsContent />
    </Suspense>
  );
}
