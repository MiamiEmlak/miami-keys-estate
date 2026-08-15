import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { getBuildingDirectoryFn } from "@/lib/buildings.functions";
import { ListingImage } from "@/components/listings/ListingImage";
import { BuildingCardSkeleton } from "@/components/listings/Skeletons";
import { BUILDINGS, NEIGHBORHOODS, PRICE_TIERS } from "@/lib/buildings";
import { money, num } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/buildings/")({
  head: () => ({
    meta: [
      { title: "Miami Condo Tower Directory | Cays Realty" },
      {
        name: "description",
        content:
          "Browse Miami's luxury condo towers — active listings, average price per square foot and building-level market data from the live MLS.",
      },
      { property: "og:title", content: "Miami Condo Tower Directory | Cays Realty" },
      {
        property: "og:description",
        content: "Luxury Miami towers with live active listing counts and $/sq ft data.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/buildings" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/buildings" }],
  }),
  component: BuildingsDirectory,
});

function BuildingsDirectory() {
  const run = useServerFn(getBuildingDirectoryFn);
  const { data, isFetching } = useQuery({
    queryKey: ["building-directory"],
    queryFn: () => run({ data: undefined }),
    staleTime: 5 * 60 * 1000,
  });

  const [q, setQ] = useState("");
  const [hood, setHood] = useState("");
  const [tier, setTier] = useState("");

  const statsBySlug = useMemo(
    () => Object.fromEntries((data?.stats ?? []).map((s) => [s.slug, s])),
    [data],
  );

  const tierRange = PRICE_TIERS.find((t) => t.value === tier) ?? PRICE_TIERS[0]!;

  const buildings = BUILDINGS.filter((b) => {
    if (hood && b.neighborhood !== hood) return false;
    if (q && !`${b.name} ${b.address}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (tier) {
      const min = statsBySlug[b.slug]?.minPrice;
      if (typeof min !== "number") return false;
      if (min < tierRange.min || min >= tierRange.max) return false;
    }
    return true;
  });

  return (
    <main className="bg-background">
      <section className="mx-auto max-w-7xl px-6 pb-8 pt-8">
        <p className="eyebrow text-muted-foreground">Building intelligence</p>
        <h1 className="mt-5 max-w-3xl font-display text-5xl leading-tight text-foreground sm:text-6xl">
          Miami Condo Tower Directory
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Explore top luxury residential towers, active listings, and market data.
        </p>

        <div className="mt-10 grid gap-4 rounded-sm border border-border bg-card p-6 sm:grid-cols-3">
          <div>
            <Label htmlFor="b-q">Building</Label>
            <Input
              id="b-q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name or address"
            />
          </div>
          <div>
            <Label htmlFor="b-hood">Neighborhood</Label>
            <select
              id="b-hood"
              value={hood}
              onChange={(e) => setHood(e.target.value)}
              className="mt-1 h-9 w-full rounded-sm border border-input bg-background px-3 text-sm"
            >
              <option value="">All neighborhoods</option>
              {NEIGHBORHOODS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="b-tier">Price tier</Label>
            <select
              id="b-tier"
              value={tier}
              onChange={(e) => setTier(e.target.value)}
              className="mt-1 h-9 w-full rounded-sm border border-input bg-background px-3 text-sm"
            >
              {PRICE_TIERS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <p className="border-b border-border pb-4 text-sm text-muted-foreground">
          {isFetching ? "Loading live building data…" : `${buildings.length} towers`}
        </p>

        {isFetching && (
          <div className="mt-8 grid gap-8 sm:grid-cols-2 xl:grid-cols-3" aria-hidden>
            {Array.from({ length: 6 }).map((_, i) => (
              <BuildingCardSkeleton key={i} />
            ))}
          </div>
        )}

        <div className={`mt-8 grid gap-8 sm:grid-cols-2 xl:grid-cols-3 ${isFetching ? "hidden" : ""}`}>
          {buildings.map((b) => {
            const s = statsBySlug[b.slug];
            return (
              <article
                key={b.slug}
                className="group overflow-hidden rounded-sm border border-border bg-card transition-shadow hover:shadow-[var(--shadow-elevated)]"
              >
                <Link to="/buildings/$slug" params={{ slug: b.slug }} className="block">
                  <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
                    <ListingImage
                      src={s?.photo}
                      alt={`${b.name} in ${b.neighborhood}, Miami`}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                    {s?.avgPpsf ? (
                      <span className="absolute left-3 top-3 rounded-sm bg-primary/90 px-2 py-1 text-[10px] uppercase tracking-widest text-primary-foreground">
                        Avg {money(s.avgPpsf)}/sq ft
                      </span>
                    ) : null}
                  </div>
                </Link>
                <div className="p-6">
                  <p className="eyebrow text-muted-foreground">{b.neighborhood}</p>
                  <h2 className="mt-2 font-display text-2xl text-foreground">{b.name}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{b.blurb}</p>
                  <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-5 text-sm">
                    <div>
                      <dt className="text-xs uppercase tracking-widest text-muted-foreground">Units</dt>
                      <dd className="mt-1 text-foreground">{num(b.units)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-widest text-muted-foreground">
                        Active listings
                      </dt>
                      <dd className="mt-1 text-foreground">{s ? num(s.activeCount) : "—"}</dd>
                    </div>
                  </dl>
                  <Link
                    to="/buildings/$slug"
                    params={{ slug: b.slug }}
                    className="mt-6 inline-flex w-full items-center justify-center rounded-sm bg-primary px-4 py-3 text-xs uppercase tracking-widest text-primary-foreground"
                  >
                    View building intelligence
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        {buildings.length === 0 && (
          <p className="mt-16 text-center text-sm text-muted-foreground">
            No towers match these filters.
          </p>
        )}
      </section>
    </main>
  );
}
