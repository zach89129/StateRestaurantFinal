"use client";

import { useState } from "react";
import CollapsibleSection from "../ui/CollapsibleSection";

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
  isOpen: boolean;
  onClose: () => void;
}

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
  isOpen,
  onClose,
}: FilterSidebarProps) {
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

  const FilterContent = () => (
    <div>
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
                  <span className="ml-2 text-sm text-black">{category}</span>
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
            {filterItems(sortOptions.manufacturers, manufacturerSearch).map(
              (manufacturer) => (
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
              )
            )}
          </div>
        </div>
      </CollapsibleSection>

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
            {filterItems(sortOptions.patterns, patternSearch).map((pattern) => (
              <label key={pattern} className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                  checked={selectedTags.includes(`PATTERN_${pattern}`)}
                  onChange={() => onTagChange(`PATTERN_${pattern}`)}
                />
                <span className="ml-2 text-sm text-black">{pattern}</span>
              </label>
            ))}
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="STOCK ITEM / QUICK SHIP" defaultOpen={true}>
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
    </div>
  );

  return (
    <div key="filter-sidebar-container">
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity"
          onClick={onClose}
          key="mobile-overlay"
        />
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0" key="desktop-sidebar">
        <div className="sticky top-[120px]">
          <div className="bg-white rounded-lg shadow-lg p-4 overflow-y-auto max-h-[calc(100vh-140px)]">
            <FilterContent />
          </div>
        </div>
      </div>

      {/* Mobile Slide-out Drawer */}
      <div
        className={`lg:hidden fixed top-0 right-0 h-full w-3/4 max-w-sm bg-white/70 backdrop-blur-sm z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } shadow-xl overflow-y-auto`}
        key="mobile-drawer"
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <svg
                className="w-6 h-6 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
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
          <FilterContent />
        </div>
      </div>
    </div>
  );
}
