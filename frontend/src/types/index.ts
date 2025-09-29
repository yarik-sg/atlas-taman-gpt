// Types pour Atlas Taman GPT

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

export interface PriceOffer {
  id: number;
  merchantName: string;
  merchantDomain: string;
  merchantLogo?: string;
  price: number;
  originalPrice?: number;
  currency: string;
  shippingCost: number;
  availability: 'in_stock' | 'out_of_stock' | 'limited' | 'unknown';
  stockQuantity?: number;
  condition: 'new' | 'used' | 'refurbished';
  url: string;
  lastUpdated: string;
}

export interface Merchant {
  id: number;
  name: string;
  domain: string;
  logoUrl?: string;
  description?: string;
  websiteUrl: string;
  isActive: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parentId?: number;
  productsCount?: number;
}

export interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface PriceAlert {
  id: number;
  productId: number;
  productName: string;
  targetPrice: number;
  currentMinPrice: number;
  isActive: boolean;
  createdAt: string;
}

export interface SearchFilters {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  merchants?: string[];
  availability?: 'in_stock' | 'all';
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'name' | 'newest';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  results: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
