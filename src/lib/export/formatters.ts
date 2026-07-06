import type { Article, ExportFormat } from "@/types/article";

function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/`([^`]*)`/g, "$1");
}

export function formatArticleAsJson(article: Article): string {
  return JSON.stringify(
    {
      id: article.id,
      title: article.title,
      category: article.category,
      language: article.language,
      sourceUrl: article.sourceUrl,
      status: article.status,
      extractionQuality: article.extractionQuality,
      metrics: {
        wordCount: article.wordCount,
        charCount: article.charCount,
        estimatedTokens: article.estimatedTokens,
        sectionCount: article.sectionCount,
      },
      content: article.content,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
    },
    null,
    2
  );
}

export function formatArticleAsMarkdown(article: Article): string {
  const frontMatter = [
    "---",
    `title: "${article.title.replace(/"/g, '\\"')}"`,
    `category: ${article.category ?? "null"}`,
    `language: ${article.language}`,
    `source_url: ${article.sourceUrl}`,
    `word_count: ${article.wordCount}`,
    "---",
    "",
  ].join("\n");
  return `${frontMatter}${article.content}\n`;
}

export function formatArticleAsTxt(article: Article): string {
  return `${article.title}\n${"=".repeat(article.title.length)}\n\n${stripMarkdown(
    article.content
  )}\n`;
}

export function formatArticle(article: Article, format: ExportFormat): string {
  switch (format) {
    case "json":
      return formatArticleAsJson(article);
    case "markdown":
      return formatArticleAsMarkdown(article);
    case "txt":
      return formatArticleAsTxt(article);
  }
}

export const EXPORT_MIME: Record<ExportFormat, string> = {
  json: "application/json",
  markdown: "text/markdown",
  txt: "text/plain",
};

export const EXPORT_EXTENSION: Record<ExportFormat, string> = {
  json: "json",
  markdown: "md",
  txt: "txt",
};

export function slugifyFilename(title: string): string {
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "article"
  );
}
