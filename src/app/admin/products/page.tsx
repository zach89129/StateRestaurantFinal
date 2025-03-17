"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Product {
  id: number;
  sku: string;
  title: string;
  description: string | null;
  manufacturer: string | null;
  category: string | null;
  uom: string | null;
  qtyAvailable: number | null;
  tags: string | null;
  imageSrc: string | null;
}

interface PaginationInfo {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

export default function AdminProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
    hasMore: false,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const page = parseInt(searchParams.get("page") || "1");
      const search = searchParams.get("search") || "";

      const response = await fetch(
        `/api/admin/products?page=${page}&search=${search}`
      );
      const data = await response.json();

      if (response.ok) {
        setProducts(data.products);
        setPagination(data.pagination);
      } else {
        console.error("Failed to fetch products:", data.error);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    params.set("search", searchTerm);
    params.set("page", "1");
    router.push(`/admin/products?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/admin/products?${params.toString()}`);
  };

  const handleProductSelect = (productId: number) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleDeleteSelected = async () => {
    if (
      !selectedProducts.length ||
      !confirm("Are you sure you want to delete the selected products?")
    ) {
      return;
    }

    try {
      const response = await fetch("/api/admin/products/batch", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: selectedProducts }),
      });

      if (response.ok) {
        setSelectedProducts([]);
        fetchProducts();
      } else {
        const data = await response.json();
        console.error("Failed to delete products:", data.error);
      }
    } catch (error) {
      console.error("Error deleting products:", error);
    }
  };

  return (
    <div className="space-y-6 max-w-[100vw] px-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Products Management
        </h2>
        <div className="flex gap-4">
          <button
            onClick={() => router.push("/admin/products/new")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add Product
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
        <form onSubmit={handleSearch} className="flex gap-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products..."
            className="px-4 py-2 border rounded-md w-80"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900"
          >
            Search
          </button>
        </form>
        {selectedProducts.length > 0 && (
          <button
            onClick={handleDeleteSelected}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Delete Selected ({selectedProducts.length})
          </button>
        )}
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div
          className="overflow-x-auto"
          style={{ maxWidth: "calc(100vw - 300px)" }}
        >
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="sticky left-0 z-10 bg-gray-50 w-16 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedProducts.length === products.length}
                    onChange={(e) => {
                      setSelectedProducts(
                        e.target.checked ? products.map((p) => p.id) : []
                      );
                    }}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="w-40 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="w-64 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="w-48 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="w-48 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Manufacturer
                </th>
                <th className="w-32 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="w-40 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="sticky left-0 z-10 bg-white px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => handleProductSelect(product.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-normal text-sm text-gray-900">
                      {product.sku}
                    </td>
                    <td className="px-6 py-4 whitespace-normal text-sm text-gray-900">
                      {product.title}
                    </td>
                    <td className="px-6 py-4 whitespace-normal text-sm text-gray-500">
                      {product.category || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-normal text-sm text-gray-500">
                      {product.manufacturer || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-normal text-sm text-gray-500">
                      {product.qtyAvailable || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() =>
                          router.push(`/admin/products/${product.id}`)
                        }
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleProductSelect(product.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <nav className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50"
            >
              Previous
            </button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
              (page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-1 rounded border ${
                    page === pagination.page
                      ? "bg-blue-600 text-white border-blue-600"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              )
            )}
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasMore}
              className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50"
            >
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
