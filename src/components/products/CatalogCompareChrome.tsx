"use client";

import CompareSidebarCard from "./CompareSidebarCard";
import ProductCompareModal from "./ProductCompareModal";
import { useCompare } from "@/contexts/CompareContext";
import { CATALOG_COMPARE_FIELDS } from "@/lib/compare";

export function CatalogCompareSidebar() {
  const compare = useCompare();
  if (!compare) return null;

  return (
    <div className="hidden lg:block w-64 flex-shrink-0 mb-4">
      <CompareSidebarCard
        selectedCount={compare.selectedCount}
        minCount={compare.minCount}
        maxCount={compare.maxCount}
        selectedLabels={compare.selectedLabels}
        canCompare={compare.canCompare}
        onClear={compare.clear}
        onCompare={compare.openModal}
      />
    </div>
  );
}

export function CatalogCompareMobileBar() {
  const compare = useCompare();
  if (!compare || compare.selectedCount === 0) return null;

  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-gray-200 bg-white shadow-lg px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-900">
            Compare ({compare.selectedCount}/{compare.maxCount})
          </p>
          <p className="text-xs text-gray-600 truncate">
            {compare.selectedLabels.join(" · ")}
          </p>
        </div>
        <button
          type="button"
          onClick={compare.clear}
          className="flex-shrink-0 bg-gray-100 text-gray-800 px-3 py-2 rounded-md text-sm hover:bg-gray-200"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={compare.openModal}
          disabled={!compare.canCompare}
          className="flex-shrink-0 bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          Compare
        </button>
      </div>
    </div>
  );
}

export function CatalogCompareModal() {
  const compare = useCompare();
  if (!compare || !compare.showModal || compare.compareProducts.length < 2) {
    return null;
  }

  return (
    <ProductCompareModal
      isOpen={compare.showModal}
      onClose={compare.closeModal}
      products={compare.compareProducts}
      fields={CATALOG_COMPARE_FIELDS}
    />
  );
}

export function CatalogCompareBottomSpacer() {
  const compare = useCompare();
  if (!compare || compare.selectedCount === 0) return null;
  return <div className="h-24 lg:hidden" aria-hidden />;
}
