"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewProductPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    sku: "",
    title: "",
    description: "",
    manufacturer: "",
    category: "",
    uom: "",
    qtyAvailable: "",
    tags: "",
    imageSrc: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate required fields
    if (!formData.sku.trim() || !formData.title.trim()) {
      setError("SKU and Title are required fields");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sku: formData.sku,
          title: formData.title,
          description: formData.description || null,
          manufacturer: formData.manufacturer || null,
          category: formData.category || null,
          uom: formData.uom || null,
          qty_available: formData.qtyAvailable
            ? parseInt(formData.qtyAvailable)
            : null,
          tags: formData.tags || null,
          images: formData.imageSrc ? [{ src: formData.imageSrc }] : [],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create product");
      }

      router.push("/admin/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">
          Add New Product
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="sku"
            className="block text-sm font-medium text-gray-700"
          >
            SKU *
          </label>
          <input
            type="text"
            id="sku"
            name="sku"
            required
            value={formData.sku}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
          />
        </div>

        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700"
          >
            Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            value={formData.title}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
          />
        </div>

        <div>
          <label
            htmlFor="manufacturer"
            className="block text-sm font-medium text-gray-700"
          >
            Manufacturer
          </label>
          <input
            type="text"
            id="manufacturer"
            name="manufacturer"
            value={formData.manufacturer}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
          />
        </div>

        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700"
          >
            Category
          </label>
          <input
            type="text"
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
          />
        </div>

        <div>
          <label
            htmlFor="uom"
            className="block text-sm font-medium text-gray-700"
          >
            Unit of Measure
          </label>
          <input
            type="text"
            id="uom"
            name="uom"
            value={formData.uom}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
          />
        </div>

        <div>
          <label
            htmlFor="qtyAvailable"
            className="block text-sm font-medium text-gray-700"
          >
            Quantity Available
          </label>
          <input
            type="number"
            id="qtyAvailable"
            name="qtyAvailable"
            value={formData.qtyAvailable}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
          />
        </div>

        <div>
          <label
            htmlFor="tags"
            className="block text-sm font-medium text-gray-700"
          >
            Tags
          </label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            placeholder="Comma-separated tags"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
          />
        </div>

        <div>
          <label
            htmlFor="imageSrc"
            className="block text-sm font-medium text-gray-700"
          >
            Image URL
          </label>
          <input
            type="url"
            id="imageSrc"
            name="imageSrc"
            value={formData.imageSrc}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900"
          />
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Product"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
