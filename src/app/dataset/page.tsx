"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Inbox } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { DatasetCard } from "@/components/dataset/dataset-card";
import { api } from "@/lib/api-client";
import type { ArticleListItem, ArticleStatus } from "@/types/article";

type SortKey = "newest" | "oldest" | "title" | "words";

const PAGE_SIZE = 9;

function DatasetContent() {
  const [articles, setArticles] = useState<ArticleListItem[] | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ArticleStatus | "all">("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.articles.list({ limit: 200 }).then((res) => setArticles(res.articles));
  }, []);

  const filtered = useMemo(() => {
    if (!articles) return [];
    let result = articles;
    if (statusFilter !== "all") result = result.filter((a) => a.status === statusFilter);
    if (search.trim()) {
      const needle = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(needle) ||
          (a.category ?? "").toLowerCase().includes(needle)
      );
    }
    const sorted = [...result];
    switch (sort) {
      case "newest":
        sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        break;
      case "oldest":
        sorted.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        break;
      case "title":
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "words":
        sorted.sort((a, b) => b.wordCount - a.wordCount);
        break;
    }
    return sorted;
  }, [articles, search, statusFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleDeleted(id: string) {
    setArticles((prev) => prev?.filter((a) => a.id !== id) ?? prev);
  }

  return (
    <div className="container py-10">
      <div className="mb-8 flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-primary-800">Dataset</h1>
        <p className="text-sm text-muted-foreground">
          Every article you&apos;ve imported, organized and ready to export.
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by title or category…"
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v as ArticleStatus | "all");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="title">Title (A–Z)</SelectItem>
            <SelectItem value="words">Word count</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {articles === null && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      )}

      {articles && filtered.length === 0 && (
        <Card className="archive-ruled border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <Inbox className="h-5 w-5" />
            </div>
            <p className="font-medium text-primary-800">No matching articles</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Try a different search term or clear the status filter.
            </p>
          </CardContent>
        </Card>
      )}

      {articles && pageItems.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pageItems.map((article) => (
              <DatasetCard key={article.id} article={article} onDeleted={handleDeleted} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function DatasetPage() {
  return (
    <ProtectedRoute>
      <DatasetContent />
    </ProtectedRoute>
  );
}
