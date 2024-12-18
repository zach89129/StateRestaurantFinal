"use client";

import { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

interface FilterSidebarProps {
  sortOptions: {
    categories: string[];
    manufacturers: string[];
    patterns: string[];
    collections: string[];
    hasStockItems: boolean;
    hasQuickShip: boolean;
  };
  selectedCategories: string[];
  selectedManufacturers: string[];
  selectedTags: string[];
  onCategoryChange: (category: string) => void;
  onManufacturerChange: (manufacturer: string) => void;
  onTagChange: (tag: string) => void;
  onClearAll: () => void;
  isCollectionPage?: boolean;
}

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const CollapsibleSection = ({
  title,
  children,
  defaultOpen = false,
}: CollapsibleSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-200 py-4">
      <button
        className="flex w-full items-center justify-between text-left text-sm font-medium text-gray-900"
        onClick={() => setIsOpen(!isOpen)}
      >
        {title}
        {isOpen ? (
          <ChevronUpIcon className="h-4 w-4" />
        ) : (
          <ChevronDownIcon className="h-4 w-4" />
        )}
      </button>
      {isOpen && <div className="mt-4 space-y-2">{children}</div>}
    </div>
  );
};

export default function FilterSidebar({
  sortOptions,
  selectedCategories,
  selectedManufacturers,
  selectedTags,
  onCategoryChange,
  onManufacturerChange,
  onTagChange,
  onClearAll,
  isCollectionPage = false,
}: FilterSidebarProps) {
  // Helper function to normalize strings for comparison
  const normalizeString = (str: string) => str.trim();

  // Helper function to check if a manufacturer is selected
  const isManufacturerSelected = (manufacturer: string) => {
    const normalizedManufacturer = normalizeString(manufacturer);
    return selectedManufacturers
      .map((m) => decodeURIComponent(m))
      .some((m) => normalizeString(m) === normalizedManufacturer);
  };

  return (
    <div className="bg-white">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900">Filters</h2>
        {(selectedCategories.length > 0 ||
          selectedManufacturers.length > 0 ||
          selectedTags.length > 0) && (
          <button
            onClick={onClearAll}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Clear all
          </button>
        )}
      </div>

      <CollapsibleSection title="STOCK ITEM / QUICK SHIP" defaultOpen={true}>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
              checked={selectedTags.includes("stock-item")}
              onChange={() => onTagChange("stock-item")}
            />
            <span className="ml-2 text-sm text-gray-900">Stock Item</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
              checked={selectedTags.includes("quick-ship")}
              onChange={() => onTagChange("quick-ship")}
            />
            <span className="ml-2 text-sm text-gray-900">Quick Ship</span>
          </label>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="PRODUCT CATEGORY" defaultOpen={true}>
        <div className="space-y-2">
          {sortOptions.categories.map((category) => (
            <label key={category} className="flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                checked={selectedCategories.includes(category)}
                onChange={() => onCategoryChange(category)}
              />
              <span className="ml-2 text-sm text-gray-900">{category}</span>
            </label>
          ))}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="MANUFACTURER" defaultOpen={true}>
        <div className="space-y-2">
          {sortOptions.manufacturers.map((manufacturer) => (
            <label key={manufacturer} className="flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                checked={isManufacturerSelected(manufacturer)}
                onChange={() => onManufacturerChange(manufacturer)}
              />
              <span className="ml-2 text-sm text-gray-900">{manufacturer}</span>
            </label>
          ))}
        </div>
      </CollapsibleSection>

      {!isCollectionPage && sortOptions.collections.length > 0 && (
        <CollapsibleSection title="COLLECTIONS" defaultOpen={true}>
          <div className="space-y-2">
            {sortOptions.collections.map((collection) => (
              <label key={collection} className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                  checked={selectedTags.includes(collection)}
                  onChange={() => onTagChange(collection)}
                />
                <span className="ml-2 text-sm text-gray-900">{collection}</span>
              </label>
            ))}
          </div>
        </CollapsibleSection>
      )}

      <CollapsibleSection title="PATTERNS" defaultOpen={true}>
        <div className="space-y-2">
          {sortOptions.patterns.map((pattern) => (
            <label key={pattern} className="flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                checked={selectedTags.includes(`PATTERN_${pattern}`)}
                onChange={() => onTagChange(`PATTERN_${pattern}`)}
              />
              <span className="ml-2 text-sm text-gray-900">{pattern}</span>
            </label>
          ))}
        </div>
      </CollapsibleSection>
    </div>
  );
}
