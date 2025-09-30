import { createProductCardIntegration } from './utils';

export const decathlonIntegration = createProductCardIntegration({
  merchantId: 'decathlon',
  label: 'Decathlon',
  defaultSearchUrl: 'https://www.decathlon.ma/search',
  defaultQueryParam: 'q',
  defaultCurrency: 'MAD',
});
