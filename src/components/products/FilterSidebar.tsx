"use client";

import { useState, useEffect, useCallback, memo } from "react";
import CollapsibleSection from "../ui/CollapsibleSection";

// Add custom scrollbar styles at the top of the component
// ... existing code ...

// Define keyframes for the fade-in animation and scrollbar styles
const fadeInKeyframes = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  /* Custom scrollbar styles - always visible */
  .custom-scrollbar {
    overflow-y: scroll !important; /* Force scrollbar to always show */
    scrollbar-width: thin;
    scrollbar-color: #bbb #f1f1f1;
  }
  
  .custom-scrollbar::-webkit-scrollbar {
    width: 10px;
    height: 10px;
    display: block;
    background-color: #f1f1f1;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #bbb;
    border-radius: 4px;
    min-height: 40px; /* Ensure the thumb has a minimum size */
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #999;
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
  selectedCloseOut: boolean;
  onCategoryChange: (category: string) => void;
  onManufacturerChange: (manufacturer: string) => void;
  onPatternChange: (pattern: string) => void;
  onCollectionChange: (collection: string) => void;
  onQuickShipChange: (value: boolean) => void;
  onCloseOutChange: (value: boolean) => void;
  onClearAll: () => void;
  isCategoryPage?: boolean;
  isOpen: boolean;
  onClose: () => void;
}

// Define a separate interface for the FilterContent component
interface FilterContentProps {
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
  selectedCloseOut: boolean;
  onCategoryChange: (category: string) => void;
  onManufacturerChange: (manufacturer: string) => void;
  onPatternChange: (pattern: string) => void;
  onCollectionChange: (collection: string) => void;
  onQuickShipChange: (value: boolean) => void;
  onCloseOutChange: (value: boolean) => void;
  onClearAll: () => void;
  isCategoryPage?: boolean;
  isMobile: boolean;
}

// Lift the FilterContent component outside the main component and memoize it
const FilterContent = memo(function FilterContent({
  sortOptions,
  selectedCategories,
  selectedManufacturers,
  selectedPatterns,
  selectedCollections,
  selectedQuickShip,
  selectedCloseOut,
  onCategoryChange,
  onManufacturerChange,
  onPatternChange,
  onCollectionChange,
  onQuickShipChange,
  onCloseOutChange,
  onClearAll,
  isCategoryPage = false,
  isMobile,
}: FilterContentProps) {
  const [categorySearch, setCategorySearch] = useState("");
  const [manufacturerSearch, setManufacturerSearch] = useState("");
  const [collectionSearch, setCollectionSearch] = useState("");
  const [patternSearch, setPatternSearch] = useState("");

  // Helper function to normalize strings for comparison
  const normalizeString = (str: string) => str.toLowerCase().trim();

  const filterItems = useCallback(
    (items: string[] = [], searchTerm: string) => {
      return items.filter((item) =>
        item.toLowerCase().includes(searchTerm.toLowerCase())
      );
    },
    []
  );

  // Helper function to check if a manufacturer is selected
  const isManufacturerSelected = useCallback(
    (manufacturer: string) => {
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
    },
    [selectedManufacturers]
  );

  // Helper function to check if a category is selected
  const isCategorySelected = useCallback(
    (category: string) => {
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
    },
    [selectedCategories]
  );

  // Helper function to check if a pattern is selected
  const isPatternSelected = useCallback(
    (pattern: string) => {
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
    },
    [selectedPatterns]
  );

  // Helper function to check if a collection is selected
  const isCollectionSelected = useCallback(
    (collection: string) => {
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
    },
    [selectedCollections]
  );

  const handleClearAll = () => {
    onClearAll();
    // Reset all search states
    setCategorySearch("");
    setManufacturerSearch("");
    setCollectionSearch("");
    setPatternSearch("");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        {(selectedCategories?.length > 0 ||
          selectedManufacturers?.length > 0 ||
          selectedPatterns?.length > 0 ||
          selectedCollections?.length > 0 ||
          selectedQuickShip ||
          selectedCloseOut) && (
          <button
            onClick={handleClearAll}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Clear all
          </button>
        )}
      </div>

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

      <CollapsibleSection title="CLOSE OUT ITEMS" defaultOpen={!isMobile}>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300"
              checked={selectedCloseOut}
              onChange={() => onCloseOutChange(!selectedCloseOut)}
            />
            <span className="ml-2 text-sm text-gray-700">Close Out Items</span>
          </label>
        </div>
      </CollapsibleSection>

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
            <div className="space-y-2 min-h-[120px] max-h-48 custom-scrollbar">
              {filterItems(sortOptions?.categories, categorySearch).map(
                (category) => (
                  <label key={category} className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300"
                      checked={isCategorySelected(category)}
                      onChange={() => onCategoryChange(category)}
                    />
                    <span className="ml-2 text-sm text-black">{category}</span>
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
            <div className="space-y-2 min-h-[120px] max-h-48 custom-scrollbar">
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
            <div className="space-y-2 min-h-[120px] max-h-48 custom-scrollbar">
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
            <div className="space-y-2 min-h-[120px] max-h-48 custom-scrollbar">
              {filterItems(sortOptions?.manufacturers, manufacturerSearch).map(
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
      )}
    </div>
  );
});

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
  selectedCloseOut = false,
  onCategoryChange,
  onManufacturerChange,
  onPatternChange,
  onCollectionChange,
  onQuickShipChange,
  onCloseOutChange,
  onClearAll,
  isCategoryPage = false,
  isOpen,
  onClose,
}: FilterSidebarProps) {
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

      {/* Desktop Sidebar - Position static so it scrolls with page */}
      <div
        className="hidden lg:block w-64 flex-shrink-0 static"
        key="desktop-sidebar"
      >
        <div className="bg-white rounded-lg shadow-lg p-4">
          <FilterContent
            sortOptions={sortOptions}
            selectedCategories={selectedCategories}
            selectedManufacturers={selectedManufacturers}
            selectedPatterns={selectedPatterns}
            selectedCollections={selectedCollections}
            selectedQuickShip={selectedQuickShip}
            selectedCloseOut={selectedCloseOut}
            onCategoryChange={onCategoryChange}
            onManufacturerChange={onManufacturerChange}
            onPatternChange={onPatternChange}
            onCollectionChange={onCollectionChange}
            onQuickShipChange={onQuickShipChange}
            onCloseOutChange={onCloseOutChange}
            onClearAll={onClearAll}
            isCategoryPage={isCategoryPage}
            isMobile={isMobile}
          />
        </div>
      </div>

      {/* Mobile Slide-out Drawer */}
      <div
        className={`lg:hidden fixed top-0 right-0 h-full w-3/4 max-w-sm bg-white/70 backdrop-blur-sm z-50 transform transition-all duration-300 ease-out ${
          isOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
        } shadow-xl custom-scrollbar`}
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
          <FilterContent
            sortOptions={sortOptions}
            selectedCategories={selectedCategories}
            selectedManufacturers={selectedManufacturers}
            selectedPatterns={selectedPatterns}
            selectedCollections={selectedCollections}
            selectedQuickShip={selectedQuickShip}
            selectedCloseOut={selectedCloseOut}
            onCategoryChange={onCategoryChange}
            onManufacturerChange={onManufacturerChange}
            onPatternChange={onPatternChange}
            onCollectionChange={onCollectionChange}
            onQuickShipChange={onQuickShipChange}
            onCloseOutChange={onCloseOutChange}
            onClearAll={onClearAll}
            isCategoryPage={isCategoryPage}
            isMobile={isMobile}
          />
        </div>
      </div>
    </div>
  );
}
