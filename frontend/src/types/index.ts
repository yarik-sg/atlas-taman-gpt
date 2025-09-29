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
  offersCount: number;
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
