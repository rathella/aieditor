export type ArticleStatus =
  | "processing"
  | "draft"
  | "approved"
  | "archived"
  | "failed";

export interface Article {
  id: string;
  sourceUrl: string;
  title: string;
  category: string | null;
  language: string;
  status: ArticleStatus;
  extractionQuality: number; // 0-100
  htmlSizeBytes: number;
  wordCount: number;
  charCount: number;
  estimatedTokens: number;
  sectionCount: number;
  content: string; // cleaned markdown, editable
  excerpt: string;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleListItem
  extends Pick<
    Article,
    | "id"
    | "title"
    | "category"
    | "status"
    | "wordCount"
    | "extractionQuality"
    | "language"
    | "createdAt"
    | "updatedAt"
  > {}

export interface ArticleStats {
  characters: number;
  words: number;
  tokens: number;
  paragraphs: number;
}

export interface CreateArticleInput {
  sourceUrl: string;
}

export interface UpdateArticleInput {
  content?: string;
  title?: string;
  category?: string | null;
  status?: ArticleStatus;
}

export type ExportFormat = "json" | "markdown" | "txt";
