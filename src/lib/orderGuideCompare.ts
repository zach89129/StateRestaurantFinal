import { ComparableProduct } from "@/types/compare";

export interface OrderGuideCompareItem {
  productId: number;
  orderGuideQuality: string;
  sourceType: "ORDER_GUIDE" | "GENERAL_CATALOG";
  product: {
    sku: string;
    title: string;
    description: string | null;
    longDescription?: string | null;
    manufacturer: string | null;
    category: string | null;
    aqcat: string | null;
    uom: string | null;
    qtyAvailable: number | null;
    images: { src: string }[];
  };
}

export function orderGuideItemToComparable(
  item: OrderGuideCompareItem,
  pricingData: Record<string, number | null>
): ComparableProduct {
  const price = pricingData[String(item.productId)];
  return {
    id: item.productId,
    sku: item.product.sku,
    title: item.product.title,
    description: item.product.description,
    longDescription: item.product.longDescription ?? null,
    manufacturer: item.product.manufacturer,
    category: item.product.category,
    aqcat: item.product.aqcat,
    uom: item.product.uom,
    qtyAvailable: item.product.qtyAvailable,
    imageUrl: item.product.images?.[0]?.src ?? null,
    price: price ?? null,
    orderGuideQuality: item.orderGuideQuality,
    sourceType: item.sourceType,
  };
}
