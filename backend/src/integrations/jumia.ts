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

const profile = merchantProfiles.jumia;

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

const parseJumiaOffers = (html: string, options: ParseOptions): MerchantOffer[] => {
  const document = parseDocument(html);
  const offers: MerchantOffer[] = [];

  const products = DomUtils.findAll(
    (node): node is Element =>
      isTag(node) && (hasClass(node, 'prd') || hasClass(node, 'c-prd')),
    document.children
  );

  for (const product of products) {
    const productId =
      DomUtils.getAttributeValue(product, 'data-sku') ?? DomUtils.getAttributeValue(product, 'data-id');
    const link = findFirst(product, (element) => hasClass(element, 'core') || hasClass(element, 'link'));
    const titleNode = link ?? findFirst(product, (element) => hasClass(element, 'name') || hasClass(element, 'title'));
    const title = getText(titleNode);
    const priceNode = findFirst(product, (element) => hasClass(element, 'prc') || hasClass(element, 'price'));
    const priceText = getText(priceNode);
    const price = parsePrice(priceText);

    if (!productId || !title || typeof price !== 'number') {
      continue;
    }

    const brandAttr = DomUtils.getAttributeValue(product, 'data-brand');
    const brand = brandAttr ?? getText(findFirst(product, (element) => hasClass(element, 'brand')));
    const categoryAttr = DomUtils.getAttributeValue(product, 'data-category');
    const category = categoryAttr ?? getText(findFirst(product, (element) => hasClass(element, 'cat')));

    const imageNode = findFirst(product, (element) => element.name === 'img');
    const imageSrc =
      (imageNode &&
        (DomUtils.getAttributeValue(imageNode, 'data-src') ??
          DomUtils.getAttributeValue(imageNode, 'data-srcset') ??
          DomUtils.getAttributeValue(imageNode, 'src')))
        || undefined;

    const shippingNode = findFirst(product, (element) => hasClass(element, 'shp') || hasClass(element, 'delivery'));
    const shippingText = shippingNode ? getText(shippingNode) : undefined;
    const shippingFee = parseShippingFee(shippingText);

    const availabilityNode = findFirst(product, (element) => hasClass(element, 'stk') || hasClass(element, 'availability'));
    const availabilityText = availabilityNode ? getText(availabilityNode) : undefined;
    const currencyAttr = DomUtils.getAttributeValue(product, 'data-currency');

    const href =
      (link && DomUtils.getAttributeValue(link, 'href')) ?? DomUtils.getAttributeValue(product, 'data-url') ?? '';
    const slugSource =
      DomUtils.getAttributeValue(product, 'data-name') ??
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

export const jumiaIntegration: MerchantIntegration = {
  id: profile.id,
  label: 'Jumia',
  profile,
  async search(query: string) {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return [];
    }

    const config = getMerchantHttpConfig('jumia', {
      searchUrl: 'https://www.jumia.ma/catalog/',
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
    return parseJumiaOffers(html, { origin: config.origin, currency: config.currency });
  },
};
