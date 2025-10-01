import { parseDocument, DomUtils } from 'htmlparser2';
import { Element, isTag } from 'domhandler';
import { merchantProfiles } from './fixtures/merchantData';
import { MerchantIntegration, MerchantOffer } from './types';
import {
  buildSearchUrl,
  delay,
  fetchWithConfig,
  getMerchantHttpConfig,
  parseAvailability,
  parsePrice,
  parseShippingFee,
  resolveUrl,
  slugify,
} from './utils';

const profile = merchantProfiles.electroplanet;

interface ParseOptions {
  origin: string;
  currency: string;
}

const hasClass = (element: Element | null | undefined, className: string) => {
  if (!element) {
    return false;
  }
  const classAttr = DomUtils.getAttributeValue(element, 'class');
  if (!classAttr) {
    return false;
  }
  return classAttr
    .split(/\s+/)
    .filter(Boolean)
    .some((value) => value === className);
};

const findFirst = (root: Element, predicate: (element: Element) => boolean) =>
  DomUtils.findOne((node): node is Element => isTag(node) && predicate(node), root.children, true);

const getText = (element: Element | null | undefined) =>
  element ? DomUtils.textContent(element).trim() : '';

const parseElectroplanetOffers = (html: string, options: ParseOptions): MerchantOffer[] => {
  const document = parseDocument(html);
  const offers: MerchantOffer[] = [];

  const products = DomUtils.findAll(
    (node): node is Element =>
      isTag(node) &&
      (hasClass(node, 'product-item') || hasClass(node, 'product-item-info') || node.name === 'li'),
    document.children
  ).filter((element) => hasClass(element, 'product-item'));

  for (const product of products) {
    const info = findFirst(product, (element) => hasClass(element, 'product-item-info')) ?? product;

    const productId =
      DomUtils.getAttributeValue(product, 'data-product-id') ??
      DomUtils.getAttributeValue(product, 'data-sku') ??
      DomUtils.getAttributeValue(info, 'data-product-id');

    const link = findFirst(info, (element) => hasClass(element, 'product-item-link')) ?? undefined;
    const titleNode = link ?? findFirst(info, (element) => hasClass(element, 'product') && hasClass(element, 'name'));
    const title = getText(titleNode);
    const priceNode = findFirst(info, (element) => hasClass(element, 'price-box'));
    const priceValueNode = priceNode ? findFirst(priceNode, (element) => hasClass(element, 'price')) : undefined;
    const priceText = getText(priceValueNode);
    const price = parsePrice(priceText);

    if (!productId || !title || typeof price !== 'number') {
      continue;
    }

    const brand = getText(findFirst(info, (element) => hasClass(element, 'product-brand')));
    const category = getText(findFirst(info, (element) => hasClass(element, 'product-category')));

    const imageNode = findFirst(info, (element) => element.name === 'img');
    const imageSrc =
      (imageNode && (DomUtils.getAttributeValue(imageNode, 'data-src') ?? DomUtils.getAttributeValue(imageNode, 'src')))
        || undefined;

    const shippingNode = findFirst(info, (element) => hasClass(element, 'shipping') || hasClass(element, 'delivery'));
    const shippingText = shippingNode ? getText(shippingNode) : undefined;
    const shippingFee = parseShippingFee(shippingText);

    const availabilityNode = findFirst(info, (element) => hasClass(element, 'stock') || hasClass(element, 'availability'));
    const availabilityText = availabilityNode ? getText(availabilityNode) : undefined;
    const currencyAttr = DomUtils.getAttributeValue(priceValueNode ?? priceNode ?? product, 'data-price-currency');

    const href = (link && DomUtils.getAttributeValue(link, 'href')) ?? DomUtils.getAttributeValue(product, 'data-product-url');
    const slugSource =
      DomUtils.getAttributeValue(product, 'data-url-key') ??
      DomUtils.getAttributeValue(product, 'data-sku') ??
      href ??
      title;
    const slug = slugify(slugSource || title) || slugify(title);

    offers.push({
      offerId: `${profile.id}-${productId}`,
      merchant: profile,
      productId,
      slug,
      title,
      brand: brand || undefined,
      category: category || undefined,
      image: imageSrc ? resolveUrl(imageSrc, options.origin, profile.url) : undefined,
      price,
      currency: (currencyAttr ?? options.currency).toUpperCase(),
      shippingFee: typeof shippingFee === 'number' ? shippingFee : undefined,
      availability: parseAvailability(availabilityText),
      url: resolveUrl(href, options.origin, profile.url),
      scrapedAt: new Date().toISOString(),
    });
  }

  return offers;
};

export const electroplanetIntegration: MerchantIntegration = {
  id: profile.id,
  label: 'Electroplanet',
  profile,
  async search(query: string) {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return [];
    }

    const config = getMerchantHttpConfig('electroplanet', {
      searchUrl: 'https://www.electroplanet.ma/catalogsearch/result/',
      queryParam: 'q',
      currency: 'MAD',
    });

    if (config.delayMs) {
      await delay(config.delayMs);
    }

    const url = buildSearchUrl(config.searchUrl, config.queryParam, trimmedQuery, config.staticParams);
    const { response, failed, fallbackHtml } = await fetchWithConfig(url, {
      headers: config.headers,
      timeoutMs: config.timeoutMs,
      proxyUrl: config.proxyUrl,
    });

    let html: string | undefined;

    if (failed) {
      if (!fallbackHtml) {
        throw new Error(
          `HTTP ${response.status} when fetching ${profile.id} catalogue (challenge not bypassed)`
        );
      }
      html = fallbackHtml;
    } else {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} when fetching ${profile.id} catalogue`);
      }
      html = await response.text();
    }

    if (!html) {
      throw new Error(`Empty response when fetching ${profile.id} catalogue`);
    }
    return parseElectroplanetOffers(html, { origin: config.origin, currency: config.currency });
  },
};
