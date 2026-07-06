"use client";

import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { HistoryTimeline } from "@/components/history/history-timeline";
import { useDebouncedValue } from "@/hooks/use-debounce";
import { api } from "@/lib/api-client";
import type { HistoryEntry } from "@/types/history";

function HistoryContent() {
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  const load = useCallback(() => {
    api.history.list(debouncedSearch || undefined).then((res) => setEntries(res.entries));
  }, [debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="container max-w-3xl py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-primary-800">History</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A timeline of every import, edit, export, and status change.
        </p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by article title…"
          className="pl-9"
        />
      </div>

      {entries === null ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : (
        <HistoryTimeline entries={entries} onRestored={load} />
      )}
    </div>
  );
}

export default function HistoryPage() {
  return (
    <ProtectedRoute>
      <HistoryContent />
    </ProtectedRoute>
  );
}
