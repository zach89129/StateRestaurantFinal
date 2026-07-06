"use client";

import {
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  getCollectionSuggestionHighlightSegments,
  getCollectionSuggestions,
} from "@/lib/collectionSearch";

interface SearchBarProps {
  disabled?: boolean;
  onSuggestionsOpenChange?: (isOpen: boolean) => void;
}

function encodeCollectionForUrl(collection: string): string {
  return btoa(collection);
}

export default function SearchBar({
  disabled = false,
  onSuggestionsOpenChange,
}: SearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [collections, setCollections] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [dropdownStyle, setDropdownStyle] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(
    () => getCollectionSuggestions(searchTerm, collections),
    [collections, searchTerm]
  );

  const showSuggestions =
    !disabled && isOpen && searchTerm.trim().length > 0 && suggestions.length > 0;

  const updateDropdownPosition = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const rect = container.getBoundingClientRect();
    setDropdownStyle({
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
      width: rect.width,
    });
  }, []);

  const setSuggestionsOpen = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      onSuggestionsOpenChange?.(open);
      if (!open) {
        setActiveIndex(-1);
      }
    },
    [onSuggestionsOpenChange]
  );

  useEffect(() => {
    setSearchTerm("");
    setSuggestionsOpen(false);
  }, [pathname, searchParams, setSuggestionsOpen]);

  useEffect(() => {
    if (disabled) {
      return;
    }

    let isMounted = true;

    const fetchCollections = async () => {
      try {
        const response = await fetch("/api/products/options");
        const data = await response.json();

        if (isMounted && data.success && Array.isArray(data.options?.collections)) {
          setCollections(data.options.collections);
        }
      } catch (error) {
        console.error("Error fetching collection suggestions:", error);
      }
    };

    void fetchCollections();

    return () => {
      isMounted = false;
    };
  }, [disabled]);

  useEffect(() => {
    if (!showSuggestions) {
      return;
    }

    updateDropdownPosition();

    const handleReposition = () => {
      updateDropdownPosition();
    };

    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [showSuggestions, updateDropdownPosition, suggestions.length]);

  useEffect(() => {
    if (!showSuggestions) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current?.contains(target)) {
        return;
      }

      const dropdown = document.getElementById("collection-search-suggestions");
      if (dropdown?.contains(target)) {
        return;
      }

      setSuggestionsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSuggestions, setSuggestionsOpen]);

  useEffect(() => {
    if (activeIndex >= suggestions.length) {
      setActiveIndex(suggestions.length - 1);
    }
  }, [activeIndex, suggestions.length]);

  const navigateToCollection = (collection: string) => {
    const encodedCollection = encodeCollectionForUrl(collection);
    setSuggestionsOpen(false);
    setSearchTerm("");
    router.push(`/products?collection_b64=${encodedCollection}&page=1`);
  };

  const fillSearchTerm = (collection: string) => {
    setSearchTerm(collection);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();

    if (disabled || !searchTerm.trim()) {
      return;
    }

    if (activeIndex >= 0 && suggestions[activeIndex]) {
      navigateToCollection(suggestions[activeIndex].label);
      return;
    }

    setSuggestionsOpen(false);
    router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) {
      if (event.key === "ArrowDown" && suggestions.length > 0) {
        event.preventDefault();
        setSuggestionsOpen(true);
        setActiveIndex(0);
      }
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((current) =>
          current < suggestions.length - 1 ? current + 1 : 0
        );
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((current) =>
          current > 0 ? current - 1 : suggestions.length - 1
        );
        break;
      case "Escape":
        event.preventDefault();
        setSuggestionsOpen(false);
        break;
      default:
        break;
    }
  };

  const dropdown =
    showSuggestions && dropdownStyle
      ? createPortal(
          <ul
            id="collection-search-suggestions"
            role="listbox"
            aria-label="Collection suggestions"
            className="fixed z-[100] overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg"
            style={{
              top: dropdownStyle.top,
              left: dropdownStyle.left,
              width: dropdownStyle.width,
              maxHeight: "min(20rem, calc(100vh - 6rem))",
            }}
          >
            {suggestions.map((suggestion, index) => {
              const segments = getCollectionSuggestionHighlightSegments(
                searchTerm,
                suggestion.label
              );

              return (
                <li
                  key={suggestion.label}
                  id={`collection-suggestion-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  className={`flex items-center border-b border-gray-100 last:border-b-0 ${
                    index === activeIndex ? "bg-blue-50" : "bg-white"
                  }`}
                >
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => navigateToCollection(suggestion.label)}
                    className="min-h-11 flex-1 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {segments.map((segment, segmentIndex) =>
                      segment.bold ? (
                        <span key={segmentIndex} className="font-semibold">
                          {segment.text}
                        </span>
                      ) : (
                        <span key={segmentIndex}>{segment.text}</span>
                      )
                    )}
                  </button>
                  <button
                    type="button"
                    aria-label={`Use ${suggestion.label} in search bar`}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => fillSearchTerm(suggestion.label)}
                    className="flex h-11 w-11 shrink-0 items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <path d="M7 17L17 7" />
                      <path d="M9 7h8v8" />
                    </svg>
                  </button>
                </li>
              );
            })}
          </ul>,
          document.body
        )
      : null;

  return (
    <>
      <form onSubmit={handleSearch} className="w-full">
        <div ref={containerRef} className="relative">
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={showSuggestions}
            aria-controls="collection-search-suggestions"
            aria-autocomplete="list"
            aria-activedescendant={
              activeIndex >= 0 ? `collection-suggestion-${activeIndex}` : undefined
            }
            placeholder={
              disabled ? "Search disabled on venue page" : "Search products..."
            }
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setSuggestionsOpen(true);
              setActiveIndex(-1);
            }}
            onFocus={() => {
              if (searchTerm.trim()) {
                setSuggestionsOpen(true);
              }
            }}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className={`w-full px-4 py-2 rounded-lg border text-gray-500 ${
              disabled
                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                : "bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            }`}
          />
          <button
            type="submit"
            disabled={disabled}
            className={`absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1 rounded ${
              disabled
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            Search
          </button>
        </div>
      </form>
      {dropdown}
    </>
  );
}
