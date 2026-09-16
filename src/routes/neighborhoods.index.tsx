import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { getNeighborhoodDirectoryFn } from "@/lib/market.functions";
import { NeighborhoodCard } from "@/components/market/NeighborhoodCard";
import { BuildingCardSkeleton } from "@/components/listings/Skeletons";
import { NEIGHBORHOOD_LIST, COUNTIES } from "@/lib/neighborhoods";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/neighborhoods/")({
  head: () => ({
    meta: [
      { title: "Southeast Florida Neighborhood Intelligence | Cays Realty" },
      {
        name: "description",
        content:
          "Compare 40+ luxury neighborhoods across Miami-Dade, Broward and Palm Beach on median price, rents, price per square foot, schools, walkability and short-term-rental rules.",
      },
      {
        property: "og:title",
        content: "Southeast Florida Neighborhood Intelligence | Cays Realty",
      },
      {
        property: "og:description",
        content:
          "Live median prices, rents and $/sq ft for every high-end neighborhood from Brickell to Jupiter Island.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/neighborhoods" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/neighborhoods" }],
  }),
  component: NeighborhoodsIndex,
});

function NeighborhoodsIndex() {
  const run = useServerFn(getNeighborhoodDirectoryFn);
  const { data, isFetching } = useQuery({
    queryKey: ["neighborhood-directory"],
    queryFn: () => run({ data: undefined }),
    staleTime: 5 * 60 * 1000,
  });

  const [q, setQ] = useState("");
  const [county, setCounty] = useState("");
  const [str, setStr] = useState(false);

  const statsBySlug = useMemo(
    () => Object.fromEntries((data?.stats ?? []).map((s) => [s.slug, s])),
    [data],
  );

  const items = NEIGHBORHOOD_LIST.filter((n) => {
    if (county && n.county !== county) return false;
    if (str && !n.strFriendly) return false;
    if (q && !`${n.name} ${n.city}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <main className="bg-background">
      <section className="mx-auto max-w-7xl px-6 pb-8 pt-8">
        <p className="eyebrow text-muted-foreground">Neighborhood intelligence</p>
        <h1 className="mt-5 max-w-3xl font-display text-5xl leading-tight text-foreground sm:text-6xl">
          Southeast Florida Neighborhoods
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Lifestyle, schools, investment outlook and live MLS pricing across Miami-Dade, Broward and
          Palm Beach.
        </p>

        <div className="mt-10 grid gap-4 rounded-sm border border-border bg-card p-6 sm:grid-cols-3">
          <div>
            <Label htmlFor="n-q">Neighborhood</Label>
            <Input
              id="n-q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name"
            />
          </div>
          <div>
            <Label htmlFor="n-county">County</Label>
            <select
              id="n-county"
              value={county}
              onChange={(e) => setCounty(e.target.value)}
              className="mt-1 h-9 w-full rounded-sm border border-input bg-background px-3 text-sm"
            >
              <option value="">All counties</option>
              {COUNTIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-3 text-sm text-foreground">
              <input
                type="checkbox"
                checked={str}
                onChange={(e) => setStr(e.target.checked)}
                className="h-4 w-4 rounded-sm border-input"
              />
              STR / flexible leasing friendly only
            </label>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <p className="border-b border-border pb-4 text-sm text-muted-foreground">
          {isFetching ? "Loading live market data…" : `${items.length} neighborhoods`}
        </p>

        {isFetching && (
          <div className="mt-8 grid gap-8 sm:grid-cols-2 xl:grid-cols-3" aria-hidden>
            {Array.from({ length: 6 }).map((_, i) => (
              <BuildingCardSkeleton key={i} />
            ))}
          </div>
        )}

        <div className={`mt-8 grid gap-8 sm:grid-cols-2 xl:grid-cols-3 ${isFetching ? "hidden" : ""}`}>
          {items.map((n) => (
            <NeighborhoodCard key={n.slug} neighborhood={n} stats={statsBySlug[n.slug]} />
          ))}
        </div>

        {items.length === 0 && (
          <p className="mt-16 text-center text-sm text-muted-foreground">
            No neighborhoods match these filters.
          </p>
        )}
      </section>
    </main>
  );
}
