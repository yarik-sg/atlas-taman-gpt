import { createIntegrationFromFixtures } from './utils';
import { MerchantIntegration } from './types';

export const createDefaultIntegrations = (): MerchantIntegration[] => [
  createIntegrationFromFixtures('electroplanet', 'Electroplanet', 'https://www.electroplanet.ma/catalogsearch/result/?q='),
  createIntegrationFromFixtures('jumia', 'Jumia', 'https://www.jumia.ma/catalog/?q='),
  createIntegrationFromFixtures('marjane', 'Marjane', 'https://www.marjane.ma/search?q='),
  createIntegrationFromFixtures('bim', 'BIM', 'https://www.bim.ma/recherche?query='),
  createIntegrationFromFixtures('decathlon', 'Decathlon', 'https://www.decathlon.ma/search?q='),
  createIntegrationFromFixtures('hm', 'H&M', 'https://www2.hm.com/fr_ma/search-results.html?q='),
];

export * from './types';
