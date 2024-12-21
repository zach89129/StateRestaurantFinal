"use client";

import { createContext, useContext, useState } from "react";

interface SearchContextType {
  isSearchVisible: boolean;
  setIsSearchVisible: (visible: boolean) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  return (
    <SearchContext.Provider value={{ isSearchVisible, setIsSearchVisible }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
}
