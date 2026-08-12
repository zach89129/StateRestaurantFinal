import { normalizeEmail } from "@/lib/email";

export type VenueFilter = "all" | "has" | "none";

export interface ActivityLogRecord {
  id: number;
  email: string;
  TIMESTAMP: Date | string | null;
}

export interface CustomerVenueNames {
  email: string;
  venueNames: string[];
}

export interface EnrichedActivityLog {
  id: number;
  email: string;
  TIMESTAMP: Date | string | null;
  hasVenue: boolean;
  venueNames: string[];
}

export function parseVenueFilter(value: string | null): VenueFilter {
  if (value === "has" || value === "none") {
    return value;
  }
  return "all";
}

export function buildVenueNamesByEmail(
  customers: CustomerVenueNames[]
): Map<string, string[]> {
  const venueNamesByEmail = new Map<string, string[]>();

  for (const customer of customers) {
    const email = normalizeEmail(customer.email);
    if (!email) {
      continue;
    }

    const uniqueNames = Array.from(
      new Set(
        customer.venueNames
          .map((name) => name.trim())
          .filter((name) => name.length > 0)
      )
    );

    if (uniqueNames.length === 0) {
      continue;
    }

    venueNamesByEmail.set(email, uniqueNames);
  }

  return venueNamesByEmail;
}

export function enrichActivityLogs(
  logs: ActivityLogRecord[],
  venueNamesByEmail: Map<string, string[]>
): EnrichedActivityLog[] {
  return logs.map((log) => {
    const venueNames = venueNamesByEmail.get(normalizeEmail(log.email)) ?? [];
    return {
      id: log.id,
      email: log.email,
      TIMESTAMP: log.TIMESTAMP,
      hasVenue: venueNames.length > 0,
      venueNames,
    };
  });
}

export function filterActivityLogsByVenue(
  logs: EnrichedActivityLog[],
  venueFilter: VenueFilter
): EnrichedActivityLog[] {
  switch (venueFilter) {
    case "all":
      return logs;
    case "has":
      return logs.filter((log) => log.hasVenue);
    case "none":
      return logs.filter((log) => !log.hasVenue);
    default: {
      const _exhaustive: never = venueFilter;
      return _exhaustive;
    }
  }
}

export function formatActivityVenueLabel(venueNames: string[]): string {
  if (venueNames.length === 0) {
    return "No venue";
  }
  return venueNames.join(", ");
}
