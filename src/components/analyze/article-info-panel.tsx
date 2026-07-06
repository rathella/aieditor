import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/dataset/status-badge";
import { QualityIndicator } from "@/components/analyze/quality-indicator";
import { formatBytes, formatNumber } from "@/lib/utils";
import type { Article } from "@/types/article";
import { ExternalLink } from "lucide-react";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-primary-800">{value}</span>
    </div>
  );
}

export function ArticleInfoPanel({ article }: { article: Article }) {
  return (
    <Card className="sticky top-20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Article Information</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <a
          href={article.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="mb-3 flex items-center gap-1.5 truncate text-xs text-primary-600 hover:underline"
        >
          <ExternalLink className="h-3 w-3 shrink-0" />
          <span className="truncate">{article.sourceUrl}</span>
        </a>

        <Separator />
        <div className="divide-y divide-border">
          <Row label="Category" value={article.category ?? "Uncategorized"} />
          <Row label="Estimated Tokens" value={formatNumber(article.estimatedTokens)} />
          <Row label="HTML Size" value={formatBytes(article.htmlSizeBytes)} />
          <Row label="Word Count" value={formatNumber(article.wordCount)} />
          <Row label="Detected Sections" value={article.sectionCount} />
          <Row label="Language" value={article.language.toUpperCase()} />
          <Row label="Status" value={<StatusBadge status={article.status} />} />
        </div>
        <Separator className="mb-3" />
        <div>
          <p className="mb-2 text-sm text-muted-foreground">Extraction Quality</p>
          <QualityIndicator score={article.extractionQuality} />
        </div>
      </CardContent>
    </Card>
  );
}
