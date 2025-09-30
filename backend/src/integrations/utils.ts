import { MerchantFixture, merchantFixtures, merchantProfiles } from './fixtures/merchantData';
import { MerchantIntegration, MerchantOffer } from './types';

const LIVE_DATA_FLAG = 'USE_LIVE_MERCHANT_APIS';

const fetchImpl: typeof fetch = (...args) => {
  if (typeof fetch === 'undefined') {
    throw new Error('Global fetch is not available');
  }
  return fetch(...args);
};

export const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export const normalizeQuery = (query: string) => normalizeText(query.trim());

export const filterFixturesByQuery = (merchantId: string, query: string): MerchantFixture[] => {
  const fixtures = merchantFixtures[merchantId] ?? [];
  if (!query) {
    return fixtures;
  }

  const normalizedQuery = normalizeQuery(query);
  return fixtures.filter((item) => {
    const haystack = normalizeText(
      [item.slug, item.title, item.brand, item.category, ...(item.keywords ?? [])].join(' ')
    );
    return normalizedQuery
      .split(/\s+/)
      .filter(Boolean)
      .every((term) => haystack.includes(term));
  });
};

export const shouldUseLiveData = () => process.env[LIVE_DATA_FLAG] === 'true';

const buildFixtureHtml = (merchantId: string, fixtures: MerchantFixture[]) => {
  const merchant = merchantProfiles[merchantId];
  const articles = fixtures
    .map((item) => `
      <article class="product-card" data-merchant-id="${merchant.id}" data-merchant-name="${merchant.name}" data-merchant-url="${merchant.url}" data-merchant-logo="${merchant.logoUrl ?? ''}" data-product-id="${item.productId}" data-product-slug="${item.slug}" data-product-url="${item.url}" data-price="${item.price}" data-currency="${item.currency}" data-shipping-fee="${item.shippingFee ?? ''}" data-availability="${item.availability}">
        <h3 class="product-title">${item.title}</h3>
        <span class="product-brand">${item.brand}</span>
        <span class="product-category">${item.category}</span>
        <img class="product-image" src="${item.image}" alt="${item.title}" />
      </article>
    `)
    .join('');

  return `<section class="catalog">${articles}</section>`;
};

const attributePattern = /([a-zA-Z0-9-:]+)="([^"]*)"/g;

const extractAttributes = (fragment: string) => {
  const attributes: Record<string, string> = {};
  fragment.replace(attributePattern, (_, key, value) => {
    attributes[key] = value;
    return '';
  });
  return attributes;
};

const extractText = (html: string, selector: string) => {
  const regex = new RegExp(`<${selector}[^>]*>([\\s\\S]*?)<\\/${selector}>`, 'i');
  const match = regex.exec(html);
  return match ? match[1].trim() : '';
};

const extractImageSrc = (html: string) => {
  const match = /<img[^>]*class="product-image"[^>]*src="([^"]*)"/i.exec(html);
  return match ? match[1] : undefined;
};

export const parseOffersFromHtml = (merchantId: string, html: string): MerchantOffer[] => {
  const merchant = merchantProfiles[merchantId];
  const offers: MerchantOffer[] = [];
  const articleRegex = /<article class="product-card"([^>]*)>([\s\S]*?)<\/article>/g;
  let match: RegExpExecArray | null;

  while ((match = articleRegex.exec(html)) !== null) {
    const [, attributesRaw, body] = match;
    const attributes = extractAttributes(attributesRaw);
    const productId = attributes['data-product-id'];
    const slug = attributes['data-product-slug'];
    const price = Number(attributes['data-price']);
    const currency = (attributes['data-currency'] ?? 'MAD').toUpperCase();
    const shippingFeeAttr = attributes['data-shipping-fee'];
    const shippingFee = shippingFeeAttr ? Number(shippingFeeAttr) : undefined;
    const availabilityAttr = attributes['data-availability'];
    const availability = availabilityAttr === 'out_of_stock'
      ? 'out_of_stock'
      : availabilityAttr === 'in_stock'
      ? 'in_stock'
      : 'unknown';

    const title = extractText(body, 'h3');
    const brandMatch = /<span class="product-brand">([\s\S]*?)<\/span>/i.exec(body);
    const brand = brandMatch ? brandMatch[1].trim() : '';
    const categoryMatch = /<span class="product-category">([\s\S]*?)<\/span>/i.exec(body);
    const category = categoryMatch ? categoryMatch[1].trim() : '';
    const image = extractImageSrc(body);
    const url = attributes['data-product-url'] ?? merchant.url;

    if (!productId || !slug || !title || Number.isNaN(price)) {
      continue;
    }

    offers.push({
      offerId: `${merchant.id}-${productId}`,
      merchant,
      productId,
      slug,
      title,
      brand: brand || undefined,
      category: category || undefined,
      image,
      price,
      currency,
      shippingFee,
      availability,
      url,
      scrapedAt: new Date().toISOString(),
    });
  }

  return offers;
};

export const fetchHtmlForMerchant = async (
  merchantId: string,
  searchUrl: string,
  query: string
): Promise<string> => {
  if (shouldUseLiveData()) {
    const response = await fetchImpl(`${searchUrl}${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.text();
  }

  const fixtures = filterFixturesByQuery(merchantId, query);
  return buildFixtureHtml(merchantId, fixtures);
};

export const createIntegrationFromFixtures = (
  merchantId: keyof typeof merchantFixtures,
  label: string,
  searchUrl: string
): MerchantIntegration => {
  const profile = merchantProfiles[merchantId];
  return {
    id: merchantId,
    label,
    profile,
    async search(query: string) {
      const html = await fetchHtmlForMerchant(merchantId, searchUrl, query);
      return parseOffersFromHtml(merchantId, html);
    },
  };
};
