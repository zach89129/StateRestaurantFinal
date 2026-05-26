"use client";

import { useCallback, useEffect, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import CompareManufacturerDetailsCell from "./CompareManufacturerDetailsCell";
import ComparePriceCell from "./ComparePriceCell";
import {
  compareFieldValuesDiffer,
  DEFAULT_COMPARE_FIELDS,
  formatFieldValue,
  shouldShowCompareRow,
} from "@/lib/compare";
import { formatComparePriceDisplay } from "@/lib/comparePricing";
import { ComparableProduct, CompareFieldConfig } from "@/types/compare";

interface ProductCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ComparableProduct[];
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
  const [priceDisplayByProductId, setPriceDisplayByProductId] = useState<
    Record<number, string>
  >({});

  const handlePriceChange = useCallback(
    (productId: number, displayValue: string) => {
      setPriceDisplayByProductId((prev) => {
        if (prev[productId] === displayValue) return prev;
        return { ...prev, [productId]: displayValue };
      });
    },
    []
  );

  useEffect(() => {
    if (!isOpen) {
      setPriceDisplayByProductId({});
      return;
    }

    const initial: Record<number, string> = {};
    for (const product of products) {
      if (product.price != null) {
        initial[product.id] = formatComparePriceDisplay(
          product.price,
          product.uom
        );
      }
    }
    setPriceDisplayByProductId(initial);
  }, [isOpen, products]);

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

  if (!isOpen || products.length < 2) return null;

  const visibleFields = fields.filter((field) =>
    shouldShowCompareRow(products, field.key, field.format)
  );

  const productColCount = products.length;

  const getPriceDisplayValue = (product: ComparableProduct): string => {
    if (priceDisplayByProductId[product.id]) {
      return priceDisplayByProductId[product.id];
    }
    if (product.price != null) {
      return formatComparePriceDisplay(product.price, product.uom);
    }
    return "Quote";
  };

  const renderFieldRow = (field: CompareFieldConfig) => {
    const values = products.map((product) =>
      formatFieldValue(product, field.key, field.format)
    );
    const differs = compareFieldValuesDiffer(values);
    const rowClass = differs ? "bg-amber-50" : "bg-white";
    const cellClass = differs ? "font-semibold text-gray-900" : "text-gray-900";

    return (
      <tr key={field.label} className={rowClass}>
        <td className="px-4 py-3 font-medium text-gray-700 align-top border-b border-gray-200">
          {field.label}
        </td>
        {values.map((value, index) => (
          <td
            key={`${field.label}-${products[index].id}`}
            className={`px-4 py-3 align-top break-words border-b border-gray-200 ${cellClass}`}
          >
            {value}
          </td>
        ))}
      </tr>
    );
  };

  const renderPriceRow = () => {
    const values = products.map((product) => getPriceDisplayValue(product));
    const differs = compareFieldValuesDiffer(values);
    const rowClass = differs ? "bg-amber-50" : "bg-white";
    const cellClass = differs ? "font-semibold text-gray-900" : "text-gray-900";

    return (
      <tr key="price" className={rowClass}>
        <td className="px-4 py-3 font-medium text-gray-700 align-top border-b border-gray-200">
          Price
        </td>
        {products.map((product) => (
          <td
            key={`price-${product.id}`}
            className={`px-4 py-3 align-top border-b border-gray-200 ${cellClass}`}
          >
            <ComparePriceCell
              product={product}
              onPriceChange={handlePriceChange}
            />
          </td>
        ))}
      </tr>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-7xl max-h-[90vh] mx-4 bg-white rounded-lg shadow-xl overflow-hidden flex flex-col min-h-0">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">Compare items</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-6">
          <div className="overflow-x-auto border border-gray-200 rounded-md">
            <table className="w-full table-fixed text-sm border-collapse">
              <colgroup>
                <col className="w-36" />
                {Array.from({ length: productColCount }).map((_, index) => (
                  <col key={index} />
                ))}
              </colgroup>
              <thead className="bg-gray-100 text-gray-800">
                <tr>
                  <th className="px-4 py-2 text-left border-b border-gray-200">Attribute</th>
                  {products.map((product) => (
                    <th
                      key={product.id}
                      className="px-4 py-2 text-left border-b border-gray-200 truncate"
                      title={product.title}
                    >
                      {product.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white">
                  <td className="px-4 py-4 border-b border-gray-200 align-top" />
                  {products.map((product) => (
                    <td
                      key={product.id}
                      className="px-4 py-4 border-b border-gray-200 align-top"
                    >
                      <CompareImage product={product} />
                    </td>
                  ))}
                </tr>
                {visibleFields.map((field) => {
                  if (field.key === "priceDisplay") {
                    return renderPriceRow();
                  }
                  return renderFieldRow(field);
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-8">
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              Manufacturer Details
            </h3>
            <div className="overflow-x-auto border border-gray-200 rounded-md">
              <table className="w-full table-fixed text-sm border-collapse">
                <colgroup>
                  <col className="w-36" />
                  {Array.from({ length: productColCount }).map((_, index) => (
                    <col key={index} />
                  ))}
                </colgroup>
                <tbody>
                  <tr className="bg-white">
                    <td className="px-4 py-3 font-medium text-gray-700 align-top border-b border-gray-200">
                      More details
                    </td>
                    {products.map((product) => (
                      <td
                        key={product.id}
                        className="px-4 py-4 align-top border-b border-gray-200"
                      >
                        <CompareManufacturerDetailsCell product={product} enabled={isOpen} />
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <p className="text-xs text-blue-800">
                <strong>Disclaimer:</strong> Manufacturer information was gathered using
                OpenAI technology. Please verify any information with the manufacturer or
                reach out to the State Restaurant sales team for more information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
