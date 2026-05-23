import {
  ManufacturerDetails,
  ManufacturerDetailsResponse,
} from "@/types/manufacturerDetails";

export async function fetchManufacturerDetails(
  sku: string,
  manufacturer: string,
  details: string
): Promise<{ details: ManufacturerDetails; cached: boolean }> {
  const response = await fetch("/api/manufacturer-details?", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      stateSku: encodeURIComponent(sku),
      manufacturer: encodeURIComponent(manufacturer),
      details,
    }),
  });

  const data: ManufacturerDetailsResponse = await response.json();

  if (!response.ok || !data.success || !data.details) {
    throw new Error(data.error || "Failed to fetch manufacturer details");
  }

  return {
    details: data.details,
    cached: data.cached ?? false,
  };
}
