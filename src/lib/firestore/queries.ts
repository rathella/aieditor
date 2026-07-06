import { nanoid } from "nanoid";
import { getAdminDb } from "@/lib/firebase/admin";
import type { Article, ArticleListItem, ArticleStatus } from "@/types/article";
import type { HistoryEntry, HistoryAction } from "@/types/history";
import { DEFAULT_SETTINGS, type AppSettings } from "@/types/settings";

// ---------------------------------------------------------------------------
// Collection helpers — every read/write is scoped under users/{uid}/...
// so tenant isolation is structural, not just rule-based.
// ---------------------------------------------------------------------------

function articlesCol(uid: string) {
  return getAdminDb().collection("users").doc(uid).collection("articles");
}

function historyCol(uid: string) {
  return getAdminDb().collection("users").doc(uid).collection("history");
}

function settingsDoc(uid: string) {
  return getAdminDb().collection("users").doc(uid).collection("settings").doc("app");
}

// ---------------------------------------------------------------------------
// Articles
// ---------------------------------------------------------------------------

export interface NewArticleData {
  sourceUrl: string;
  title: string;
  category: string | null;
  language: string;
  status: ArticleStatus;
  extractionQuality: number;
  htmlSizeBytes: number;
  wordCount: number;
  charCount: number;
  estimatedTokens: number;
  sectionCount: number;
  content: string;
  excerpt: string;
  errorMessage?: string | null;
}

export async function insertArticle(uid: string, data: NewArticleData): Promise<Article> {
  const id = nanoid(12);
  const now = new Date().toISOString();
  const article: Article = {
    id,
    sourceUrl: data.sourceUrl,
    title: data.title,
    category: data.category,
    language: data.language,
    status: data.status,
    extractionQuality: data.extractionQuality,
    htmlSizeBytes: data.htmlSizeBytes,
    wordCount: data.wordCount,
    charCount: data.charCount,
    estimatedTokens: data.estimatedTokens,
    sectionCount: data.sectionCount,
    content: data.content,
    excerpt: data.excerpt,
    errorMessage: data.errorMessage ?? null,
    createdAt: now,
    updatedAt: now,
  };
  await articlesCol(uid).doc(id).set(article);
  return article;
}

export async function getArticleById(uid: string, id: string): Promise<Article | null> {
  const snap = await articlesCol(uid).doc(id).get();
  return snap.exists ? (snap.data() as Article) : null;
}

export async function listArticles(
  uid: string,
  opts?: { status?: ArticleStatus; limit?: number }
): Promise<ArticleListItem[]> {
  let query = articlesCol(uid).orderBy("createdAt", "desc") as FirebaseFirestore.Query;
  if (opts?.status) query = query.where("status", "==", opts.status);
  if (opts?.limit) query = query.limit(opts.limit);
  const snap = await query.get();
  return snap.docs.map((doc) => {
    const a = doc.data() as Article;
    return {
      id: a.id,
      title: a.title,
      category: a.category,
      status: a.status,
      wordCount: a.wordCount,
      extractionQuality: a.extractionQuality,
      language: a.language,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    };
  });
}

export async function updateArticle(
  uid: string,
  id: string,
  patch: Partial<{
    title: string;
    category: string | null;
    status: ArticleStatus;
    content: string;
    wordCount: number;
    charCount: number;
    estimatedTokens: number;
    sectionCount: number;
  }>
): Promise<Article | null> {
  const ref = articlesCol(uid).doc(id);
  const existing = await ref.get();
  if (!existing.exists) return null;

  const updatedAt = new Date().toISOString();
  await ref.set({ ...patch, updatedAt }, { merge: true });
  const updated = await ref.get();
  return updated.data() as Article;
}

export async function deleteArticle(uid: string, id: string): Promise<void> {
  await articlesCol(uid).doc(id).delete();
  const historySnap = await historyCol(uid).where("articleId", "==", id).get();
  await Promise.all(historySnap.docs.map((d) => d.ref.delete()));
}

export async function countArticles(
  uid: string
): Promise<{ total: number; approved: number }> {
  const [totalSnap, approvedSnap] = await Promise.all([
    articlesCol(uid).count().get(),
    articlesCol(uid).where("status", "==", "approved").count().get(),
  ]);
  return { total: totalSnap.data().count, approved: approvedSnap.data().count };
}

export async function listApprovedContents(
  uid: string
): Promise<Array<{ id: string; title: string; content: string }>> {
  const snap = await articlesCol(uid).where("status", "==", "approved").get();
  return snap.docs.map((doc) => {
    const a = doc.data() as Article;
    return { id: a.id, title: a.title, content: a.content };
  });
}

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------

export async function addHistoryEntry(
  uid: string,
  entry: {
    articleId: string;
    articleTitle: string;
    action: HistoryAction;
    detail?: string | null;
    snapshot?: string | null;
  }
): Promise<HistoryEntry> {
  const id = nanoid(12);
  const now = new Date().toISOString();
  const historyEntry: HistoryEntry = {
    id,
    articleId: entry.articleId,
    articleTitle: entry.articleTitle,
    action: entry.action,
    detail: entry.detail ?? null,
    snapshot: entry.snapshot ?? null,
    createdAt: now,
  };
  await historyCol(uid).doc(id).set(historyEntry);
  return historyEntry;
}

export async function listHistory(
  uid: string,
  opts?: { search?: string; limit?: number }
): Promise<HistoryEntry[]> {
  let query = historyCol(uid).orderBy("createdAt", "desc") as FirebaseFirestore.Query;
  if (opts?.limit) query = query.limit(opts.limit);
  const snap = await query.get();
  let entries = snap.docs.map((d) => d.data() as HistoryEntry);
  if (opts?.search) {
    const needle = opts.search.toLowerCase();
    entries = entries.filter((e) => e.articleTitle.toLowerCase().includes(needle));
  }
  return entries;
}

export async function getHistoryEntry(uid: string, id: string): Promise<HistoryEntry | null> {
  const snap = await historyCol(uid).doc(id).get();
  return snap.exists ? (snap.data() as HistoryEntry) : null;
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export async function getSettings(uid: string): Promise<AppSettings> {
  const snap = await settingsDoc(uid).get();
  if (!snap.exists) return DEFAULT_SETTINGS;
  return { ...DEFAULT_SETTINGS, ...(snap.data() as Partial<AppSettings>) };
}

export async function saveSettings(uid: string, settings: AppSettings): Promise<AppSettings> {
  await settingsDoc(uid).set(settings, { merge: false });
  return settings;
}
