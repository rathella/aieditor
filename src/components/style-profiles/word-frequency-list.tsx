import type { WordFrequency } from "@/types/style-profile";

export function WordFrequencyList({ items }: { items: WordFrequency[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Not enough data yet.</p>;
  }
  const max = items[0]?.count ?? 1;
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.word} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-sm text-primary-800">{item.word}</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary-500"
              style={{ width: `${Math.max(6, (item.count / max) * 100)}%` }}
            />
          </div>
          <span className="w-8 shrink-0 text-right text-xs text-muted-foreground">
            {item.count}
          </span>
        </div>
      ))}
    </div>
  );
}
