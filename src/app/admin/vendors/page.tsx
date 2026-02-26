"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface VendorLink {
  id: number;
  name: string;
  url: string;
  imageUrl: string | null;
  type: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export default function VendorsPage() {
  const [manufacturers, setManufacturers] = useState<VendorLink[]>([]);
  const [chinaFlatware, setChinaFlatware] = useState<VendorLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "manufacturer" | "china_flatware"
  >("manufacturer");

  const [manufacturerForm, setManufacturerForm] = useState({
    name: "",
    url: "",
  });
  const [chinaFlatwareForm, setChinaFlatwareForm] = useState({
    name: "",
    url: "",
    file: null as File | null,
    order: 0,
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingType, setEditingType] = useState<"manufacturer" | "china_flatware" | null>(null);
  const [editingForm, setEditingForm] = useState({
    name: "",
    url: "",
    order: 0,
    file: null as File | null,
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && editingId && editingType === "china_flatware") {
        cancelEdit();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [editingId, editingType]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [mfrRes, cfRes] = await Promise.all([
        fetch("/api/admin/vendors?type=manufacturer"),
        fetch("/api/admin/vendors?type=china_flatware"),
      ]);

      if (!mfrRes.ok || !cfRes.ok) {
        throw new Error("Failed to fetch vendors");
      }

      const [mfrData, cfData] = await Promise.all([
        mfrRes.json(),
        cfRes.json(),
      ]);

      setManufacturers(mfrData);
      setChinaFlatware(cfData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleManufacturerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manufacturerForm.name || !manufacturerForm.url) return;

    try {
      setError(null);
      const formData = new FormData();
      formData.append("name", manufacturerForm.name);
      formData.append("url", manufacturerForm.url);
      formData.append("type", "manufacturer");
      formData.append("order", "0");

      const response = await fetch("/api/admin/vendors", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create manufacturer");
      }

      setManufacturerForm({ name: "", url: "" });
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    }
  };

  const handleChinaFlatwareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chinaFlatwareForm.name || !chinaFlatwareForm.url) return;

    try {
      setError(null);
      const formData = new FormData();
      formData.append("name", chinaFlatwareForm.name);
      formData.append("url", chinaFlatwareForm.url);
      formData.append("type", "china_flatware");
      formData.append("order", chinaFlatwareForm.order.toString());
      if (chinaFlatwareForm.file) {
        formData.append("file", chinaFlatwareForm.file);
      }

      const response = await fetch("/api/admin/vendors", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create partner");
      }

      setChinaFlatwareForm({
        name: "",
        url: "",
        file: null,
        order: chinaFlatware.length,
      });
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    }
  };

  const startEdit = (vendor: VendorLink) => {
    setEditingId(vendor.id);
    setEditingType(vendor.type as "manufacturer" | "china_flatware");
    setEditingForm({
      name: vendor.name,
      url: vendor.url,
      order: vendor.order,
      file: null,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingType(null);
    setEditingForm({ name: "", url: "", order: 0, file: null });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    try {
      setError(null);
      const formData = new FormData();
      formData.append("id", editingId.toString());
      formData.append("name", editingForm.name);
      formData.append("url", editingForm.url);
      formData.append("order", editingForm.order.toString());
      if (editingForm.file) {
        formData.append("file", editingForm.file);
      }

      const response = await fetch("/api/admin/vendors", {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update");
      }

      cancelEdit();
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    }
  };

  const deleteVendor = async (id: number) => {
    if (!confirm("Are you sure you want to delete this vendor?")) return;

    try {
      setError(null);
      const response = await fetch(`/api/admin/vendors?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete vendor");
      }

      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Vendor Management</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("manufacturer")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "manufacturer"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Manufacturer Websites
          </button>
          <button
            onClick={() => setActiveTab("china_flatware")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "china_flatware"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            China/Flatware Partners
          </button>
        </nav>
      </div>

      {activeTab === "manufacturer" && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Add Manufacturer
            </h3>
            <form
              onSubmit={handleManufacturerSubmit}
              className="space-y-4 max-w-md"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  value={manufacturerForm.name}
                  onChange={(e) =>
                    setManufacturerForm({
                      ...manufacturerForm,
                      name: e.target.value,
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 text-gray-900 rounded-md shadow-sm p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  URL
                </label>
                <input
                  type="url"
                  value={manufacturerForm.url}
                  onChange={(e) =>
                    setManufacturerForm({
                      ...manufacturerForm,
                      url: e.target.value,
                    })
                  }
                  placeholder="https://example.com"
                  className="mt-1 block w-full border border-gray-300 text-gray-900 rounded-md shadow-sm p-2"
                  required
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Manufacturer
              </button>
            </form>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Existing Manufacturers ({manufacturers.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {manufacturers.map((v) => (
                <div
                  key={v.id}
                  className="border border-gray-200 rounded-lg p-4 flex justify-between items-start gap-4"
                >
                  {editingId === v.id ? (
                    <form
                      onSubmit={handleEditSubmit}
                      className="flex-1 space-y-2"
                    >
                      <input
                        type="text"
                        value={editingForm.name}
                        onChange={(e) =>
                          setEditingForm({
                            ...editingForm,
                            name: e.target.value,
                          })
                        }
                        className="block w-full border border-gray-300 text-gray-900 rounded p-2 text-sm"
                        required
                      />
                      <input
                        type="url"
                        value={editingForm.url}
                        onChange={(e) =>
                          setEditingForm({
                            ...editingForm,
                            url: e.target.value,
                          })
                        }
                        className="block w-full border border-gray-300 text-gray-900 rounded p-2 text-sm"
                        required
                      />
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="px-2 py-1 text-sm bg-blue-600 text-white rounded"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="px-2 py-1 text-sm bg-gray-200 text-gray-700 rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {v.name}
                        </p>
                        <a
                          href={v.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 truncate block"
                        >
                          {v.url}
                        </a>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => startEdit(v)}
                          className="px-2 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteVendor(v.id)}
                          className="px-2 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "china_flatware" && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Add China/Flatware Partner
            </h3>
            <form
              onSubmit={handleChinaFlatwareSubmit}
              className="space-y-4 max-w-md"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  value={chinaFlatwareForm.name}
                  onChange={(e) =>
                    setChinaFlatwareForm({
                      ...chinaFlatwareForm,
                      name: e.target.value,
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 text-gray-900 rounded-md shadow-sm p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  URL
                </label>
                <input
                  type="url"
                  value={chinaFlatwareForm.url}
                  onChange={(e) =>
                    setChinaFlatwareForm({
                      ...chinaFlatwareForm,
                      url: e.target.value,
                    })
                  }
                  placeholder="https://example.com"
                  className="mt-1 block w-full border border-gray-300 text-gray-900 rounded-md shadow-sm p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Display Order
                </label>
                <input
                  type="number"
                  value={chinaFlatwareForm.order}
                  onChange={(e) =>
                    setChinaFlatwareForm({
                      ...chinaFlatwareForm,
                      order: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  min={0}
                  className="mt-1 block w-full border border-gray-300 text-gray-900 rounded-md shadow-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Logo Image (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setChinaFlatwareForm({
                      ...chinaFlatwareForm,
                      file: e.target.files?.[0] || null,
                    })
                  }
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Upload a logo or leave blank to add later. Supports local paths
                  from seed if not set.
                </p>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Partner
              </button>
            </form>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Existing Partners ({chinaFlatware.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {chinaFlatware.map((v) => (
                <div
                  key={v.id}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <div className="relative h-32 bg-gray-50 flex items-center justify-center">
                    {v.imageUrl ? (
                      <Image
                        src={v.imageUrl}
                        alt={v.name}
                        fill
                        className="object-contain p-2"
                        unoptimized
                      />
                    ) : (
                      <span className="text-gray-400 text-sm">No image</span>
                    )}
                    {editingId === v.id && editingType === "china_flatware" && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10">
                        <span className="bg-white px-3 py-1 rounded text-sm font-medium">
                          Editing...
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h4 className="font-medium text-gray-900">{v.name}</h4>
                    <p className="text-xs text-gray-500">
                      Order: {v.order} | {v.url}
                    </p>
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => startEdit(v)}
                        className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteVendor(v.id)}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Edit modal for China/Flatware - prevents form from being cut off by footer */}
            {editingId && editingType === "china_flatware" && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                onClick={(e) => e.target === e.currentTarget && cancelEdit()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="edit-partner-title"
              >
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                  <div
                    className="p-6"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h3 id="edit-partner-title" className="text-lg font-semibold text-gray-900 mb-4">
                      Edit Partner
                    </h3>
                    <form
                      onSubmit={handleEditSubmit}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Name
                        </label>
                        <input
                          type="text"
                          value={editingForm.name}
                          onChange={(e) =>
                            setEditingForm({
                              ...editingForm,
                              name: e.target.value,
                            })
                          }
                          className="mt-1 block w-full border border-gray-300 text-gray-900 rounded p-2"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          URL
                        </label>
                        <input
                          type="url"
                          value={editingForm.url}
                          onChange={(e) =>
                            setEditingForm({
                              ...editingForm,
                              url: e.target.value,
                            })
                          }
                          className="mt-1 block w-full border border-gray-300 text-gray-900 rounded p-2"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Display Order
                        </label>
                        <input
                          type="number"
                          value={editingForm.order}
                          onChange={(e) =>
                            setEditingForm({
                              ...editingForm,
                              order: parseInt(e.target.value, 10) || 0,
                            })
                          }
                          min={0}
                          className="mt-1 block w-full border border-gray-300 text-gray-900 rounded p-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Replace logo (optional)
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            setEditingForm({
                              ...editingForm,
                              file: e.target.files?.[0] || null,
                            })
                          }
                          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border file:border-gray-300 file:bg-white file:text-gray-700"
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
