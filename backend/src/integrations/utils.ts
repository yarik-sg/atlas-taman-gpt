import { parseDocument, DomUtils } from 'htmlparser2';
import { Element } from 'domhandler';
import { merchantProfiles } from './fixtures/merchantData';
import { MerchantIntegration, MerchantOffer, MerchantProfile } from './types';

type MerchantId = keyof typeof merchantProfiles;

export const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export const normalizeQuery = (query: string) => normalizeText(query.trim());

export const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    if (ms <= 0) {
      resolve();
      return;
    }
    setTimeout(resolve, ms);
  });

const parseNumber = (value?: string) => {
  if (!value) {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseKeyValuePairs = (input?: string) => {
  if (!input) {
    return {} as Record<string, string>;
  }

  try {
    const parsed = JSON.parse(input) as Record<string, unknown>;
    if (parsed && typeof parsed === 'object') {
      return Object.fromEntries(
        Object.entries(parsed).map(([key, value]) => [key, String(value)])
      );
    }
  } catch (error) {
    // ignore JSON parse errors and fallback to manual parsing
  }

  const result: Record<string, string> = {};
  const segments = input.split(/[;,]/);
  for (const segment of segments) {
    const [rawKey, ...rest] = segment.split(/[:=]/);
    const key = rawKey?.trim();
    const value = rest.join('=').trim();
    if (key) {
      result[key] = value;
    }
  }
  return result;
};

const parseQueryParams = (input?: string) => {
  const entries = parseKeyValuePairs(input);
  return Object.fromEntries(
    Object.entries(entries).map(([key, value]) => [key, decodeURIComponent(value)])
  );
};

export interface MerchantHttpConfig {
  searchUrl: string;
  queryParam: string;
  headers: Record<string, string>;
  staticParams: Record<string, string>;
  delayMs?: number;
  timeoutMs?: number;
  currency: string;
  origin: string;
}

const ensureUrl = (value: string): URL => {
  try {
    return new URL(value);
  } catch (error) {
    throw new Error(`Invalid URL provided for merchant integration: ${value}`);
  }
};

export const getMerchantHttpConfig = (
  merchantId: MerchantId,
  defaults: Pick<MerchantHttpConfig, 'searchUrl' | 'queryParam' | 'currency'>
): MerchantHttpConfig => {
  const prefix = merchantId.toUpperCase();
  const searchUrl = process.env[`${prefix}_SEARCH_URL`] ?? defaults.searchUrl;
  const queryParam = process.env[`${prefix}_QUERY_PARAM`] ?? defaults.queryParam;
  const currency = process.env[`${prefix}_CURRENCY`] ?? defaults.currency;
  const headers = parseKeyValuePairs(process.env[`${prefix}_HEADERS`]);
  const staticParams = parseQueryParams(process.env[`${prefix}_STATIC_PARAMS`]);
  const delayMs = parseNumber(process.env[`${prefix}_DELAY_MS`]);
  const timeoutMs = parseNumber(process.env[`${prefix}_TIMEOUT_MS`]);

  const url = ensureUrl(searchUrl);

  return {
    searchUrl: url.toString(),
    queryParam,
    currency,
    headers,
    staticParams,
    delayMs,
    timeoutMs,
    origin: url.origin,
  };
};

export const buildSearchUrl = (
  baseUrl: string,
  queryParam: string,
  query: string,
  staticParams: Record<string, string>
) => {
  const url = ensureUrl(baseUrl);
  url.searchParams.set(queryParam, query);
  for (const [key, value] of Object.entries(staticParams)) {
    if (!url.searchParams.has(key)) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
};

const STATIC_DEFAULT_HEADERS: Readonly<Record<string, string>> = Object.freeze({
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
});

const DEFAULT_REFERER_FALLBACK = 'https://atlas-taman.dev';

const createDefaultHeaders = (targetUrl: string) => {
  const headers: Record<string, string> = { ...STATIC_DEFAULT_HEADERS };

  try {
    const { origin } = new URL(targetUrl);
    headers.Referer = origin;
  } catch (error) {
    headers.Referer = DEFAULT_REFERER_FALLBACK;
  }

  return headers;
};

export const fetchWithConfig = async (
  url: string,
  options: { headers?: Record<string, string>; timeoutMs?: number } = {}
) => {
  const controller = options.timeoutMs ? new AbortController() : undefined;
  const timeoutId = options.timeoutMs
    ? setTimeout(() => controller?.abort(), options.timeoutMs)
    : undefined;

  try {
    const mergedHeaders = {
      ...createDefaultHeaders(url),
      ...(options.headers ?? {}),
    };

    const fetchOptions: RequestInit = {
      headers: mergedHeaders,
    };

    if (controller) {
      fetchOptions.signal = controller.signal;
    }

    const response = await fetch(url, fetchOptions);
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Timeout after ${options.timeoutMs}ms for ${url}`);
    }
    throw error;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

export const parsePrice = (input?: string | null) => {
  if (!input) {
    return undefined;
  }
  const sanitized = input
    .replace(/[^0-9,\.\-]/g, '')
    .replace(/,/g, '.')
    .replace(/\.(?=.*\.)/g, '');
  const value = Number.parseFloat(sanitized);
  return Number.isFinite(value) ? value : undefined;
};

const hasClass = (element: Element, className: string) => {
  const classAttr = DomUtils.getAttributeValue(element, 'class');
  if (!classAttr) {
    return false;
  }
  return classAttr
    .split(/\s+/)
    .filter(Boolean)
    .some((value) => value === className);
};

const findChild = (root: Element, tagName: string, className?: string) =>
  DomUtils.findOne(
    (element) => {
      if (element.name !== tagName) {
        return false;
      }
      if (!className) {
        return true;
      }
      return hasClass(element, className);
    },
    root.children,
    true
  );

const resolveUrl = (value: string | undefined, origin: string, fallback: string) => {
  if (!value) {
    return fallback;
  }
  try {
    return new URL(value, origin).toString();
  } catch (error) {
    return fallback;
  }
};

const slugify = (value: string) =>
  normalizeText(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

const parseAvailability = (value?: string | null) => {
  if (!value) {
    return 'unknown' as const;
  }
  const normalized = normalizeText(value);
  if (normalized.includes('rupture') || normalized.includes('epuise') || normalized.includes('out')) {
    return 'out_of_stock' as const;
  }
  if (normalized.includes('stock') || normalized.includes('available') || normalized.includes('disponible')) {
    return 'in_stock' as const;
  }
  return 'unknown' as const;
};

export interface ParseProductCardsOptions {
  profile: MerchantProfile;
  currency: string;
  origin: string;
}

export const parseProductCards = (
  html: string,
  options: ParseProductCardsOptions
): MerchantOffer[] => {
  const document = parseDocument(html);
  const cards = DomUtils.findAll(
    (element) => element.name === 'article' && hasClass(element, 'product-card'),
    document.children
  );

  const offers: MerchantOffer[] = [];
  for (const card of cards) {
    const productId = DomUtils.getAttributeValue(card, 'data-product-id');
    const slugAttr = DomUtils.getAttributeValue(card, 'data-product-slug');
    const titleFromNode = findChild(card, 'h3', 'product-title');
    const title = titleFromNode ? DomUtils.textContent(titleFromNode).trim() : '';
    const slug = slugAttr || slugify(title);
    const priceAttr = DomUtils.getAttributeValue(card, 'data-price');
    const price = parsePrice(priceAttr);

    if (!productId || !slug || !title || typeof price === 'undefined') {
      continue;
    }

    const brandNode = findChild(card, 'span', 'product-brand');
    const categoryNode = findChild(card, 'span', 'product-category');
    const shippingAttr = DomUtils.getAttributeValue(card, 'data-shipping-fee');
    const shippingFee = parsePrice(shippingAttr);
    const availabilityAttr = DomUtils.getAttributeValue(card, 'data-availability');
    const availability = parseAvailability(availabilityAttr);
    const currencyAttr = DomUtils.getAttributeValue(card, 'data-currency');

    const imageNode = findChild(card, 'img');
    const image = imageNode
      ? DomUtils.getAttributeValue(imageNode, 'src') || DomUtils.getAttributeValue(imageNode, 'data-src')
      : undefined;
    const url = DomUtils.getAttributeValue(card, 'data-product-url');

    offers.push({
      offerId: `${options.profile.id}-${productId}`,
      merchant: options.profile,
      productId,
      slug,
      title,
      brand: brandNode ? DomUtils.textContent(brandNode).trim() || undefined : undefined,
      category: categoryNode ? DomUtils.textContent(categoryNode).trim() || undefined : undefined,
      image: image ? resolveUrl(image, options.origin, options.profile.url) : undefined,
      price,
      currency: (currencyAttr ?? options.currency).toUpperCase(),
      shippingFee: typeof shippingFee === 'number' ? shippingFee : undefined,
      availability,
      url: resolveUrl(url, options.origin, options.profile.url),
      scrapedAt: new Date().toISOString(),
    });
  }

  return offers;
};

export const createRateLimiter = (minimumIntervalMs: number) => {
  const lastInvocations = new Map<string, number>();
  return async (key: string) => {
    if (minimumIntervalMs <= 0) {
      lastInvocations.set(key, Date.now());
      return;
    }
    const now = Date.now();
    const last = lastInvocations.get(key) ?? 0;
    const delta = now - last;
    if (delta < minimumIntervalMs) {
      await delay(minimumIntervalMs - delta);
    }
    lastInvocations.set(key, Date.now());
  };
};

export interface ProductCardIntegrationOptions {
  merchantId: MerchantId;
  label: string;
  defaultSearchUrl: string;
  defaultQueryParam?: string;
  defaultCurrency?: string;
}

export const createProductCardIntegration = (
  options: ProductCardIntegrationOptions
): MerchantIntegration => {
  const profile = merchantProfiles[options.merchantId];
  const defaultQueryParam = options.defaultQueryParam ?? 'q';
  const defaultCurrency = options.defaultCurrency ?? 'MAD';

  return {
    id: profile.id,
    label: options.label,
    profile,
    async search(query: string) {
      const trimmedQuery = query.trim();
      if (!trimmedQuery) {
        return [];
      }

      const config = getMerchantHttpConfig(options.merchantId, {
        searchUrl: options.defaultSearchUrl,
        queryParam: defaultQueryParam,
        currency: defaultCurrency,
      });

      if (config.delayMs) {
        await delay(config.delayMs);
      }

      const url = buildSearchUrl(config.searchUrl, config.queryParam, trimmedQuery, config.staticParams);
      const response = await fetchWithConfig(url, {
        headers: config.headers,
        timeoutMs: config.timeoutMs,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} when fetching ${profile.id} catalogue`);
      }

      const html = await response.text();
      return parseProductCards(html, {
        profile,
        currency: config.currency,
        origin: config.origin,
      });
    },
  };
};
