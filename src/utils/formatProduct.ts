import { Product } from "@/types/product";

type PrismaProductWithImages = {
  id: bigint;
  sku: string;
  title: string;
  description: string | null;
  longDescription: string | null;
  manufacturer: string | null;
  category: string | null;
  uom: string | null;
  qtyAvailable: number | null;
  aqcat: string | null;
  pattern: string | null;
  aqid: string | null;
  quickship: boolean | null;
  dead: boolean | null;
  images: { url: string }[];
};

export function formatProductForClient(product: PrismaProductWithImages): Product {
  return {
    id: Number(product.id),
    sku: product.sku,
    title: product.title,
    description: product.description || "",
    longDescription: product.longDescription || "",
    manufacturer: product.manufacturer || "",
    category: product.category || "",
    uom: product.uom || "",
    qtyAvailable: product.qtyAvailable ? Number(product.qtyAvailable) : 0,
    aqcat: product.aqcat || null,
    pattern:
      product.pattern && typeof product.pattern === "string"
        ? product.pattern
            .split(",")
            .map((p: string) => p.trim())
            .filter(Boolean)
        : null,
    aqid: product.aqid || null,
    quickship: product.quickship || false,
    dead: product.dead || false,
    images: product.images.map((img) => ({ url: img.url })),
  };
}
