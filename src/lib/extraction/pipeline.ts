import { fetchArticleHtml } from "./fetch-article";
import { extractMainContent } from "./extract-content";
import { htmlToMarkdown } from "./html-to-markdown";
import { computeContentMetrics, scoreExtractionQuality } from "./metrics";
import type { NewArticleData } from "@/lib/firestore/queries";

/**
 * Runs the full import pipeline for a URL: fetch -> extract -> convert ->
 * measure -> score. Returns data shaped for direct insertion via
 * `insertArticle`. Throws `ArticleFetchError` on network/URL failures.
 */
export async function runExtractionPipeline(sourceUrl: string): Promise<NewArticleData> {
  const { html, htmlSizeBytes } = await fetchArticleHtml(sourceUrl);
  const extracted = extractMainContent(html);
  const { markdown, sectionCount } = htmlToMarkdown(extracted.contentHtml);
  const { charCount, wordCount, estimatedTokens } = computeContentMetrics(markdown);

  const extractionQuality = scoreExtractionQuality({
    wordCount,
    sectionCount,
    htmlSizeBytes,
    charCount,
    hasTitle: Boolean(extracted.title && extracted.title !== "Untitled Article"),
  });

  const excerpt = markdown
    .replace(/^#{1,6}\s+.*$/gm, "")
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .find((b) => b.length > 40)
    ?.slice(0, 220) ?? "";

  return {
    sourceUrl,
    title: extracted.title,
    category: extracted.category,
    language: extracted.language,
    status: wordCount < 30 ? "failed" : "draft",
    extractionQuality,
    htmlSizeBytes,
    wordCount,
    charCount,
    estimatedTokens,
    sectionCount,
    content: markdown,
    excerpt,
    errorMessage: wordCount < 30 ? "Extraction produced too little content to be usable." : null,
  };
}
