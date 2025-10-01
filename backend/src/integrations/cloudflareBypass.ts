import { URL } from 'node:url';

const SCRAPINGBEE_DEFAULT_BASE_URL = 'https://app.scrapingbee.com/api/v1/';

export interface SolveMerchantRequestParams {
  url: string;
  headers: Record<string, string>;
  status: number;
  challengeBody?: string;
}

const readJsonFromResponse = async (response: Response) => {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch (error) {
    return undefined;
  }
};

const solveWithScrapingBee = async (
  params: SolveMerchantRequestParams
): Promise<string | undefined> => {
  const apiKey = process.env.SCRAPINGBEE_API_KEY;
  if (!apiKey) {
    return undefined;
  }

  const baseUrl = process.env.SCRAPINGBEE_BASE_URL ?? SCRAPINGBEE_DEFAULT_BASE_URL;
  let requestUrl: URL;
  try {
    requestUrl = new URL(baseUrl);
  } catch (error) {
    requestUrl = new URL(SCRAPINGBEE_DEFAULT_BASE_URL);
  }

  requestUrl.searchParams.set('api_key', apiKey);
  requestUrl.searchParams.set('url', params.url);
  requestUrl.searchParams.set('render_js', process.env.SCRAPINGBEE_RENDER_JS ?? 'false');

  if (process.env.SCRAPINGBEE_COUNTRY_CODE) {
    requestUrl.searchParams.set('country_code', process.env.SCRAPINGBEE_COUNTRY_CODE);
  }
  if (process.env.SCRAPINGBEE_PREMIUM_PROXY) {
    requestUrl.searchParams.set('premium_proxy', process.env.SCRAPINGBEE_PREMIUM_PROXY);
  }
  if (process.env.SCRAPINGBEE_BLOCK_RESOURCES) {
    requestUrl.searchParams.set('block_resources', process.env.SCRAPINGBEE_BLOCK_RESOURCES);
  }

  const response = await fetch(requestUrl, {
    headers: { Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' },
  });

  if (!response.ok) {
    return undefined;
  }

  return await response.text();
};

const solveWithHttpEndpoint = async (
  params: SolveMerchantRequestParams,
  endpoint: string,
  additionalHeaders: Record<string, string> = {}
): Promise<string | undefined> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...additionalHeaders,
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      url: params.url,
      headers: params.headers,
      status: params.status,
      html: params.challengeBody,
    }),
  });

  if (!response.ok) {
    return undefined;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const payload = await readJsonFromResponse(response);
    if (!payload) {
      return undefined;
    }
    const htmlValue =
      payload.html ?? payload.content ?? payload.result ?? payload.body ?? payload.data;
    return typeof htmlValue === 'string' ? htmlValue : undefined;
  }

  return await response.text();
};

const solveWithBrightData = async (
  params: SolveMerchantRequestParams
): Promise<string | undefined> => {
  const endpoint = process.env.BRIGHTDATA_COLLECTOR_URL ?? process.env.MERCHANT_SOLVER_ENDPOINT;
  if (!endpoint) {
    return undefined;
  }

  const headers: Record<string, string> = {};
  const token = process.env.BRIGHTDATA_API_TOKEN ?? process.env.MERCHANT_SOLVER_API_KEY;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const username = process.env.BRIGHTDATA_USERNAME;
  const password = process.env.BRIGHTDATA_PASSWORD;
  if (username && password) {
    const credentials = Buffer.from(`${username}:${password}`).toString('base64');
    headers.Authorization = `Basic ${credentials}`;
  }

  return await solveWithHttpEndpoint(params, endpoint, headers);
};

const solveWithCustomEndpoint = async (
  params: SolveMerchantRequestParams
): Promise<string | undefined> => {
  const endpoint = process.env.MERCHANT_SOLVER_ENDPOINT;
  if (!endpoint) {
    return undefined;
  }

  const headers: Record<string, string> = {};
  const apiKey = process.env.MERCHANT_SOLVER_API_KEY;
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  return await solveWithHttpEndpoint(params, endpoint, headers);
};

export const solveMerchantRequest = async (
  params: SolveMerchantRequestParams
): Promise<string | undefined> => {
  const provider = process.env.MERCHANT_SOLVER_PROVIDER?.toLowerCase();
  if (!provider) {
    return undefined;
  }

  try {
    switch (provider) {
      case 'scrapingbee':
        return await solveWithScrapingBee(params);
      case 'brightdata':
        return await solveWithBrightData(params);
      case 'browser':
      case 'custom':
      case 'http':
        return await solveWithCustomEndpoint(params);
      default:
        return undefined;
    }
  } catch (error) {
    return undefined;
  }
};
