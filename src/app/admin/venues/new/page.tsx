"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Product {
  id: string;
  sku: string;
  title: string;
}

export default function NewVenuePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    venueName: "",
    trxVenueId: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchProduct, setSearchProduct] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/admin/venues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          venueName: formData.venueName,
          trxVenueId: parseInt(formData.trxVenueId),
          productIds: selectedProducts.map((p) => p.id),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create venue");
      }

      router.push("/admin/venues");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create venue");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const searchProducts = async () => {
    if (!searchProduct.trim()) {
      setAvailableProducts([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch(
        `/api/admin/products/search?query=${encodeURIComponent(searchProduct)}`
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to search products");
      }
      setAvailableProducts(
        data.products.filter(
          (product: Product) =>
            !selectedProducts.some((p) => p.id === product.id)
        )
      );
    } catch (error) {
      console.error("Error searching products:", error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddProduct = (product: Product) => {
    setSelectedProducts((prev) => [...prev, product]);
    setAvailableProducts((prev) => prev.filter((p) => p.id !== product.id));
    setSearchProduct("");
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  useEffect(() => {
    if (searchProduct) {
      const timeoutId = setTimeout(searchProducts, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setAvailableProducts([]);
    }
  }, [searchProduct]);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Add New Venue</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="venueName"
            className="block text-sm font-medium text-gray-700"
          >
            Venue Name *
          </label>
          <input
            type="text"
            id="venueName"
            name="venueName"
            required
            value={formData.venueName}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
          />
        </div>

        <div>
          <label
            htmlFor="trxVenueId"
            className="block text-sm font-medium text-gray-700"
          >
            TRX Venue ID *
          </label>
          <input
            type="number"
            id="trxVenueId"
            name="trxVenueId"
            required
            value={formData.trxVenueId}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
          />
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Products</h3>
            <div className="mb-4">
              <label htmlFor="productSearch" className="sr-only">
                Search Products
              </label>
              <input
                type="text"
                id="productSearch"
                placeholder="Search products to add..."
                value={searchProduct}
                onChange={(e) => setSearchProduct(e.target.value)}
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
              />
              {searchLoading && (
                <p className="mt-2 text-sm text-gray-500">Searching...</p>
              )}
              {availableProducts.length > 0 && (
                <ul className="mt-2 border border-gray-200 rounded-md divide-y divide-gray-200">
                  {availableProducts.map((product) => (
                    <li
                      key={product.id}
                      className="p-3 flex justify-between items-center hover:bg-gray-50"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {product.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          SKU: {product.sku}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddProduct(product)}
                        className="ml-4 text-sm text-blue-600 hover:text-blue-800"
                      >
                        Add
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {selectedProducts.length > 0 ? (
              <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md">
                {selectedProducts.map((product) => (
                  <li
                    key={product.id}
                    className="p-4 flex justify-between items-center"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {product.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        SKU: {product.sku}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveProduct(product.id)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No products selected</p>
            )}
          </div>
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Venue"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/venues")}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
