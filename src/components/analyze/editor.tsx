"use client";

import { Textarea } from "@/components/ui/textarea";
import type { AutosaveStatus } from "@/hooks/use-autosave";
import { Check, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

function AutosaveIndicator({ status }: { status: AutosaveStatus }) {
  if (status === "idle") return null;
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      {status === "saving" && (
        <>
          <Loader2 className="h-3 w-3 animate-spin" /> Saving…
        </>
      )}
      {status === "saved" && (
        <>
          <Check className="h-3 w-3 text-success" /> Saved
        </>
      )}
      {status === "error" && (
        <>
          <AlertCircle className="h-3 w-3 text-destructive" /> Couldn&apos;t save
        </>
      )}
    </div>
  );
}

export function Editor({
  value,
  onChange,
  autosaveStatus,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  autosaveStatus: AutosaveStatus;
  disabled?: boolean;
}) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card shadow-card">
      <div className="flex items-center justify-between border-b border-border px-6 py-3.5">
        <span className="text-sm font-medium text-primary-800">Content</span>
        <AutosaveIndicator status={autosaveStatus} />
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        spellCheck={false}
        className={cn(
          "prose-editor min-h-[60vh] flex-1 resize-none rounded-none border-none px-6 py-5 shadow-none focus-visible:ring-0"
        )}
        placeholder="Article content will appear here…"
      />
    </div>
  );
}
