import { Badge } from "@/components/ui/badge";
import type { ArticleStatus } from "@/types/article";
import { CheckCircle2, FileEdit, Loader2, Archive, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const CONFIG: Record<
  ArticleStatus,
  { label: string; variant: "secondary" | "success" | "warning" | "destructive" | "outline"; icon: React.ElementType }
> = {
  processing: { label: "Processing", variant: "outline", icon: Loader2 },
  draft: { label: "Draft", variant: "secondary", icon: FileEdit },
  approved: { label: "Approved", variant: "success", icon: CheckCircle2 },
  archived: { label: "Archived", variant: "outline", icon: Archive },
  failed: { label: "Failed", variant: "destructive", icon: AlertTriangle },
};

export function StatusBadge({ status, className }: { status: ArticleStatus; className?: string }) {
  const { label, variant, icon: Icon } = CONFIG[status];
  return (
    <Badge variant={variant} className={cn(className)}>
      <Icon className={cn("h-3 w-3", status === "processing" && "animate-spin")} />
      {label}
    </Badge>
  );
}
