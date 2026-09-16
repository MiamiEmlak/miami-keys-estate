export function TrendGraphPlaceholder({
  title = "12-month price trend",
  note = "Trend data builds as nightly market snapshots accumulate.",
}: {
  title?: string;
  note?: string;
}) {
  const bars = [42, 48, 45, 53, 58, 55, 62, 66, 61, 70, 74, 78];
  return (
    <section className="rounded-sm border border-border bg-card p-6">
      <h3 className="font-display text-xl text-foreground">{title}</h3>
      <div className="mt-6 flex h-32 items-end gap-2" aria-hidden>
        {bars.map((h, i) => (
          <div key={i} className="flex-1 rounded-t-sm bg-primary/20" style={{ height: `${h}%` }} />
        ))}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">{note}</p>
    </section>
  );
}
