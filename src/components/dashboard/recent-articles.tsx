"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, ArrowUpRight, Inbox } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/dataset/status-badge";
import { QualityIndicator } from "@/components/analyze/quality-indicator";
import { api } from "@/lib/api-client";
import { formatDate } from "@/lib/utils";
import type { ArticleListItem } from "@/types/article";

export function RecentArticles() {
  const [articles, setArticles] = useState<ArticleListItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.articles
      .list({ limit: 6 })
      .then((res) => {
        if (!cancelled) setArticles(res.articles);
      })
      .catch(() => {
        if (!cancelled) setArticles([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="container py-16">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-xl font-semibold">Recently processed</h2>
          <p className="text-sm text-muted-foreground">
            Pick up where you left off, or jump into a recent import.
          </p>
        </div>
        {articles && articles.length > 0 && (
          <Link
            href="/dataset"
            className="flex items-center gap-1 text-sm font-medium text-primary-700 hover:underline"
          >
            View all
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      {articles === null && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="space-y-3 p-5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-2 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {articles && articles.length === 0 && (
        <Card className="archive-ruled border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <Inbox className="h-5 w-5" />
            </div>
            <p className="font-medium text-primary-800">No articles yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Paste an encyclopedia article URL above to run your first import
              and see it appear here.
            </p>
          </CardContent>
        </Card>
      )}

      {articles && articles.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <Link key={article.id} href={`/analyze/${article.id}`}>
              <Card className="group h-full transition-all hover:-translate-y-0.5 hover:shadow-card-hover">
                <CardContent className="flex h-full flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary-600">
                      <FileText className="h-4 w-4" />
                    </div>
                    <StatusBadge status={article.status} />
                  </div>
                  <h3 className="line-clamp-2 font-serif text-base font-semibold leading-snug text-primary-800">
                    {article.title}
                  </h3>
                  <div className="mt-auto space-y-2 pt-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{article.category ?? "Uncategorized"}</span>
                      <span>{formatDate(article.createdAt)}</span>
                    </div>
                    <QualityIndicator score={article.extractionQuality} compact />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
