export interface Product {
  id: number;
  sku: string;
  title: string;
  description: string;
  longDescription: string;
  manufacturer: string;
  category: string;
  uom: string;
  qtyAvailable: number;
  aqcat: string | null;
  pattern: string | null;
  aqid: string | number | null;
  quickship: boolean;
  images: { url: string }[];
}
