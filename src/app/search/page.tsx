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

// Add PaginationInfo interface
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
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    pageSize: 24,
    totalPages: 0,
    hasMore: false,
  });
  const [sortOptions, setSortOptions] = useState({
    categories: [],
    manufacturers: [],
    patterns: [],
    collections: [],
    hasStockItems: false,
    hasQuickShip: false,
  });

  // Add new state for filter drawer
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Track selected filters
  const selectedManufacturers =
    searchParams.get("manufacturer")?.split(",").filter(Boolean) || [];
  const selectedPatterns =
    searchParams.get("pattern")?.split(",").filter(Boolean) || [];
  const selectedTags =
    searchParams.get("tags")?.split(",").filter(Boolean) || [];
  const selectedCategories =
    searchParams
      .get("category")
      ?.split(",")
      .filter(Boolean)
      .map((c) => decodeURIComponent(c)) || [];

  // Add toggle function
  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  // Add search effect to fetch products when search term changes
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
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Include all URL parameters in the search request
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
          // Update sort options from server data
          setSortOptions({
            categories: data.filters.availableCategories || [],
            manufacturers: data.filters.availableManufacturers || [],
            patterns: data.filters.availablePatterns || [],
            collections: [], // Collections are not used in search
            hasStockItems: data.filters.hasStockItems || false,
            hasQuickShip: data.filters.hasQuickShip || false,
          });
        } else {
          console.error("Search failed:", data.error);
          setProducts([]);
        }
      } catch (error) {
        console.error("Error fetching search results:", error);
        setProducts([]);
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
        .filter(Boolean)
        .map((c) => decodeURIComponent(c)) || [];
    const updatedCategories = currentCategories.includes(category)
      ? currentCategories.filter((c) => c !== category)
      : [...currentCategories, category];

    if (updatedCategories.length > 0) {
      params.set(
        "category",
        updatedCategories.map((c) => encodeURIComponent(c)).join(",")
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
      params.get("manufacturer")?.split(",").filter(Boolean) || [];
    const updatedManufacturers = currentManufacturers.includes(manufacturer)
      ? currentManufacturers.filter((m) => m !== manufacturer)
      : [...currentManufacturers, manufacturer];

    if (updatedManufacturers.length > 0) {
      params.set("manufacturer", updatedManufacturers.join(","));
    } else {
      params.delete("manufacturer");
    }

    router.push(`/search?${params.toString()}`, { scroll: false });
  };

  const handlePatternChange = (pattern: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");

    const currentPatterns =
      params.get("pattern")?.split(",").filter(Boolean) || [];
    const updatedPatterns = currentPatterns.includes(pattern)
      ? currentPatterns.filter((p) => p !== pattern)
      : [...currentPatterns, pattern];

    if (updatedPatterns.length > 0) {
      params.set("pattern", updatedPatterns.join(","));
    } else {
      params.delete("pattern");
    }

    router.push(`/search?${params.toString()}`, { scroll: false });
  };

  const handleTagChange = (tag: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");

    const currentTags = params.get("tags")?.split(",").filter(Boolean) || [];
    const updatedTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];

    if (updatedTags.length > 0) {
      params.set("tags", updatedTags.join(","));
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
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    router.push(`/search?${params.toString()}`, { scroll: false });
  };

  const { isSearchVisible } = useSearch();

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
                        key={product.trx_product_id}
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
