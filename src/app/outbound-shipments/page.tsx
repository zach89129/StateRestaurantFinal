"use client";

import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import Link from "next/link";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { PageContainer } from "@/components/ui/PageContainer";
import { MessageBox } from "@/components/ui/MessageBox";
import {
  filterOutboundShipments,
  type OutboundShipmentListItem,
} from "@/lib/outbound-shipments/filter";
import {
  MAX_OUTBOUND_SHIPMENT_IMAGE_BYTES,
  MAX_OUTBOUND_SHIPMENT_IMAGES,
  MAX_OUTBOUND_SHIPMENT_UPLOAD_BYTES,
} from "@/lib/outbound-shipments/constants";
import { compressOutboundShipmentImages } from "@/lib/outbound-shipments/compressImage";
import { isAllowedOutboundShipmentImage } from "@/lib/outbound-shipments/imageValidation";

type ShipmentImage = {
  id: number;
  contentType: string | null;
  createdAt: string;
};

type ShipmentDetail = OutboundShipmentListItem & {
  images: ShipmentImage[];
};

export default function OutboundShipmentsPage() {
  const { data: session, status } = useSession();
  const [shipments, setShipments] = useState<OutboundShipmentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<ShipmentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const loadShipments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/outbound-shipments");
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to load shipments");
      }
      setShipments(data.shipments);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load shipments"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.isSalesTeam) {
      void loadShipments();
    }
  }, [status, session?.user?.isSalesTeam, loadShipments]);

  useEffect(() => {
    if (selectedId == null) {
      setDetail(null);
      setDetailError(null);
      return;
    }

    let active = true;
    setDetailLoading(true);
    setDetailError(null);

    fetch(`/api/outbound-shipments/${selectedId}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to load shipment");
        }
        if (active) {
          setDetail(data.shipment);
        }
      })
      .catch((err) => {
        if (active) {
          setDetailError(
            err instanceof Error ? err.message : "Failed to load shipment"
          );
        }
      })
      .finally(() => {
        if (active) setDetailLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedId]);

  useEffect(() => {
    if (selectedId == null) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedId(null);
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [selectedId]);

  const filteredShipments = useMemo(
    () => filterOutboundShipments(shipments, filterQuery),
    [shipments, filterQuery]
  );

  const filePreview = useMemo(
    () =>
      files.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
      })),
    [files]
  );

  useEffect(() => {
    return () => {
      filePreview.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [filePreview]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    setFormError(null);

    if (selected.length > MAX_OUTBOUND_SHIPMENT_IMAGES) {
      setFormError(
        `A maximum of ${MAX_OUTBOUND_SHIPMENT_IMAGES} images is allowed`
      );
      event.target.value = "";
      return;
    }

    for (const file of selected) {
      if (!isAllowedOutboundShipmentImage(file)) {
        setFormError("Only non-SVG image files are allowed (JPG, PNG, etc.)");
        event.target.value = "";
        return;
      }
      if (file.size > MAX_OUTBOUND_SHIPMENT_IMAGE_BYTES) {
        setFormError("Each image must be 5MB or smaller before upload");
        event.target.value = "";
        return;
      }
    }

    setFiles(selected);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!customerName.trim() || !invoiceNumber.trim()) {
      setFormError("Customer name and invoice number are required");
      return;
    }

    setSubmitting(true);
    try {
      const imagesToUpload =
        files.length > 0 ? await compressOutboundShipmentImages(files) : [];

      const totalBytes = imagesToUpload.reduce(
        (sum, file) => sum + file.size,
        0
      );
      if (totalBytes > MAX_OUTBOUND_SHIPMENT_UPLOAD_BYTES) {
        throw new Error(
          "Images are still too large after compression. Please use fewer photos."
        );
      }

      const formData = new FormData();
      formData.append("customerName", customerName.trim());
      formData.append("invoiceNumber", invoiceNumber.trim());
      for (const file of imagesToUpload) {
        formData.append("images", file);
      }

      const response = await fetch("/api/outbound-shipments", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to create shipment");
      }

      setCustomerName("");
      setInvoiceNumber("");
      setFiles([]);
      setFormSuccess("Outbound shipment created");
      await loadShipments();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to create shipment"
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "loading") {
    return (
      <PageContainer title="Outbound Shipments">
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900" />
        </div>
      </PageContainer>
    );
  }

  if (status === "unauthenticated") {
    return (
      <PageContainer title="Outbound Shipments">
        <MessageBox type="warning">
          Please{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            log in
          </Link>{" "}
          to view outbound shipments.
        </MessageBox>
      </PageContainer>
    );
  }

  if (!session?.user?.isSalesTeam) {
    return (
      <PageContainer title="Outbound Shipments">
        <MessageBox type="error">
          This page is only available to sales team members.
        </MessageBox>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Outbound Shipments" className="!p-4 sm:!p-8">
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Create outbound shipment
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
          <div>
            <label
              htmlFor="customerName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Customer name
            </label>
            <input
              id="customerName"
              type="text"
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
              autoComplete="organization"
              required
            />
          </div>
          <div>
            <label
              htmlFor="invoiceNumber"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Invoice number
            </label>
            <input
              id="invoiceNumber"
              type="text"
              value={invoiceNumber}
              onChange={(event) => setInvoiceNumber(event.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
              required
            />
          </div>
          <div>
            <label
              htmlFor="createdByEmail"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Submitted by
            </label>
            <input
              id="createdByEmail"
              type="email"
              value={session.user.email}
              readOnly
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-gray-600 bg-gray-50"
            />
          </div>
          <div>
            <label
              htmlFor="images"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Images
            </label>
            <input
              id="images"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.gif,.heic,.heif"
              capture="environment"
              multiple
              onChange={handleFileChange}
              className="w-full text-sm text-gray-700"
            />
            <p className="mt-1 text-xs text-gray-500">
              Up to {MAX_OUTBOUND_SHIPMENT_IMAGES} images. Photos are compressed
              before upload. SVG files are not allowed. On mobile, you can take
              a photo.
            </p>
            {filePreview.length > 0 && (
              <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
                {filePreview.map((preview) => (
                  <div
                    key={preview.url}
                    className="aspect-square overflow-hidden rounded border border-gray-200 bg-gray-50"
                  >
                    <img
                      src={preview.url}
                      alt={preview.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          {formError && <MessageBox type="error">{formError}</MessageBox>}
          {formSuccess && <MessageBox type="success">{formSuccess}</MessageBox>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto bg-zinc-800 text-white px-5 py-2.5 rounded-md hover:bg-zinc-700 disabled:opacity-60"
          >
            {submitting ? "Compressing & saving..." : "Create shipment"}
          </button>
        </form>
      </section>

      <section>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Recent shipments
          </h2>
          <input
            type="search"
            value={filterQuery}
            onChange={(event) => setFilterQuery(event.target.value)}
            placeholder="Filter by customer, invoice, email, date"
            className="w-full sm:max-w-sm border border-gray-300 rounded-md px-3 py-2 text-gray-900"
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        ) : error ? (
          <MessageBox type="error">{error}</MessageBox>
        ) : filteredShipments.length === 0 ? (
          <p className="text-gray-500">No outbound shipments found.</p>
        ) : (
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Invoice</th>
                  <th className="px-4 py-3 font-medium">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {filteredShipments.map((shipment) => (
                  <tr
                    key={shipment.id}
                    className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedId(shipment.id)}
                  >
                    <td className="px-4 py-3 text-gray-900">
                      {shipment.customerName}
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      {shipment.invoiceNumber}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {format(
                        new Date(shipment.createdAt),
                        "MMM d, yyyy h:mm a"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedId != null && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSelectedId(null)}
            aria-hidden
          />
          <div className="relative z-10 w-full sm:max-w-3xl max-h-[92vh] sm:mx-4 bg-white rounded-t-xl sm:rounded-lg shadow-xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Shipment details
              </h3>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="p-2 text-gray-500 hover:text-gray-800"
                aria-label="Close"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="overflow-y-auto p-4 sm:p-6">
              {detailLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                </div>
              ) : detailError ? (
                <MessageBox type="error">{detailError}</MessageBox>
              ) : detail ? (
                <div className="space-y-4">
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-gray-500">Customer</dt>
                      <dd className="font-medium text-gray-900">
                        {detail.customerName}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Invoice</dt>
                      <dd className="font-medium text-gray-900">
                        {detail.invoiceNumber}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Submitted by</dt>
                      <dd className="font-medium text-gray-900">
                        {detail.createdByEmail}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Submitted at</dt>
                      <dd className="font-medium text-gray-900">
                        {format(
                          new Date(detail.createdAt),
                          "MMM d, yyyy h:mm a"
                        )}
                      </dd>
                    </div>
                  </dl>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Images
                    </h4>
                    {detail.images.length === 0 ? (
                      <p className="text-gray-500 text-sm">No images attached.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {detail.images.map((image) => (
                          <a
                            key={image.id}
                            href={`/api/outbound-shipments/images/${image.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="block overflow-hidden rounded border border-gray-200 bg-gray-50"
                          >
                            <img
                              src={`/api/outbound-shipments/images/${image.id}`}
                              alt={`Shipment image ${image.id}`}
                              className="w-full h-auto object-contain max-h-80"
                            />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
