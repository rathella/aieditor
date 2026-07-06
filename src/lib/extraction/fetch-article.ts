const MAX_HTML_BYTES = 8 * 1024 * 1024; // 8 MB safety ceiling
const FETCH_TIMEOUT_MS = 15_000;

export class ArticleFetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ArticleFetchError";
  }
}

export interface FetchedArticle {
  html: string;
  htmlSizeBytes: number;
  finalUrl: string;
}

/**
 * Fetches a public URL and returns its raw HTML, guarding against invalid
 * URLs, non-HTML responses, and oversized payloads. This module intentionally
 * never generates content itself — it only retrieves what is already public
 * at the given address.
 */
export async function fetchArticleHtml(sourceUrl: string): Promise<FetchedArticle> {
  let url: URL;
  try {
    url = new URL(sourceUrl);
  } catch {
    throw new ArticleFetchError("That doesn't look like a valid URL.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new ArticleFetchError("Only http:// and https:// URLs are supported.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; KureDatasetBuilder/1.0; +https://kure.local/bot)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new ArticleFetchError("The request timed out while fetching the article.");
    }
    throw new ArticleFetchError("Could not reach that URL. Check the address and try again.");
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new ArticleFetchError(`The source returned an error (HTTP ${response.status}).`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("html")) {
    throw new ArticleFetchError("That URL did not return an HTML page.");
  }

  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (contentLength && contentLength > MAX_HTML_BYTES) {
    throw new ArticleFetchError("The page is too large to import.");
  }

  const html = await response.text();
  const htmlSizeBytes = Buffer.byteLength(html, "utf8");

  if (htmlSizeBytes > MAX_HTML_BYTES) {
    throw new ArticleFetchError("The page is too large to import.");
  }

  return { html, htmlSizeBytes, finalUrl: response.url || url.toString() };
}
