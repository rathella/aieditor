import { cn } from "@/lib/utils";
import { qualityLabel } from "@/lib/extraction/metrics";

export function QualityIndicator({
  score,
  className,
  compact = false,
}: {
  score: number;
  className?: string;
  compact?: boolean;
}) {
  const label = qualityLabel(score);
  const color =
    score >= 85
      ? "bg-success"
      : score >= 65
        ? "bg-primary-600"
        : score >= 40
          ? "bg-gold-500"
          : "bg-destructive";

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary">
          <div className={cn("h-full rounded-full", color)} style={{ width: `${score}%` }} />
        </div>
        <span className="text-xs font-medium text-muted-foreground">{score}%</span>
      </div>
    );
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-primary-800">{label}</span>
        <span className="text-muted-foreground">{score}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
