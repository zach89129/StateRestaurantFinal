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
  aqcat: string | null;
  pattern: string | null;
  quickship: boolean;
  images: { url: string }[];
}

interface SortOptions {
  categories: string[];
  manufacturers: string[];
  patterns: string[];
  collections: string[];
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
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    pageSize: 24,
    totalPages: 1,
    hasMore: false,
  });
  const [sortOptions, setSortOptions] = useState<SortOptions>({
    categories: [],
    manufacturers: [],
    patterns: [],
    collections: [],
    hasQuickShip: false,
  });

  const searchTerm = searchParams.get("q") || "";
  const selectedCategories =
    searchParams.get("category_b64")?.split(",").filter(Boolean) || [];
  const selectedManufacturers =
    searchParams.get("manufacturer_b64")?.split(",").filter(Boolean) || [];
  const selectedPatterns =
    searchParams.get("pattern_b64")?.split(",").filter(Boolean) || [];
  const selectedCollections =
    searchParams.get("collection_b64")?.split(",").filter(Boolean) || [];
  const selectedQuickShip = searchParams.get("quickShip") === "true";

  const DEAD_INVENTORY_PATTERN_B64 = "X0RFQUQgSU5WRU5UT1JZ";
  const selectedCloseOut = selectedPatterns.includes(
    DEAD_INVENTORY_PATTERN_B64
  );

  const { isSearchVisible } = useSearch();

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

          // Use the dynamic filter options returned from the API
          if (data.filters) {
            const filterOptions = {
              categories: data.filters.availableCategories || [],
              manufacturers: data.filters.availableManufacturers || [],
              patterns: data.filters.availablePatterns || [],
              collections: data.filters.availableCollections || [],
              hasQuickShip: data.filters.hasQuickShip || false,
            };
            setSortOptions(filterOptions);
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
      params.get("category_b64")?.split(",").filter(Boolean) || [];
    const base64Category = btoa(category);

    const newCategories = currentCategories.includes(base64Category)
      ? currentCategories.filter((c) => c !== base64Category)
      : [...currentCategories, base64Category];

    if (newCategories.length > 0) {
      params.set("category_b64", newCategories.join(","));
    } else {
      params.delete("category_b64");
    }

    router.push(`/search?${params.toString()}`, { scroll: false });
  };

  const handleManufacturerChange = (manufacturer: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");

    const currentManufacturers =
      params.get("manufacturer_b64")?.split(",").filter(Boolean) || [];
    const base64Manufacturer = btoa(manufacturer);

    const newManufacturers = currentManufacturers.includes(base64Manufacturer)
      ? currentManufacturers.filter((m) => m !== base64Manufacturer)
      : [...currentManufacturers, base64Manufacturer];

    if (newManufacturers.length > 0) {
      params.set("manufacturer_b64", newManufacturers.join(","));
    } else {
      params.delete("manufacturer_b64");
    }

    router.push(`/search?${params.toString()}`, { scroll: false });
  };

  const handlePatternChange = (pattern: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");

    const currentPatterns =
      params.get("pattern_b64")?.split(",").filter(Boolean) || [];
    const base64Pattern = btoa(pattern);

    const newPatterns = currentPatterns.includes(base64Pattern)
      ? currentPatterns.filter((p) => p !== base64Pattern)
      : [...currentPatterns, base64Pattern];

    if (newPatterns.length > 0) {
      params.set("pattern_b64", newPatterns.join(","));
    } else {
      params.delete("pattern_b64");
    }

    router.push(`/search?${params.toString()}`, { scroll: false });
  };

  const handleCollectionChange = (collection: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");

    const currentCollections =
      params.get("collection_b64")?.split(",").filter(Boolean) || [];
    const base64Collection = btoa(collection);

    const newCollections = currentCollections.includes(base64Collection)
      ? currentCollections.filter((c) => c !== base64Collection)
      : [...currentCollections, base64Collection];

    if (newCollections.length > 0) {
      params.set("collection_b64", newCollections.join(","));
    } else {
      params.delete("collection_b64");
    }

    router.push(`/search?${params.toString()}`, { scroll: false });
  };

  const handleQuickShipChange = (value: boolean) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");

    if (value) {
      params.set("quickShip", "true");
    } else {
      params.delete("quickShip");
    }

    router.push(`/search?${params.toString()}`, { scroll: false });
  };

  const handleCloseOutChange = (value: boolean) => {
    const params = new URLSearchParams(searchParams);
    const currentPatterns =
      params.get("pattern_b64")?.split(",").filter(Boolean) || [];

    if (value) {
      if (!currentPatterns.includes(DEAD_INVENTORY_PATTERN_B64)) {
        currentPatterns.push(DEAD_INVENTORY_PATTERN_B64);
      }
    } else {
      const index = currentPatterns.indexOf(DEAD_INVENTORY_PATTERN_B64);
      if (index > -1) {
        currentPatterns.splice(index, 1);
      }
    }

    if (currentPatterns.length > 0) {
      params.set("pattern_b64", currentPatterns.join(","));
    } else {
      params.delete("pattern_b64");
    }
    params.set("page", "1");
    router.push(`/search?${params.toString()}`, { scroll: false });
  };

  const handleClearAll = () => {
    const params = new URLSearchParams();
    params.set("q", searchTerm);
    router.push(`/search?${params.toString()}`, { scroll: false });
  };

  // Add page change handler
  const handlePageChange = (newPage: number) => {
    setLoading(true); // Set loading state
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/search?${params.toString()}`);
  };

  // Add effect to handle scrolling after content is loaded
  useEffect(() => {
    if (!loading) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [loading]);

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

        <div className="flex flex-col lg:flex-row gap-8 w-full overflow-hidden">
          {/* Left Sidebar */}
          <FilterSidebar
            sortOptions={sortOptions}
            selectedCategories={selectedCategories}
            selectedManufacturers={selectedManufacturers}
            selectedPatterns={selectedPatterns}
            selectedCollections={selectedCollections}
            selectedQuickShip={selectedQuickShip}
            selectedCloseOut={selectedCloseOut}
            onCategoryChange={handleCategoryChange}
            onManufacturerChange={handleManufacturerChange}
            onPatternChange={handlePatternChange}
            onCollectionChange={handleCollectionChange}
            onQuickShipChange={handleQuickShipChange}
            onCloseOutChange={handleCloseOutChange}
            onClearAll={handleClearAll}
            onClose={() => setIsFilterOpen(false)}
            isOpen={isFilterOpen}
          />

          {/* Main Content */}
          <div className="flex-1 min-h-0 max-w-full overflow-hidden">
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

            <div className="min-h-screen max-w-full overflow-hidden">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-black"></div>
                </div>
              ) : (
                <>
                  <div
                    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mb-8"
                    style={{
                      width: "100%",
                      maxWidth: "100%",
                      overflow: "hidden",
                    }}
                  >
                    {products.map((product) => (
                      <ProductCard
                        key={`search-product-${product.trx_product_id}`}
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
                <div className="mt-8 mb-4 flex flex-col items-center">
                  <div className="text-sm text-gray-500 mb-2">
                    Page {pagination.page} of {pagination.totalPages} | Total
                    Items: {pagination.total} | Items per page:{" "}
                    {pagination.pageSize}
                  </div>
                  <nav className="flex items-center gap-1">
                    {/* Previous button */}
                    <button
                      key="prev-button"
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

                    {/* Page numbers - display up to 7 pages with ellipsis for large page counts */}
                    {(() => {
                      const currentPage = pagination.page;
                      const totalPages = pagination.totalPages;

                      // Always show first page
                      const pages = [1];

                      if (totalPages <= 7) {
                        // If 7 or fewer pages, show all
                        for (let i = 2; i <= totalPages; i++) {
                          pages.push(i);
                        }
                      } else {
                        // More than 7 pages, show strategy:
                        // Always show first, last, current, and pages around current

                        // Add ellipsis after first page if needed
                        if (currentPage > 3) {
                          pages.push(-1); // -1 represents ellipsis
                        }

                        // Pages around current
                        const startPage = Math.max(2, currentPage - 1);
                        const endPage = Math.min(
                          totalPages - 1,
                          currentPage + 1
                        );

                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(i);
                        }

                        // Add ellipsis before last page if needed
                        if (currentPage < totalPages - 2) {
                          pages.push(-2); // -2 represents second ellipsis
                        }

                        // Always show last page
                        pages.push(totalPages);
                      }

                      return pages.map((page) => {
                        if (page < 0) {
                          // Render ellipsis
                          return (
                            <span
                              key={`ellipsis-${page}`}
                              className="px-2 py-1"
                            >
                              …
                            </span>
                          );
                        }

                        return (
                          <button
                            key={`page-${page}`}
                            onClick={() => handlePageChange(page)}
                            className={`px-2 py-1 rounded border ${
                              page === currentPage
                                ? "bg-gray-900 text-white border-gray-900"
                                : "border-gray-300 text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      });
                    })()}

                    {/* Next button */}
                    <button
                      key="next-button"
                      onClick={() =>
                        handlePageChange(
                          Math.min(pagination.totalPages, pagination.page + 1)
                        )
                      }
                      disabled={pagination.page >= pagination.totalPages}
                      className={`px-2 py-1 rounded border ${
                        pagination.page >= pagination.totalPages
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
