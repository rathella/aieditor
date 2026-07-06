"use client";

import Link from "next/link";
import { useState } from "react";
import { FileText, Download, Trash2, Loader2, ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/dataset/status-badge";
import { formatDate, formatNumber } from "@/lib/utils";
import { api } from "@/lib/api-client";
import { toast } from "@/hooks/use-toast";
import type { ArticleListItem } from "@/types/article";

export function DatasetCard({
  article,
  onDeleted,
}: {
  article: ArticleListItem;
  onDeleted: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    setBusy(true);
    try {
      await api.articles.remove(article.id);
      onDeleted(article.id);
      toast.success("Article deleted");
    } catch {
      toast.error("Couldn't delete article.");
    } finally {
      setBusy(false);
      setConfirmDelete(false);
    }
  }

  async function handleExport(format: "json" | "markdown" | "txt") {
    try {
      await api.articles.download(article.id, format, article.title);
    } catch {
      toast.error("Export failed.");
    }
  }

  return (
    <>
      <Card className="group flex h-full flex-col transition-all hover:-translate-y-0.5 hover:shadow-card-hover">
        <CardContent className="flex h-full flex-col gap-3 p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary-600">
              <FileText className="h-4 w-4" />
            </div>
            <StatusBadge status={article.status} />
          </div>

          <Link href={`/analyze/${article.id}`} className="flex-1">
            <h3 className="line-clamp-2 font-serif text-base font-semibold leading-snug text-primary-800 hover:text-primary-700">
              {article.title}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {article.category ?? "Uncategorized"} · {formatDate(article.createdAt)}
            </p>
          </Link>

          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="text-xs text-muted-foreground">
              {formatNumber(article.wordCount)} words
            </span>
            <div className="flex items-center gap-1">
              <Button asChild size="sm" variant="ghost">
                <Link href={`/analyze/${article.id}`}>Open</Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost" className="px-2">
                    <Download className="h-3.5 w-3.5" />
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => handleExport("json")}>
                    Export JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleExport("markdown")}>
                    Export Markdown
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleExport("txt")}>
                    Export TXT
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                size="sm"
                variant="ghost"
                className="px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this article?</DialogTitle>
            <DialogDescription>
              This permanently removes &ldquo;{article.title}&rdquo; and its history.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
