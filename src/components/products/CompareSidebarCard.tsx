"use client";

interface CompareSidebarCardProps {
  selectedCount: number;
  maxCount: number;
  selectedLabels: string[];
  canCompare: boolean;
  onClear: () => void;
  onCompare: () => void;
}

function truncateLabel(label: string, maxLength = 28): string {
  if (label.length <= maxLength) return label;
  return `${label.slice(0, maxLength - 1)}…`;
}

export default function CompareSidebarCard({
  selectedCount,
  maxCount,
  selectedLabels,
  canCompare,
  onClear,
  onCompare,
}: CompareSidebarCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Compare</h3>
        <span className="text-xs text-gray-600" aria-live="polite">
          {selectedCount}/{maxCount}
        </span>
      </div>

      {selectedLabels.length > 0 ? (
        <ul className="space-y-1 text-xs text-gray-700">
          {selectedLabels.map((label, index) => (
            <li key={`${label}-${index}`} className="truncate" title={label}>
              {truncateLabel(label)}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-gray-600">Select two items to compare.</p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onClear}
          disabled={selectedCount === 0}
          className="flex-1 bg-gray-100 text-gray-800 px-3 py-2 rounded-md text-sm hover:bg-gray-200 disabled:opacity-50"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={onCompare}
          disabled={!canCompare}
          className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          Compare ({selectedCount}/{maxCount})
        </button>
      </div>
    </div>
  );
}
