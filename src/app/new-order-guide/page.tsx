"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCart } from "@/contexts/CartContext";

interface OrderGuideProduct {
  id: number;
  sku: string;
  title: string;
  description: string | null;
  manufacturer: string | null;
  category: string | null;
  uom: string | null;
  qtyAvailable: number | null;
  images: { src: string }[];
}

interface OrderGuideItem {
  id: number;
  productId: number;
  orderGuideGroup: string;
  orderGuideQuality: string;
  product: OrderGuideProduct;
}

interface OrderGuideResponse {
  success: boolean;
  error?: string;
  defaultVenueId: number | null;
  items: OrderGuideItem[];
}

const sortByText = (a: string | null, b: string | null) =>
  (a || "").localeCompare(b || "", undefined, { numeric: true });

export default function NewOrderGuidePage() {
  const { data: session, status } = useSession();
  const { addItem } = useCart();
  const [items, setItems] = useState<OrderGuideItem[]>([]);
  const [defaultVenueId, setDefaultVenueId] = useState<number | null>(null);
  const [pricingData, setPricingData] = useState<Record<string, number | null>>(
    {}
  );
  const [groupOpenState, setGroupOpenState] = useState<Record<string, boolean>>(
    {}
  );
  const [quantities, setQuantities] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadItems = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/order-guide-items");
        const data: OrderGuideResponse = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to load order guide");
        }

        setItems(data.items || []);
        setDefaultVenueId(data.defaultVenueId || null);
        setGroupOpenState(
          (data.items || []).reduce((acc, item) => {
            acc[item.orderGuideGroup] = true;
            return acc;
          }, {} as Record<string, boolean>)
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load guide");
      } finally {
        setLoading(false);
      }
    };

    if (status !== "loading") {
      loadItems();
    }
  }, [status]);

  useEffect(() => {
    const fetchPrices = async () => {
      if (items.length === 0) return;
      setLoadingPrices(true);
      try {
        const ids = items.map((item) => item.productId);
        const batchSize = 25;
        const nextPrices: Record<string, number | null> = {};
        for (let i = 0; i < ids.length; i += batchSize) {
          const batch = ids.slice(i, i + batchSize);
          const response = await fetch(
            `/api/pricing?productIds=${batch.join(",")}&isDeadInventory=false`
          );
          const data = await response.json();
          if (!response.ok || !data.success) {
            continue;
          }
          if (Array.isArray(data.prices)) {
            data.prices.forEach((entry: { productId: number; price: number }) => {
              nextPrices[String(entry.productId)] = entry.price ?? null;
            });
          }
        }
        setPricingData(nextPrices);
      } finally {
        setLoadingPrices(false);
      }
    };

    fetchPrices();
  }, [items]);

  const groupedItems = useMemo(() => {
    const sorted = [...items].sort((a, b) => {
      const groupSort = sortByText(a.orderGuideGroup, b.orderGuideGroup);
      if (groupSort !== 0) return groupSort;
      const categorySort = sortByText(a.product.category, b.product.category);
      if (categorySort !== 0) return categorySort;
      const qualitySort = sortByText(a.orderGuideQuality, b.orderGuideQuality);
      if (qualitySort !== 0) return qualitySort;
      return sortByText(a.product.title, b.product.title);
    });

    return sorted.reduce((acc, item) => {
      if (!acc[item.orderGuideGroup]) {
        acc[item.orderGuideGroup] = {};
      }
      const categoryKey = item.product.category || "Uncategorized";
      if (!acc[item.orderGuideGroup][categoryKey]) {
        acc[item.orderGuideGroup][categoryKey] = [];
      }
      acc[item.orderGuideGroup][categoryKey].push(item);
      return acc;
    }, {} as Record<string, Record<string, OrderGuideItem[]>>);
  }, [items]);

  if (!session?.user && status !== "loading") {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <p className="text-gray-700">
          Please <Link href="/login">log in</Link> to access the order guide.
        </p>
      </div>
    );
  }

  const handleAddToCart = (item: OrderGuideItem) => {
    const quantityValue = quantities[item.productId] || "";
    const quantity = parseInt(quantityValue, 10);
    if (Number.isNaN(quantity) || quantity <= 0) {
      return;
    }
    addItem(
      {
        id: String(item.productId),
        sku: item.product.sku,
        title: item.product.title,
        manufacturer: item.product.manufacturer,
        category: item.product.category,
        uom: item.product.uom,
        imageSrc: item.product.images[0]?.src || null,
        venueId: defaultVenueId ? String(defaultVenueId) : undefined,
      },
      quantity
    );
    setQuantities((prev) => ({ ...prev, [item.productId]: "" }));
  };

  const getQualityHighlightClass = (quality: string) => {
    const normalizedQuality = quality.toUpperCase();
    if (normalizedQuality.includes("SUGGESTED")) {
      return "bg-green-50";
    }
    if (normalizedQuality.includes("ECONOMY")) {
      return "bg-yellow-50";
    }
    return "";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            New Customer Order Guide
          </h1>
          <div className="text-sm text-gray-700">
            <Link href="/products" className="text-blue-700 hover:text-blue-900">
              Add from main catalog
            </Link>
          </div>
        </div>

        {loadingPrices && (
          <div className="mb-4 text-sm text-gray-700">Loading pricing...</div>
        )}
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-red-700">
            {error}
          </div>
        )}
        {defaultVenueId === null && !loading && (
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-700">
            Default pricing venue is not configured for this account.
          </div>
        )}

          {loading ? (
            <div className="text-gray-600">Loading guide...</div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedItems).map(([groupName, categories]) => (
                <div key={groupName} className="border border-gray-200 rounded-md overflow-hidden">
                <button
                  className="w-full px-4 py-3 bg-gray-100 text-left font-semibold text-gray-900 flex items-center justify-between hover:bg-gray-200"
                  onClick={() =>
                    setGroupOpenState((prev) => ({
                      ...prev,
                      [groupName]: !prev[groupName],
                    }))
                  }
                >
                  <span>{groupName}</span>
                  <span>{groupOpenState[groupName] ? "-" : "+"}</span>
                </button>
                {groupOpenState[groupName] && (
                  <div className="p-3 space-y-4 bg-white">
                    {Object.entries(categories).map(([categoryName, categoryItems]) => (
                      <div key={categoryName}>
                        <h2 className="text-sm font-semibold text-gray-800 mb-2">
                          {categoryName}
                        </h2>
                        <div className="overflow-x-auto border border-gray-200 rounded-md">
                          <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-100 text-gray-800">
                              <tr>
                                <th className="px-3 py-2 text-left">Item</th>
                                <th className="px-3 py-2 text-left">Quality</th>
                                <th className="px-3 py-2 text-left">SKU</th>
                                <th className="px-3 py-2 text-left">UOM</th>
                                <th className="px-3 py-2 text-left">Price</th>
                                <th className="px-3 py-2 text-left">Qty</th>
                                <th className="px-3 py-2 text-left">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                              {categoryItems.map((item) => (
                                <tr key={item.id} className={getQualityHighlightClass(item.orderGuideQuality)}>
                                  <td className="px-3 py-2 text-gray-900">
                                    <div className="font-medium">{item.product.title}</div>
                                    <div className="text-xs text-gray-700">
                                      {item.product.manufacturer || "No Manufacturer"}
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 text-gray-900">
                                    {item.orderGuideQuality}
                                  </td>
                                  <td className="px-3 py-2 text-gray-900">{item.product.sku}</td>
                                  <td className="px-3 py-2 text-gray-900">{item.product.uom || "-"}</td>
                                  <td className="px-3 py-2 text-gray-900">
                                    {pricingData[String(item.productId)] !== undefined &&
                                    pricingData[String(item.productId)] !== null
                                      ? `$${Number(
                                          pricingData[String(item.productId)]
                                        ).toFixed(2)}`
                                      : "Quote"}
                                  </td>
                                  <td className="px-3 py-2">
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      pattern="[0-9]*"
                                      value={quantities[item.productId] ?? ""}
                                      onChange={(e) => {
                                        const nextValue = e.target.value.replace(/\D/g, "");
                                        setQuantities((prev) => ({
                                          ...prev,
                                          [item.productId]: nextValue,
                                        }));
                                      }}
                                      className="w-20 border border-gray-400 rounded-md p-1 text-gray-900 bg-white [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <button
                                      onClick={() => handleAddToCart(item)}
                                      className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700"
                                    >
                                      Add
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
