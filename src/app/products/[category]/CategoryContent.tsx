"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import FilterSidebar from "@/components/products/FilterSidebar";
import ProductCard from "@/components/products/ProductCard";

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

interface Props {
  category: string;
}

export default function CategoryContent({ category }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOptions, setSortOptions] = useState<SortOptions>({
    categories: [],
    manufacturers: [],
    patterns: [],
    collections: [],
    hasStockItems: false,
    hasQuickShip: false,
  });

  // Track selected filters
  const selectedManufacturers =
    searchParams.get("manufacturer")?.split(",").filter(Boolean) || [];
  const selectedPatterns =
    searchParams.get("pattern")?.split(",").filter(Boolean) || [];
  const selectedTags =
    searchParams.get("tags")?.split(",").filter(Boolean) || [];

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const params = new URLSearchParams(searchParams);
      const queryString = params.toString();
      try {
        const response = await fetch(
          `/api/products/category/${category}?${queryString}`
        );
        const data = await response.json();
        if (data.success) {
          setProducts(data.products);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      }
      setLoading(false);
    };

    fetchProducts();
  }, [category, searchParams]);

  // Fetch filter options
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await fetch(`/api/products/category/${category}`);
        const data = await response.json();
        if (data.success) {
          setSortOptions({
            categories: data.filters.categories || [],
            manufacturers: data.filters.manufacturers || [],
            patterns: data.filters.patterns || [],
            collections: data.filters.collections || [],
            hasStockItems: data.filters.hasStockItems || false,
            hasQuickShip: data.filters.hasQuickShip || false,
          });
        }
      } catch (error) {
        console.error("Error fetching options:", error);
      }
    };

    fetchOptions();
  }, [category]);

  const handleCategoryChange = (selectedCategory: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");
    params.set("category", selectedCategory);
    router.push(`/products/${category}?${params.toString()}`, {
      scroll: false,
    });
  };

  const handleManufacturerChange = (manufacturer: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");

    // Get current manufacturers and toggle the selected one
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

    router.push(`/products/${category}?${params.toString()}`, {
      scroll: false,
    });
  };

  const handlePatternChange = (pattern: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");

    // Get current patterns and toggle the selected one
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

    router.push(`/products/${category}?${params.toString()}`, {
      scroll: false,
    });
  };

  const handleTagChange = (tag: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");

    // Get current tags and toggle the selected one
    const currentTags = params.get("tags")?.split(",").filter(Boolean) || [];
    const updatedTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];

    if (updatedTags.length > 0) {
      params.set("tags", updatedTags.join(","));
    } else {
      params.delete("tags");
    }

    router.push(`/products/${category}?${params.toString()}`, {
      scroll: false,
    });
  };

  const handleClearAll = () => {
    router.push(`/products/${category}`, { scroll: false });
  };

  const categoryTitle = category
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex py-4 text-sm">
        <span className="text-gray-600">Products</span>
        <span className="mx-2 text-gray-600">/</span>
        <span className="text-gray-900 font-medium">{categoryTitle}</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filter Sidebar */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <FilterSidebar
            sortOptions={sortOptions}
            selectedCategories={[]}
            selectedManufacturers={selectedManufacturers}
            selectedPatterns={selectedPatterns}
            selectedTags={selectedTags}
            onCategoryChange={handleCategoryChange}
            onManufacturerChange={handleManufacturerChange}
            onPatternChange={handlePatternChange}
            onTagChange={handleTagChange}
            onClearAll={handleClearAll}
            isCategoryPage={true}
            isOpen={true}
            onClose={() => {}}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Category Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            {categoryTitle}
          </h1>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <>
              {/* Products Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.trx_product_id} product={product} />
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
        </div>
      </div>
    </div>
  );
}
