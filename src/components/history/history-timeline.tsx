"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Download,
  FilePlus2,
  Pencil,
  CheckCircle2,
  Archive,
  History as HistoryIcon,
  AlertTriangle,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { api } from "@/lib/api-client";
import { toast } from "@/hooks/use-toast";
import type { HistoryEntry, HistoryAction } from "@/types/history";

const ACTION_CONFIG: Record<HistoryAction, { label: string; icon: React.ElementType; color: string }> = {
  imported: { label: "Imported", icon: FilePlus2, color: "text-primary-600" },
  edited: { label: "Edited", icon: Pencil, color: "text-primary-600" },
  exported: { label: "Exported", icon: Download, color: "text-gold-600" },
  approved: { label: "Approved", icon: CheckCircle2, color: "text-success" },
  archived: { label: "Archived", icon: Archive, color: "text-muted-foreground" },
  restored: { label: "Restored", icon: RotateCcw, color: "text-primary-600" },
  failed: { label: "Failed", icon: AlertTriangle, color: "text-destructive" },
};

function HistoryRow({ entry, onRestored }: { entry: HistoryEntry; onRestored: () => void }) {
  const [restoring, setRestoring] = useState(false);
  const config = ACTION_CONFIG[entry.action];
  const Icon = config.icon;
  const canRestore = entry.snapshot !== null && entry.action !== "restored";

  async function handleRestore() {
    setRestoring(true);
    try {
      await api.history.restore(entry.id);
      toast.success("Article restored to this version");
      onRestored();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't restore this version.");
    } finally {
      setRestoring(false);
    }
  }

  return (
    <div className="flex items-start gap-4 py-4">
      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary ${config.color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link
            href={`/analyze/${entry.articleId}`}
            className="truncate font-medium text-primary-800 hover:underline"
          >
            {entry.articleTitle}
          </Link>
          <span className="text-sm text-muted-foreground">
            {config.label}
            {entry.detail ? ` · ${entry.detail.toUpperCase()}` : ""}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{formatDateTime(entry.createdAt)}</p>
      </div>
      {canRestore && (
        <Button size="sm" variant="outline" onClick={handleRestore} disabled={restoring}>
          {restoring ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
          Restore
        </Button>
      )}
    </div>
  );
}

export function HistoryTimeline({
  entries,
  onRestored,
}: {
  entries: HistoryEntry[];
  onRestored: () => void;
}) {
  if (entries.length === 0) {
    return (
      <Card className="archive-ruled border-dashed">
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <HistoryIcon className="h-5 w-5" />
          </div>
          <p className="font-medium text-primary-800">No history yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Every import, edit, export, and status change will show up here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="divide-y divide-border p-6">
        {entries.map((entry) => (
          <HistoryRow key={entry.id} entry={entry} onRestored={onRestored} />
        ))}
      </CardContent>
    </Card>
  );
}
