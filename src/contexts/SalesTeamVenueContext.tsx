"use client";
import { createContext, useContext, useState, useEffect } from "react";

interface SalesTeamVenueContextType {
  salesVenue: number;
  setSalesVenue: (salesVenue: number) => void;
}

const SalesTeamVenueContext = createContext<
  SalesTeamVenueContextType | undefined
>(undefined);

const STORAGE_KEY = "salesVenue";

export function SalesTeamVenueProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize state from localStorage if available, otherwise use 0
  const [salesVenue, setSalesVenueState] = useState<number>(() => {
    // We can't access localStorage during SSR, so we need to check if window is defined
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const initial = Number(saved);
        return !isNaN(initial) ? initial : 0;
      }
    }
    return 0;
  });

  // Wrapper function to update both state and localStorage
  const setSalesVenue = (value: number) => {
    setSalesVenueState(value);
    localStorage.setItem(STORAGE_KEY, value.toString());
  };

  // Effect to sync with localStorage changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        const newValue = Number(e.newValue);
        if (!isNaN(newValue) && newValue !== salesVenue) {
          setSalesVenueState(newValue);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [salesVenue]);

  return (
    <SalesTeamVenueContext.Provider value={{ salesVenue, setSalesVenue }}>
      {children}
    </SalesTeamVenueContext.Provider>
  );
}

export function useSalesTeamVenue() {
  const context = useContext(SalesTeamVenueContext);
  if (!context) {
    throw new Error(
      "useSalesTeamVenue must be used within a SalesTeamVenueProvider"
    );
  }
  return context;
}
