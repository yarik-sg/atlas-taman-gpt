import { bimIntegration } from './bim';
import { decathlonIntegration } from './decathlon';
import { electroplanetIntegration } from './electroplanet';
import { maybeCreateGoogleProductsIntegration } from './googleProducts';
import { hmIntegration } from './hm';
import { jumiaIntegration } from './jumia';
import { marjaneIntegration } from './marjane';
import { MerchantIntegration } from './types';

export const createDefaultIntegrations = (): MerchantIntegration[] => {
  const integrations: MerchantIntegration[] = [
    electroplanetIntegration,
    jumiaIntegration,
    marjaneIntegration,
    bimIntegration,
    decathlonIntegration,
    hmIntegration,
  ];

  const googleIntegration = maybeCreateGoogleProductsIntegration();
  if (googleIntegration) {
    integrations.push(googleIntegration);
  }

  return integrations;
};

export * from './types';
export * from './electroplanet';
export * from './jumia';
export * from './marjane';
export * from './bim';
export * from './decathlon';
export * from './hm';
export * from './googleProducts';
