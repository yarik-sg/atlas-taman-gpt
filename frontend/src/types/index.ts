export interface Merchant {
  id: string;
  name: string;
  url: string;
  logoUrl?: string | null;
  city?: string | null;
}

export interface Offer {
  id: string;
  price: number;
  totalPrice: number;
  currency: string;
  shippingFee?: number | null;
  isAvailable: boolean;
  url: string;
  merchant: Merchant;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  brand?: string;
  model?: string;
  category: string;
  categorySlug: string;
  images: string[];
  minPrice: number;
  maxPrice: number;
  minTotalPrice: number;
  offersCount: number;
  offers: Offer[];
  specifications?: Record<string, string>;
  createdAt: string;
}

export interface IntegrationMetric {
  id: string;
  label: string;
  durationMs: number;
  offers: number;
  status: 'fulfilled' | 'rejected';
  error?: string;
}

export interface IntegrationError {
  merchantId: string;
  merchantName: string;
  message: string;
}

export interface SearchMetadata {
  query: string;
  fromCache: boolean;
  tookMs: number;
  generatedAt: string;
  integrations: IntegrationMetric[];
}

export interface SearchFilters {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'name' | 'newest';
}
