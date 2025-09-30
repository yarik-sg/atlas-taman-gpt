import { createProductCardIntegration } from './utils';

export const jumiaIntegration = createProductCardIntegration({
  merchantId: 'jumia',
  label: 'Jumia',
  defaultSearchUrl: 'https://www.jumia.ma/catalog/',
  defaultQueryParam: 'q',
  defaultCurrency: 'MAD',
});
