"use client";

import { useState, useEffect } from "react";
import CollapsibleSection from "../ui/CollapsibleSection";

// Define keyframes for the fade-in animation
const fadeInKeyframes = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

interface FilterSidebarProps {
  sortOptions: {
    categories: string[];
    manufacturers: string[];
    patterns: string[];
    collections: string[];
    hasQuickShip: boolean;
  };
  selectedCategories: string[];
  selectedManufacturers: string[];
  selectedPatterns: string[];
  selectedCollections: string[];
  selectedQuickShip: boolean;
  onCategoryChange: (category: string) => void;
  onManufacturerChange: (manufacturer: string) => void;
  onPatternChange: (pattern: string) => void;
  onCollectionChange: (collection: string) => void;
  onQuickShipChange: (value: boolean) => void;
  onClearAll: () => void;
  isCategoryPage?: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export default function FilterSidebar({
  sortOptions = {
    categories: [],
    manufacturers: [],
    patterns: [],
    collections: [],
    hasQuickShip: false,
  },
  selectedCategories = [],
  selectedManufacturers = [],
  selectedPatterns = [],
  selectedCollections = [],
  selectedQuickShip = false,
  onCategoryChange,
  onManufacturerChange,
  onPatternChange,
  onCollectionChange,
  onQuickShipChange,
  onClearAll,
  isCategoryPage = false,
  isOpen,
  onClose,
}: FilterSidebarProps) {
  const [categorySearch, setCategorySearch] = useState("");
  const [manufacturerSearch, setManufacturerSearch] = useState("");
  const [collectionSearch, setCollectionSearch] = useState("");
  const [patternSearch, setPatternSearch] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  // Set up mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Set initial value
    checkMobile();

    // Add event listener for window resize
    window.addEventListener("resize", checkMobile);

    // Clean up
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const filterItems = (items: string[] = [], searchTerm: string) => {
    return items.filter((item) =>
      item.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Helper function to normalize strings for comparison
  const normalizeString = (str: string) => str.toLowerCase().trim();

  // Helper function to check if a manufacturer is selected
  const isManufacturerSelected = (manufacturer: string) => {
    const normalizedManufacturer = normalizeString(manufacturer);
    return selectedManufacturers.some((m) => {
      try {
        const decodedValue = atob(m);
        return normalizeString(decodedValue) === normalizedManufacturer;
      } catch {
        // If not base64 encoded, try regular comparison
        return normalizeString(m) === normalizedManufacturer;
      }
    });
  };

  // Helper function to check if a category is selected
  const isCategorySelected = (category: string) => {
    const normalizedCategory = normalizeString(category);
    return selectedCategories.some((c) => {
      try {
        const decodedValue = atob(c);
        return normalizeString(decodedValue) === normalizedCategory;
      } catch {
        // If not base64 encoded, try regular comparison
        return normalizeString(c) === normalizedCategory;
      }
    });
  };

  // Helper function to check if a pattern is selected
  const isPatternSelected = (pattern: string) => {
    const normalizedPattern = normalizeString(pattern);
    return selectedPatterns.some((p) => {
      try {
        const decodedValue = atob(p);
        return normalizeString(decodedValue) === normalizedPattern;
      } catch {
        // If not base64 encoded, try regular comparison
        return normalizeString(p) === normalizedPattern;
      }
    });
  };

  // Helper function to check if a collection is selected
  const isCollectionSelected = (collection: string) => {
    const normalizedCollection = normalizeString(collection);
    return selectedCollections.some((c) => {
      try {
        const decodedValue = atob(c);
        return normalizeString(decodedValue) === normalizedCollection;
      } catch {
        // If not base64 encoded, try regular comparison
        return normalizeString(c) === normalizedCollection;
      }
    });
  };

  const handleClearAll = () => {
    onClearAll();
    // Reset all search states
    setCategorySearch("");
    setManufacturerSearch("");
    setCollectionSearch("");
    setPatternSearch("");
  };

  const FilterContent = () => {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          {(selectedCategories?.length > 0 ||
            selectedManufacturers?.length > 0 ||
            selectedPatterns?.length > 0 ||
            selectedCollections?.length > 0 ||
            selectedQuickShip) && (
            <button
              onClick={handleClearAll}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Clear all
            </button>
          )}
        </div>

        {!isCategoryPage && sortOptions?.categories?.length > 0 && (
          <CollapsibleSection title="PRODUCT CATEGORY" defaultOpen={true}>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Search options"
                className="w-full px-3 py-2 border rounded text-sm text-black placeholder-gray-500"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
              />
              <div className="space-y-2 max-h-60 overflow-y-scroll scrollbar">
                {filterItems(sortOptions?.categories, categorySearch).map(
                  (category) => (
                    <label key={category} className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300"
                        checked={isCategorySelected(category)}
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
        )}

        {sortOptions?.patterns?.length > 0 && (
          <CollapsibleSection title="PATTERNS" defaultOpen={!isMobile}>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Search options"
                className="w-full px-3 py-2 border rounded text-sm text-black placeholder-gray-500"
                value={patternSearch}
                onChange={(e) => setPatternSearch(e.target.value)}
              />
              <div className="space-y-2 max-h-60 overflow-y-scroll scrollbar">
                {filterItems(sortOptions?.patterns, patternSearch).map(
                  (pattern) => (
                    <label key={pattern} className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300"
                        checked={isPatternSelected(pattern)}
                        onChange={() => onPatternChange(pattern)}
                      />
                      <span className="ml-2 text-sm text-black">{pattern}</span>
                    </label>
                  )
                )}
              </div>
            </div>
          </CollapsibleSection>
        )}

        {sortOptions?.collections?.length > 0 && (
          <CollapsibleSection title="COLLECTIONS" defaultOpen={!isMobile}>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Search options"
                className="w-full px-3 py-2 border rounded text-sm text-black placeholder-gray-500"
                value={collectionSearch}
                onChange={(e) => setCollectionSearch(e.target.value)}
              />
              <div className="space-y-2 max-h-60 overflow-y-scroll scrollbar">
                {filterItems(sortOptions?.collections, collectionSearch).map(
                  (collection) => (
                    <label key={collection} className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300"
                        checked={isCollectionSelected(collection)}
                        onChange={() => onCollectionChange(collection)}
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

        {sortOptions?.manufacturers?.length > 0 && (
          <CollapsibleSection title="MANUFACTURER" defaultOpen={!isMobile}>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Search options"
                className="w-full px-3 py-2 border rounded text-sm text-black placeholder-gray-500"
                value={manufacturerSearch}
                onChange={(e) => setManufacturerSearch(e.target.value)}
              />
              <div className="space-y-2 max-h-60 overflow-y-scroll scrollbar">
                {filterItems(
                  sortOptions?.manufacturers,
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
        )}

        <CollapsibleSection title="QUICK SHIP" defaultOpen={!isMobile}>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
                checked={selectedQuickShip}
                onChange={() => onQuickShipChange(!selectedQuickShip)}
              />
              <span className="ml-2 text-sm text-gray-700">
                Quick Ship Available
              </span>
            </label>
          </div>
        </CollapsibleSection>
      </div>
    );
  };

  return (
    <div key="filter-sidebar-container">
      {/* Add keyframes style */}
      <style dangerouslySetInnerHTML={{ __html: fadeInKeyframes }} />

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity duration-300 ease-out"
          onClick={onClose}
          key="mobile-overlay"
          style={{
            opacity: isOpen ? 1 : 0,
            animation: isOpen ? "fadeIn 0.3s ease-out" : "none",
          }}
        />
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0" key="desktop-sidebar">
        <div className="sticky top-[120px]">
          <div className="bg-white rounded-lg shadow-lg p-4 overflow-y-scroll max-h-[calc(100vh-140px)] scrollbar">
            <FilterContent />
          </div>
        </div>
      </div>

      {/* Mobile Slide-out Drawer */}
      <div
        className={`lg:hidden fixed top-0 right-0 h-full w-3/4 max-w-sm bg-white/70 backdrop-blur-sm z-50 transform transition-all duration-300 ease-out ${
          isOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
        } shadow-xl overflow-y-scroll scrollbar`}
        key="mobile-drawer"
        style={{
          willChange: "transform, opacity",
          transition: "transform 0.3s ease-in-out, opacity 0.2s ease-in-out",
        }}
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
