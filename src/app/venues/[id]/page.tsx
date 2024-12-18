/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, use } from "react";
import { useSession } from "next-auth/react";
import { useCart } from "@/contexts/CartContext";
import QuantityInput from "@/components/products/QuantityInput";

interface VenueProduct {
  id: string;
  sku: string;
  title: string;
  manufacturer: string | null;
  category: string | null;
  uom: string | null;
  qtyAvailable: number | null;
  price: number | null;
  imageSrc: string | null;
}

interface VenueProductsResponse {
  success: boolean;
  error?: string;
  venueName: string;
  products: {
    id: bigint | number;
    sku: string;
    title: string;
    manufacturer: string | null;
    category: string | null;
    uom: string | null;
    qtyAvailable: bigint | number | null;
    price: number | null;
    imageSrc: string | null;
  }[];
}

interface Venue {
  id: string;
  venueName: string;
  products: VenueProduct[];
}

export default function VenuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { data: session } = useSession();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const { addItem } = useCart();

  useEffect(() => {
    const fetchVenueProducts = async () => {
      try {
        const response = await fetch(
          `/api/venue-products?trx_venue_id=${resolvedParams.id}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch venue products");
        }
        const data = (await response.json()) as VenueProductsResponse;
        if (data.success) {
          console.log("First product image URL:", data.products[0]?.imageSrc);
          setVenue({
            id: resolvedParams.id,
            venueName: data.venueName,
            products: data.products.map((product) => ({
              ...product,
              id: String(product.id),
              qtyAvailable: product.qtyAvailable
                ? Number(product.qtyAvailable)
                : null,
            })),
          });
        } else {
          throw new Error(data.error || "Failed to fetch venue products");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchVenueProducts();
    }
  }, [resolvedParams.id, session]);

  const handleQuantityChange = (productId: string, quantity: number) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: quantity,
    }));
  };

  const handleAddToCart = (product: VenueProduct) => {
    const quantity = quantities[product.id] || 1;
    addItem(
      {
        id: product.id,
        sku: product.sku,
        title: product.title,
        manufacturer: product.manufacturer,
        category: product.category,
        uom: product.uom,
        imageSrc: product.imageSrc,
      },
      quantity
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 text-red-600 p-4 rounded">{error}</div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 text-yellow-600 p-4 rounded">
          No venue found
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-xl sm:text-2xl font-bold mb-6 text-gray-900">
          {venue.venueName} Products
        </h1>

        {/* Desktop Table / Mobile Cards */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {/* Desktop Table - Hidden on Mobile */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Image
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Manufacturer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    UOM
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Qty Available
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {venue.products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="relative h-16 w-16">
                        {product.imageSrc ? (
                          <img
                            src={product.imageSrc}
                            alt={product.title}
                            className="h-full w-full object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "/placeholder-product.png";
                            }}
                          />
                        ) : (
                          <img
                            src="/placeholder-product.png"
                            alt="No image available"
                            className="h-full w-full object-contain"
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.sku}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.manufacturer || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.uom || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.qtyAvailable || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.price ? `$${product.price.toFixed(2)}` : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {session?.user && (
                        <div className="flex items-center gap-2">
                          <QuantityInput
                            onQuantityChange={(quantity) =>
                              handleQuantityChange(product.id, quantity)
                            }
                            initialQuantity={quantities[product.id] || 1}
                            max={product.qtyAvailable || 9999}
                          />
                          <button
                            onClick={() => handleAddToCart(product)}
                            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                          >
                            Add
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {venue.products.map((product) => (
              <div
                key={product.id}
                className="bg-white border rounded-lg p-4 space-y-3"
              >
                {/* Product Header */}
                <div className="flex gap-4">
                  <div className="relative h-20 w-20 flex-shrink-0">
                    {product.imageSrc ? (
                      <img
                        src={product.imageSrc}
                        alt={product.title}
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/placeholder-product.png";
                        }}
                      />
                    ) : (
                      <img
                        src="/placeholder-product.png"
                        alt="No image available"
                        className="h-full w-full object-contain"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {product.title}
                    </h3>
                    <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                    {product.manufacturer && (
                      <p className="text-sm text-gray-500">
                        {product.manufacturer}
                      </p>
                    )}
                  </div>
                </div>

                {/* Product Details */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">UOM:</span>{" "}
                    <span className="text-gray-900">{product.uom || "-"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Available:</span>{" "}
                    <span className="text-gray-900">
                      {product.qtyAvailable || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Price:</span>{" "}
                    <span className="text-gray-900">
                      {product.price ? `$${product.price.toFixed(2)}` : "-"}
                    </span>
                  </div>
                </div>

                {/* Add to Cart Section */}
                {session?.user && (
                  <div className="flex items-center gap-2 pt-2">
                    <div className="flex-1">
                      <QuantityInput
                        onQuantityChange={(quantity) =>
                          handleQuantityChange(product.id, quantity)
                        }
                        initialQuantity={quantities[product.id] || 1}
                        max={product.qtyAvailable || 9999}
                      />
                    </div>
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap text-sm font-medium"
                    >
                      Add to Cart
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
