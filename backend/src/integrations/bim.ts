import { createProductCardIntegration } from './utils';

export const bimIntegration = createProductCardIntegration({
  merchantId: 'bim',
  label: 'BIM',
  defaultSearchUrl: 'https://www.bim.ma/recherche',
  defaultQueryParam: 'query',
  defaultCurrency: 'MAD',
});
