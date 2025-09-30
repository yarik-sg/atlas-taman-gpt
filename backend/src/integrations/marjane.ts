import { createProductCardIntegration } from './utils';

export const marjaneIntegration = createProductCardIntegration({
  merchantId: 'marjane',
  label: 'Marjane',
  defaultSearchUrl: 'https://www.marjane.ma/search',
  defaultQueryParam: 'q',
  defaultCurrency: 'MAD',
});
