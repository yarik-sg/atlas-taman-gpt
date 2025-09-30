export interface Merchant {
  id: number;
  name: string;
  url?: string | null;
  logoUrl?: string | null;
  city?: string | null;
}

export interface Offer {
  id: number;
  price: number;
  totalPrice: number;
  currency: string;
  shippingFee?: number | null;
  isAvailable: boolean;
  url?: string | null;
  merchant: Merchant;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  brand: string;
  model?: string;
  category: string;
  categorySlug: string;
  images: string[];
  minPrice: number;
  maxPrice: number;
  minTotalPrice?: number;
  offersCount: number;
  offers?: Offer[];
  specifications?: Record<string, any>;
  createdAt: string;
}

export interface SearchFilters {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'name' | 'newest';
}
