"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { computeContentMetrics } from "@/lib/extraction/metrics";
import { formatNumber } from "@/lib/utils";
import { api } from "@/lib/api-client";
import { toast } from "@/hooks/use-toast";
import { FileJson, FileText, FileType, Sparkles, Loader2 } from "lucide-react";
import type { ExportFormat } from "@/types/article";

const FORMATS: { format: ExportFormat; label: string; icon: React.ElementType }[] = [
  { format: "json", label: "Export JSON", icon: FileJson },
  { format: "markdown", label: "Export Markdown", icon: FileText },
  { format: "txt", label: "Export TXT", icon: FileType },
];

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-secondary px-3 py-2.5 text-center">
      <div className="font-serif text-lg font-semibold text-primary-800">{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

export function ExportPanel({
  articleId,
  title,
  content,
}: {
  articleId: string;
  title: string;
  content: string;
}) {
  const [downloading, setDownloading] = useState<ExportFormat | null>(null);
  const metrics = useMemo(() => computeContentMetrics(content), [content]);

  async function handleExport(format: ExportFormat) {
    setDownloading(format);
    try {
      await api.articles.download(articleId, format, title);
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch {
      toast.error("Export failed. Please try again.");
    } finally {
      setDownloading(null);
    }
  }

  return (
    <Card className="sticky top-20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Export</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-0">
        <div className="grid grid-cols-2 gap-2">
          <StatBox label="Characters" value={formatNumber(metrics.charCount)} />
          <StatBox label="Words" value={formatNumber(metrics.wordCount)} />
          <StatBox label="Tokens" value={formatNumber(metrics.estimatedTokens)} />
          <StatBox label="Paragraphs" value={formatNumber(metrics.paragraphCount)} />
        </div>

        <Separator />

        <div className="space-y-2">
          {FORMATS.map(({ format, label, icon: Icon }) => (
            <Button
              key={format}
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleExport(format)}
              disabled={downloading !== null}
            >
              {downloading === format ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Icon className="h-4 w-4" />
              )}
              {label}
            </Button>
          ))}

          <Button variant="ghost" className="w-full justify-start opacity-50" disabled>
            <Sparkles className="h-4 w-4" />
            Generate AI Prompt
            <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              Coming soon
            </span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
