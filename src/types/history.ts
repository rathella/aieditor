export type HistoryAction =
  | "imported"
  | "edited"
  | "exported"
  | "approved"
  | "archived"
  | "restored"
  | "failed";

export interface HistoryEntry {
  id: string;
  articleId: string;
  articleTitle: string;
  action: HistoryAction;
  detail: string | null; // e.g. export format, or nothing
  snapshot: string | null; // markdown snapshot for restore, only on 'edited'/'imported'
  createdAt: string;
}
