import { Session } from "next-auth";
import { isEquipmentCategory } from "./equipmentPricing";

const DEAD_INVENTORY_DEFAULT_VENUE = 94670;

export function isCompareEquipmentProduct(category?: string | null): boolean {
  return isEquipmentCategory(category);
}

export function canGetComparePrice(
  session: Session | null,
  product?: { dead?: boolean }
): boolean {
  return Boolean(
    product?.dead ||
      session?.user?.isSalesTeam ||
      session?.user?.newOrderGuideEnabled
  );
}

export function resolveComparePricingVenueId(
  session: Session | null,
  salesVenue: number | null,
  isDeadInventory: boolean
): number | null {
  if (isDeadInventory) {
    return DEAD_INVENTORY_DEFAULT_VENUE;
  }

  if (salesVenue) {
    return salesVenue;
  }

  if (session?.user?.newOrderGuideEnabled) {
    return (
      session.user.defaultOrderGuideVenueId ??
      (session.user.venues?.length === 1
        ? session.user.venues[0].trxVenueId
        : null)
    );
  }

  return null;
}

export async function fetchCompareProductPrice(options: {
  productId: number;
  venueId: number;
  isDeadInventory?: boolean;
}): Promise<{ price: number | null; restricted: boolean }> {
  const params = new URLSearchParams({
    productId: String(options.productId),
    catalogContext: "general",
    venueId: String(options.venueId),
  });

  if (options.isDeadInventory) {
    params.set("isDeadInventory", "true");
  }

  const response = await fetch(`/api/pricing?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to fetch price");
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || "Failed to fetch price");
  }

  return {
    price: data.price ?? null,
    restricted: Boolean(data.restricted),
  };
}

export function formatComparePriceDisplay(
  price: number | null | undefined,
  uom?: string | null
): string {
  if (price == null) return "Quote";
  const suffix = uom ? ` per ${uom}` : "";
  return `$${price.toFixed(2)}${suffix}`;
}
