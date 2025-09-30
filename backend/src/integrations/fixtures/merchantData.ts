import { MerchantAvailability, MerchantProfile } from '../types';

export interface MerchantFixture {
  productId: string;
  slug: string;
  title: string;
  brand: string;
  category: string;
  image: string;
  price: number;
  currency: string;
  shippingFee?: number;
  availability: MerchantAvailability;
  url: string;
  keywords: string[];
}

export const merchantProfiles: Record<string, MerchantProfile> = {
  electroplanet: {
    id: 'electroplanet',
    name: 'Electroplanet',
    url: 'https://www.electroplanet.ma',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/73/Electroplanet_logo.png',
  },
  jumia: {
    id: 'jumia',
    name: 'Jumia',
    url: 'https://www.jumia.ma',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/0d/Jumia-Logo.png',
  },
  marjane: {
    id: 'marjane',
    name: 'Marjane',
    url: 'https://www.marjane.ma',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/fr/8/80/Marjane_logo.png',
  },
  bim: {
    id: 'bim',
    name: 'BIM',
    url: 'https://www.bim.ma',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d3/Bim_logo.png',
  },
  decathlon: {
    id: 'decathlon',
    name: 'Decathlon',
    url: 'https://www.decathlon.ma',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Decathlon_Logo.svg',
  },
  hm: {
    id: 'hm',
    name: 'H&M',
    url: 'https://www2.hm.com',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/53/H%26M-Logo.svg',
  },
};

const sharedProducts: MerchantFixture[] = [
  {
    productId: 'iphone-15-pro-128gb',
    slug: 'iphone-15-pro-128gb',
    title: 'Apple iPhone 15 Pro 128GB',
    brand: 'Apple',
    category: 'Smartphones',
    image: 'https://images.atlas-taman.dev/mock/iphone-15-pro.jpg',
    price: 13499,
    currency: 'MAD',
    shippingFee: 0,
    availability: 'in_stock',
    url: 'https://example.com/iphone-15-pro',
    keywords: ['iphone', 'apple', 'smartphone', '15 pro'],
  },
  {
    productId: 'samsung-galaxy-s24-ultra',
    slug: 'samsung-galaxy-s24-ultra',
    title: 'Samsung Galaxy S24 Ultra 256GB',
    brand: 'Samsung',
    category: 'Smartphones',
    image: 'https://images.atlas-taman.dev/mock/galaxy-s24-ultra.jpg',
    price: 14999,
    currency: 'MAD',
    shippingFee: 99,
    availability: 'in_stock',
    url: 'https://example.com/samsung-galaxy-s24-ultra',
    keywords: ['s24', 'samsung', 'galaxy', 'ultra'],
  },
  {
    productId: 'playstation-5-slim',
    slug: 'playstation-5-slim',
    title: 'PlayStation 5 Slim',
    brand: 'Sony',
    category: 'Gaming',
    image: 'https://images.atlas-taman.dev/mock/ps5-slim.jpg',
    price: 5799,
    currency: 'MAD',
    shippingFee: 49,
    availability: 'in_stock',
    url: 'https://example.com/playstation-5-slim',
    keywords: ['ps5', 'playstation', 'gaming', 'console'],
  },
  {
    productId: 'hm-linen-shirt',
    slug: 'hm-linen-shirt',
    title: 'Chemise en Lin Homme',
    brand: 'H&M',
    category: 'Mode',
    image: 'https://images.atlas-taman.dev/mock/hm-shirt.jpg',
    price: 399,
    currency: 'MAD',
    shippingFee: 0,
    availability: 'in_stock',
    url: 'https://example.com/hm-linen-shirt',
    keywords: ['chemise', 'lin', 'mode', 'shirt'],
  },
];

const adjustPrices = (base: MerchantFixture[], adjustments: Partial<MerchantFixture>[]): MerchantFixture[] => {
  return base.map((item, index) => ({
    ...item,
    ...(adjustments[index] ?? {}),
  }));
};

export const merchantFixtures: Record<string, MerchantFixture[]> = {
  electroplanet: adjustPrices(sharedProducts, [
    {},
    { price: 15249, shippingFee: 0 },
    { price: 5699, shippingFee: 0 },
    { price: 379, shippingFee: 0 },
  ]),
  jumia: adjustPrices(sharedProducts, [
    { price: 13349, shippingFee: 29 },
    { price: 14899, shippingFee: 49 },
    { price: 5999, shippingFee: 99 },
    { price: 349, shippingFee: 29 },
  ]),
  marjane: adjustPrices(sharedProducts, [
    { price: 13599, shippingFee: 0 },
    { price: 15049, shippingFee: 0 },
    { price: 5899, shippingFee: 0 },
    { price: 409, shippingFee: 0 },
  ]),
  bim: adjustPrices(sharedProducts, [
    { price: 13649, shippingFee: 0 },
    { price: 15149, shippingFee: 0 },
    { price: 5890, shippingFee: 0 },
    { price: 399, shippingFee: 0 },
  ]),
  decathlon: adjustPrices(sharedProducts, [
    { price: 13999, shippingFee: 0 },
    { price: 15499, shippingFee: 0 },
    { price: 5599, shippingFee: 0 },
    { price: 0, availability: 'out_of_stock', shippingFee: 0 },
  ]).map((item) => ({
    ...item,
    category: item.category === 'Gaming' ? 'Sport & Loisirs' : item.category,
    keywords: item.keywords.concat('decathlon'),
  })),
  hm: adjustPrices(sharedProducts, [
    { price: 0, availability: 'out_of_stock', shippingFee: 0 },
    { price: 0, availability: 'out_of_stock', shippingFee: 0 },
    { price: 0, availability: 'out_of_stock', shippingFee: 0 },
    { price: 379, shippingFee: 19 },
  ]).map((item) => ({
    ...item,
    keywords: item.keywords.concat(['vetement', 'h&m']),
    category: item.slug === 'hm-linen-shirt' ? 'Mode' : item.category,
  })),
};
