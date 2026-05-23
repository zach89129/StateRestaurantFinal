"use client";

import { useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import {
  compareValuesDiffer,
  DEFAULT_COMPARE_FIELDS,
  formatFieldValue,
  shouldShowCompareRow,
} from "@/lib/compare";
import { ComparableProduct, CompareFieldConfig } from "@/types/compare";

interface ProductCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: [ComparableProduct, ComparableProduct];
  fields?: CompareFieldConfig[];
}

function CompareImage({ product }: { product: ComparableProduct }) {
  if (product.imageUrl) {
    return (
      <img
        src={product.imageUrl}
        alt={product.title}
        className="w-full h-32 object-contain rounded border border-gray-200 bg-white"
      />
    );
  }

  return (
    <div className="w-full h-32 rounded border border-gray-200 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
      No image
    </div>
  );
}

export default function ProductCompareModal({
  isOpen,
  onClose,
  products,
  fields = DEFAULT_COMPARE_FIELDS,
}: ProductCompareModalProps) {
  const [left, right] = products;

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const visibleFields = fields.filter((field) =>
    shouldShowCompareRow(left, right, field.key, field.format)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-5xl max-h-[90vh] mx-4 bg-white rounded-lg shadow-xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Compare items</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <CompareImage product={left} />
            <CompareImage product={right} />
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-md">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-100 text-gray-800">
                <tr>
                  <th className="px-4 py-2 text-left w-36">Attribute</th>
                  <th className="px-4 py-2 text-left">{left.title}</th>
                  <th className="px-4 py-2 text-left">{right.title}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {visibleFields.map((field) => {
                  const leftValue = formatFieldValue(left, field.key, field.format);
                  const rightValue = formatFieldValue(right, field.key, field.format);
                  const differs = compareValuesDiffer(leftValue, rightValue);
                  const rowClass = differs ? "bg-amber-50" : "bg-white";
                  const cellClass = differs ? "font-semibold text-gray-900" : "text-gray-900";

                  return (
                    <tr key={field.label} className={rowClass}>
                      <td className="px-4 py-3 font-medium text-gray-700 align-top">
                        {field.label}
                      </td>
                      <td className={`px-4 py-3 align-top ${cellClass}`}>{leftValue}</td>
                      <td className={`px-4 py-3 align-top ${cellClass}`}>{rightValue}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
