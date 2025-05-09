import React, { useState } from "react";
import { Dialog } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { CartItem, Venue } from "@/types/cart";

interface QuoteVenueAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteItems: CartItem[];
  venues: Venue[];
  onSubmit: (assignments: Record<string, string>) => void;
}

export function QuoteVenueAssignmentModal({
  isOpen,
  onClose,
  quoteItems,
  venues,
  onSubmit,
}: QuoteVenueAssignmentModalProps) {
  // Initialize assignments with each quote item assigned to the first venue
  const [assignments, setAssignments] = useState<Record<string, string>>(() => {
    const initialAssignments: Record<string, string> = {};
    if (venues.length > 0) {
      quoteItems.forEach((item) => {
        initialAssignments[item.id] = venues[0].trxVenueId.toString();
      });
    }
    return initialAssignments;
  });

  const [preview, setPreview] = useState(false);

  const handleChange = (itemId: string, venueId: string) => {
    setAssignments((prev) => ({
      ...prev,
      [itemId]: venueId,
    }));
  };

  const handleSubmit = () => {
    onSubmit(assignments);
    onClose();
  };

  const togglePreview = () => {
    setPreview(!preview);
  };

  // Group items by assigned venue for preview
  const itemsByVenue = preview
    ? Object.entries(assignments).reduce(
        (acc: Record<string, CartItem[]>, [itemId, venueId]) => {
          const item = quoteItems.find((i) => i.id === itemId);
          if (!item) return acc;

          if (!acc[venueId]) {
            acc[venueId] = [];
          }
          acc[venueId].push(item);
          return acc;
        },
        {}
      )
    : {};

  // Get venue name from venue ID
  const getVenueName = (venueId: string) => {
    const venue = venues.find((v) => v.trxVenueId.toString() === venueId);
    return venue ? venue.venueName : "Unknown Venue";
  };

  if (quoteItems.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-3xl rounded bg-white p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <Dialog.Title className="text-lg font-medium text-gray-900">
                {preview
                  ? "Preview Quote Assignments"
                  : "Assign Quotes to Venues"}
              </Dialog.Title>
              <button
                type="button"
                className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                onClick={onClose}
              >
                <span className="sr-only">Close</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>

            {!preview ? (
              <div className="mt-4 space-y-4">
                <p className="text-sm text-gray-500">
                  Please assign each quote item to a venue. This will help us
                  process your quotes more efficiently.
                </p>

                <div className="overflow-auto max-h-[400px]">
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
                          Venue
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {quoteItems.map((item) => (
                        <tr key={item.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.title} (SKU: {item.sku})
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <select
                              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                              value={assignments[item.id] || ""}
                              onChange={(e) =>
                                handleChange(item.id, e.target.value)
                              }
                            >
                              {venues.map((venue) => (
                                <option
                                  key={venue.trxVenueId}
                                  value={venue.trxVenueId.toString()}
                                >
                                  {venue.venueName}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <p className="text-sm text-gray-500">
                  Review your quote assignments before submitting.
                </p>

                <div className="overflow-auto max-h-[400px]">
                  {Object.entries(itemsByVenue).map(([venueId, items]) => (
                    <div key={venueId} className="mb-6">
                      <h3 className="text-md font-medium text-gray-900 mb-2">
                        {getVenueName(venueId)}
                      </h3>
                      <ul className="list-disc pl-5 space-y-1">
                        {items.map((item) => (
                          <li key={item.id} className="text-sm text-gray-600">
                            {item.title} (SKU: {item.sku}) - Qty:{" "}
                            {item.quantity}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-between">
              <button
                type="button"
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                onClick={togglePreview}
              >
                {preview ? "Edit Assignments" : "Preview"}
              </button>

              <button
                type="button"
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                onClick={handleSubmit}
              >
                {preview ? "Confirm & Submit" : "Submit"}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
}
