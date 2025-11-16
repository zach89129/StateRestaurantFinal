"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import FilterSidebar from "@/components/products/FilterSidebar";
import ProductCard from "@/components/products/ProductCard";
import Link from "next/link";
import { useSearch } from "@/contexts/SearchContext";

interface Product {
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

interface Props {
  category: string;
}

export default function CategoryContent({ category }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
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
  const { isSearchVisible } = useSearch();

  // Track selected filters from URL params using base64
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

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams(searchParams);
        // Add the category to the API call
        params.set("category_b64", btoa(category));
        const queryString = params.toString();

        const response = await fetch(`/api/products?${queryString}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch products");
        }

        setProducts(data.products);
        setPagination(data.pagination);

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
  }, [category, searchParams]);

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
    router.push(`/products/${category}?${params.toString()}`, {
      scroll: false,
    });
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
    router.push(`/products/${category}?${params.toString()}`, {
      scroll: false,
    });
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
    router.push(`/products/${category}?${params.toString()}`, {
      scroll: false,
    });
  };

  const handleQuickShipChange = (value: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("quickShip", "true");
    } else {
      params.delete("quickShip");
    }
    params.set("page", "1");
    router.push(`/products/${category}?${params.toString()}`, {
      scroll: false,
    });
  };

  const handleCloseOutChange = (value: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
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
    router.push(`/products/${category}?${params.toString()}`, {
      scroll: false,
    });
  };

  const handleClearAll = () => {
    // Reset to category page with only the category filter
    const params = new URLSearchParams();
    params.set("category_b64", btoa(category));
    router.push(`/products/${category}?${params.toString()}`, {
      scroll: false,
    });
  };

  const handlePageChange = (newPage: number) => {
    setLoading(true); // Set loading state
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/products/${category}?${params.toString()}`);
  };

  // Add effect to handle scrolling after content is loaded
  useEffect(() => {
    if (!loading) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [loading]);

  const categoryTitle = category
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

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
          <span className="mx-2 text-gray-600" key="separator-1">
            /
          </span>
          <Link
            href="/products"
            className="text-gray-600 hover:text-gray-900"
            key="products-link"
          >
            Products
          </Link>
          <span className="mx-2 text-gray-600" key="separator-2">
            /
          </span>
          <span className="text-gray-900 font-medium" key="category-label">
            {categoryTitle}
          </span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8 w-full overflow-hidden">
          {/* Left Sidebar */}
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
              onCategoryChange={handleCollectionChange}
              onManufacturerChange={handleManufacturerChange}
              onPatternChange={handlePatternChange}
              onCollectionChange={handleCollectionChange}
              onQuickShipChange={handleQuickShipChange}
              onCloseOutChange={handleCloseOutChange}
              onClearAll={handleClearAll}
              isCategoryPage={true}
              isOpen={isFilterOpen}
              onClose={() => setIsFilterOpen(false)}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 min-h-0 max-w-full overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">{category}</h1>
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
                  {products.map((product) => (
                    <ProductCard
                      key={product.trx_product_id}
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
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className={`fixed right-4 top-[100px] z-30 lg:hidden flex items-center gap-2 px-4 py-3 bg-copper text-white border border-copper rounded-full shadow-lg hover:bg-copper-hover ${
            isSearchVisible ? "top-[150px]" : "top-[100px]"
          }  transition-all duration-300 ease-in-out`}
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
