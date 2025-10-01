import { merchantProfiles } from './fixtures/merchantData';

import type { Dispatcher } from 'undici';

type ProxyAgentConstructor = new (proxyUrl: string) => Dispatcher;

let proxyAgentCtor: ProxyAgentConstructor | undefined;

const getProxyAgent = (): ProxyAgentConstructor => {
  if (!proxyAgentCtor) {
    try {
      const undici = require('undici') as { ProxyAgent: ProxyAgentConstructor };
      proxyAgentCtor = undici.ProxyAgent;
    } catch (error) {
      throw new Error(
        'Proxy support requires the "undici" package. Install it with `npm install undici` before using *_PROXY_URL`.'
      );
    }
  }
  return proxyAgentCtor;
};

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
  proxyUrl?: string;
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
  const proxyUrlValue = process.env[`${prefix}_PROXY_URL`]?.trim();
  const proxyUrl = proxyUrlValue ? proxyUrlValue : undefined;

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
    proxyUrl,
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

const mergeHeadersWithDefaults = (
  defaults: Record<string, string>,
  overrides: Record<string, string>
) => {
  const merged: Record<string, string> = {};
  const overridesByLowerCase = new Map<string, string>();

  for (const key of Object.keys(overrides)) {
    overridesByLowerCase.set(key.toLowerCase(), key);
  }

  for (const [key, value] of Object.entries(defaults)) {
    if (!overridesByLowerCase.has(key.toLowerCase())) {
      merged[key] = value;
    }
  }

  for (const [key, value] of Object.entries(overrides)) {
    merged[key] = value;
  }

  return merged;
};

export const fetchWithConfig = async (
  url: string,
  options: {
    headers?: Record<string, string>;
    timeoutMs?: number;
    proxyUrl?: string;
  } = {}
) => {
  const controller = options.timeoutMs ? new AbortController() : undefined;
  const timeoutId = options.timeoutMs
    ? setTimeout(() => controller?.abort(), options.timeoutMs)
    : undefined;

  try {
    const mergedHeaders = mergeHeadersWithDefaults(
      createDefaultHeaders(url),
      options.headers ?? {}
    );

    const fetchOptions: RequestInit & { dispatcher?: Dispatcher } = {
      headers: mergedHeaders,
    };

    if (controller) {
      fetchOptions.signal = controller.signal;
    }

    if (options.proxyUrl) {
      const ProxyAgent = getProxyAgent();
      const proxyAgent = new ProxyAgent(options.proxyUrl);
      fetchOptions.dispatcher = proxyAgent;
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

export const parseShippingFee = (input?: string | null) => {
  if (!input) {
    return undefined;
  }
  const price = parsePrice(input);
  if (typeof price === 'number') {
    return price;
  }
  if (/gratuit/i.test(input)) {
    return 0;
  }
  return undefined;
};

export const resolveUrl = (value: string | undefined, origin: string, fallback: string) => {
  if (!value) {
    return fallback;
  }
  try {
    return new URL(value, origin).toString();
  } catch (error) {
    return fallback;
  }
};

export const slugify = (value: string) => {
  if (!value) {
    return '';
  }

  const cleaned = value
    .replace(/https?:\/\/[^/]+/gi, ' ')
    .replace(/[?#].*$/g, ' ')
    .replace(/\.[a-z0-9]+$/gi, ' ')
    .replace(/[_/]+/g, ' ');

  return normalizeText(cleaned)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
};

export const parseAvailability = (value?: string | null) => {
  if (!value) {
    return 'unknown' as const;
  }
  const normalized = normalizeText(value);
  const negativePhrases = [
    'out of stock',
    'out-of-stock',
    'rupture de stock',
    'en rupture de stock',
    'en rupture',
    'stock epuise',
    'stock epuisee',
    'epuise',
    'epuisee',
    'indisponible',
    'non disponible',
    'hors stock',
  ];
  if (negativePhrases.some((phrase) => normalized.includes(phrase))) {
    return 'out_of_stock' as const;
  }
  if (normalized.includes('stock') || normalized.includes('available') || normalized.includes('disponible')) {
    return 'in_stock' as const;
  }
  return 'unknown' as const;
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
