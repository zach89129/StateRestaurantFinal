// Common CartItem interface to be used across components
export interface CartItem {
  id: string;
  sku: string;
  title: string;
  quantity: number;
  manufacturer: string | null;
  category: string | null;
  uom: string | null;
  imageSrc: string | null;
  price?: number | null;
  venueId?: string;
  venueName?: string;
}

// Venue interface
export interface Venue {
  id: string;
  trxVenueId: number;
  venueName: string;
}
