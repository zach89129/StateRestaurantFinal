"use client";

import { useState } from "react";
import CollapsibleSection from "../ui/CollapsibleSection";

interface SortOptions {
  categories: string[];
  manufacturers: string[];
  tags: string[];
  patterns: string[];
  collections: string[];
  hasStockItems: boolean;
}

interface VenueFilterSidebarProps {
  sortOptions: SortOptions;
  selectedCategories: string[];
  selectedManufacturers: string[];
  selectedTags: string[];
  onCategoryChange: (category: string) => void;
  onManufacturerChange: (manufacturer: string) => void;
  onTagChange: (tag: string) => void;
  onClearAll: () => void;
  isOpen: boolean;
  onClose: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export default function VenueFilterSidebar({
  sortOptions,
  selectedCategories,
  selectedManufacturers,
  selectedTags,
  onCategoryChange,
  onManufacturerChange,
  onTagChange,
  onClearAll,
  isOpen,
  onClose,
  searchTerm,
  onSearchChange,
}: VenueFilterSidebarProps) {
  const [categorySearch, setCategorySearch] = useState("");
  const [manufacturerSearch, setManufacturerSearch] = useState("");

  const filterItems = (items: string[], searchTerm: string) => {
    return items.filter((item) =>
      item.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Drawer */}
      <div
        className={`fixed top-0 right-0 h-full bg-white w-full max-w-sm z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } shadow-xl overflow-y-auto`}
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

          {/* Search Input */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              {searchTerm && (
                <button
                  onClick={() => onSearchChange("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="h-5 w-5"
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
              )}
            </div>
          </div>

          {/* Filter Content */}
          <div className="space-y-4">
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

            <CollapsibleSection title="CATEGORY" defaultOpen={true}>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Search categories"
                  className="w-full px-3 py-2 border rounded text-sm text-gray-500"
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
                        <span className="ml-2 text-sm text-gray-900">
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
                  placeholder="Search manufacturers"
                  className="w-full px-3 py-2 border rounded text-sm text-gray-500"
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
                        checked={selectedManufacturers.includes(manufacturer)}
                        onChange={() => onManufacturerChange(manufacturer)}
                      />
                      <span className="ml-2 text-sm text-gray-900">
                        {manufacturer}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </CollapsibleSection>

            {sortOptions.hasStockItems && (
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
                    <span className="ml-2 text-sm text-gray-900">
                      Stock Item / Quick Ship
                    </span>
                  </label>
                </div>
              </CollapsibleSection>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
