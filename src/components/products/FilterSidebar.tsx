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
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [manufacturerSearch, setManufacturerSearch] = useState("");
  const [collectionSearch, setCollectionSearch] = useState("");
  const [patternSearch, setPatternSearch] = useState("");

  const filterItems = (items: string[], searchTerm: string) => {
    return items.filter((item) =>
      item.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

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
    <>
      {/* Mobile Filter Button */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
          className="w-full flex items-center justify-between px-4 py-2 bg-white border rounded text-gray-900"
        >
          <span className="font-medium">FILTER BY</span>
          <ChevronDownIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Filter Content - Slide from left */}
      <div
        className={`
          lg:block
          fixed lg:relative
          top-0 left-0 lg:left-auto
          h-full lg:h-auto
          w-80 lg:w-auto
          bg-white
          lg:bg-transparent
          lg:p-0
          transform lg:transform-none
          transition-transform duration-200
          ${isMobileFiltersOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
          z-40
          overflow-y-auto
          shadow-lg lg:shadow-none
        `}
      >
        {/* Mobile Header */}
        <div className="lg:hidden flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-medium text-gray-900">FILTER BY</h2>
          <button
            onClick={() => setIsMobileFiltersOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Filter Content */}
        <div className="p-4 lg:p-0">
          <div className="bg-white">
            <div className="flex items-center justify-between mb-4">
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

            <CollapsibleSection
              title="STOCK ITEM / QUICK SHIP"
              defaultOpen={true}
            >
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300"
                    checked={selectedTags.includes("Stock Item / Quick Ship")}
                    onChange={() => onTagChange("Stock Item / Quick Ship")}
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Stock Item / Quick Ship
                  </span>
                </label>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="PRODUCT CATEGORY" defaultOpen={true}>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Search options"
                  className="w-full px-3 py-2 border rounded text-sm text-black placeholder-gray-500"
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                />
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {filterItems(sortOptions.categories, categorySearch).map(
                    (category) => (
                      <label key={category} className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300"
                          checked={selectedCategories.includes(category)}
                          onChange={() => onCategoryChange(category)}
                        />
                        <span className="ml-2 text-sm text-black">
                          {category}
                        </span>
                      </label>
                    )
                  )}
                </div>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="MANUFACTURER" defaultOpen={true}>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Search options"
                  className="w-full px-3 py-2 border rounded text-sm text-black placeholder-gray-500"
                  value={manufacturerSearch}
                  onChange={(e) => setManufacturerSearch(e.target.value)}
                />
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {filterItems(
                    sortOptions.manufacturers,
                    manufacturerSearch
                  ).map((manufacturer) => (
                    <label key={manufacturer} className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300"
                        checked={isManufacturerSelected(manufacturer)}
                        onChange={() => onManufacturerChange(manufacturer)}
                      />
                      <span className="ml-2 text-sm text-black">
                        {manufacturer}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </CollapsibleSection>

            {!isCollectionPage && sortOptions.collections.length > 0 && (
              <CollapsibleSection title="COLLECTIONS" defaultOpen={true}>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Search options"
                    className="w-full px-3 py-2 border rounded text-sm text-black placeholder-gray-500"
                    value={collectionSearch}
                    onChange={(e) => setCollectionSearch(e.target.value)}
                  />
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {filterItems(sortOptions.collections, collectionSearch).map(
                      (collection) => (
                        <label key={collection} className="flex items-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300"
                            checked={selectedTags.includes(collection)}
                            onChange={() => onTagChange(collection)}
                          />
                          <span className="ml-2 text-sm text-black">
                            {collection}
                          </span>
                        </label>
                      )
                    )}
                  </div>
                </div>
              </CollapsibleSection>
            )}

            <CollapsibleSection title="PATTERNS" defaultOpen={true}>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Search options"
                  className="w-full px-3 py-2 border rounded text-sm text-black placeholder-gray-500"
                  value={patternSearch}
                  onChange={(e) => setPatternSearch(e.target.value)}
                />
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {filterItems(sortOptions.patterns, patternSearch).map(
                    (pattern) => (
                      <label key={pattern} className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300"
                          checked={selectedTags.includes(`PATTERN_${pattern}`)}
                          onChange={() => onTagChange(`PATTERN_${pattern}`)}
                        />
                        <span className="ml-2 text-sm text-black">
                          {pattern}
                        </span>
                      </label>
                    )
                  )}
                </div>
              </div>
            </CollapsibleSection>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileFiltersOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-25 lg:hidden z-30"
          onClick={() => setIsMobileFiltersOpen(false)}
        />
      )}
    </>
  );
}
