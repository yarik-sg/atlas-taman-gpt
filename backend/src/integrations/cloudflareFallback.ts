const CLOUD_FLARE_PATTERNS: RegExp[] = [
  /__cf_chl_jschl_tk__/i,
  /cf-browser-verification/i,
  /attention required!\s*\|\s*cloudflare/i,
  /ddos protection by cloudflare/i,
  /checking your browser before accessing/i,
  /ray id/i,
];

const MAX_BODY_LENGTH = 64 * 1024;

const SOLVER_HTML_KEYS = ['html', 'response'] as const;

const extractHtmlFromSolverPayload = (payload: unknown): string | undefined => {
  if (typeof payload === 'string') {
    return payload;
  }

  if (!payload || typeof payload !== 'object') {
    return undefined;
  }

  const visited = new Set<object>();

  const search = (value: unknown): string | undefined => {
    if (!value || typeof value !== 'object') {
      return undefined;
    }

    const objectValue = value as object;
    if (visited.has(objectValue)) {
      return undefined;
    }

    visited.add(objectValue);

    const record = value as Record<string, unknown>;

    for (const key of SOLVER_HTML_KEYS) {
      const candidate = record[key];
      if (typeof candidate === 'string' && candidate.trim().length > 0) {
        return candidate;
      }
    }

    for (const nested of Object.values(record)) {
      if (nested && typeof nested === 'object') {
        const found = search(nested);
        if (found) {
          return found;
        }
      }
    }

    return undefined;
  };

  return search(payload);
};

export type CloudflareBlockReason = 'status_code' | 'html_marker';

export interface CloudflareBlockDetection {
  blocked: boolean;
  reason?: CloudflareBlockReason;
  statusCode?: number;
  bodyText?: string;
}

export interface CloudflareFallbackConfig {
  solverUrl: string;
  apiKey?: string;
  timeoutMs?: number;
}

export interface CloudflareFallbackOverrides {
  solverUrl?: string;
  apiKey?: string;
  timeoutMs?: number;
}

const readBodySafely = async (response: Response): Promise<string | undefined> => {
  try {
    return await response.text();
  } catch (error) {
    return undefined;
  }
};

const sliceBody = (body?: string) => {
  if (typeof body !== 'string') {
    return undefined;
  }
  if (body.length <= MAX_BODY_LENGTH) {
    return body;
  }
  return body.slice(0, MAX_BODY_LENGTH);
};

const resolveEnvNumber = (value?: string | null) => {
  if (!value) {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const buildFallbackConfig = (
  overrides?: CloudflareFallbackOverrides
): CloudflareFallbackConfig | undefined => {
  const solverUrl = overrides?.solverUrl ?? process.env.CLOUDFLARE_FALLBACK_URL;
  if (!solverUrl) {
    return undefined;
  }

  const apiKey = overrides?.apiKey ?? process.env.CLOUDFLARE_FALLBACK_API_KEY;
  const timeoutMs =
    overrides?.timeoutMs ?? resolveEnvNumber(process.env.CLOUDFLARE_FALLBACK_TIMEOUT_MS);

  return { solverUrl, apiKey, timeoutMs };
};

export const detectCloudflareBlock = async (
  response: Response
): Promise<CloudflareBlockDetection> => {
  const statusCode = response.status;
  const contentType = response.headers.get('content-type') ?? '';
  const isHtml = /html/i.test(contentType);

  if (statusCode === 403 || statusCode === 503) {
    const bodyText = await readBodySafely(response.clone());
    return {
      blocked: true,
      reason: 'status_code',
      statusCode,
      bodyText,
    };
  }

  if (!isHtml) {
    return { blocked: false };
  }

  const bodyText = await readBodySafely(response.clone());
  if (!bodyText) {
    return { blocked: false };
  }

  if (CLOUD_FLARE_PATTERNS.some((pattern) => pattern.test(bodyText))) {
    return {
      blocked: true,
      reason: 'html_marker',
      statusCode,
      bodyText,
    };
  }

  return { blocked: false };
};

export const triggerCloudflareFallback = async (
  params: {
    url: string;
    headers: Record<string, string>;
    detection: CloudflareBlockDetection;
    overrides?: CloudflareFallbackOverrides;
  },
  fetchImpl: typeof fetch = fetch
): Promise<Response | undefined> => {
  const config = buildFallbackConfig(params.overrides);
  if (!config) {
    return undefined;
  }

  const controller = config.timeoutMs ? new AbortController() : undefined;
  const timeoutId = config.timeoutMs
    ? setTimeout(() => controller?.abort(), config.timeoutMs)
    : undefined;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (config.apiKey) {
    (headers as Record<string, string>)['x-api-key'] = config.apiKey;
  }

  const payload = {
    url: params.url,
    headers: params.headers,
    reason: params.detection.reason,
    statusCode: params.detection.statusCode,
    originalBody: sliceBody(params.detection.bodyText),
  };

  const requestInit: RequestInit = {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    signal: controller?.signal,
  };

  try {
    const response = await fetchImpl(config.solverUrl, requestInit);

    if (!response.ok) {
      return undefined;
    }

    const contentType = response.headers.get('content-type') ?? '';
    const raw = await response.text();
    let html: string | undefined;

    if (/json/i.test(contentType)) {
      try {
        const data = JSON.parse(raw);
        html = extractHtmlFromSolverPayload(data);
      } catch (error) {
        html = undefined;
      }
    }

    if (!html) {
      html = raw;
    }

    if (!html || html.trim().length === 0) {
      return undefined;
    }

    const fallbackHeaders = new Headers({
      'content-type': 'text/html; charset=utf-8',
      'x-atlas-cloudflare-fallback': '1',
    });

    return new Response(html, { status: 200, headers: fallbackHeaders });
  } catch (error) {
    return undefined;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};
