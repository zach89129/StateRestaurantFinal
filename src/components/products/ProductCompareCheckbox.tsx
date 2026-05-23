"use client";

import { useCompare } from "@/contexts/CompareContext";
import { CatalogCompareSource } from "@/lib/catalogCompare";

interface ProductCompareCheckboxProps {
  product: CatalogCompareSource;
}

export default function ProductCompareCheckbox({
  product,
}: ProductCompareCheckboxProps) {
  const compare = useCompare();
  if (!compare) return null;

  const productId = Number(product.trx_product_id);
  const checked = compare.selectedIds.includes(productId);
  const disabled = compare.isDisabled(productId);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled && !checked) return;
    compare.toggleProduct(product);
  };

  return (
    <div
      role="checkbox"
      aria-checked={checked}
      aria-label={`Compare ${product.title}`}
      aria-disabled={disabled}
      tabIndex={disabled && !checked ? -1 : 0}
      onClick={handleToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleToggle(e as unknown as React.MouseEvent);
        }
      }}
      className={`compare-checkbox absolute top-1 right-1 z-10 flex items-center justify-center w-7 h-7 rounded border-2 shadow-sm cursor-pointer ${
        checked
          ? "bg-blue-600 border-blue-600 text-white"
          : "bg-white border-gray-600 text-transparent"
      } ${disabled && !checked ? "opacity-40 cursor-not-allowed" : "hover:border-blue-500"}`}
    >
      <svg
        viewBox="0 0 20 20"
        fill="currentColor"
        className="w-4 h-4"
        aria-hidden
      >
        <path
          fillRule="evenodd"
          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  );
}
