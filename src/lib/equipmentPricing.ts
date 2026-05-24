export function isEquipmentCategory(category?: string | null): boolean {
  return (category || "").trim().toLowerCase() === "equipment";
}

export function isEquipmentPricingRestricted(
  category?: string | null,
  dead?: boolean
): boolean {
  return isEquipmentCategory(category) && !dead;
}
