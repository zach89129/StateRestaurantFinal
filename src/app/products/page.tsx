"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FilterSidebar from "@/components/products/FilterSidebar";
import ProductCard from "@/components/products/ProductCard";
import SortOptions from "@/components/products/SortOptions";
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

interface PaginationInfo {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

interface SortOptions {
  categories: string[];
  manufacturers: string[];
  patterns: string[];
  collections: string[];
  hasStockItems: boolean;
  hasQuickShip: boolean;
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductsContent key="products-content" />
    </Suspense>
  );
}

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { isSearchVisible } = useSearch();

  // Track selected filters from URL params
  const selectedCategories =
    searchParams.get("category_b64")?.split(",").filter(Boolean) || [];
  const selectedManufacturers =
    searchParams.get("manufacturer_b64")?.split(",").filter(Boolean) || [];
  const selectedPatterns =
    searchParams.get("pattern_b64")?.split(",").filter(Boolean) || [];
  const selectedCollections =
    searchParams.get("collection_b64")?.split(",").filter(Boolean) || [];
  const selectedQuickShip = searchParams.get("quickShip") === "true";

  // Check if _DEAD INVENTORY pattern is selected
  const DEAD_INVENTORY_PATTERN_B64 = "X0RFQUQgSU5WRU5UT1JZ";
  const selectedCloseOut = selectedPatterns.includes(
    DEAD_INVENTORY_PATTERN_B64
  );

  // Fetch products with current filters and pagination
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // Build query string from all search params
        const queryString = searchParams.toString();
        const response = await fetch(`/api/products?${queryString}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch products");
        }

        setProducts(data.products);
        setPagination(data.pagination);

        // Update filter options with the available options from this filtered set
        if (data.filters) {
          setSortOptions({
            categories: data.filters.availableCategories || [],
            manufacturers: data.filters.availableManufacturers || [],
            patterns: data.filters.availablePatterns || [],
            collections: data.filters.availableCollections || [],
            hasStockItems: data.filters.hasStockItems || false,
            hasQuickShip: data.filters.hasQuickShip || false,
          });
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchParams]);

  const handlePageChange = (newPage: number) => {
    setLoading(true);
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/products?${params.toString()}`);
  };

  // Add effect to handle scrolling after content is loaded
  useEffect(() => {
    if (!loading) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [loading]);

  const handleCategoryChange = (category: string) => {
    const params = new URLSearchParams(searchParams.toString());
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
    params.set("page", "1");
    router.push(`/products?${params.toString()}`, { scroll: false });
  };

  const handleManufacturerChange = (manufacturer: string) => {
    const params = new URLSearchParams(searchParams.toString());
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
    params.set("page", "1");
    router.push(`/products?${params.toString()}`, { scroll: false });
  };

  const handlePatternChange = (pattern: string) => {
    const params = new URLSearchParams(searchParams.toString());
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
    params.set("page", "1");
    router.push(`/products?${params.toString()}`, { scroll: false });
  };

  const handleCollectionChange = (collection: string) => {
    const params = new URLSearchParams(searchParams.toString());
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
    params.set("page", "1");
    router.push(`/products?${params.toString()}`, { scroll: false });
  };

  const handleQuickShipChange = (value: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("quickShip", "true");
    } else {
      params.delete("quickShip");
    }
    params.set("page", "1");
    router.push(`/products?${params.toString()}`, { scroll: false });
  };

  const handleCloseOutChange = (value: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentPatterns =
      params.get("pattern_b64")?.split(",").filter(Boolean) || [];

    if (value) {
      // Add _DEAD INVENTORY pattern if not already present
      if (!currentPatterns.includes(DEAD_INVENTORY_PATTERN_B64)) {
        currentPatterns.push(DEAD_INVENTORY_PATTERN_B64);
      }
    } else {
      // Remove _DEAD INVENTORY pattern
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
    router.push(`/products?${params.toString()}`, { scroll: false });
  };

  const clearAllFilters = () => {
    // Reset to base URL with only page=1
    router.push("/products?page=1", { scroll: false });
  };

  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  return (
    <div className="min-h-screen bg-white" key="products-page-container">
      <div className="max-w-7xl mx-auto px-4 w-full overflow-hidden">
        {/* Breadcrumb */}
        <nav className="flex py-4 text-sm">
          <Link
            href="/"
            className="text-gray-600 hover:text-gray-900"
            key="home-link"
          >
            Home
          </Link>
          <span className="mx-2 text-gray-600" key="separator">
            /
          </span>
          <span className="text-gray-900 font-medium" key="products-label">
            Products
          </span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8 w-full overflow-hidden">
          {/* Left Sidebar - Make visible on lg screens by default (not hidden) */}
          <div className="lg:w-1/4">
            <FilterSidebar
              key="filter-sidebar"
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
              onClearAll={clearAllFilters}
              isOpen={isFilterOpen}
              onClose={() => setIsFilterOpen(false)}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 min-h-0 max-w-full overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">All Products</h1>
              {!loading && (
                <div className="text-sm text-gray-900">
                  {pagination.total} Products
                </div>
              )}
            </div>

            {/* Products Grid */}
            <div className="min-h-screen max-w-full overflow-hidden">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-black"></div>
                </div>
              ) : (
                <div
                  key="products-grid"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8"
                  style={{
                    width: "100%",
                    maxWidth: "100%",
                    overflow: "hidden",
                  }}
                >
                  {products.map((product, index) => (
                    <ProductCard
                      key={`${product.trx_product_id}-${index}`}
                      product={product}
                    />
                  ))}
                </div>
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
                            className={`px-3 py-1 rounded border ${
                              page === pagination.page
                                ? "bg-zinc-900 text-white border-zinc-900"
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
          className={`fixed right-4 z-30 lg:hidden flex items-center gap-2 px-4 py-3 bg-copper text-white border border-copper rounded-full shadow-lg hover:bg-copper-hover ${
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
