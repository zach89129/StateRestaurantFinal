export interface ComparableProduct {
  id: number;
  sku: string;
  title: string;
  description: string | null;
  longDescription?: string | null;
  manufacturer: string | null;
  category?: string | null;
  aqcat?: string | null;
  uom?: string | null;
  qtyAvailable?: number | null;
  imageUrl?: string | null;
  price?: number | null;
  dead?: boolean;
  orderGuideQuality?: string | null;
  sourceType?: "ORDER_GUIDE" | "GENERAL_CATALOG" | null;
}

export interface CompareFieldConfig {
  key: keyof ComparableProduct | "priceDisplay";
  label: string;
  format?: (product: ComparableProduct) => string;
}
