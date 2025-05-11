"use client";
import { createContext, useContext, useState } from "react";

interface SalesTeamVenueContextType {
  salesVenue: number;
  setSalesVenue: (salesVenue: number) => void;
}

const SalesTeamVenueContext = createContext<
  SalesTeamVenueContextType | undefined
>(undefined);

export function SalesTeamVenueProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [salesVenue, setSalesVenue] = useState<number>(0);

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
