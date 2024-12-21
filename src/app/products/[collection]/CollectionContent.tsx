"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FilterSidebar from "@/components/products/FilterSidebar";
import ProductCard from "@/components/products/ProductCard";
import SortOptions from "@/components/products/SortOptions";
import Link from "next/link";
import { useSearch } from "@/contexts/SearchContext";

interface Product {
  id: number;
  sku: string;
  title: string;
  description: string;
  manufacturer: string;
  category: string;
  uom: string;
  qtyAvailable: number;
  tags: string;
  imageSrc: string | null;
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

interface Props {
  collection: string;
}

export default function CollectionContent({ collection }: Props) {
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

  // Fetch products with current filters and pagination
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const queryString = searchParams.toString();
        const response = await fetch(
          `/api/products/collection/${collection}?${queryString}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch products");
        }

        setProducts(data.products);
        setPagination(data.pagination);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [collection, searchParams]);

  // Fetch filter options
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await fetch(`/api/products/options/${collection}`);
        const data = await response.json();

        if (response.ok && data.success) {
          setSortOptions(data.options);
        }
      } catch (error) {
        console.error("Error fetching filter options:", error);
      }
    };

    fetchOptions();
  }, [collection]);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/products/${collection}?${params.toString()}`, {
      scroll: false,
    });
  };

  const handleCategoryChange = (category: string) => {
    const params = new URLSearchParams(searchParams.toString());

    // Keep the collection parameter
    const collectionParam = params.get("collection");

    // Get current categories and decode properly
    const currentCategories =
      params
        .get("category")
        ?.split(",")
        .map((c) => decodeURIComponent(decodeURIComponent(c.trim()))) // Double decode to handle any double encoding
        .filter(Boolean) || [];

    let newCategories;
    if (currentCategories.includes(category)) {
      newCategories = currentCategories.filter((c) => c !== category);
    } else {
      newCategories = [...new Set([...currentCategories, category])];
    }

    // Clear params and reset essential ones
    params.delete("category");
    if (collectionParam) {
      params.set("collection", collectionParam);
    }

    if (newCategories.length > 0) {
      // Single encode the categories
      params.set(
        "category",
        newCategories.map((c) => encodeURIComponent(c)).join(",")
      );
    }

    params.set("page", "1");
    router.push(`/products/${collection}?${params.toString()}`, {
      scroll: false,
    });
  };

  const handleManufacturerChange = (manufacturer: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentManufacturers =
      params
        .get("manufacturer")
        ?.split(",")
        .map((m) => decodeURIComponent(m))
        .filter(Boolean) || [];

    // Normalize the manufacturer name for comparison
    const normalizeString = (str: string) => str.trim();
    const normalizedManufacturer = normalizeString(manufacturer);

    // Check if the manufacturer is already selected (exact match)
    const isSelected = currentManufacturers.some(
      (m) => normalizeString(m) === normalizedManufacturer
    );

    let newManufacturers;
    if (isSelected) {
      newManufacturers = currentManufacturers.filter(
        (m) => normalizeString(m) !== normalizedManufacturer
      );
    } else {
      // Use the original manufacturer name when adding
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

    params.set("page", "1");
    router.push(`/products/${collection}?${params.toString()}`, {
      scroll: false,
    });
  };

  const handleTagChange = (tag: string) => {
    const params = new URLSearchParams(searchParams.toString());
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

    params.set("page", "1");
    router.push(`/products/${collection}?${params.toString()}`, {
      scroll: false,
    });
  };

  const clearAllFilters = () => {
    router.push(`/products/${collection}`, { scroll: false });
  };

  const collectionTitle = collection
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
  };
  const { isSearchVisible } = useSearch();

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Breadcrumb - Made responsive */}
        <nav className="flex py-4 text-sm overflow-x-auto whitespace-nowrap">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            Home
          </Link>
          <span className="mx-2 text-gray-600">/</span>
          <Link href="/products" className="text-gray-600 hover:text-gray-900">
            Products
          </Link>
          <span className="mx-2 text-gray-600">/</span>
          <span className="text-gray-900 font-medium">{collectionTitle}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar - Now handled by FilterSidebar component for mobile */}
          <FilterSidebar
            sortOptions={sortOptions}
            selectedCategories={
              searchParams
                .get("category")
                ?.split(",")
                .map((c) => decodeURIComponent(c.trim()))
                .filter(Boolean) || []
            }
            selectedManufacturers={
              searchParams.get("manufacturer")?.split(",").filter(Boolean) || []
            }
            selectedTags={
              searchParams.get("tags")?.split(",").filter(Boolean) || []
            }
            onCategoryChange={handleCategoryChange}
            onManufacturerChange={handleManufacturerChange}
            onTagChange={handleTagChange}
            onClearAll={clearAllFilters}
            isCollectionPage={true}
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
          />

          {/* Main Content */}
          <div className="flex-1 min-h-0">
            {/* Header Section - Made responsive */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                {collectionTitle}
              </h1>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="text-sm text-gray-900 whitespace-nowrap">
                    Sort by:
                  </div>
                  <SortOptions
                    onSortChange={(sort) => {
                      const params = new URLSearchParams(
                        searchParams.toString()
                      );
                      if (sort) {
                        params.set("sort", sort);
                      } else {
                        params.delete("sort");
                      }
                      params.set("page", "1");
                      router.push(
                        `/products/${collection}?${params.toString()}`
                      );
                    }}
                    currentSort={searchParams.get("sort") || ""}
                    onClear={() => {
                      const params = new URLSearchParams(
                        searchParams.toString()
                      );
                      params.delete("sort");
                      router.push(
                        `/products/${collection}?${params.toString()}`
                      );
                    }}
                  />
                </div>
                {!loading && (
                  <div className="text-sm text-gray-900 sm:ml-4">
                    {pagination.total} Products
                  </div>
                )}
              </div>
            </div>

            {/* Products Grid - Add min-height and proper spacing */}
            <div className="min-h-screen pb-16">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-black"></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-6 mb-8">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}

              {/* Pagination - Only show if needed */}
              {!loading && pagination.totalPages > 1 && (
                <div className="mt-8 mb-4 flex justify-center">
                  <nav className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        handlePageChange(Math.max(1, pagination.page - 1))
                      }
                      disabled={pagination.page === 1}
                      className={`px-3 py-2 rounded border ${
                        pagination.page === 1
                          ? "border-gray-200 text-gray-400 cursor-not-allowed"
                          : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span className="sr-only">Previous</span>
                      <span aria-hidden="true">‹</span>
                    </button>

                    <div className="hidden sm:flex items-center gap-2">
                      {Array.from(
                        { length: pagination.totalPages },
                        (_, i) => i + 1
                      ).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`min-w-[40px] px-3 py-2 rounded border ${
                            page === pagination.page
                              ? "bg-zinc-900 text-white border-zinc-900"
                              : "border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <div className="sm:hidden flex items-center gap-2">
                      <span className="text-sm text-gray-700">
                        Page {pagination.page} of {pagination.totalPages}
                      </span>
                    </div>

                    <button
                      onClick={() =>
                        handlePageChange(
                          Math.min(pagination.totalPages, pagination.page + 1)
                        )
                      }
                      disabled={pagination.page === pagination.totalPages}
                      className={`px-3 py-2 rounded border ${
                        pagination.page === pagination.totalPages
                          ? "border-gray-200 text-gray-400 cursor-not-allowed"
                          : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span className="sr-only">Next</span>
                      <span aria-hidden="true">›</span>
                    </button>
                  </nav>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Filter Button */}
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
  );
}
