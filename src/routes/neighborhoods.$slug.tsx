import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getNeighborhoodProfileFn } from "@/lib/market.functions";
import { getNeighborhood } from "@/lib/neighborhoods";
import { buildingsInNeighborhood } from "@/lib/buildings";
import { PropertyCard } from "@/components/listings/PropertyCard";
import { PropertyGridSkeleton } from "@/components/listings/Skeletons";
import { MarketStatsPanel } from "@/components/market/MarketStatsPanel";
import { TrendGraphPlaceholder } from "@/components/market/TrendGraphPlaceholder";
import { WatchButton } from "@/components/market/WatchButton";
import { AlertButton } from "@/components/market/AlertButton";
import { STRBadge } from "@/components/market/STRBadge";

export const Route = createFileRoute("/neighborhoods/$slug")({
  loader: ({ params }) => {
    const neighborhood = getNeighborhood(params.slug);
    if (!neighborhood) throw notFound();
    return { neighborhood };
  },
  head: ({ params, loaderData }) => {
    const canonical = `/neighborhoods/${params.slug}`;
    if (!loaderData) {
      return {
        meta: [
          { title: "Neighborhood unavailable | Cays Realty" },
          { name: "robots", content: "noindex" },
        ],
        links: [{ rel: "canonical", href: canonical }],
      };
    }
    const n = loaderData.neighborhood;
    const title = `${n.name} Real Estate — Prices, Schools & Rentals | Cays Realty`;
    const description = `${n.name} market intelligence: live median sale and rent prices, price per square foot, schools, walkability and short-term-rental rules.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: canonical },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: canonical }],
    };
  },
  component: NeighborhoodProfile,
  notFoundComponent: () => (
    <div className="p-16 text-center text-sm text-muted-foreground">
      We don't cover that neighborhood yet.{" "}
      <Link to="/neighborhoods" className="underline">
        Browse all neighborhoods
      </Link>
    </div>
  ),
});

function NeighborhoodProfile() {
  const { neighborhood: n } = Route.useLoaderData();
  const run = useServerFn(getNeighborhoodProfileFn);
  const { data, isFetching } = useQuery({
    queryKey: ["neighborhood", n.slug],
    queryFn: () => run({ data: { slug: n.slug } }),
  });

  const towers = buildingsInNeighborhood(n.slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: n.name,
    description: n.overview,
    address: { "@type": "PostalAddress", addressLocality: n.city, addressRegion: "FL", addressCountry: "US" },
    geo: { "@type": "GeoCoordinates", latitude: n.center.lat, longitude: n.center.lng },
  };

  return (
    <main className="bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-7xl px-6 pb-24 pt-10">
        <p className="eyebrow text-muted-foreground">{n.city}</p>
        <h1 className="mt-4 font-display text-5xl text-foreground">{n.name}</h1>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">{n.overview}</p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <STRBadge friendly={n.strFriendly} />
          <span className="rounded-sm bg-secondary px-2.5 py-1 text-xs text-foreground">
            Walk score {n.walkScore}
          </span>
          <span className="rounded-sm bg-secondary px-2.5 py-1 text-xs text-foreground">
            Transit score {n.transitScore}
          </span>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <WatchButton watchType="neighborhood" value={n.slug} label={n.name} />
          <AlertButton name={`New listings in ${n.name}`} criteria={{ neighborhood: n.slug }} />
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_22rem]">
          <div className="space-y-8">
            <MarketStatsPanel stats={data?.stats} loading={isFetching} saleLabel="Median sale price" />
            <TrendGraphPlaceholder title={`${n.name} price trend`} />

            <section className="rounded-sm border border-border bg-card p-6">
              <h2 className="font-display text-xl">Lifestyle &amp; walkability</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{n.lifestyle}</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {n.hotspots.map((h) => (
                  <li key={h} className="rounded-sm bg-secondary px-2.5 py-1 text-xs text-foreground">
                    {h}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-sm border border-border bg-card p-6">
              <h2 className="font-display text-xl">Schools</h2>
              <ul className="mt-4 divide-y divide-border text-sm">
                {n.schools.map((s) => (
                  <li key={s.name} className="flex items-center justify-between py-3">
                    <span className="text-foreground">{s.name}</span>
                    <span className="text-muted-foreground">
                      {s.level} · {s.rating}/10
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-sm border border-border bg-card p-6">
              <h2 className="font-display text-xl">Investment potential</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {n.investmentPotential}
              </p>
              {n.strZones.length > 0 && (
                <>
                  <p className="mt-5 text-xs uppercase tracking-widest text-muted-foreground">
                    STR-friendly zones
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {n.strZones.map((z) => (
                      <li key={z} className="rounded-sm bg-secondary px-2.5 py-1 text-xs text-foreground">
                        {z}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>

            <section className="overflow-hidden rounded-sm border border-border bg-card">
              <h2 className="px-6 pt-6 font-display text-xl">Map</h2>
              <iframe
                title={`Map of ${n.name}`}
                className="mt-4 h-80 w-full border-0"
                loading="lazy"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${n.center.lng - 0.03}%2C${n.center.lat - 0.02}%2C${n.center.lng + 0.03}%2C${n.center.lat + 0.02}&layer=mapnik&marker=${n.center.lat}%2C${n.center.lng}`}
              />
            </section>

            <section>
              <h2 className="font-display text-3xl">Active listings</h2>
              {isFetching && (data?.listings?.length ?? 0) === 0 ? (
                <PropertyGridSkeleton count={4} />
              ) : (
                <div className="mt-6 grid gap-8 sm:grid-cols-2">
                  {(data?.listings ?? []).map((l) => (
                    <PropertyCard key={l.listing_key} listing={{ ...l, photo_count: l.photo ? 1 : 0 }} />
                  ))}
                </div>
              )}
              {!isFetching && (data?.listings?.length ?? 0) === 0 && (
                <p className="mt-6 text-sm text-muted-foreground">
                  No active listings returned for this area right now.
                </p>
              )}
            </section>
          </div>

          <aside className="lg:sticky lg:top-8 lg:self-start">
            <div className="rounded-sm border border-border bg-card p-6">
              <h2 className="font-display text-2xl">Top buildings</h2>
              <ul className="mt-4 space-y-3 text-sm">
                {towers.map((b) => (
                  <li key={b.slug}>
                    <Link
                      to="/buildings/$slug"
                      params={{ slug: b.slug }}
                      className="text-foreground underline-offset-4 hover:underline"
                    >
                      {b.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{b.hoaRange}</p>
                  </li>
                ))}
                {towers.length === 0 && (
                  <li className="text-muted-foreground">No towers tracked here yet.</li>
                )}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
