import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import type { CheerioAPI } from "cheerio";

export interface ExtractedArticle {
  title: string;
  category: string | null;
  language: string;
  contentHtml: string; // cleaned HTML, main content only
}

// Elements that never carry article content, regardless of the source site.
const NOISE_SELECTORS = [
  "script",
  "style",
  "noscript",
  "iframe",
  "form",
  "nav",
  "header",
  "footer",
  "aside",
  "svg",
  "button",
  "input",
  "select",
  ".navbox",
  ".vertical-navbox",
  ".infobox",
  ".metadata",
  ".ambox",
  ".hatnote",
  ".mw-editsection",
  ".reference",
  ".reflist",
  "sup.reference",
  ".toc",
  "#toc",
  ".mw-jump-link",
  ".noprint",
  ".printfooter",
  ".catlinks",
  ".mw-references-wrap",
  "[role='navigation']",
  "[role='banner']",
  "[role='contentinfo']",
  ".advertisement",
  ".ad",
  ".cookie-banner",
  ".site-header",
  ".site-footer",
  ".breadcrumbs",
  ".share-buttons",
  ".comments",
];

// Candidate containers for "main article body", checked in priority order.
const CONTENT_SELECTORS = [
  "#mw-content-text .mw-parser-output",
  "#mw-content-text",
  "article",
  "main article",
  "main",
  "#content",
  ".article-content",
  ".entry-content",
  "#bodyContent",
];

function scoreElement($: CheerioAPI, el: AnyNode): number {
  const $el = $(el);
  const text = $el.text().trim();
  const paragraphCount = $el.find("p").length;
  const linkDensity = computeLinkDensity($, $el);
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  // Favor elements with substantial prose and low link density.
  return wordCount * (1 - linkDensity) + paragraphCount * 25;
}

function computeLinkDensity($: CheerioAPI, $el: cheerio.Cheerio<AnyNode>): number {
  const textLength = $el.text().trim().length || 1;
  const linkLength = $el
    .find("a")
    .toArray()
    .reduce((sum, a) => sum + $(a).text().trim().length, 0);
  return Math.min(1, linkLength / textLength);
}

function pickMainElement($: CheerioAPI): cheerio.Cheerio<AnyNode> {
  for (const selector of CONTENT_SELECTORS) {
    const el = $(selector).first();
    if (el.length && el.text().trim().length > 200) {
      return el;
    }
  }

  // Fallback: score every reasonably-sized block-level container and take the best.
  let best: AnyNode | null = null;
  let bestScore = -Infinity;
  $("div, section, td").each((_, el) => {
    const score = scoreElement($, el);
    if (score > bestScore) {
      bestScore = score;
      best = el;
    }
  });

  return best ? $(best) : $("body");
}

function detectLanguage($: CheerioAPI): string {
  const htmlLang = $("html").attr("lang");
  if (htmlLang) return htmlLang.split("-")[0]!.toLowerCase();
  return "en";
}

function detectCategory($: CheerioAPI): string | null {
  // Wikipedia-style category links.
  const catLink = $("#catlinks a, .mw-normal-catlinks a").first().text().trim();
  if (catLink) return catLink;

  // Common breadcrumb pattern.
  const breadcrumb = $(
    "[class*='breadcrumb'] li:last-child, [class*='breadcrumb'] a:last-child"
  )
    .first()
    .text()
    .trim();
  if (breadcrumb) return breadcrumb;

  // <meta property="article:section">
  const metaSection = $("meta[property='article:section']").attr("content");
  if (metaSection) return metaSection.trim();

  return null;
}

function detectTitle($: CheerioAPI): string {
  const h1 = $("#firstHeading, article h1, main h1, h1").first().text().trim();
  if (h1) return h1;
  const ogTitle = $("meta[property='og:title']").attr("content");
  if (ogTitle) return ogTitle.trim();
  const titleTag = $("title").first().text().trim();
  return titleTag || "Untitled Article";
}

/**
 * Parses raw HTML and returns the isolated main-content region plus basic
 * metadata. This performs *extraction* only — it never rewrites or generates
 * prose, it only removes chrome (navigation, ads, edit links, citations)
 * around content that already exists on the page.
 */
export function extractMainContent(html: string): ExtractedArticle {
  const $ = cheerio.load(html);

  const language = detectLanguage($);
  const title = detectTitle($);
  const category = detectCategory($);

  $(NOISE_SELECTORS.join(",")).remove();

  const main = pickMainElement($);

  // Drop the first heading inside the main region if it duplicates the title
  // (very common on encyclopedia-style pages) to avoid a repeated H1.
  const firstHeading = main.find("h1, h2").first();
  if (firstHeading.length && firstHeading.text().trim() === title) {
    firstHeading.remove();
  }

  return {
    title,
    category,
    language,
    contentHtml: main.html() ?? "",
  };
}
