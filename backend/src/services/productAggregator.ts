import pLimit from 'p-limit';
import { LRUCache } from 'lru-cache';
import { createDefaultIntegrations, MerchantIntegration, MerchantOffer, MerchantProfile } from '../integrations';
import { createRateLimiter, normalizeQuery } from '../integrations/utils';

export interface AggregatedOffer {
  id: string;
  price: number;
  totalPrice: number;
  currency: string;
  shippingFee?: number | null;
  isAvailable: boolean;
  url: string;
  merchant: MerchantProfile;
  createdAt: string;
  updatedAt: string;
}

export interface AggregatedProduct {
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
  offers: AggregatedOffer[];
  specifications: Record<string, string>;
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

export interface AggregationMetadata {
  query: string;
  fromCache: boolean;
  tookMs: number;
  generatedAt: string;
  integrations: IntegrationMetric[];
}

export interface AggregationResponse {
  products: AggregatedProduct[];
  errors: IntegrationError[];
  metadata: AggregationMetadata;
}

interface AggregatedProductBuilder {
  id: string;
  slug: string;
  name: string;
  brand?: string;
  category?: string;
  images: Set<string>;
  offers: AggregatedOffer[];
  createdAt: string;
}

interface IntegrationExecutionResult {
  offers: MerchantOffer[];
  metric: IntegrationMetric;
  error?: IntegrationError;
}

const deepClone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const slugify = (input: string) =>
  input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

const isValidOffer = (offer: MerchantOffer) =>
  offer.price > 0 && offer.availability !== 'out_of_stock';

const toAggregatedOffer = (offer: MerchantOffer): AggregatedOffer => {
  const shippingFee = offer.shippingFee ?? null;
  const totalPrice = offer.price + (shippingFee ?? 0);
  return {
    id: offer.offerId,
    price: offer.price,
    totalPrice,
    currency: offer.currency,
    shippingFee,
    isAvailable: offer.availability !== 'out_of_stock',
    url: offer.url,
    merchant: offer.merchant,
    createdAt: offer.scrapedAt,
    updatedAt: offer.scrapedAt,
  };
};

export interface ProductAggregatorOptions {
  cacheTtlMs?: number;
  rateLimitMs?: number;
  maxConcurrency?: number;
  integrations?: MerchantIntegration[];
}

export class ProductAggregator {
  private readonly integrations: MerchantIntegration[];
  private readonly cache: LRUCache<string, AggregationResponse>;
  private readonly rateLimitMs: number;
  private readonly limiter: ReturnType<typeof pLimit>;
  private readonly rateLimiter: (key: string) => Promise<void>;

  constructor(options: ProductAggregatorOptions = {}) {
    this.integrations = options.integrations ?? createDefaultIntegrations();
    const cacheTtlMs = options.cacheTtlMs ?? 1000 * 60 * 5;
    this.cache = new LRUCache<string, AggregationResponse>({ max: 50, ttl: cacheTtlMs });
    this.rateLimitMs = options.rateLimitMs ?? 500;
    this.rateLimiter = createRateLimiter(this.rateLimitMs);
    const maxConcurrency = options.maxConcurrency ?? 3;
    this.limiter = pLimit(maxConcurrency);
  }

  async search(query: string): Promise<AggregationResponse> {
    const normalizedQuery = normalizeQuery(query ?? '');
    const cacheKey = `search:${normalizedQuery || '__all__'}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      const response = deepClone(cached);
      response.metadata.fromCache = true;
      return response;
    }

    const startedAt = Date.now();
    const offers: MerchantOffer[] = [];
    const errors: IntegrationError[] = [];
    const metrics: IntegrationMetric[] = [];

    const tasks = this.integrations.map((integration) =>
      this.limiter(() => this.executeIntegration(integration, normalizedQuery))
    );

    const results = await Promise.all(tasks);
    for (const result of results) {
      offers.push(...result.offers);
      metrics.push(result.metric);
      if (result.error) {
        errors.push(result.error);
      }
    }

    const products = this.normalizeOffers(offers);
    const tookMs = Date.now() - startedAt;
    const response: AggregationResponse = {
      products,
      errors,
      metadata: {
        query: normalizedQuery,
        fromCache: false,
        tookMs,
        generatedAt: new Date().toISOString(),
        integrations: metrics,
      },
    };

    this.cache.set(cacheKey, deepClone(response));
    return response;
  }

  async listProducts(): Promise<AggregationResponse> {
    return this.search('');
  }

  private async executeIntegration(
    integration: MerchantIntegration,
    query: string
  ): Promise<IntegrationExecutionResult> {
    const startedAt = Date.now();
    await this.applyRateLimit(integration.id);

    try {
      const offers = await integration.search(query);
      const filteredOffers = offers.filter(isValidOffer);
      const durationMs = Date.now() - startedAt;
      return {
        offers: filteredOffers,
        metric: {
          id: integration.id,
          label: integration.label,
          durationMs,
          offers: filteredOffers.length,
          status: 'fulfilled' as const,
        },
      };
    } catch (error) {
      const durationMs = Date.now() - startedAt;
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      return {
        offers: [] as MerchantOffer[],
        metric: {
          id: integration.id,
          label: integration.label,
          durationMs,
          offers: 0,
          status: 'rejected' as const,
          error: message,
        },
        error: {
          merchantId: integration.id,
          merchantName: integration.label,
          message,
        },
      };
    }
  }

  private async applyRateLimit(merchantId: string) {
    await this.rateLimiter(merchantId);
  }

  private normalizeOffers(offers: MerchantOffer[]): AggregatedProduct[] {
    const products = new Map<string, AggregatedProductBuilder>();

    for (const offer of offers) {
      if (!isValidOffer(offer)) {
        continue;
      }

      const slug = slugify(offer.slug || offer.title);
      if (!slug) {
        continue;
      }

      let builder = products.get(slug);
      if (!builder) {
        builder = {
          id: slug,
          slug,
          name: offer.title,
          brand: offer.brand,
          category: offer.category,
          images: new Set<string>(),
          offers: [],
          createdAt: offer.scrapedAt,
        };
        products.set(slug, builder);
      }

      builder.name = builder.name || offer.title;
      builder.brand = builder.brand ?? offer.brand;
      builder.category = builder.category ?? offer.category;
      if (offer.image) {
        builder.images.add(offer.image);
      }
      builder.createdAt = builder.createdAt < offer.scrapedAt ? builder.createdAt : offer.scrapedAt;
      builder.offers.push(toAggregatedOffer(offer));
    }

    const aggregated: AggregatedProduct[] = [];
    for (const builder of products.values()) {
      const offersSorted = [...builder.offers].sort((a, b) => a.totalPrice - b.totalPrice);
      const prices = offersSorted.map((offer) => offer.price);
      const minPrice = prices.length ? Math.min(...prices) : 0;
      const maxPrice = prices.length ? Math.max(...prices) : 0;
      const minTotalPrice = offersSorted.length ? offersSorted[0].totalPrice : 0;
      aggregated.push({
        id: builder.id,
        name: builder.name,
        slug: builder.slug,
        brand: builder.brand,
        category: builder.category ?? 'Divers',
        categorySlug: slugify(builder.category ?? 'Divers'),
        images: Array.from(builder.images),
        minPrice,
        maxPrice,
        minTotalPrice,
        offersCount: offersSorted.length,
        offers: offersSorted,
        specifications: {},
        createdAt: builder.createdAt,
      });
    }

    return aggregated.sort((a, b) => a.minTotalPrice - b.minTotalPrice || a.name.localeCompare(b.name));
  }
}

export const productAggregator = new ProductAggregator();
