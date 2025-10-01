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

const profile = merchantProfiles.decathlon;

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

const parseDecathlonOffers = (html: string, options: ParseOptions): MerchantOffer[] => {
  const document = parseDocument(html);
  const offers: MerchantOffer[] = [];

  const products = DomUtils.findAll(
    (node): node is Element =>
      isTag(node) && (hasClass(node, 'plp-product') || hasClass(node, 'product-card') || hasClass(node, 'plp-product-card')),
    document.children
  );

  for (const product of products) {
    const productId =
      DomUtils.getAttributeValue(product, 'data-product-sku') ??
      DomUtils.getAttributeValue(product, 'data-product-id') ??
      DomUtils.getAttributeValue(product, 'data-sku');

    const link = findFirst(product, (element) => hasClass(element, 'plp-product__main-link') || hasClass(element, 'product-card__link'))
      ?? findFirst(product, (element) => element.name === 'a');
    const titleNode =
      (link && findFirst(link, (element) => hasClass(element, 'plp-product__title') || hasClass(element, 'product-card__title')))
        ?? findFirst(product, (element) => hasClass(element, 'plp-product__title') || hasClass(element, 'product-card__title'))
        ?? findFirst(product, (element) => element.name === 'h2' || element.name === 'h3');
    const title = getText(titleNode);
    const priceNode =
      findFirst(product, (element) => hasClass(element, 'plp-product-price__current')) ??
      findFirst(product, (element) => hasClass(element, 'product-card__price')) ??
      findFirst(product, (element) => hasClass(element, 'price'));
    const priceText = priceNode ? getText(priceNode) : '';
    const price = parsePrice(priceText);

    if (!productId || !title || typeof price !== 'number') {
      continue;
    }

    const brand = getText(findFirst(product, (element) => hasClass(element, 'plp-product__brand') || hasClass(element, 'product-card__brand')));
    const category = getText(
      findFirst(product, (element) => hasClass(element, 'plp-product__sport') || hasClass(element, 'product-card__category'))
    );

    const imageNode = findFirst(product, (element) => element.name === 'img');
    const imageSrc =
      (imageNode &&
        (DomUtils.getAttributeValue(imageNode, 'data-src') ??
          DomUtils.getAttributeValue(imageNode, 'data-srcset') ??
          DomUtils.getAttributeValue(imageNode, 'src')))
        || undefined;

    const shippingNode = findFirst(product, (element) => hasClass(element, 'plp-product__delivery') || hasClass(element, 'delivery'));
    const shippingText = shippingNode ? getText(shippingNode) : undefined;
    const shippingFee = parseShippingFee(shippingText);

    const availabilityNode = findFirst(product, (element) => hasClass(element, 'plp-product__availability') || hasClass(element, 'availability'));
    const availabilityText = availabilityNode ? getText(availabilityNode) : undefined;
    const currencyAttr = DomUtils.getAttributeValue(product, 'data-currency');

    const href = (link && DomUtils.getAttributeValue(link, 'href')) ?? DomUtils.getAttributeValue(product, 'data-url') ?? '';
    const slugSource =
      DomUtils.getAttributeValue(product, 'data-product-sku') ??
      DomUtils.getAttributeValue(product, 'data-url-key') ??
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

export const decathlonIntegration: MerchantIntegration = {
  id: profile.id,
  label: 'Decathlon',
  profile,
  async search(query: string) {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return [];
    }

    const config = getMerchantHttpConfig('decathlon', {
      searchUrl: 'https://www.decathlon.ma/search',
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
    return parseDecathlonOffers(html, { origin: config.origin, currency: config.currency });
  },
};
