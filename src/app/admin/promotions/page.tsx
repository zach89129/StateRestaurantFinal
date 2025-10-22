"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface PromotionBanner {
  id: number;
  name: string;
  imageUrl: string;
  targetUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PromotionDetail {
  id: number;
  name: string;
  imageUrl: string;
  targetUrl: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PromotionContent {
  id: number;
  title: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function PromotionsPage() {
  const [banners, setBanners] = useState<PromotionBanner[]>([]);
  const [details, setDetails] = useState<PromotionDetail[]>([]);
  const [content, setContent] = useState<PromotionContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"banners" | "details" | "content">(
    "banners"
  );

  // Banner form state
  const [bannerForm, setBannerForm] = useState({
    name: "",
    file: null as File | null,
    targetUrl: "",
  });

  // Detail form state
  const [detailForm, setDetailForm] = useState({
    name: "",
    file: null as File | null,
    order: 0,
    targetUrl: "",
  });

  // Content form state
  const [contentForm, setContentForm] = useState({
    title: "",
    description: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bannersRes, detailsRes, contentRes] = await Promise.all([
        fetch("/api/admin/promotions/banners"),
        fetch("/api/admin/promotions/details"),
        fetch("/api/admin/promotions/content"),
      ]);

      if (!bannersRes.ok || !detailsRes.ok || !contentRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const [bannersData, detailsData, contentData] = await Promise.all([
        bannersRes.json(),
        detailsRes.json(),
        contentRes.json(),
      ]);

      setBanners(bannersData);
      setDetails(detailsData);
      setContent(contentData);

      // Populate form with existing content
      if (contentData) {
        setContentForm({
          title: contentData.title,
          description: contentData.description,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerForm.file || !bannerForm.name) return;

    try {
      const formData = new FormData();
      formData.append("file", bannerForm.file);
      formData.append("name", bannerForm.name);
      if (bannerForm.targetUrl) {
        formData.append("targetUrl", bannerForm.targetUrl);
      }

      const response = await fetch("/api/admin/promotions/banners", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to create banner");
      }

      setBannerForm({ name: "", file: null, targetUrl: "" });
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create banner");
    }
  };

  const handleDetailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailForm.file || !detailForm.name) return;

    try {
      const formData = new FormData();
      formData.append("file", detailForm.file);
      formData.append("name", detailForm.name);
      formData.append("order", detailForm.order.toString());
      if (detailForm.targetUrl) {
        formData.append("targetUrl", detailForm.targetUrl);
      }

      const response = await fetch("/api/admin/promotions/details", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to create promotion detail");
      }

      setDetailForm({ name: "", file: null, order: 0, targetUrl: "" });
      fetchData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create promotion detail"
      );
    }
  };

  const toggleBannerActive = async (id: number, isActive: boolean) => {
    try {
      const response = await fetch("/api/admin/promotions/banners", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive }),
      });

      if (!response.ok) {
        throw new Error("Failed to update banner");
      }

      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update banner");
    }
  };

  const deleteBanner = async (id: number) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;

    try {
      const response = await fetch(`/api/admin/promotions/banners?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete banner");
      }

      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete banner");
    }
  };

  const deleteDetail = async (id: number) => {
    if (!confirm("Are you sure you want to delete this promotion detail?"))
      return;

    try {
      const response = await fetch(`/api/admin/promotions/details?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete promotion detail");
      }

      fetchData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete promotion detail"
      );
    }
  };

  const handleContentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contentForm.title || !contentForm.description) return;

    try {
      const response = await fetch("/api/admin/promotions/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contentForm),
      });

      if (!response.ok) {
        throw new Error("Failed to save content");
      }

      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save content");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Promotion Management</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("banners")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "banners"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Banners
          </button>
          <button
            onClick={() => setActiveTab("details")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "details"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Promotion Details
          </button>
          <button
            onClick={() => setActiveTab("content")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "content"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Content
          </button>
        </nav>
      </div>

      {/* Banner Management */}
      {activeTab === "banners" && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Upload New Banner
            </h3>
            <form onSubmit={handleBannerSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Banner Name
                </label>
                <input
                  type="text"
                  value={bannerForm.name}
                  onChange={(e) =>
                    setBannerForm({ ...bannerForm, name: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 text-gray-900 rounded-md shadow-sm p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Target URL (Optional)
                </label>
                <input
                  type="text"
                  value={bannerForm.targetUrl}
                  onChange={(e) =>
                    setBannerForm({ ...bannerForm, targetUrl: e.target.value })
                  }
                  placeholder="https://example.com or leave blank for /promotion-details"
                  className="mt-1 block w-full border border-gray-300 text-gray-900 rounded-md shadow-sm p-2"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Leave blank to link to the default promotion details page.
                  Enter full URL including https://
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Image File
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setBannerForm({
                      ...bannerForm,
                      file: e.target.files?.[0] || null,
                    })
                  }
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  required
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Upload Banner
              </button>
            </form>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Existing Banners
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {banners.map((banner) => (
                <div
                  key={banner.id}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <div className="relative h-48">
                    <Image
                      src={banner.imageUrl}
                      alt={banner.name}
                      fill
                      className="object-cover"
                    />
                    {banner.isActive && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                        Active
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h4 className="font-medium text-gray-900">{banner.name}</h4>
                    <p className="text-sm text-gray-500">
                      Created: {new Date(banner.createdAt).toLocaleDateString()}
                    </p>
                    {banner.targetUrl ? (
                      <p
                        className="text-xs text-blue-600 mt-1 truncate"
                        title={banner.targetUrl}
                      >
                        🔗 Links to: {banner.targetUrl}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 mt-1">
                        → Default: /promotion-details
                      </p>
                    )}
                    <div className="mt-4 flex space-x-2">
                      <button
                        onClick={() =>
                          toggleBannerActive(banner.id, !banner.isActive)
                        }
                        className={`px-3 py-1 text-sm rounded ${
                          banner.isActive
                            ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            : "bg-green-600 text-white hover:bg-green-700"
                        }`}
                      >
                        {banner.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => deleteBanner(banner.id)}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Promotion Details Management */}
      {activeTab === "details" && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Upload New Promotion Detail
            </h3>
            <form onSubmit={handleDetailSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Detail Name
                </label>
                <input
                  type="text"
                  value={detailForm.name}
                  onChange={(e) =>
                    setDetailForm({ ...detailForm, name: e.target.value })
                  }
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
                  value={detailForm.order}
                  onChange={(e) =>
                    setDetailForm({
                      ...detailForm,
                      order: parseInt(e.target.value) || 0,
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 text-gray-900 rounded-md shadow-sm p-2"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Call to Action URL (Optional)
                </label>
                <input
                  type="text"
                  value={detailForm.targetUrl}
                  onChange={(e) =>
                    setDetailForm({ ...detailForm, targetUrl: e.target.value })
                  }
                  placeholder="https://example.com (optional)"
                  className="mt-1 block w-full border border-gray-300 text-gray-900 rounded-md shadow-sm p-2"
                />
                <p className="mt-1 text-sm text-gray-500">
                  If provided, a button will appear below the image. Leave blank
                  for image-only display.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Image File
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setDetailForm({
                      ...detailForm,
                      file: e.target.files?.[0] || null,
                    })
                  }
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  required
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Upload Detail
              </button>
            </form>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Existing Promotion Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {details.map((detail) => (
                <div
                  key={detail.id}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <div className="relative h-48">
                    <Image
                      src={detail.imageUrl}
                      alt={detail.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h4 className="font-medium text-gray-900">{detail.name}</h4>
                    <p className="text-sm text-gray-500">
                      Order: {detail.order} | Created:{" "}
                      {new Date(detail.createdAt).toLocaleDateString()}
                    </p>
                    {detail.targetUrl && (
                      <p
                        className="text-xs text-blue-600 mt-1 truncate"
                        title={detail.targetUrl}
                      >
                        🔗 Has CTA: {detail.targetUrl}
                      </p>
                    )}
                    <div className="mt-4">
                      <button
                        onClick={() => deleteDetail(detail.id)}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content Management */}
      {activeTab === "content" && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Edit Promotion Content
            </h3>
            <form onSubmit={handleContentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  type="text"
                  value={contentForm.title}
                  onChange={(e) =>
                    setContentForm({ ...contentForm, title: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 text-gray-900 rounded-md shadow-sm p-2"
                  placeholder="Enter promotion title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={contentForm.description}
                  onChange={(e) =>
                    setContentForm({
                      ...contentForm,
                      description: e.target.value,
                    })
                  }
                  rows={4}
                  className="mt-1 block w-full border border-gray-300 text-gray-900 rounded-md shadow-sm p-2"
                  placeholder="Enter promotion description"
                  required
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {content ? "Update Content" : "Save Content"}
              </button>
            </form>
          </div>

          {content && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Current Content Preview
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-xl font-bold text-gray-900 mb-2">
                  {content.title}
                </h4>
                <p className="text-gray-600">{content.description}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Last updated: {new Date(content.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
