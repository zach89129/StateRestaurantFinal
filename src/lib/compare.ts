import { ComparableProduct, CompareFieldConfig } from "@/types/compare";

export function normalizeCompareValue(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "number") return String(value);
  return String(value).trim().toLowerCase();
}

export function compareValuesDiffer(a: unknown, b: unknown): boolean {
  return normalizeCompareValue(a) !== normalizeCompareValue(b);
}

export function formatPrice(price: number | null | undefined): string {
  if (price == null) return "Quote";
  return `$${price.toFixed(2)}`;
}

export function formatSourceType(
  sourceType: ComparableProduct["sourceType"]
): string {
  if (sourceType === "GENERAL_CATALOG") return "General Catalog";
  if (sourceType === "ORDER_GUIDE") return "Order Guide";
  return "-";
}

export function formatCompareDescription(product: ComparableProduct): string {
  const longDescription = product.longDescription?.trim();
  if (longDescription) return longDescription;
  const description = product.description?.trim();
  if (description) return description;
  return "-";
}

export function formatFieldValue(
  product: ComparableProduct,
  key: CompareFieldConfig["key"],
  format?: CompareFieldConfig["format"]
): string {
  if (format) return format(product);
  if (key === "priceDisplay") return formatPrice(product.price);
  if (key === "sourceType") return formatSourceType(product.sourceType);
  if (key === "price") return formatPrice(product.price);

  const value = product[key as keyof ComparableProduct];
  if (value == null || value === "") return "-";
  if (typeof value === "number") return String(value);
  return String(value);
}

export function shouldShowCompareRow(
  products: ComparableProduct[],
  key: CompareFieldConfig["key"],
  format?: CompareFieldConfig["format"]
): boolean {
  return products.some(
    (product) => formatFieldValue(product, key, format) !== "-"
  );
}

export function compareFieldValuesDiffer(values: string[]): boolean {
  const normalized = values.map((value) => normalizeCompareValue(value));
  return new Set(normalized).size > 1;
}

export const DEFAULT_COMPARE_FIELDS: CompareFieldConfig[] = [
  { key: "title", label: "Title" },
  { key: "manufacturer", label: "Manufacturer" },
  { key: "description", label: "Description", format: formatCompareDescription },
  { key: "orderGuideQuality", label: "Quality" },
  { key: "sourceType", label: "Source" },
  { key: "category", label: "Category" },
  { key: "aqcat", label: "AQCAT" },
  { key: "uom", label: "UOM" },
  { key: "priceDisplay", label: "Price" },
  { key: "qtyAvailable", label: "Qty Available" },
];

export interface CompareSelectionState {
  selectedIds: number[];
}

export function toggleCompareSelection(
  state: CompareSelectionState,
  id: number,
  maxCount: number
): CompareSelectionState {
  if (state.selectedIds.includes(id)) {
    return {
      selectedIds: state.selectedIds.filter((selectedId) => selectedId !== id),
    };
  }
  if (state.selectedIds.length >= maxCount) {
    return state;
  }
  return {
    selectedIds: [...state.selectedIds, id],
  };
}

export function clearCompareSelection(): CompareSelectionState {
  return { selectedIds: [] };
}

export function isCompareSelected(
  state: CompareSelectionState,
  id: number
): boolean {
  return state.selectedIds.includes(id);
}

export function isCompareDisabled(
  state: CompareSelectionState,
  id: number,
  maxCount: number
): boolean {
  return (
    !state.selectedIds.includes(id) && state.selectedIds.length >= maxCount
  );
}

export function canCompareSelection(
  state: CompareSelectionState,
  minCount: number,
  maxCount: number
): boolean {
  return (
    state.selectedIds.length >= minCount &&
    state.selectedIds.length <= maxCount
  );
}
