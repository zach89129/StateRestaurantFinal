"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";

interface Product {
  id: string;
  sku: string;
  title: string;
}

interface VenueProduct {
  id: number;
  products: Product[];
}

interface Venue {
  trxVenueId: number;
  venueName: string;
  venueProduct: VenueProduct | null;
}

export default function VenueProductsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchProduct, setSearchProduct] = useState("");
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    fetchVenue();
  }, [unwrappedParams.id]);

  useEffect(() => {
    if (searchProduct) {
      searchProducts();
    } else {
      setAvailableProducts([]);
    }
  }, [searchProduct]);

  const searchProducts = async () => {
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
            !venue?.venueProduct?.products?.some((p) => p.id === product.id)
        )
      );
    } catch (error) {
      console.error("Error searching products:", error);
    } finally {
      setSearchLoading(false);
    }
  };

  const fetchVenue = async () => {
    try {
      const response = await fetch(
        `/api/admin/venues?id=${unwrappedParams.id}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch venue");
      }

      setVenue(data.venue);
    } catch (error) {
      console.error("Error fetching venue:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch venue"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (product: Product) => {
    if (!venue) return;
    try {
      const response = await fetch(
        `/api/admin/venues/${venue.trxVenueId}/products`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: product.id,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add product");
      }

      // Refresh venue data to get updated products
      fetchVenue();
      setSearchProduct("");
    } catch (error) {
      console.error("Error adding product:", error);
      setError(
        error instanceof Error ? error.message : "Failed to add product"
      );
    }
  };

  const handleRemoveProduct = async (productId: string) => {
    if (!venue) return;
    try {
      const response = await fetch(
        `/api/admin/venues/${venue.trxVenueId}/products/${productId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to remove product");
      }

      // Refresh venue data to get updated products
      fetchVenue();
    } catch (error) {
      console.error("Error removing product:", error);
      setError(
        error instanceof Error ? error.message : "Failed to remove product"
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Venue not found</h2>
        <button
          onClick={() => router.push("/admin/venues")}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          Return to venues
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 text-black">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-black">
            Manage Products for {venue.venueName}
          </h1>
          <p className="text-sm text-black">TRX Venue ID: {venue.trxVenueId}</p>
        </div>
        <button
          onClick={() => router.push("/admin/venues")}
          className="text-black hover:text-gray-600"
        >
          Back to Venues
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-lg font-medium text-black mb-4">Add Products</h2>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search products to add..."
            value={searchProduct}
            onChange={(e) => setSearchProduct(e.target.value)}
            className="block w-full border border-gray-300 rounded-md shadow-sm p-2 text-black"
          />
          {searchLoading && (
            <p className="mt-2 text-sm text-black">Searching...</p>
          )}
          {availableProducts.length > 0 && (
            <div className="mt-2 border border-gray-200 rounded-md">
              {availableProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex justify-between items-center p-4 hover:bg-gray-50 border-b border-gray-200 last:border-b-0"
                >
                  <div className="grid grid-cols-[200px,1fr] gap-8">
                    <div>
                      <p className="text-sm font-medium text-black">
                        ID: {product.id}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-black">
                        {product.title}
                      </p>
                      <p className="text-sm text-black">SKU: {product.sku}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddProduct(product)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium text-black mb-4">
          Current Products
        </h2>
        {venue.venueProduct?.products &&
        venue.venueProduct.products.length > 0 ? (
          <div className="border border-gray-200 rounded-md">
            {venue.venueProduct.products.map((product) => (
              <div
                key={product.id}
                className="flex justify-between items-center p-4 hover:bg-gray-50 border-b border-gray-200 last:border-b-0"
              >
                <div className="grid grid-cols-[200px,1fr] gap-8">
                  <div>
                    <p className="text-sm font-medium text-black">
                      ID: {product.id}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-black">
                      {product.title}
                    </p>
                    <p className="text-sm text-black">SKU: {product.sku}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveProduct(product.id)}
                  className="text-sm text-red-600 hover:text-red-900"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-black">No products added to this venue</p>
        )}
      </div>
    </div>
  );
}
