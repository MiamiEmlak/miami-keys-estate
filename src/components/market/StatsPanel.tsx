export type Stat = { label: string; value: string; hint?: string };

export function StatsPanel({
  title,
  stats,
  footnote,
  className,
}: {
  title: string;
  stats: Stat[];
  footnote?: string;
  className?: string;
}) {
  return (
    <section className={`rounded-sm border border-border bg-card p-6 ${className ?? ""}`}>
      <h3 className="font-display text-xl text-foreground">{title}</h3>
      <dl className="mt-6 grid grid-cols-2 gap-6">
        {stats.map((s) => (
          <div key={s.label}>
            <dt className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {s.label}
            </dt>
            <dd className="mt-1.5 font-display text-2xl text-foreground">{s.value}</dd>
            {s.hint && <p className="mt-1 text-xs text-muted-foreground">{s.hint}</p>}
          </div>
        ))}
      </dl>
      {footnote && <p className="mt-6 text-xs text-muted-foreground">{footnote}</p>}
    </section>
  );
}
