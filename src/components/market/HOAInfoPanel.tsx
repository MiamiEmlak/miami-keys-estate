import { money } from "@/lib/format";

export function HOAInfoPanel({
  hoaRange,
  hoaLow,
  hoaHigh,
  amenities,
  floorPlans,
}: {
  hoaRange: string;
  hoaLow: number;
  hoaHigh: number;
  amenities: string[];
  floorPlans: string[];
}) {
  return (
    <section className="rounded-sm border border-border bg-card p-6">
      <h3 className="font-display text-xl text-foreground">HOA &amp; building details</h3>
      <dl className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-widest text-muted-foreground">Monthly HOA range</dt>
          <dd className="mt-1 text-sm text-foreground">
            {money(hoaLow)} – {money(hoaHigh)}/mo
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-widest text-muted-foreground">Rate per sq ft</dt>
          <dd className="mt-1 text-sm text-foreground">{hoaRange}</dd>
        </div>
      </dl>

      <div className="mt-6 border-t border-border pt-6">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Amenities</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {amenities.map((a) => (
            <li key={a} className="rounded-sm bg-secondary px-2.5 py-1 text-xs text-foreground">
              {a}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 border-t border-border pt-6">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Floor plan lines</p>
        <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
          {floorPlans.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
