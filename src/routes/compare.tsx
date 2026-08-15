import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueries } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { X, Trophy } from "lucide-react";
import { getListingFn } from "@/lib/listings.functions";
import { money, num, fullAddress } from "@/lib/format";
import { computeRoi, defaultInputs, pct } from "@/lib/roi";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScheduleShowingDialog } from "@/components/leads/ScheduleShowingDialog";

export const Route = createFileRoute("/compare")({
  validateSearch: (search: Record<string, unknown>) => ({
    ids: typeof search["ids"] === "string" ? (search["ids"] as string) : "",
  }),
  head: () => ({
    meta: [
      { title: "Compare Miami Listings Side by Side | Cays Realty" },
      {
        name: "description",
        content:
          "Compare up to four live Miami MLS listings on price, $/sq ft, HOA fees, size and estimated rental yield.",
      },
      { property: "og:title", content: "Compare Miami Listings | Cays Realty" },
      {
        property: "og:description",
        content: "Side-by-side comparison of live Miami MLS listings with estimated rental yield.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ComparePage,
});

type Row = {
  label: string;
  values: string[];
  best?: number | null;
};

function ComparePage() {
  const { ids } = Route.useSearch();
  const navigate = useNavigate();
  const getListing = useServerFn(getListingFn);
  const [dimSame, setDimSame] = useState(true);

  const keys = ids.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 4);

  const results = useQueries({
    queries: keys.map((key) => ({
      queryKey: ["listing", key],
      queryFn: () => getListing({ data: { listingKey: key } }),
    })),
  });

  const loading = results.some((r) => r.isLoading);
  const items = results
    .map((r, i) => ({ key: keys[i]!, data: r.data }))
    .filter((x) => x.data?.listing)
    .map((x) => {
      const p = x.data!.listing!;
      const roi = computeRoi(defaultInputs(p));
      return {
        key: x.key,
        p,
        photo: x.data!.media[0]?.media_url ?? null,
        ppsf: p.list_price && p.living_area ? p.list_price / p.living_area : null,
        yieldPct: roi.netYield,
      };
    });

  function remove(key: string) {
    navigate({
      to: "/compare",
      search: { ids: keys.filter((k) => k !== key).join(",") },
    });
  }

  const ppsfValues = items.map((i) => i.ppsf).filter((v): v is number => typeof v === "number");
  const bestPpsf = ppsfValues.length ? Math.min(...ppsfValues) : null;
  const bestYield = items.length ? Math.max(...items.map((i) => i.yieldPct)) : null;

  const rows: Row[] = items.length
    ? [
        { label: "List price", values: items.map((i) => money(i.p.list_price)) },
        {
          label: "$ / sq ft",
          values: items.map((i) => (i.ppsf ? `${money(Math.round(i.ppsf))}/sq ft` : "—")),
        },
        { label: "Beds", values: items.map((i) => num(i.p.bedrooms_total)) },
        { label: "Baths", values: items.map((i) => num(i.p.bathrooms_total)) },
        { label: "Living area", values: items.map((i) => (i.p.living_area ? `${num(i.p.living_area)} sq ft` : "—")) },
        { label: "Year built", values: items.map((i) => (i.p.year_built ? String(i.p.year_built) : "—")) },
        {
          label: "HOA fee",
          values: items.map((i) =>
            i.p.association_fee
              ? `${money(i.p.association_fee)} ${i.p.association_fee_frequency ?? ""}`.trim()
              : "—",
          ),
        },
        { label: "Annual tax", values: items.map((i) => money(i.p.tax_annual_amount)) },
        { label: "Property type", values: items.map((i) => i.p.property_sub_type ?? i.p.property_type ?? "—") },
        { label: "Status", values: items.map((i) => i.p.standard_status ?? "—") },
        { label: "Estimated net yield", values: items.map((i) => pct(i.yieldPct)) },
      ]
    : [];

  return (
    <main className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link to="/" className="brand-mark text-lg text-foreground">
          Cays
        </Link>
        <Link to="/search" search={{}} className="text-sm text-muted-foreground hover:text-foreground">
          Back to search
        </Link>
      </header>

      <div className="mx-auto max-w-7xl px-6 pb-24">
        <p className="eyebrow text-muted-foreground">Comparison matrix</p>
        <h1 className="mt-3 font-display text-5xl text-foreground">Compare properties</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Up to four live MLS listings side by side — pricing, size, carrying costs and estimated
          rental yield.
        </p>

        <div className="mt-8 flex items-center gap-3">
          <Switch id="dim-same" checked={dimSame} onCheckedChange={setDimSame} />
          <Label htmlFor="dim-same" className="text-sm text-muted-foreground">
            Highlight differences only
          </Label>
        </div>

        {loading && <p className="mt-12 text-sm text-muted-foreground">Loading listings…</p>}

        {!loading && items.length === 0 && (
          <div className="mt-12 rounded-sm border border-border p-10 text-sm text-muted-foreground">
            No properties selected yet. Add listings from{" "}
            <Link to="/search" search={{}} className="underline">
              search results
            </Link>{" "}
            to compare them here.
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[52rem] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="w-40 border-b border-border p-4 text-left align-bottom text-xs uppercase tracking-widest text-muted-foreground">
                    Attribute
                  </th>
                  {items.map((i) => {
                    const winner =
                      (bestPpsf !== null && i.ppsf === bestPpsf) ||
                      (bestYield !== null && i.yieldPct === bestYield && items.length > 1);
                    return (
                      <th key={i.key} className="border-b border-border p-4 text-left align-top">
                        <div className="relative">
                          {i.photo ? (
                            <img
                              src={i.photo}
                              alt={`${fullAddress(i.p)} — MLS photo`}
                              className="h-36 w-full rounded-sm object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-36 items-center justify-center rounded-sm bg-secondary text-xs text-muted-foreground">
                              No photo
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => remove(i.key)}
                            aria-label="Remove property"
                            className="absolute right-2 top-2 rounded-sm bg-background/90 p-1 text-foreground"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          {winner && (
                            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-sm bg-accent px-2 py-1 text-[10px] uppercase tracking-widest text-accent-foreground">
                              <Trophy className="h-3 w-3" />
                              {bestPpsf !== null && i.ppsf === bestPpsf ? "Best value" : "Top yield"}
                            </span>
                          )}
                        </div>
                        <Link
                          to="/property/$id"
                          params={{ id: i.key }}
                          className="mt-3 block font-display text-lg text-foreground hover:underline"
                        >
                          {money(i.p.list_price)}
                        </Link>
                        <span className="mt-1 block text-xs font-normal text-muted-foreground">
                          {fullAddress(i.p)}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const identical =
                    row.values.length > 1 && row.values.every((v) => v === row.values[0]);
                  return (
                    <tr
                      key={row.label}
                      className={dimSame && identical ? "opacity-40" : undefined}
                    >
                      <th className="border-b border-border p-4 text-left text-xs uppercase tracking-widest text-muted-foreground">
                        {row.label}
                      </th>
                      {row.values.map((v, idx) => (
                        <td key={`${row.label}-${idx}`} className="border-b border-border p-4 text-foreground">
                          {v}
                        </td>
                      ))}
                    </tr>
                  );
                })}
                <tr>
                  <th className="p-4" />
                  {items.map((i) => (
                    <td key={`actions-${i.key}`} className="space-y-3 p-4 align-top">
                      <ScheduleShowingDialog listingKey={i.key} address={fullAddress(i.p)} />
                      <Button variant="outline" className="w-full" onClick={() => remove(i.key)}>
                        Remove property
                      </Button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}