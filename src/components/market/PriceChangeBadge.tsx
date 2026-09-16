import { TrendingDown, TrendingUp } from "lucide-react";

export function PriceChangeBadge({
  current,
  prior,
  className,
}: {
  current: number | null;
  prior: number | null;
  className?: string;
}) {
  if (!current || !prior || current === prior) return null;
  const dropped = current < prior;
  const pct = Math.abs(((prior - current) / prior) * 100);
  const Icon = dropped ? TrendingDown : TrendingUp;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-[10px] uppercase tracking-widest ${
        dropped ? "bg-accent/15 text-accent-foreground" : "bg-secondary text-foreground"
      } ${className ?? ""}`}
    >
      <Icon className="h-3 w-3" />
      {dropped ? "Price drop" : "Price increase"} {pct.toFixed(1)}%
    </span>
  );
}
