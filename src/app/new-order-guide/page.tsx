"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import ProductDetailModal from "@/components/products/ProductDetailModal";

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
  const [hideEmptyPage, setHideEmptyPage] = useState(false);
  const [hideEmptyByCategory, setHideEmptyByCategory] = useState<Record<string, boolean>>({});
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [productModalId, setProductModalId] = useState<number | null>(null);
  const [isDesktop, setIsDesktop] = useState(true);
  const saveTimersRef = useRef<Record<number, ReturnType<typeof setTimeout>>>(
    {}
  );
  const pendingSavesRef = useRef<
    Record<number, { item: OrderGuideItem; quantityText: string }>
  >({});

  const resolvedPricingVenueId =
    defaultVenueId ?? (session?.user?.venues?.length === 1 ? session.user.venues[0].trxVenueId : null);

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

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

  const handleSubmitOrder = () => {
    if (draftLocked) {
      setError("Draft is locked. Ask admin to reactivate it.");
      return;
    }
    setShowSubmitConfirm(true);
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

  const getRowHighlightClass = (item: OrderGuideItem) => {
    if (item.sourceType === "GENERAL_CATALOG") return "bg-red-50";
    const normalizedQuality = item.orderGuideQuality.toUpperCase();
    if (normalizedQuality.includes("SUGGESTED")) return "bg-green-50";
    if (normalizedQuality.includes("ECONOMY")) return "bg-yellow-50";
    return "";
  };

  const getQty = (item: OrderGuideItem) => {
    const t = quantities[item.productId] ?? "";
    const n = parseInt(t, 10);
    return Number.isNaN(n) ? 0 : n;
  };

  const filterItemsByQty = (list: OrderGuideItem[], hideEmpty: boolean) =>
    hideEmpty ? list.filter((item) => getQty(item) > 0) : list;

  const submitConfirmItems = useMemo(() => {
    return items.filter((item) => {
      const t = quantities[item.productId] ?? "";
      const n = parseInt(t, 10);
      return !Number.isNaN(n) && n > 0;
    });
  }, [items, quantities]);

  const submitConfirmTotal = useMemo(() => {
    let total = 0;
    for (const item of submitConfirmItems) {
      const price = pricingData[String(item.productId)];
      const t = quantities[item.productId] ?? "";
      const qty = parseInt(t, 10);
      if (typeof price === "number" && !Number.isNaN(qty) && qty > 0) total += price * qty;
    }
    return total;
  }, [submitConfirmItems, pricingData, quantities]);

  const doSubmitOrder = async () => {
    setShowSubmitConfirm(false);
    if (draftLocked) return;
    setSubmitting(true);
    setError(null);
    setSubmitSuccess(false);
    try {
      await flushPendingSaves();
      const response = await fetch("/api/order-guide-draft/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchaseOrder, comment }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Failed to submit order");
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

  if (!session?.user && status !== "loading") {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <p className="text-gray-700">
          Please <Link href="/login">log in</Link> to access the order guide.
        </p>
      </div>
    );
  }

  if (!isDesktop) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <p className="text-gray-700 text-lg">
            This experience is meant to be done on your desktop. Please log in on your desktop to use this feature.
          </p>
        </div>
      </div>
    );
  }

  const groupNames = Object.keys(groupedItems);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-6">
          <div className="flex-1 min-w-0">
            <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-4 md:p-6">
              <h1 className="text-2xl font-semibold text-gray-900 mb-6">
                Opening Order Guide
              </h1>

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
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={hideEmptyPage}
                      onChange={(e) => setHideEmptyPage(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    Hide empty items
                  </label>

                  {groupNames.map((groupName) => (
                    <div key={groupName} id={groupName.replace(/\s/g, "-")} className="border border-gray-200 rounded-md overflow-hidden scroll-mt-4">
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
                          {Object.entries(groupedItems[groupName]).map(([categoryName, categoryItems]) => {
                            const catKey = `${groupName}-${categoryName}`;
                            const hideCat = hideEmptyByCategory[catKey] ?? false;
                            const filtered = filterItemsByQty(categoryItems, hideEmptyPage || hideCat);
                            return (
                              <div key={categoryName}>
                                <div className="flex items-center justify-between mb-2">
                                  <h2 className="text-sm font-semibold text-gray-800">{categoryName}</h2>
                                  <label className="flex items-center gap-1 text-xs text-gray-600">
                                    <input
                                      type="checkbox"
                                      checked={hideCat}
                                      onChange={(e) =>
                                        setHideEmptyByCategory((prev) => ({
                                          ...prev,
                                          [catKey]: e.target.checked,
                                        }))
                                      }
                                      className="rounded border-gray-300"
                                    />
                                    Hide empty
                                  </label>
                                </div>
                                <div className="overflow-x-auto border border-gray-200 rounded-md">
                                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                                    <thead className="bg-gray-100 text-gray-800">
                                      <tr>
                                        <th className="px-2 py-2 text-left w-12"></th>
                                        <th className="px-3 py-2 text-left">Item</th>
                                        <th className="px-3 py-2 text-left">Description</th>
                                        <th className="px-3 py-2 text-left">Quality</th>
                                        <th className="px-3 py-2 text-left">AQCAT</th>
                                        <th className="px-3 py-2 text-left">UOM</th>
                                        <th className="px-3 py-2 text-left">Price</th>
                                        <th className="px-3 py-2 text-left">Qty</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                      {filtered.map((item) => (
                                        <tr key={item.productId} className={getRowHighlightClass(item)}>
                                          <td className="px-2 py-2">
                                            <button
                                              type="button"
                                              onClick={() => setProductModalId(item.productId)}
                                              className="block w-10 h-10 rounded overflow-hidden border border-gray-200 hover:border-blue-400 flex-shrink-0"
                                            >
                                              {item.product.images?.[0]?.src ? (
                                                <img
                                                  src={item.product.images[0].src}
                                                  alt=""
                                                  className="w-full h-full object-contain"
                                                />
                                              ) : (
                                                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs">—</div>
                                              )}
                                            </button>
                                          </td>
                                          <td className="px-3 py-2 text-gray-900">
                                            <div className="font-medium">{item.product.title}</div>
                                            <div className="text-xs text-gray-700">
                                              {item.product.manufacturer || "No Manufacturer"}
                                            </div>
                                          </td>
                                          <td className="px-3 py-2 text-gray-900">
                                            <div className="max-h-16 overflow-y-auto text-xs">
                                              {item.product.description || "-"}
                                            </div>
                                          </td>
                                          <td className="px-3 py-2 text-gray-900">{item.orderGuideQuality}</td>
                                          <td className="px-3 py-2 text-gray-900">{item.product.aqcat || "-"}</td>
                                          <td className="px-3 py-2 text-gray-900">{item.product.uom || "-"}</td>
                                          <td className="px-3 py-2 text-gray-900">
                                            {pricingData[String(item.productId)] !== undefined &&
                                            pricingData[String(item.productId)] !== null
                                              ? `$${Number(pricingData[String(item.productId)]).toFixed(2)}`
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
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>

          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-36 space-y-4">
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3">Jump to</h3>
                <nav className="space-y-1">
                  {groupNames.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        document.getElementById(name.replace(/\s/g, "-"))?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="block w-full text-left text-sm text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {name}
                    </button>
                  ))}
                </nav>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3">Color key</h3>
                <div className="space-y-2 text-sm text-gray-800">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-red-50 border border-red-200" />
                    <span>General Catalog</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-50 border border-green-200" />
                    <span>Suggested</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-yellow-50 border border-yellow-200" />
                    <span>Economy</span>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="font-medium text-gray-900">
                  Running Total: ${runningTotals.total.toFixed(2)}
                </div>
                {runningTotals.quoteRequiredCount > 0 && (
                  <div className="text-amber-700 text-sm mt-1">
                    {runningTotals.quoteRequiredCount} line{runningTotals.quoteRequiredCount === 1 ? "" : "s"} require quote
                  </div>
                )}
                <div className="text-gray-600 text-sm mt-2">
                  Last saved: {lastSavedAt ? new Date(lastSavedAt).toLocaleString() : "Not saved yet"}
                </div>
                <Link
                  href="/products"
                  className="mt-3 block text-sm text-blue-700 hover:text-blue-900"
                  onClick={() => void flushPendingSaves()}
                >
                  Add from main catalog
                </Link>
              </div>
              {items.length > 0 && (
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-3">
                  <h3 className="font-semibold text-gray-900">Submit order</h3>
                  <div>
                    <label htmlFor="stickyPurchaseOrder" className="block text-xs font-medium text-gray-700 mb-1">
                      Purchase Order
                    </label>
                    <input
                      id="stickyPurchaseOrder"
                      type="text"
                      maxLength={25}
                      value={purchaseOrder}
                      onChange={(e) => setPurchaseOrder(e.target.value)}
                      className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm text-gray-900"
                      placeholder="PO number (optional)"
                    />
                  </div>
                  <div>
                    <label htmlFor="stickyOrderComment" className="block text-xs font-medium text-gray-700 mb-1">
                      Comments
                    </label>
                    <textarea
                      id="stickyOrderComment"
                      rows={2}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm text-gray-900"
                      placeholder="Special instructions..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSaveNow}
                      disabled={savingNow || draftLocked}
                      className="flex-1 bg-gray-100 text-gray-800 px-3 py-2 rounded-md text-sm hover:bg-gray-200 disabled:opacity-50"
                    >
                      {savingNow ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={handleSubmitOrder}
                      disabled={submitting || draftLocked}
                      className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                      {submitting ? "Submitting..." : "Submit"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowSubmitConfirm(false)} aria-hidden />
          <div className="relative z-10 w-full max-w-lg mx-4 bg-white rounded-lg shadow-xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm order</h3>
            <div className="space-y-2 mb-4 text-sm">
              {submitConfirmItems.map((item) => {
                const price = pricingData[String(item.productId)];
                const qty = getQty(item);
                const lineTotal = typeof price === "number" ? price * qty : null;
                return (
                  <div key={item.productId} className="flex justify-between gap-4 py-1 border-b border-gray-100">
                    <span className="text-gray-700 truncate">
                      {item.product.title} × {qty}
                    </span>
                    <span className="text-gray-900 font-medium">{lineTotal != null ? `$${lineTotal.toFixed(2)}` : "Quote"}</span>
                  </div>
                );
              })}
            </div>
            <div className="font-semibold text-gray-900 mb-4">
              Total: ${submitConfirmTotal.toFixed(2)}
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSubmitConfirm(false)}
                className="bg-gray-100 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={doSubmitOrder}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Confirm Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {productModalId != null && (
        <ProductDetailModal
          productId={productModalId}
          isOpen={true}
          onClose={() => setProductModalId(null)}
        />
      )}
    </div>
  );
}
