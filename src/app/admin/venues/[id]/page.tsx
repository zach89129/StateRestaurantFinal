"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";

interface Product {
  id: number;
  sku: string;
  title: string;
}

interface VenueProduct {
  id: number;
  productId: number;
  price: number | null;
  qtyAvailable: number | null;
  isActive: boolean;
  product: Product;
}

interface Venue {
  trxVenueId: number;
  venueName: string;
  venueProducts: VenueProduct[];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditVenuePage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchProduct, setSearchProduct] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetchVenue(resolvedParams.id);
  }, [resolvedParams.id]);

  const searchProducts = useCallback(async () => {
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
            !venue?.venueProducts?.some((vp) => vp.productId === product.id)
        )
      );
    } catch (error) {
      console.error("Error searching products:", error);
    } finally {
      setSearchLoading(false);
    }
  }, [searchProduct, venue?.venueProducts]);

  useEffect(() => {
    if (searchProduct) {
      searchProducts();
    } else {
      setAvailableProducts([]);
    }
  }, [searchProduct, searchProducts]);

  const fetchVenue = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/venues?id=${id}`);
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
            price: null,
            qtyAvailable: null,
            isActive: true,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add product");
      }

      const newVenueProduct: VenueProduct = {
        id: Date.now(), // Temporary ID until we refresh
        productId: product.id,
        price: null,
        qtyAvailable: null,
        isActive: true,
        product,
      };

      setVenue((prev) =>
        prev
          ? {
              ...prev,
              venueProducts: [...prev.venueProducts, newVenueProduct],
            }
          : null
      );
      setAvailableProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (error) {
      console.error("Error adding product:", error);
      setError(
        error instanceof Error ? error.message : "Failed to add product"
      );
    }
  };

  const handleRemoveProduct = async (productId: number) => {
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

      setVenue((prev) =>
        prev
          ? {
              ...prev,
              venueProducts: prev.venueProducts.filter(
                (vp) => vp.productId !== productId
              ),
            }
          : null
      );
    } catch (error) {
      console.error("Error removing product:", error);
      setError(
        error instanceof Error ? error.message : "Failed to remove product"
      );
    }
  };

  const handleVenueProductChange = async (
    productId: number,
    field: keyof VenueProduct,
    value: string | number | boolean | null
  ) => {
    if (!venue) return;

    try {
      const response = await fetch(
        `/api/admin/venues/${venue.trxVenueId}/products/${productId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [field]: value }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update product settings");
      }

      setVenue((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          venueProducts: prev.venueProducts.map((vp) =>
            vp.productId === productId ? { ...vp, [field]: value } : vp
          ),
        };
      });
    } catch (error) {
      console.error("Error updating product settings:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to update product settings"
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!venue) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/venues", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(venue),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update venue");
      }

      router.push("/admin/venues");
    } catch (error) {
      console.error("Error updating venue:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update venue"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    // Handle numeric fields
    if (name === "trxVenueId") {
      const numValue = value === "" ? 0 : parseInt(value);
      setVenue((prev) => (prev ? { ...prev, [name]: numValue } : null));
      return;
    }

    setVenue((prev) => (prev ? { ...prev, [name]: value } : null));
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
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Edit Venue</h1>
        <button
          onClick={() => router.push("/admin/venues")}
          className="text-gray-600 hover:text-gray-900"
        >
          Back to Venues
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="venueName"
                className="block text-sm font-medium text-gray-700"
              >
                Venue Name
              </label>
              <input
                type="text"
                id="venueName"
                name="venueName"
                value={venue?.venueName || ""}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>

            <div>
              <label
                htmlFor="trxVenueId"
                className="block text-sm font-medium text-gray-700"
              >
                TRX Venue ID
              </label>
              <input
                type="number"
                id="trxVenueId"
                name="trxVenueId"
                value={venue?.trxVenueId || ""}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => router.push("/admin/venues")}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>

        <div>
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Products</h2>
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
                className="block w-full border border-gray-300 rounded-md shadow-sm p-2"
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

            {venue?.venueProducts?.length > 0 ? (
              <div className="border border-gray-200 rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Product
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Price
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Quantity
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {venue.venueProducts.map((vp) => (
                      <tr key={vp.productId}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {vp.product.title}
                            </p>
                            <p className="text-sm text-gray-500">
                              SKU: {vp.product.sku}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            step="0.01"
                            value={vp.price || ""}
                            onChange={(e) =>
                              handleVenueProductChange(
                                vp.productId,
                                "price",
                                e.target.value
                                  ? parseFloat(e.target.value)
                                  : null
                              )
                            }
                            className="w-24 border border-gray-300 rounded-md shadow-sm p-1"
                            placeholder="Price"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            value={vp.qtyAvailable || ""}
                            onChange={(e) =>
                              handleVenueProductChange(
                                vp.productId,
                                "qtyAvailable",
                                e.target.value ? parseInt(e.target.value) : null
                              )
                            }
                            className="w-24 border border-gray-300 rounded-md shadow-sm p-1"
                            placeholder="Quantity"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() =>
                              handleVenueProductChange(
                                vp.productId,
                                "isActive",
                                !vp.isActive
                              )
                            }
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              vp.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {vp.isActive ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            type="button"
                            onClick={() => handleRemoveProduct(vp.productId)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No products added</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
