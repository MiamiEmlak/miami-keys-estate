import { useQuery } from "@tanstack/react-query";
import { Gauge, Sparkles } from "lucide-react";
import { getDealScoreFn } from "@/lib/deal-score.functions";
import { money } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

const TONE: Record<string, string> = {
  Exceptional: "text-accent",
  Strong: "text-accent",
  Fair: "text-foreground",
  Weak: "text-destructive",
};

export function DealScoreCard({ listingKey }: { listingKey: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["deal-score", listingKey],
    queryFn: () => getDealScoreFn({ data: { listingKey } }),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <section className="mt-12 rounded-sm border border-border bg-card p-6 sm:p-8">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="mt-6 h-40 w-full" />
      </section>
    );
  }

  if (!data?.score) return null;
  const s = data.score;

  return (
    <section className="mt-12 rounded-sm border border-border bg-card p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="eyebrow text-muted-foreground">Cays deal intelligence</p>
          <h2 className="mt-2 flex items-center gap-2 font-display text-2xl">
            <Gauge className="h-5 w-5 text-accent" /> Deal Score
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Scored against{" "}
            {data.comps.closedCount > 0
              ? `${data.comps.closedCount} closed sales`
              : `${data.comps.activeCount} active listings`}{" "}
            of similar size and bedroom count in this city, blended with projected rental
            economics.
          </p>
        </div>
        <div className="text-right">
          <p className={`font-display text-6xl leading-none ${TONE[s.verdict] ?? ""}`}>{s.score}</p>
          <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
            {s.verdict} · out of 100
          </p>
        </div>
      </div>

      {data.narrative && (
        <p className="mt-6 flex gap-3 rounded-sm border border-border bg-secondary/40 p-5 text-sm leading-relaxed text-foreground">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <span>{data.narrative}</span>
        </p>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <ul className="space-y-5">
          {s.factors.map((f) => (
            <li key={f.key}>
              <div className="flex items-baseline justify-between gap-4 text-sm">
                <span className="text-foreground">{f.label}</span>
                <span className="text-muted-foreground">
                  {Math.round(f.score)}/100 · {Math.round(f.weight * 100)}% weight
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${Math.max(2, Math.min(100, f.score))}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{f.detail}</p>
            </li>
          ))}
        </ul>

        {data.economics && (
          <div className="rounded-sm border border-border bg-secondary/40 p-6">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Monthly economics at 25% down
            </p>
            <dl className="mt-5 space-y-4 text-sm">
              {[
                ["Projected rent", `${money(data.economics.monthlyRent)}/mo`],
                ["Mortgage", `${money(data.economics.monthlyPayment)}/mo`],
                ["HOA", `${money(data.economics.monthlyHoa)}/mo`],
                ["Taxes", `${money(data.economics.monthlyTaxes)}/mo`],
                ["Insurance", `${money(data.economics.monthlyInsurance)}/mo`],
                ["Net cash flow", `${money(data.economics.monthlyCashFlow)}/mo`],
                ["Cap rate", `${data.economics.capRate.toFixed(1)}%`],
                ["Cash-on-cash", `${data.economics.cashOnCash.toFixed(1)}%`],
              ].map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-4">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
            {s.ppsf && (
              <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
                ${Math.round(s.ppsf).toLocaleString()}/sq ft asking
                {s.vsMarketPct !== null
                  ? ` — ${Math.abs(s.vsMarketPct).toFixed(1)}% ${
                      s.vsMarketPct < 0 ? "below" : "above"
                    } comparable median.`
                  : "."}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}