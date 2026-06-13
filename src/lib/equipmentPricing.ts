function normalizeCategory(category?: string | null): string {
  return (category || "").trim().toLowerCase();
}

export function isEquipmentCategory(category?: string | null): boolean {
  const normalized = normalizeCategory(category);
  return (
    normalized === "equipment" || normalized === "light equipment contract"
  );
}

export function isEquipmentPricingRestricted(
  category?: string | null,
  dead?: boolean | null
): boolean {
  return isEquipmentCategory(category) && !dead;
}
