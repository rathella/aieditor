"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { WorkspaceHeader } from "@/components/analyze/workspace-header";
import { ArticleInfoPanel } from "@/components/analyze/article-info-panel";
import { Editor } from "@/components/analyze/editor";
import { ExportPanel } from "@/components/analyze/export-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { useAutosave } from "@/hooks/use-autosave";
import { api } from "@/lib/api-client";
import type { Article, ArticleStatus } from "@/types/article";

function WorkspaceSkeleton() {
  return (
    <div className="container grid gap-6 py-8 lg:grid-cols-[280px_1fr_300px]">
      <Skeleton className="h-72 rounded-2xl" />
      <Skeleton className="h-[60vh] rounded-2xl" />
      <Skeleton className="h-72 rounded-2xl" />
    </div>
  );
}

function AnalyzeWorkspace({ id }: { id: string }) {
  const [article, setArticle] = useState<Article | null>(null);
  const [content, setContent] = useState("");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.articles
      .get(id)
      .then(({ article }) => {
        if (cancelled) return;
        setArticle(article);
        setContent(article.content);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const autosaveStatus = useAutosave(content, async (value) => {
    const { article: updated } = await api.articles.update(id, { content: value });
    setArticle(updated);
  });

  if (notFound) {
    return (
      <div className="container py-24 text-center">
        <p className="font-serif text-xl text-primary-800">Article not found</p>
        <p className="mt-2 text-sm text-muted-foreground">
          It may have been deleted, or the link is incorrect.
        </p>
      </div>
    );
  }

  if (!article) return <WorkspaceSkeleton />;

  return (
    <div>
      <WorkspaceHeader
        article={article}
        onTitleChange={(title) => setArticle((a) => (a ? { ...a, title } : a))}
        onStatusChange={(status: ArticleStatus) =>
          setArticle((a) => (a ? { ...a, status } : a))
        }
      />
      <div className="container grid gap-6 py-8 lg:grid-cols-[280px_1fr_300px] lg:items-start">
        <ArticleInfoPanel article={{ ...article, content }} />
        <Editor
          value={content}
          onChange={setContent}
          autosaveStatus={autosaveStatus}
          disabled={article.status === "archived"}
        />
        <ExportPanel articleId={article.id} title={article.title} content={content} />
      </div>
    </div>
  );
}

export default function AnalyzePage() {
  const params = useParams<{ id: string }>();
  return (
    <ProtectedRoute>
      <AnalyzeWorkspace id={params.id} />
    </ProtectedRoute>
  );
}
