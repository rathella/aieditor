export interface ContentMetrics {
  charCount: number;
  wordCount: number;
  estimatedTokens: number;
  paragraphCount: number;
}

export function computeContentMetrics(markdown: string): ContentMetrics {
  const charCount = markdown.length;
  const words = markdown
    .replace(/^#{1,6}\s+/gm, "")
    .split(/\s+/)
    .filter(Boolean);
  const wordCount = words.length;
  // ~4 characters per token is a reasonable cross-model approximation.
  const estimatedTokens = Math.max(1, Math.round(charCount / 4));
  const paragraphCount = markdown
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter((b) => b && !b.startsWith("#")).length;

  return { charCount, wordCount, estimatedTokens, paragraphCount };
}

/**
 * A heuristic 0-100 quality score for how cleanly the article was extracted.
 * This is not a measure of the source's editorial quality — only of how much
 * confidence we have that the extraction isolated real article prose.
 */
export function scoreExtractionQuality(params: {
  wordCount: number;
  sectionCount: number;
  htmlSizeBytes: number;
  charCount: number;
  hasTitle: boolean;
}): number {
  let score = 40;

  if (params.hasTitle) score += 10;

  if (params.wordCount > 2000) score += 25;
  else if (params.wordCount > 800) score += 20;
  else if (params.wordCount > 300) score += 12;
  else if (params.wordCount > 100) score += 5;
  else score -= 15;

  if (params.sectionCount >= 3) score += 10;
  else if (params.sectionCount >= 1) score += 5;

  // Text yield: what fraction of the raw HTML survived as extracted text.
  // Extremely low yield often means we grabbed a chrome-heavy fragment.
  const yieldRatio = params.htmlSizeBytes > 0 ? params.charCount / params.htmlSizeBytes : 0;
  if (yieldRatio > 0.15) score += 15;
  else if (yieldRatio > 0.05) score += 8;
  else if (yieldRatio > 0.01) score += 2;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function qualityLabel(score: number): "Excellent" | "Good" | "Fair" | "Poor" {
  if (score >= 85) return "Excellent";
  if (score >= 65) return "Good";
  if (score >= 40) return "Fair";
  return "Poor";
}
