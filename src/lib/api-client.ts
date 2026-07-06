import type { Article, ArticleListItem, ArticleStatus, ExportFormat } from "@/types/article";
import type { HistoryEntry } from "@/types/history";
import type { StyleProfile } from "@/types/style-profile";
import type { AppSettings } from "@/types/settings";
import { auth } from "@/lib/firebase/client";

class ApiError extends Error {}

async function authHeaders(extra?: Record<string, string>): Promise<Record<string, string>> {
  const token = await auth.currentUser?.getIdToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function handle<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.error ?? "Something went wrong. Please try again.");
  }
  return data as T;
}

export const api = {
  articles: {
    list: async (opts?: { status?: ArticleStatus; limit?: number }) => {
      const params = new URLSearchParams();
      if (opts?.status) params.set("status", opts.status);
      if (opts?.limit) params.set("limit", String(opts.limit));
      return fetch(`/api/articles?${params.toString()}`, { headers: await authHeaders() }).then(
        (r) => handle<{ articles: ArticleListItem[] }>(r)
      );
    },
    create: async (sourceUrl: string) =>
      fetch("/api/articles", {
        method: "POST",
        headers: await authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ sourceUrl }),
      }).then((r) => handle<{ article: Article }>(r)),
    get: async (id: string) =>
      fetch(`/api/articles/${id}`, { headers: await authHeaders() }).then((r) =>
        handle<{ article: Article }>(r)
      ),
    update: async (
      id: string,
      patch: Partial<{ content: string; title: string; category: string | null; status: ArticleStatus }>
    ) =>
      fetch(`/api/articles/${id}`, {
        method: "PATCH",
        headers: await authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(patch),
      }).then((r) => handle<{ article: Article }>(r)),
    remove: async (id: string) =>
      fetch(`/api/articles/${id}`, { method: "DELETE", headers: await authHeaders() }).then((r) =>
        handle<{ success: true }>(r)
      ),
    /** Downloads an export by fetching it with an auth header and saving the resulting blob. */
    download: async (id: string, format: ExportFormat, suggestedName?: string) => {
      const res = await fetch(`/api/articles/${id}/export?format=${format}`, {
        headers: await authHeaders(),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new ApiError(data.error ?? "Export failed.");
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="(.+)"/);
      const filename = match?.[1] ?? suggestedName ?? `export.${format}`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    },
  },
  history: {
    list: async (q?: string) => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      return fetch(`/api/history?${params.toString()}`, { headers: await authHeaders() }).then(
        (r) => handle<{ entries: HistoryEntry[] }>(r)
      );
    },
    restore: async (id: string) =>
      fetch(`/api/history/${id}/restore`, { method: "POST", headers: await authHeaders() }).then(
        (r) => handle<{ article: Article }>(r)
      ),
  },
  styleProfile: {
    get: async () =>
      fetch("/api/style-profile", { headers: await authHeaders() }).then((r) =>
        handle<{ profile: StyleProfile }>(r)
      ),
  },
  settings: {
    get: async () =>
      fetch("/api/settings", { headers: await authHeaders() }).then((r) =>
        handle<{ settings: AppSettings; counts: { total: number; approved: number } }>(r)
      ),
    save: async (settings: AppSettings) =>
      fetch("/api/settings", {
        method: "PUT",
        headers: await authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(settings),
      }).then((r) => handle<{ settings: AppSettings }>(r)),
  },
};
