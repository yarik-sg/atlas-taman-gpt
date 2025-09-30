export type MerchantAvailability = 'in_stock' | 'out_of_stock' | 'unknown';

export interface MerchantProfile {
  id: string;
  name: string;
  url: string;
  logoUrl?: string;
  city?: string;
}

export interface MerchantOffer {
  offerId: string;
  merchant: MerchantProfile;
  productId: string;
  slug: string;
  title: string;
  brand?: string;
  category?: string;
  image?: string;
  price: number;
  currency: string;
  shippingFee?: number;
  availability: MerchantAvailability;
  url: string;
  scrapedAt: string;
}

export interface MerchantIntegration {
  readonly id: string;
  readonly label: string;
  readonly profile: MerchantProfile;
  search(query: string): Promise<MerchantOffer[]>;
}
