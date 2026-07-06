"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, Archive, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { api } from "@/lib/api-client";
import { toast } from "@/hooks/use-toast";
import type { Article, ArticleStatus } from "@/types/article";

export function WorkspaceHeader({
  article,
  onTitleChange,
  onStatusChange,
}: {
  article: Article;
  onTitleChange: (title: string) => void;
  onStatusChange: (status: ArticleStatus) => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(article.title);
  const [busy, setBusy] = useState<"approve" | "archive" | "delete" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function commitTitle() {
    if (title.trim() && title !== article.title) {
      onTitleChange(title.trim());
      await api.articles.update(article.id, { title: title.trim() });
    }
  }

  async function setStatus(status: ArticleStatus) {
    setBusy(status === "approved" ? "approve" : "archive");
    try {
      await api.articles.update(article.id, { status });
      onStatusChange(status);
      toast.success(status === "approved" ? "Article approved" : "Article archived");
    } catch {
      toast.error("Couldn't update status.");
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete() {
    setBusy("delete");
    try {
      await api.articles.remove(article.id);
      toast.success("Article deleted");
      router.push("/dataset");
    } catch {
      toast.error("Couldn't delete article.");
      setBusy(null);
    }
  }

  return (
    <div className="border-b border-border bg-card/60">
      <div className="container flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/dataset"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-primary-700"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commitTitle}
            className="h-auto max-w-md truncate border-none bg-transparent p-0 font-serif text-xl font-semibold text-primary-800 shadow-none focus-visible:ring-0"
          />
        </div>

        <div className="flex items-center gap-2">
          {article.status !== "approved" && (
            <Button variant="secondary" onClick={() => setStatus("approved")} disabled={busy !== null}>
              {busy === "approve" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Approve
            </Button>
          )}
          {article.status !== "archived" && (
            <Button variant="outline" onClick={() => setStatus("archived")} disabled={busy !== null}>
              {busy === "archive" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Archive className="h-4 w-4" />
              )}
              Archive
            </Button>
          )}
          <Button
            variant="ghost"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setConfirmDelete(true)}
            disabled={busy !== null}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this article?</DialogTitle>
            <DialogDescription>
              This permanently removes &ldquo;{article.title}&rdquo; and its history. This
              can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={busy === "delete"}>
              {busy === "delete" && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
