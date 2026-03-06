"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface OrderGuideProduct {
  id: number;
  sku: string;
  title: string;
  description: string | null;
  manufacturer: string | null;
  category: string | null;
  aqcat: string | null;
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
  sourceType: "ORDER_GUIDE" | "GENERAL_CATALOG";
}

interface OrderGuideResponse {
  success: boolean;
  error?: string;
  defaultVenueId: number | null;
  items: OrderGuideItem[];
}

interface DraftItem {
  id: number;
  productId: number;
  quantity: number;
  sourceType: "ORDER_GUIDE" | "GENERAL_CATALOG";
  orderGuideGroup: string | null;
  orderGuideQuality: string | null;
  product: OrderGuideProduct;
}

interface DraftResponse {
  success: boolean;
  error?: string;
  isLocked?: boolean;
  submittedAt?: string | null;
  lastSavedAt?: string | null;
  items: DraftItem[];
}

const sortByText = (a: string | null, b: string | null) =>
  (a || "").localeCompare(b || "", undefined, { numeric: true });

export default function NewOrderGuidePage() {
  const { data: session, status } = useSession();
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
  const [submitting, setSubmitting] = useState(false);
  const [purchaseOrder, setPurchaseOrder] = useState("");
  const [comment, setComment] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [draftLocked, setDraftLocked] = useState(false);
  const [savingNow, setSavingNow] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const saveTimersRef = useRef<Record<number, ReturnType<typeof setTimeout>>>(
    {}
  );
  const pendingSavesRef = useRef<
    Record<number, { item: OrderGuideItem; quantityText: string }>
  >({});

  const resolvedPricingVenueId =
    defaultVenueId ?? (session?.user?.venues?.length === 1 ? session.user.venues[0].trxVenueId : null);

  useEffect(() => {
    const loadItems = async () => {
      setLoading(true);
      setError(null);
      try {
        const [guideResponse, draftResponse] = await Promise.all([
          fetch("/api/order-guide-items"),
          fetch("/api/order-guide-draft"),
        ]);
        const guideData: OrderGuideResponse = await guideResponse.json();
        const draftData: DraftResponse = await draftResponse.json();

        if (!guideResponse.ok || !guideData.success) {
          throw new Error(guideData.error || "Failed to load order guide");
        }
        if (!draftResponse.ok || !draftData.success) {
          throw new Error(draftData.error || "Failed to load saved draft");
        }
        setDraftLocked(Boolean(draftData.isLocked));
        setLastSavedAt(draftData.lastSavedAt ?? null);

        const aqcatGroupMap: Record<string, string> = {};
        for (const baseItem of guideData.items || []) {
          const aqcatKey = (baseItem.product.aqcat || "").trim();
          if (aqcatKey && !aqcatGroupMap[aqcatKey]) {
            aqcatGroupMap[aqcatKey] = baseItem.orderGuideGroup;
          }
        }

        const mergedByProductId = new Map<number, OrderGuideItem>();
        for (const baseItem of guideData.items || []) {
          mergedByProductId.set(baseItem.productId, {
            ...baseItem,
            sourceType: "ORDER_GUIDE",
          });
        }

        for (const draftItem of draftData.items || []) {
          const existing = mergedByProductId.get(draftItem.productId);
          if (existing) {
            if (draftItem.sourceType === "GENERAL_CATALOG") {
              mergedByProductId.set(draftItem.productId, {
                ...existing,
                sourceType: "GENERAL_CATALOG",
              });
            }
            continue;
          }

          const draftAqcat = (draftItem.product.aqcat || "").trim();
          const resolvedGroup =
            draftItem.orderGuideGroup ||
            (draftAqcat ? aqcatGroupMap[draftAqcat] : null) ||
            "GENERAL CATALOG";

          mergedByProductId.set(draftItem.productId, {
            id: draftItem.id,
            productId: draftItem.productId,
            orderGuideGroup: resolvedGroup,
            orderGuideQuality: draftItem.orderGuideQuality || "GENERAL CATALOG",
            sourceType: "GENERAL_CATALOG",
            product: draftItem.product,
          });
        }

        const mergedItems = Array.from(mergedByProductId.values());
        setItems(mergedItems);
        setDefaultVenueId(guideData.defaultVenueId || null);
        setGroupOpenState(
          mergedItems.reduce((acc, item) => {
            acc[item.orderGuideGroup] = true;
            return acc;
          }, {} as Record<string, boolean>)
        );

        const nextQuantities = (draftData.items || []).reduce((acc, item) => {
          acc[item.productId] = String(item.quantity);
          return acc;
        }, {} as Record<number, string>);
        setQuantities(nextQuantities);
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
      if (!resolvedPricingVenueId) {
        setLoadingPrices(false);
        return;
      }
      setLoadingPrices(true);
      try {
        const ids = Array.from(new Set(items.map((item) => item.productId)));
        const batchSize = 25;
        setPricingData({});
        for (let i = 0; i < ids.length; i += batchSize) {
          const batch = ids.slice(i, i + batchSize);
          const response = await fetch(
            `/api/pricing?venueId=${resolvedPricingVenueId}&productIds=${batch.join(",")}&isDeadInventory=false`
          );
          const data = await response.json();
          if (!response.ok || !data.success) {
            continue;
          }
          if (Array.isArray(data.prices)) {
            const batchPrices: Record<string, number | null> = {};
            data.prices.forEach(
              (entry: {
                productId: number;
                price?: number;
                customerPrice?: number;
              }) => {
                const resolvedPrice =
                  typeof entry.customerPrice === "number"
                    ? entry.customerPrice
                    : typeof entry.price === "number"
                    ? entry.price
                    : null;
                batchPrices[String(entry.productId)] = resolvedPrice;
              }
            );
            setPricingData((prev) => ({
              ...prev,
              ...batchPrices,
            }));
          }
        }
      } finally {
        setLoadingPrices(false);
      }
    };

    fetchPrices();
  }, [items, resolvedPricingVenueId]);

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
      const categoryKey = item.product.aqcat || item.product.category || "Uncategorized";
      if (!acc[item.orderGuideGroup][categoryKey]) {
        acc[item.orderGuideGroup][categoryKey] = [];
      }
      acc[item.orderGuideGroup][categoryKey].push(item);
      return acc;
    }, {} as Record<string, Record<string, OrderGuideItem[]>>);
  }, [items]);

  const runningTotals = useMemo(() => {
    let total = 0;
    let quoteRequiredCount = 0;

    for (const item of items) {
      const quantityText = quantities[item.productId] ?? "";
      const quantity = parseInt(quantityText, 10);
      if (Number.isNaN(quantity) || quantity <= 0) {
        continue;
      }

      const price = pricingData[String(item.productId)];
      if (typeof price === "number") {
        total += price * quantity;
      } else {
        quoteRequiredCount += 1;
      }
    }

    return {
      total,
      quoteRequiredCount,
    };
  }, [items, pricingData, quantities]);

  useEffect(() => {
    const timers = saveTimersRef.current;
    return () => {
      Object.keys(timers).forEach((key) => clearTimeout(timers[Number(key)]));
    };
  }, []);

  const saveQuantity = useCallback(async (
    item: OrderGuideItem,
    quantityText: string,
    keepalive?: boolean
  ) => {
    const nextQuantity = quantityText === "" ? 0 : parseInt(quantityText, 10);
    if (Number.isNaN(nextQuantity)) {
      return;
    }

    const response = await fetch("/api/order-guide-draft", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      keepalive: Boolean(keepalive),
      body: JSON.stringify({
        productId: item.productId,
        quantity: nextQuantity,
        sourceType: item.sourceType,
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || "Failed to save quantity");
    }
    setLastSavedAt(new Date().toISOString());
    delete pendingSavesRef.current[item.productId];
  }, []);

  const flushPendingSaves = useCallback(async (keepalive?: boolean) => {
    const pending = Object.values(pendingSavesRef.current);
    if (pending.length === 0) {
      return;
    }

    Object.keys(saveTimersRef.current).forEach((key) =>
      clearTimeout(saveTimersRef.current[Number(key)])
    );

    const uniqueByProductId = new Map<
      number,
      { item: OrderGuideItem; quantityText: string }
    >();
    for (const entry of pending) {
      uniqueByProductId.set(entry.item.productId, entry);
    }

    for (const entry of uniqueByProductId.values()) {
      await saveQuantity(entry.item, entry.quantityText, keepalive);
    }
  }, [saveQuantity]);

  const handleQuantityChange = (item: OrderGuideItem, rawValue: string) => {
    if (draftLocked) return;
    const nextValue = rawValue.replace(/\D/g, "");
    setQuantities((prev) => ({
      ...prev,
      [item.productId]: nextValue,
    }));
    pendingSavesRef.current[item.productId] = { item, quantityText: nextValue };

    if (saveTimersRef.current[item.productId]) {
      clearTimeout(saveTimersRef.current[item.productId]);
    }
    saveTimersRef.current[item.productId] = setTimeout(() => {
      void saveQuantity(item, nextValue).catch((saveError) => {
        setError(
          saveError instanceof Error ? saveError.message : "Failed to save quantity"
        );
      });
    }, 500);
  };

  const handleQuantityBlur = (item: OrderGuideItem) => {
    if (draftLocked) return;
    const quantityText = quantities[item.productId] ?? "";
    pendingSavesRef.current[item.productId] = { item, quantityText };
    if (saveTimersRef.current[item.productId]) {
      clearTimeout(saveTimersRef.current[item.productId]);
    }
    void saveQuantity(item, quantityText).catch((saveError) => {
      setError(
        saveError instanceof Error ? saveError.message : "Failed to save quantity"
      );
    });
  };

  const handleSaveNow = async () => {
    if (draftLocked) return;
    setSavingNow(true);
    setSaveNotice(null);
    try {
      await flushPendingSaves();
      setSaveNotice("All changes saved.");
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Failed to save changes"
      );
    } finally {
      setSavingNow(false);
    }
  };

  const handleSubmitOrder = async () => {
    if (draftLocked) {
      setError("Draft is locked. Ask admin to reactivate it.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setSubmitSuccess(false);
    try {
      await flushPendingSaves();
      const response = await fetch("/api/order-guide-draft/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          purchaseOrder,
          comment,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to submit order");
      }

      setSubmitSuccess(true);
      setDraftLocked(true);
      setPurchaseOrder("");
      setComment("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit order");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const handleBeforeUnload = () => {
      const pending = Object.values(pendingSavesRef.current);
      if (pending.length === 0) return;
      for (const entry of pending) {
        void saveQuantity(entry.item, entry.quantityText, true);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        void flushPendingSaves(true);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      void flushPendingSaves();
    };
  }, [saveQuantity, flushPendingSaves]);

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

  if (!session?.user && status !== "loading") {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <p className="text-gray-700">
          Please <Link href="/login">log in</Link> to access the order guide.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            New Customer Order Guide
          </h1>
          <div className="text-sm text-gray-700 flex flex-col items-start md:items-end gap-1">
            <div className="font-medium text-gray-900">
              Running Total: ${runningTotals.total.toFixed(2)}
            </div>
            {runningTotals.quoteRequiredCount > 0 && (
              <div className="text-amber-700">
                {runningTotals.quoteRequiredCount} line
                {runningTotals.quoteRequiredCount === 1 ? "" : "s"} require quote
                pricing
              </div>
            )}
            <div className="text-gray-600">
              Last saved:{" "}
              {lastSavedAt ? new Date(lastSavedAt).toLocaleString() : "Not saved yet"}
            </div>
            <Link
              href="/products"
              className="text-blue-700 hover:text-blue-900"
              onClick={() => {
                void flushPendingSaves();
              }}
            >
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
        {submitSuccess && (
          <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-green-700">
            Order submitted successfully.
          </div>
        )}
        {draftLocked && (
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-700">
            This draft is locked after submission. Ask admin to reactivate it if changes are needed.
          </div>
        )}
        {saveNotice && (
          <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-3 text-blue-700">
            {saveNotice}
          </div>
        )}
        {!loading && !resolvedPricingVenueId && (
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-700">
            Pricing venue is not configured for this account.
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
                                <th className="px-3 py-2 text-left">AQCAT</th>
                                <th className="px-3 py-2 text-left">SKU</th>
                                <th className="px-3 py-2 text-left">UOM</th>
                                <th className="px-3 py-2 text-left">Price</th>
                                <th className="px-3 py-2 text-left">Qty</th>
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
                                  <td className="px-3 py-2 text-gray-900">
                                    {item.product.aqcat || "-"}
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
                                      onChange={(e) => handleQuantityChange(item, e.target.value)}
                                      onBlur={() => handleQuantityBlur(item)}
                                      disabled={draftLocked}
                                      className="w-20 border border-gray-400 rounded-md p-1 text-gray-900 bg-white [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                    />
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

          {!loading && items.length > 0 && (
            <div className="mt-6 border-t border-gray-200 pt-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="purchaseOrder"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Purchase Order Number
                  </label>
                  <input
                    id="purchaseOrder"
                    type="text"
                    maxLength={25}
                    value={purchaseOrder}
                    onChange={(e) => setPurchaseOrder(e.target.value)}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm text-gray-900"
                    placeholder="Enter PO number (optional)"
                  />
                </div>
                <div>
                  <label
                    htmlFor="orderComment"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Order Comments
                  </label>
                  <textarea
                    id="orderComment"
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm text-gray-900"
                    placeholder="Add any special instructions or comments..."
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleSaveNow}
                  disabled={savingNow || draftLocked}
                  className="bg-gray-100 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-200 disabled:opacity-50"
                >
                  {savingNow ? "Saving..." : "Save Now"}
                </button>
                <button
                  onClick={handleSubmitOrder}
                  disabled={submitting || draftLocked}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Order"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
