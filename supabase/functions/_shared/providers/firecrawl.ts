import { ProviderError, type FetchedContent } from "./types.ts";

const MINIMUM_CONTENT_LENGTH = 500;
const DEFAULT_BASE_URL = "https://api.firecrawl.dev/v2";
const INTERSTITIAL_PATTERNS = [
  /subscribe to continue/i,
  /sign in to continue/i,
  /enable javascript/i,
  /access denied/i,
  /page not found/i,
  /404 not found/i,
];

interface FirecrawlInput {
  apiKey: string;
  url: string;
  baseUrl?: string;
  fetcher?: typeof fetch;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function optionalNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isUsableArticle(content: string): boolean {
  if (content.length < MINIMUM_CONTENT_LENGTH) return false;
  const opening = content.slice(0, 1_500);
  return !INTERSTITIAL_PATTERNS.some((pattern) => pattern.test(opening));
}

export async function fetchArticleWithFirecrawl({
  apiKey,
  url,
  baseUrl = DEFAULT_BASE_URL,
  fetcher = fetch,
}: FirecrawlInput): Promise<FetchedContent> {
  let response: Response;
  try {
    response = await fetcher(`${baseUrl.replace(/\/+$/, "")}/scrape`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    throw new ProviderError("Firecrawl request could not be completed", true, {
      cause: error,
    });
  }

  if (!response.ok) {
    const retryable = response.status === 429 || response.status >= 500;
    throw new ProviderError(`Firecrawl request failed (${response.status})`, retryable);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch (error) {
    throw new ProviderError("Firecrawl returned an invalid response", true, {
      cause: error,
    });
  }

  const responsePayload = isRecord(payload) ? payload : null;
  const data = responsePayload && isRecord(responsePayload.data) ? responsePayload.data : null;
  const metadata = data && isRecord(data.metadata) ? data.metadata : {};
  const content = data ? optionalString(data.markdown) : null;
  const statusCode = optionalNumber(metadata.statusCode);

  if (
    !data ||
    responsePayload?.success !== true ||
    !content ||
    (statusCode !== null && statusCode >= 400) ||
    !isUsableArticle(content)
  ) {
    throw new ProviderError("Article content is unavailable or too short", false);
  }

  const providerMetadata: FetchedContent["providerMetadata"] = {
    provider: "firecrawl",
  };
  const sourceUrl = optionalString(metadata.sourceURL) ?? optionalString(metadata.url);
  const cacheState = optionalString(metadata.cacheState);
  const cachedAt = optionalString(metadata.cachedAt);
  if (sourceUrl) providerMetadata.sourceUrl = sourceUrl;
  if (statusCode !== null) providerMetadata.statusCode = statusCode;
  if (cacheState) providerMetadata.cacheState = cacheState;
  if (cachedAt) providerMetadata.cachedAt = cachedAt;

  return {
    content,
    title: optionalString(metadata.title),
    author: optionalString(metadata.author) ?? optionalString(metadata.byline),
    providerMetadata,
  };
}
