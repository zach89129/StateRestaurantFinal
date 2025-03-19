/* eslint-disable react/no-unescaped-entities */
"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProductCard from "@/components/products/ProductCard";
import FilterSidebar from "@/components/products/FilterSidebar";
// import Pagination from "@/components/ui/Pagination";
import Link from "next/link";
import { useSearch } from "@/contexts/SearchContext";

interface Product {
  id: number;
  trx_product_id: number;
  sku: string;
  title: string;
  description: string;
  manufacturer: string;
  category: string;
  uom: string;
  qtyAvailable: number;
  tags: string;
  images: { src: string }[];
}

interface SortOptions {
  categories: string[];
  manufacturers: string[];
  patterns: string[];
  collections: string[];
  hasStockItems: boolean;
  hasQuickShip: boolean;
}

interface PaginationInfo {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get("q") || "";
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [sortOptions, setSortOptions] = useState<SortOptions>({
    categories: [],
    manufacturers: [],
    patterns: [],
    collections: [],
    hasStockItems: false,
    hasQuickShip: false,
  });
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    pageSize: 24,
    totalPages: 0,
    hasMore: false,
  });

  // Add new state for filter drawer
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { isSearchVisible } = useSearch();

  // Track selected filters
  const selectedManufacturers =
    searchParams.get("manufacturer")?.split(",").filter(Boolean) || [];
  const selectedPatterns = (
    searchParams.get("tags")?.split(",").filter(Boolean) || []
  )
    .filter((tag) => tag.startsWith("PATTERN_"))
    .map((tag) => tag.replace("PATTERN_", ""));
  const selectedTags =
    searchParams.get("tags")?.split(",").filter(Boolean) || [];
  const selectedCategories =
    searchParams
      .get("category")
      ?.split(",")
      .filter(Boolean)
      .map((c) => decodeURIComponent(c)) || [];

  // Add state to track initial filter options
  const [initialSortOptions, setInitialSortOptions] = useState<SortOptions>({
    categories: [],
    manufacturers: [],
    patterns: [],
    collections: [],
    hasStockItems: false,
    hasQuickShip: false,
  });

  // Update the search effect
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!searchTerm) {
        setProducts([]);
        setSortOptions({
          categories: [],
          manufacturers: [],
          patterns: [],
          collections: [],
          hasStockItems: false,
          hasQuickShip: false,
        });
        setInitialSortOptions({
          categories: [],
          manufacturers: [],
          patterns: [],
          collections: [],
          hasStockItems: false,
          hasQuickShip: false,
        });
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const params = new URLSearchParams(searchParams.toString());
        const response = await fetch(
          `/api/products/search?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch search results");
        }

        const data = await response.json();
        if (data.success) {
          setProducts(data.products);
          setPagination(data.pagination);

          // If this is the initial search (no filters applied), save these options
          const hasNoFilters =
            !params.get("category") &&
            !params.get("manufacturer") &&
            !params.get("pattern") &&
            !params.get("tags");

          if (hasNoFilters && data.filters) {
            const initialOptions = {
              categories: data.filters.availableCategories || [],
              manufacturers: data.filters.availableManufacturers || [],
              patterns: data.filters.availablePatterns || [],
              collections: data.filters.availableCollections || [],
              hasStockItems: data.filters.hasStockItems,
              hasQuickShip: data.filters.hasQuickShip,
            };
            setInitialSortOptions(initialOptions);
            setSortOptions(initialOptions);
          } else if (data.filters) {
            // For filtered results, use initial options but update stock/quickship status
            setSortOptions((prev) => ({
              ...initialSortOptions,
              hasStockItems: data.filters.hasStockItems,
              hasQuickShip: data.filters.hasQuickShip,
            }));
          }
        } else {
          console.error("Search failed:", data.error);
          setProducts([]);
          // Clear filter options when search fails
          setSortOptions({
            categories: [],
            manufacturers: [],
            patterns: [],
            collections: [],
            hasStockItems: false,
            hasQuickShip: false,
          });
          setInitialSortOptions({
            categories: [],
            manufacturers: [],
            patterns: [],
            collections: [],
            hasStockItems: false,
            hasQuickShip: false,
          });
        }
      } catch (error) {
        console.error("Error fetching search results:", error);
        setProducts([]);
        // Clear filter options on error
        setSortOptions({
          categories: [],
          manufacturers: [],
          patterns: [],
          collections: [],
          hasStockItems: false,
          hasQuickShip: false,
        });
        setInitialSortOptions({
          categories: [],
          manufacturers: [],
          patterns: [],
          collections: [],
          hasStockItems: false,
          hasQuickShip: false,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [searchParams, searchTerm]);

  const handleCategoryChange = (category: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");

    const currentCategories =
      params
        .get("category")
        ?.split(",")
        .map((c) => decodeURIComponent(c.trim()))
        .filter(Boolean) || [];

    let newCategories;
    if (currentCategories.includes(category)) {
      newCategories = currentCategories.filter((c) => c !== category);
    } else {
      newCategories = [...new Set([...currentCategories, category])];
    }

    if (newCategories.length > 0) {
      params.set(
        "category",
        newCategories.map((c) => encodeURIComponent(c)).join(",")
      );
    } else {
      params.delete("category");
    }

    router.push(`/search?${params.toString()}`, { scroll: false });
  };

  const handleManufacturerChange = (manufacturer: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");

    const currentManufacturers =
      params
        .get("manufacturer")
        ?.split(",")
        .map((m) => decodeURIComponent(m))
        .filter(Boolean) || [];

    const normalizeString = (str: string) => str.trim();
    const normalizedManufacturer = normalizeString(manufacturer);

    const isSelected = currentManufacturers.some(
      (m) => normalizeString(m) === normalizedManufacturer
    );

    let newManufacturers;
    if (isSelected) {
      newManufacturers = currentManufacturers.filter(
        (m) => normalizeString(m) !== normalizedManufacturer
      );
    } else {
      newManufacturers = [...new Set([...currentManufacturers, manufacturer])];
    }

    if (newManufacturers.length > 0) {
      params.set(
        "manufacturer",
        newManufacturers.map((m) => encodeURIComponent(m)).join(",")
      );
    } else {
      params.delete("manufacturer");
    }

    router.push(`/search?${params.toString()}`, { scroll: false });
  };

  const handlePatternChange = (pattern: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");

    // Add tags parameter if not present
    const currentTags = params.get("tags")?.split(",").filter(Boolean) || [];
    const patternTag = `PATTERN_${pattern}`;

    let newTags;
    if (currentTags.includes(patternTag)) {
      newTags = currentTags.filter((t) => t !== patternTag);
    } else {
      newTags = [...currentTags, patternTag];
    }

    if (newTags.length > 0) {
      params.set("tags", newTags.join(","));
    } else {
      params.delete("tags");
    }

    router.push(`/search?${params.toString()}`, { scroll: false });
  };

  const handleTagChange = (tag: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");

    const currentTags = params.get("tags")?.split(",").filter(Boolean) || [];

    let newTags;
    if (currentTags.includes(tag)) {
      newTags = currentTags.filter((t) => t !== tag);
    } else {
      newTags = [...currentTags, tag];
    }

    if (newTags.length > 0) {
      params.set("tags", newTags.join(","));
    } else {
      params.delete("tags");
    }

    router.push(`/search?${params.toString()}`, { scroll: false });
  };

  const handleClearAll = () => {
    const params = new URLSearchParams();
    params.set("q", searchTerm);
    router.push(`/search?${params.toString()}`, { scroll: false });
  };

  // Add page change handler
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/search?${params.toString()}`, { scroll: false });
  };

  // Add toggle function for mobile filter
  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="flex py-4 text-sm">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            Home
          </Link>
          <span className="mx-2 text-gray-600">/</span>
          <Link href="/products" className="text-gray-600 hover:text-gray-900">
            Products
          </Link>
          <span className="mx-2 text-gray-600">/</span>
          <span className="text-gray-900 font-medium">Search Results</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar */}
          <FilterSidebar
            sortOptions={sortOptions}
            selectedCategories={selectedCategories}
            selectedManufacturers={selectedManufacturers}
            selectedPatterns={selectedPatterns}
            selectedTags={selectedTags}
            onCategoryChange={handleCategoryChange}
            onManufacturerChange={handleManufacturerChange}
            onPatternChange={handlePatternChange}
            onTagChange={handleTagChange}
            onClearAll={handleClearAll}
            onClose={() => setIsFilterOpen(false)}
            isOpen={isFilterOpen}
          />

          {/* Main Content */}
          <div className="flex-1 min-h-0">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Search Results
                </h1>
                {searchTerm && (
                  <p className="text-sm text-gray-600 mt-1">
                    Showing results for "{searchTerm}"
                  </p>
                )}
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push("/products")}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Back to Catalog
                </button>
                {!loading && (
                  <div className="text-sm text-gray-900 ml-4">
                    {pagination.total} Products
                  </div>
                )}
              </div>
            </div>

            {/* Add min-height and proper spacing */}
            <div className="min-h-screen pb-16">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-black"></div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-6 mb-8">
                    {products.map((product) => (
                      <ProductCard
                        key={`search-product-${product.id}`}
                        product={product}
                      />
                    ))}
                  </div>

                  {/* No Results */}
                  {products.length === 0 && !loading && (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No products found</p>
                      <button
                        onClick={handleClearAll}
                        className="mt-4 text-blue-600 hover:text-blue-800"
                      >
                        Clear all filters
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Pagination */}
              {!loading && pagination.totalPages > 1 && (
                <div className="mt-8 mb-4 flex justify-center">
                  <nav className="flex items-center gap-1">
                    {/* Previous button */}
                    <button
                      key="prev"
                      onClick={() =>
                        handlePageChange(Math.max(1, pagination.page - 1))
                      }
                      disabled={pagination.page === 1}
                      className={`px-2 py-1 rounded border ${
                        pagination.page === 1
                          ? "border-gray-200 text-gray-400 cursor-not-allowed"
                          : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                      aria-label="Previous page"
                    >
                      ‹
                    </button>

                    {/* Page numbers */}
                    {Array.from(
                      { length: pagination.totalPages },
                      (_, i) => i + 1
                    ).map((page) => (
                      <button
                        key={`page-${page}`}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1 rounded border ${
                          page === pagination.page
                            ? "bg-zinc-900 text-white border-zinc-900"
                            : "border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                        aria-label={`Go to page ${page}`}
                        aria-current={
                          page === pagination.page ? "page" : undefined
                        }
                      >
                        {page}
                      </button>
                    ))}

                    {/* Next button */}
                    <button
                      key="next"
                      onClick={() =>
                        handlePageChange(
                          Math.min(pagination.totalPages, pagination.page + 1)
                        )
                      }
                      disabled={pagination.page === pagination.totalPages}
                      className={`px-2 py-1 rounded border ${
                        pagination.page === pagination.totalPages
                          ? "border-gray-200 text-gray-400 cursor-not-allowed"
                          : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                      aria-label="Next page"
                    >
                      ›
                    </button>
                  </nav>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Filter Button */}
        <button
          onClick={toggleFilter}
          className={`fixed right-4 z-30 md:hidden flex items-center gap-2 px-4 py-3 bg-copper text-white border border-copper rounded-full shadow-lg hover:bg-copper-hover ${
            isSearchVisible ? "top-[150px]" : "top-[100px]"
          } transition-all duration-300 ease-in-out`}
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
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          <span className="text-sm font-medium">Filter</span>
        </button>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
