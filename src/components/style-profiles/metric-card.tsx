import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  description,
  className,
}: {
  label: string;
  value: React.ReactNode;
  description?: string;
  className?: string;
}) {
  return (
    <Card className={cn(className)}>
      <CardContent className="p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-1.5 font-serif text-2xl font-semibold text-primary-800">{value}</p>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
}
