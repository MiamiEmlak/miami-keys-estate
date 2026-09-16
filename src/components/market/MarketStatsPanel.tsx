import { money, num } from "@/lib/format";

export type MarketStatsShape = {
  activeCount: number;
  rentalCount: number;
  medianPrice: number | null;
  medianRent: number | null;
  avgPpsf: number | null;
  priceDrops: number;
  priceIncreases: number;
};

export function MarketStatsPanel({
  stats,
  loading,
  saleLabel = "Median list price",
}: {
  stats: MarketStatsShape | null | undefined;
  loading?: boolean;
  saleLabel?: string;
}) {
  const cells: [string, string][] = [
    ["Active for sale", stats ? num(stats.activeCount) : "—"],
    ["Active rentals", stats ? num(stats.rentalCount) : "—"],
    [saleLabel, money(stats?.medianPrice ?? null)],
    ["Median rent", stats?.medianRent ? `${money(stats.medianRent)}/mo` : "—"],
    ["Avg $/sq ft", stats?.avgPpsf ? `${money(stats.avgPpsf)}/sq ft` : "—"],
    ["Price drops", stats ? num(stats.priceDrops) : "—"],
    ["Price increases", stats ? num(stats.priceIncreases) : "—"],
  ];

  return (
    <section className="rounded-sm border border-border bg-card p-6">
      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-xl text-foreground">Live market snapshot</h3>
        {loading && <span className="text-xs text-muted-foreground">Refreshing…</span>}
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
        {cells.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs uppercase tracking-widest text-muted-foreground">{label}</dt>
            <dd className="mt-1 text-sm text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
