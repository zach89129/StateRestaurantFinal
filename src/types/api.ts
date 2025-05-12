export interface CustomerInput {
  customers: [
    {
      email: string;
      trx_customer_id: number;
      seePrices: boolean;
      phone?: string;
      password?: string;
      venues: (VenueData | number)[];
    }
  ];
}

export interface VenueData {
  trx_venue_id: number;
  venueName: string;
}

export interface VenueProductInput {
  venue_products: VenueProductData[];
}

export interface VenueProductData {
  trx_venue_id: number;
  products: number[];
  venueName?: string;
}

export interface VenueInput {
  venues: [
    {
      trx_venue_id: number;
      venueName: string;
      products: number[];
    }
  ];
}

export interface ProductInput {
  products: {
    trx_product_id: number;
    sku: string;
    title: string;
    description?: string;
    longDescription?: string;
    manufacturer?: string;
    category?: string;
    uom?: string;
    qty_available?: number;
    tags?: string;
    metaData?: {
      aqcat?: string;
      pattern?: string;
      quickship?: boolean;
    };
    images?: { src: string }[];
  }[];
}
