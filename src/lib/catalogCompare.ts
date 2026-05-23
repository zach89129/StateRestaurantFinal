import { ComparableProduct } from "@/types/compare";

export interface CatalogCompareSource {
  trx_product_id: number;
  sku: string;
  title: string;
  description: string;
  longDescription?: string | null;
  manufacturer: string;
  category: string;
  uom: string;
  qtyAvailable: number;
  aqcat?: string | null;
  images: { url: string }[];
}

export function catalogProductToComparable(
  product: CatalogCompareSource
): ComparableProduct {
  return {
    id: product.trx_product_id,
    sku: product.sku,
    title: product.title,
    description: product.description || null,
    longDescription: product.longDescription ?? null,
    manufacturer: product.manufacturer || null,
    category: product.category || null,
    aqcat: product.aqcat ?? null,
    uom: product.uom || null,
    qtyAvailable: product.qtyAvailable ?? null,
    imageUrl: product.images?.[0]?.url ?? null,
    price: null,
  };
}
