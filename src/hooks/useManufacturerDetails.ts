import { useCallback, useEffect, useState } from "react";
import { fetchManufacturerDetails } from "@/lib/manufacturerDetails";
import { ManufacturerDetails } from "@/types/manufacturerDetails";

interface UseManufacturerDetailsOptions {
  sku?: string | null;
  manufacturer?: string | null;
  details?: string | null;
  enabled?: boolean;
}

export function useManufacturerDetails({
  sku,
  manufacturer,
  details = "",
  enabled = true,
}: UseManufacturerDetailsOptions) {
  const [manufacturerDetails, setManufacturerDetails] =
    useState<ManufacturerDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);

  const load = useCallback(async () => {
    if (!sku || !manufacturer) {
      setError("Manufacturer information unavailable");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchManufacturerDetails(
        sku,
        manufacturer,
        details || ""
      );
      setManufacturerDetails(result.details);
      setCached(result.cached);
    } catch (err) {
      setManufacturerDetails(null);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [sku, manufacturer, details]);

  useEffect(() => {
    if (!enabled) {
      setManufacturerDetails(null);
      setError(null);
      setCached(false);
      setLoading(false);
      return;
    }

    void load();
  }, [enabled, load]);

  const refresh = useCallback(() => {
    setManufacturerDetails(null);
    void load();
  }, [load]);

  return {
    manufacturerDetails,
    loading,
    error,
    cached,
    refresh,
  };
}
