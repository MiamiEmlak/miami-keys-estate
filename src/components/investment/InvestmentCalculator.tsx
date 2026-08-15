import { useMemo, useState } from "react";
import { computeRoi, defaultInputs, pct, type RoiInputs } from "@/lib/roi";
import { money } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type Listing = {
  list_price: number | null;
  living_area: number | null;
  association_fee: number | null;
  association_fee_frequency: string | null;
  tax_annual_amount: number | null;
};

const FIELDS: { key: keyof RoiInputs; label: string; suffix?: string; step?: number }[] = [
  { key: "downPct", label: "Down payment", suffix: "%", step: 1 },
  { key: "ratePct", label: "Interest rate", suffix: "%", step: 0.125 },
  { key: "termYears", label: "Loan term", suffix: "yrs", step: 1 },
  { key: "monthlyRent", label: "Monthly rent", suffix: "$", step: 50 },
  { key: "monthlyHoa", label: "Monthly HOA", suffix: "$", step: 25 },
  { key: "annualTaxes", label: "Property taxes", suffix: "$/yr", step: 100 },
  { key: "annualInsurance", label: "Home insurance", suffix: "$/yr", step: 100 },
  { key: "vacancyPct", label: "Vacancy", suffix: "%", step: 1 },
];

export function InvestmentCalculator({ listing }: { listing: Listing }) {
  const presets = useMemo(() => defaultInputs(listing), [listing]);
  const [inputs, setInputs] = useState<RoiInputs>(presets);

  // Recomputes synchronously on every keystroke — no fetches, no reloads.
  const out = computeRoi(inputs);

  const set = (key: keyof RoiInputs, raw: string) =>
    setInputs((prev) => ({ ...prev, [key]: Number(raw) || 0 }));

  const positive = out.monthlyCashFlow >= 0;

  return (
    <section className="mt-12 rounded-sm border border-border bg-card p-6 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-muted-foreground">Investment intelligence</p>
          <h2 className="mt-2 font-display text-2xl">Yield &amp; ROI calculator</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Pre-filled from this listing&apos;s price, HOA and tax record. Adjust anything to see
            returns update instantly.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setInputs(presets)}>
          Reset to listing presets
        </Button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="grid gap-4 sm:grid-cols-2">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <Label htmlFor={`roi-${f.key}`} className="text-xs uppercase tracking-widest text-muted-foreground">
                {f.label} {f.suffix ? <span className="normal-case tracking-normal">({f.suffix})</span> : null}
              </Label>
              <Input
                id={`roi-${f.key}`}
                type="number"
                inputMode="decimal"
                step={f.step ?? 1}
                value={String(inputs[f.key])}
                onChange={(e) => set(f.key, e.target.value)}
                className="mt-2"
              />
            </div>
          ))}
        </div>

        <div className="rounded-sm border border-border bg-secondary/40 p-6">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Estimated monthly cash flow
          </p>
          <p
            className={`mt-1 font-display text-4xl ${positive ? "text-foreground" : "text-destructive"}`}
          >
            {money(Math.round(out.monthlyCashFlow))}
          </p>

          <dl className="mt-6 space-y-4 border-t border-border pt-6 text-sm">
            {[
              ["Cap rate", pct(out.capRate)],
              ["Net yield", pct(out.netYield)],
              ["Cash-on-cash return", pct(out.cashOnCash)],
              ["Gross yield", pct(out.grossYield)],
              ["Mortgage payment", `${money(Math.round(out.monthlyPayment))}/mo`],
              ["Down payment", money(Math.round(out.downPayment))],
              ["Loan amount", money(Math.round(out.loanAmount))],
              ["Annual NOI", money(Math.round(out.noiAnnual))],
            ].map(([label, value]) => (
              <div key={label} className="flex items-baseline justify-between gap-4">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
            Estimates only — includes {inputs.maintenancePct}% maintenance reserve and ~3% closing
            costs in cash invested. Verify taxes, HOA and insurance before making an offer.
          </p>
        </div>
      </div>
    </section>
  );
}