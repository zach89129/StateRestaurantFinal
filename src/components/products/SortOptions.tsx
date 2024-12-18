"use client";

interface SortOptionsProps {
  onSortChange: (sort: string) => void;
  currentSort: string;
  onClear: () => void;
}

export default function SortOptions({
  onSortChange,
  currentSort,
  onClear,
}: SortOptionsProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
      <select
        value={currentSort}
        onChange={(e) => onSortChange(e.target.value)}
        className="w-full sm:w-auto border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
      >
        <option value="">Name (A-Z)</option>
        <option value="title:desc">Name (Z-A)</option>
        <option value="manufacturer:asc">Manufacturer (A-Z)</option>
        <option value="manufacturer:desc">Manufacturer (Z-A)</option>
        <option value="sku:asc">SKU (A-Z)</option>
        <option value="sku:desc">SKU (Z-A)</option>
      </select>
      {currentSort && (
        <button
          onClick={onClear}
          className="text-sm text-gray-900 hover:text-gray-600 px-2 py-1"
        >
          Clear
        </button>
      )}
    </div>
  );
}
