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

const profile = merchantProfiles.hm;

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

const parseHmOffers = (html: string, options: ParseOptions): MerchantOffer[] => {
  const document = parseDocument(html);
  const offers: MerchantOffer[] = [];

  const products = DomUtils.findAll(
    (node): node is Element =>
      isTag(node) && (hasClass(node, 'product-item') || hasClass(node, 'product')),
    document.children
  );

  for (const product of products) {
    const productId =
      DomUtils.getAttributeValue(product, 'data-articlecode') ??
      DomUtils.getAttributeValue(product, 'data-product-id') ??
      DomUtils.getAttributeValue(product, 'data-sku');

    const link = findFirst(product, (element) => hasClass(element, 'item-link') || hasClass(element, 'product-item__link'))
      ?? findFirst(product, (element) => element.name === 'a');
    const titleNode =
      (link && findFirst(link, (element) => hasClass(element, 'item-heading') || hasClass(element, 'product-item-heading')))
        ?? findFirst(product, (element) => hasClass(element, 'item-heading') || hasClass(element, 'product-item-heading'))
        ?? findFirst(product, (element) => element.name === 'h3');
    const title = getText(titleNode);
    const priceNode =
      findFirst(product, (element) => hasClass(element, 'item-price')) ??
      findFirst(product, (element) => hasClass(element, 'product-item-price')) ??
      findFirst(product, (element) => hasClass(element, 'price'));
    const priceText = priceNode ? getText(priceNode) : '';
    const price = parsePrice(priceText);

    if (!productId || !title || typeof price !== 'number') {
      continue;
    }

    const brand = getText(findFirst(product, (element) => hasClass(element, 'item-brand') || hasClass(element, 'product-item-brand')));
    const category = getText(
      findFirst(product, (element) => hasClass(element, 'item-category') || hasClass(element, 'product-item-category'))
    );

    const imageNode = findFirst(product, (element) => element.name === 'img');
    const imageSrc =
      (imageNode &&
        (DomUtils.getAttributeValue(imageNode, 'data-src') ??
          DomUtils.getAttributeValue(imageNode, 'data-altimage') ??
          DomUtils.getAttributeValue(imageNode, 'src')))
        || undefined;

    const shippingNode = findFirst(product, (element) => hasClass(element, 'item-delivery') || hasClass(element, 'delivery'));
    const shippingText = shippingNode ? getText(shippingNode) : undefined;
    const shippingFee = parseShippingFee(shippingText);

    const availabilityNode = findFirst(product, (element) => hasClass(element, 'item-availability') || hasClass(element, 'availability'));
    const availabilityText = availabilityNode ? getText(availabilityNode) : undefined;
    const currencyAttr = DomUtils.getAttributeValue(product, 'data-currency');

    const href = (link && DomUtils.getAttributeValue(link, 'href')) ?? DomUtils.getAttributeValue(product, 'data-url') ?? '';
    const slugSource =
      DomUtils.getAttributeValue(product, 'data-articlecode') ??
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

export const hmIntegration: MerchantIntegration = {
  id: profile.id,
  label: 'H&M',
  profile,
  async search(query: string) {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return [];
    }

    const config = getMerchantHttpConfig('hm', {
      searchUrl: 'https://www2.hm.com/fr_ma/search-results.html',
      queryParam: 'q',
      currency: 'MAD',
    });

    if (config.delayMs) {
      await delay(config.delayMs);
    }

    const url = buildSearchUrl(config.searchUrl, config.queryParam, trimmedQuery, config.staticParams);
    const response = await fetchWithConfig(url, {
      headers: config.headers,
      timeoutMs: config.timeoutMs,
      proxyUrl: config.proxyUrl,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} when fetching ${profile.id} catalogue`);
    }

    const html = await response.text();
    return parseHmOffers(html, { origin: config.origin, currency: config.currency });
  },
};
