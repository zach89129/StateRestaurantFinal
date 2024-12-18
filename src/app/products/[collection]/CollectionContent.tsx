"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FilterSidebar from "@/components/products/FilterSidebar";
import ProductCard from "@/components/products/ProductCard";
import SortOptions from "@/components/products/SortOptions";
import Link from "next/link";

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

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/products/${collection}?${params.toString()}`);
  };

  const handleCategoryChange = (category: string) => {
    const params = new URLSearchParams(searchParams.toString());
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

    params.set("page", "1");
    router.push(`/products/${collection}?${params.toString()}`);
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
    router.push(`/products/${collection}?${params.toString()}`);
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
    router.push(`/products/${collection}?${params.toString()}`);
  };

  const clearAllFilters = () => {
    router.push(`/products/${collection}`);
  };

  const collectionTitle = collection
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

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
          <span className="text-gray-900 font-medium">{collectionTitle}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
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
                searchParams.get("manufacturer")?.split(",").filter(Boolean) ||
                []
              }
              selectedTags={
                searchParams.get("tags")?.split(",").filter(Boolean) || []
              }
              onCategoryChange={handleCategoryChange}
              onManufacturerChange={handleManufacturerChange}
              onTagChange={handleTagChange}
              onClearAll={clearAllFilters}
              isCollectionPage={true}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                {collectionTitle}
              </h1>
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-900">Sort by:</div>
                <SortOptions
                  onSortChange={(sort) => {
                    const params = new URLSearchParams(searchParams.toString());
                    if (sort) {
                      params.set("sort", sort);
                    } else {
                      params.delete("sort");
                    }
                    params.set("page", "1");
                    router.push(`/products/${collection}?${params.toString()}`);
                  }}
                  currentSort={searchParams.get("sort") || ""}
                  onClear={() => {
                    const params = new URLSearchParams(searchParams.toString());
                    params.delete("sort");
                    router.push(`/products/${collection}?${params.toString()}`);
                  }}
                />
                {!loading && (
                  <div className="text-sm text-gray-900 ml-4">
                    {pagination.total} Products
                  </div>
                )}
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-black"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && pagination.totalPages > 1 && (
              <div className="mt-8 mb-4 flex justify-center">
                <nav className="flex items-center gap-1">
                  {/* Previous button */}
                  <button
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
                      key={page}
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
    </div>
  );
}
