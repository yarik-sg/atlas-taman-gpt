import { createProductCardIntegration } from './utils';

export const electroplanetIntegration = createProductCardIntegration({
  merchantId: 'electroplanet',
  label: 'Electroplanet',
  defaultSearchUrl: 'https://www.electroplanet.ma/catalogsearch/result/',
  defaultQueryParam: 'q',
  defaultCurrency: 'MAD',
});
