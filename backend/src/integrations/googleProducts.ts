import { MerchantIntegration, MerchantOffer, MerchantProfile } from './types';
import { normalizeText, parseAvailability, slugify } from './utils';

const INTEGRATION_ID = 'google-products';

interface GoogleProductsConfig {
  apiUrl: string;
  apiKey: string;
  apiKeyQueryParam: string;
  apiKeyHeaderName?: string;
  searchEngineId?: string;
  country?: string;
  language?: string;
  resultsLimit?: number;
  timeoutMs?: number;
  defaultCurrency: string;
  merchantUrl: string;
}

interface GoogleProductsMerchant {
  id?: string;
  name?: string;
  url?: string;
  logoUrl?: string;
  city?: string;
}

interface GoogleProductsPriceObject {
  value?: number | string;
  currency?: string;
}

interface GoogleProductsShippingObject {
  value?: number | string;
  currency?: string;
}

interface GoogleProductsItem {
  id?: string;
  productId?: string;
  slug?: string;
  title?: string;
  description?: string;
  link?: string;
  url?: string;
  productUrl?: string;
  image?: string;
  images?: string[];
  thumbnail?: string;
  brand?: string;
  category?: string;
  price?: number | string | GoogleProductsPriceObject;
  salePrice?: number | string | GoogleProductsPriceObject;
  shipping?: number | string | GoogleProductsShippingObject;
  availability?: string;
  merchant?: GoogleProductsMerchant;
  currency?: string;
}

interface GoogleProductsResponse {
  items?: GoogleProductsItem[];
}

const parseInteger = (value?: string) => {
  if (!value) {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const resolveConfig = (): GoogleProductsConfig | null => {
  const apiUrl = process.env.GOOGLE_PRODUCTS_API_URL;
  const apiKey = process.env.GOOGLE_PRODUCTS_API_KEY;

  if (!apiUrl || !apiKey) {
    return null;
  }

  const apiKeyQueryParam = process.env.GOOGLE_PRODUCTS_API_KEY_PARAM ?? 'key';
  const apiKeyHeaderName = process.env.GOOGLE_PRODUCTS_API_KEY_HEADER;
  const searchEngineId = process.env.GOOGLE_PRODUCTS_SEARCH_ENGINE_ID;
  const country = process.env.GOOGLE_PRODUCTS_COUNTRY;
  const language = process.env.GOOGLE_PRODUCTS_LANGUAGE;
  const resultsLimit = parseInteger(process.env.GOOGLE_PRODUCTS_RESULTS_LIMIT);
  const timeoutMs = parseInteger(process.env.GOOGLE_PRODUCTS_TIMEOUT_MS);
  const defaultCurrency = (process.env.GOOGLE_PRODUCTS_DEFAULT_CURRENCY ?? 'MAD').toUpperCase();
  const merchantUrl = process.env.GOOGLE_PRODUCTS_MERCHANT_URL ?? 'https://www.google.com/shopping';

  return {
    apiUrl,
    apiKey,
    apiKeyQueryParam,
    apiKeyHeaderName: apiKeyHeaderName || undefined,
    searchEngineId: searchEngineId || undefined,
    country: country || undefined,
    language: language || undefined,
    resultsLimit: resultsLimit || undefined,
    timeoutMs: timeoutMs || undefined,
    defaultCurrency,
    merchantUrl,
  };
};

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const sanitized = value
      .replace(/[^0-9,\.\-]/g, '')
      .replace(/,/g, '.')
      .replace(/\.(?=.*\.)/g, '');
    const parsed = Number.parseFloat(sanitized);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  if (typeof value === 'object' && value !== null) {
    const record = value as GoogleProductsPriceObject;
    return toNumber(record.value);
  }

  return undefined;
};

const toCurrency = (value: unknown, fallback: string): string => {
  if (typeof value === 'string' && value.trim()) {
    const letters = value.trim().match(/[A-Z]{3}/i)?.[0];
    if (letters) {
      return letters.toUpperCase();
    }
    return value.trim().toUpperCase();
  }

  if (typeof value === 'object' && value !== null) {
    const record = value as GoogleProductsPriceObject;
    if (typeof record.currency === 'string' && record.currency.trim()) {
      return record.currency.trim().toUpperCase();
    }
  }

  return fallback;
};

const buildMerchantProfile = (
  item: GoogleProductsItem,
  fallback: MerchantProfile,
  index: number
): MerchantProfile => {
  const { merchant } = item;
  if (!merchant) {
    return fallback;
  }

  const merchantName = merchant.name?.trim();
  if (!merchantName) {
    return fallback;
  }

  const merchantIdSource = merchant.id ?? merchant.name;
  const merchantIdSlug = slugify(merchantIdSource ?? merchantName);
  const merchantUrl = merchant.url ?? item.link ?? item.url ?? fallback.url;

  return {
    id: merchantIdSlug || `${fallback.id}-merchant-${index}`,
    name: merchantName,
    url: merchantUrl,
    logoUrl: merchant.logoUrl || undefined,
    city: merchant.city || undefined,
  };
};

const resolveImage = (item: GoogleProductsItem) =>
  item.image ?? item.images?.[0] ?? item.thumbnail ?? undefined;

const resolveProductUrl = (item: GoogleProductsItem, fallback: string) => {
  const candidates = [item.link, item.url, item.productUrl];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate;
    }
  }
  return fallback;
};

const normalizeItem = (
  item: GoogleProductsItem,
  config: GoogleProductsConfig,
  fallbackProfile: MerchantProfile,
  index: number
): MerchantOffer | null => {
  const title = item.title?.trim();
  if (!title) {
    return null;
  }

  const priceValue = toNumber(item.salePrice ?? item.price);
  if (typeof priceValue !== 'number' || priceValue <= 0) {
    return null;
  }

  const currency = toCurrency(item.salePrice ?? item.price ?? item.currency, config.defaultCurrency);
  const productUrl = resolveProductUrl(item, fallbackProfile.url);
  const productId = item.productId ?? item.id ?? productUrl;
  const slugSource = item.slug ?? item.productId ?? title;
  const slug = slugify(slugSource || title);
  if (!slug) {
    return null;
  }

  const merchantProfile = buildMerchantProfile(item, fallbackProfile, index);
  const shippingFee = toNumber(item.shipping);
  const availability = parseAvailability(item.availability);
  const now = new Date().toISOString();

  return {
    offerId: `${merchantProfile.id}-${productId}`,
    merchant: merchantProfile,
    productId: String(productId),
    slug,
    title,
    brand: item.brand ?? undefined,
    category: item.category ?? undefined,
    image: resolveImage(item),
    price: priceValue,
    currency,
    shippingFee: typeof shippingFee === 'number' ? shippingFee : undefined,
    availability,
    url: productUrl,
    scrapedAt: now,
  };
};

const createRequestUrl = (query: string, config: GoogleProductsConfig) => {
  const url = new URL(config.apiUrl);
  url.searchParams.set(config.apiKeyQueryParam, config.apiKey);
  url.searchParams.set('q', query);

  if (config.searchEngineId) {
    url.searchParams.set('cx', config.searchEngineId);
  }
  if (config.country) {
    url.searchParams.set('gl', config.country);
  }
  if (config.language) {
    url.searchParams.set('hl', config.language);
  }
  if (config.resultsLimit && config.resultsLimit > 0) {
    url.searchParams.set('num', String(config.resultsLimit));
  }

  return url.toString();
};

const fetchWithTimeout = async (
  url: string,
  timeoutMs: number | undefined,
  config: GoogleProductsConfig
) => {
  const controller = typeof timeoutMs === 'number' && timeoutMs > 0 ? new AbortController() : undefined;
  const timeoutId = controller
    ? setTimeout(() => {
        controller.abort();
      }, timeoutMs)
    : undefined;

  try {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (config.apiKeyHeaderName) {
      headers[config.apiKeyHeaderName] = config.apiKey;
    }

    const response = await fetch(url, {
      headers,
      signal: controller?.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Timeout after ${timeoutMs}ms when calling Google Products API`);
    }
    throw error;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

const defaultProfile: MerchantProfile = {
  id: INTEGRATION_ID,
  name: 'Google Products',
  url: 'https://www.google.com/shopping',
  logoUrl: 'https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png',
};

const hasMeaningfulContent = (query: string) => /[a-z0-9]/.test(normalizeText(query));

export const isGoogleProductsIntegrationEnabled = () => resolveConfig() !== null;

export const createGoogleProductsIntegration = (): MerchantIntegration => {
  const config = resolveConfig();
  if (!config) {
    throw new Error('Google Products integration is not configured.');
  }

  const profile: MerchantProfile = {
    ...defaultProfile,
    url: config.merchantUrl || defaultProfile.url,
  };

  return {
    id: INTEGRATION_ID,
    label: 'Google Products',
    profile,
    async search(query: string) {
      const trimmed = query.trim();
      if (!trimmed) {
        return [];
      }

      if (!hasMeaningfulContent(trimmed)) {
        return [];
      }

      const requestUrl = createRequestUrl(trimmed, config);
      const response = await fetchWithTimeout(requestUrl, config.timeoutMs, config);

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        const suffix = body ? `: ${body}` : '';
        throw new Error(`Google Products API request failed with status ${response.status}${suffix}`);
      }

      const data = (await response.json()) as GoogleProductsResponse;
      const items = Array.isArray(data.items) ? data.items : [];

      const offers: MerchantOffer[] = [];
      for (const [index, item] of items.entries()) {
        const offer = normalizeItem(item, config, profile, index);
        if (offer) {
          offers.push(offer);
        }
      }

      offers.sort((a, b) => {
        const totalA = a.price + (a.shippingFee ?? 0);
        const totalB = b.price + (b.shippingFee ?? 0);
        if (totalA === totalB) {
          return a.title.localeCompare(b.title);
        }
        return totalA - totalB;
      });

      return offers;
    },
  };
};

export const maybeCreateGoogleProductsIntegration = () => {
  if (!isGoogleProductsIntegrationEnabled()) {
    return null;
  }
  try {
    return createGoogleProductsIntegration();
  } catch (error) {
    return null;
  }
};
