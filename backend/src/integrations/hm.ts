import { createProductCardIntegration } from './utils';

export const hmIntegration = createProductCardIntegration({
  merchantId: 'hm',
  label: 'H&M',
  defaultSearchUrl: 'https://www2.hm.com/fr_ma/search-results.html',
  defaultQueryParam: 'q',
  defaultCurrency: 'MAD',
});
