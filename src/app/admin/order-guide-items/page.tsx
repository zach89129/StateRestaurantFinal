"use client";

import { useEffect, useState } from "react";

interface OrderGuideProduct {
  id: number;
  sku: string;
  title: string;
  manufacturer: string | null;
  category: string | null;
}

interface OrderGuideItem {
  id: number;
  productId: number;
  orderGuideGroup: string;
  orderGuideQuality: string;
  included: boolean;
  product: OrderGuideProduct;
}

interface FormState {
  productId: string;
  orderGuideGroup: string;
  orderGuideQuality: string;
  included: boolean;
}

export default function AdminOrderGuideItemsPage() {
  const [items, setItems] = useState<OrderGuideItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [includeExcluded, setIncludeExcluded] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newItemForm, setNewItemForm] = useState<FormState>({
    productId: "",
    orderGuideGroup: "",
    orderGuideQuality: "",
    included: true,
  });

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/order-guide-items?search=${encodeURIComponent(
          search
        )}&includeExcluded=${includeExcluded}`
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to load order guide items");
      }
      setItems(data.items || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load order guide items"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [includeExcluded]);

  const handleSave = async (item: OrderGuideItem) => {
    setSavingId(item.id);
    setError(null);
    try {
      const response = await fetch("/api/admin/order-guide-items", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          orderGuideGroup: item.orderGuideGroup,
          orderGuideQuality: item.orderGuideQuality,
          included: item.included,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update item");
      }
      setItems((prev) =>
        prev.map((existingItem) =>
          existingItem.id === item.id ? data.item : existingItem
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update item");
    } finally {
      setSavingId(null);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await fetch("/api/admin/order-guide-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: Number(newItemForm.productId),
          orderGuideGroup: newItemForm.orderGuideGroup,
          orderGuideQuality: newItemForm.orderGuideQuality,
          included: newItemForm.included,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to add item");
      }
      setItems((prev) => [data.item, ...prev]);
      setNewItemForm({
        productId: "",
        orderGuideGroup: "",
        orderGuideQuality: "",
        included: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add item");
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">
        Opening Order Guide Items
      </h2>

      <form
        onSubmit={handleAddItem}
        className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-gray-50 p-4 rounded-md"
      >
        <input
          type="number"
          value={newItemForm.productId}
          onChange={(e) =>
            setNewItemForm((prev) => ({ ...prev, productId: e.target.value }))
          }
          placeholder="Product ID"
          className="border border-gray-300 rounded-md p-2"
          required
        />
        <input
          type="text"
          value={newItemForm.orderGuideGroup}
          onChange={(e) =>
            setNewItemForm((prev) => ({
              ...prev,
              orderGuideGroup: e.target.value,
            }))
          }
          placeholder="Group"
          className="border border-gray-300 rounded-md p-2"
          required
        />
        <input
          type="text"
          value={newItemForm.orderGuideQuality}
          onChange={(e) =>
            setNewItemForm((prev) => ({
              ...prev,
              orderGuideQuality: e.target.value,
            }))
          }
          placeholder="Quality"
          className="border border-gray-300 rounded-md p-2"
          required
        />
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={newItemForm.included}
            onChange={(e) =>
              setNewItemForm((prev) => ({ ...prev, included: e.target.checked }))
            }
          />
          Included
        </label>
        <button
          type="submit"
          className="bg-blue-600 text-white rounded-md px-4 py-2 hover:bg-blue-700"
        >
          Add / Upsert Item
        </button>
      </form>

      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, SKU, manufacturer, category"
          className="border border-gray-300 rounded-md p-2 w-full md:w-96"
        />
        <button
          onClick={fetchItems}
          className="bg-gray-800 text-white rounded-md px-4 py-2 hover:bg-gray-900"
        >
          Search
        </button>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={includeExcluded}
            onChange={(e) => setIncludeExcluded(e.target.checked)}
          />
          Include Excluded Items
        </label>
      </div>

      {error && (
        <div className="p-3 border border-red-200 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="overflow-x-auto border border-gray-200 rounded-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Product
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Group
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Quality
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Included
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-6 text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-6 text-gray-500">
                  No order guide items found
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div className="font-medium">{item.product.title}</div>
                    <div className="text-xs text-gray-500">
                      ID {item.productId} / SKU {item.product.sku}
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.product.manufacturer || "No Manufacturer"} |{" "}
                      {item.product.category || "No Category"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={item.orderGuideGroup}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((existingItem) =>
                            existingItem.id === item.id
                              ? {
                                  ...existingItem,
                                  orderGuideGroup: e.target.value,
                                }
                              : existingItem
                          )
                        )
                      }
                      className="border border-gray-300 rounded-md p-2 w-full"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={item.orderGuideQuality}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((existingItem) =>
                            existingItem.id === item.id
                              ? {
                                  ...existingItem,
                                  orderGuideQuality: e.target.value,
                                }
                              : existingItem
                          )
                        )
                      }
                      className="border border-gray-300 rounded-md p-2 w-full"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={item.included}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((existingItem) =>
                            existingItem.id === item.id
                              ? { ...existingItem, included: e.target.checked }
                              : existingItem
                          )
                        )
                      }
                    />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleSave(item)}
                      disabled={savingId === item.id}
                      className="bg-blue-600 text-white rounded-md px-3 py-2 hover:bg-blue-700 disabled:opacity-50"
                    >
                      {savingId === item.id ? "Saving..." : "Save"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
