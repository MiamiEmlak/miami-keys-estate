import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getNeighborhoodProfileFn } from "@/lib/market.functions";
import { getNeighborhood } from "@/lib/neighborhoods";
import { buildingsInNeighborhood } from "@/lib/buildings";
import { PropertyCard } from "@/components/listings/PropertyCard";
import { PropertyGridSkeleton } from "@/components/listings/Skeletons";
import { ListingImage } from "@/components/listings/ListingImage";
import { MarketStatsPanel } from "@/components/market/MarketStatsPanel";
import { TrendGraphPlaceholder } from "@/components/market/TrendGraphPlaceholder";
import { SectionHeader } from "@/components/market/SectionHeader";
import { StatsPanel } from "@/components/market/StatsPanel";
import { WatchButton } from "@/components/market/WatchButton";
import { AlertButton } from "@/components/market/AlertButton";
import { STRBadge } from "@/components/market/STRBadge";
import { money } from "@/lib/format";

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
    const title = `${n.name} Real Estate — Homes, Condos & Rentals | Cays Realty`;
    const description = `${n.name}, ${n.county} County market intelligence: live median sale and rent prices, price per square foot, top buildings, schools, walkability and short-term-rental rules.`;
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
  const sale = data?.saleListings ?? [];
  const rent = data?.rentListings ?? [];
  const hero = sale[0]?.photo ?? rent[0]?.photo ?? null;
  const stats = data?.stats;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Place",
        name: n.name,
        description: n.overview,
        address: {
          "@type": "PostalAddress",
          addressLocality: n.city,
          addressRegion: "FL",
          addressCountry: "US",
        },
        geo: { "@type": "GeoCoordinates", latitude: n.center.lat, longitude: n.center.lng },
      },
      ...sale.slice(0, 6).map((l) => ({
        "@type": "RealEstateListing",
        name: l.street_address ?? n.name,
        url: `/property/${l.listing_key}`,
        ...(l.list_price
          ? { offers: { "@type": "Offer", price: l.list_price, priceCurrency: "USD" } }
          : {}),
      })),
    ],
  };

  return (
    <main className="bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="relative">
        <ListingImage
          src={hero}
          alt={`${n.name}, ${n.city} — featured listing photo`}
          loading="eager"
          className="h-[42vh] min-h-72 w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/35 to-transparent" />
        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto max-w-7xl px-6 pb-10">
            <p className="text-[11px] uppercase tracking-[0.22em] text-background/80">
              {n.city} · {n.county} County
            </p>
            <h1 className="mt-3 font-display text-4xl text-background sm:text-6xl">{n.name}</h1>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-background">
              <STRBadge friendly={n.strFriendly} />
              <span className="rounded-sm bg-background/15 px-2.5 py-1 text-xs backdrop-blur">
                Median sale {money(stats?.medianPrice, { compact: true })}
              </span>
              <span className="rounded-sm bg-background/15 px-2.5 py-1 text-xs backdrop-blur">
                Median rent {stats?.medianRent ? `${money(stats.medianRent)}/mo` : "—"}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 pb-24 pt-10">
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{n.overview}</p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
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

            <div className="grid gap-6 lg:grid-cols-2">
              <StatsPanel
                title="For sale"
                stats={[
                  { label: "Median price", value: money(stats?.medianPrice, { compact: true }) },
                  {
                    label: "Price per sq ft",
                    value: stats?.avgPpsf ? money(stats.avgPpsf) : "—",
                  },
                  { label: "Active listings", value: String(stats?.activeCount ?? 0) },
                  { label: "Price drops", value: String(stats?.priceDrops ?? 0) },
                ]}
              />
              <StatsPanel
                title="For rent"
                stats={[
                  {
                    label: "Median rent",
                    value: stats?.medianRent ? `${money(stats.medianRent)}/mo` : "—",
                  },
                  { label: "Active rentals", value: String(stats?.rentalCount ?? 0) },
                  { label: "Walkability", value: `${n.walkScore}/100` },
                  { label: "Transit", value: `${n.transitScore}/100` },
                ]}
              />
            </div>

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
              <SectionHeader
                eyebrow="For sale"
                title={`Homes & condos for sale in ${n.name}`}
                description="Live MLS resale inventory, refreshed each time this page loads."
              />
              {isFetching && sale.length === 0 ? (
                <PropertyGridSkeleton count={4} />
              ) : (
                <div className="mt-6 grid gap-8 sm:grid-cols-2">
                  {sale.map((l) => (
                    <PropertyCard key={l.listing_key} listing={{ ...l, photo_count: l.photo ? 1 : 0 }} />
                  ))}
                </div>
              )}
              {!isFetching && sale.length === 0 && (
                <p className="mt-6 text-sm text-muted-foreground">
                  No active resale listings returned for this area right now.
                </p>
              )}
            </section>

            <section>
              <SectionHeader
                eyebrow="For rent"
                title={`Rentals in ${n.name}`}
                description="Active lease listings pulled from the same live MLS feed."
              />
              {isFetching && rent.length === 0 ? (
                <PropertyGridSkeleton count={2} />
              ) : (
                <div className="mt-6 grid gap-8 sm:grid-cols-2">
                  {rent.map((l) => (
                    <PropertyCard key={l.listing_key} listing={{ ...l, photo_count: l.photo ? 1 : 0 }} />
                  ))}
                </div>
              )}
              {!isFetching && rent.length === 0 && (
                <p className="mt-6 text-sm text-muted-foreground">
                  No active rentals returned for this area right now.
                </p>
              )}
            </section>

            <section className="rounded-sm border border-border bg-secondary/40 p-8">
              <h2 className="font-display text-2xl">{n.name} real estate guide</h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{n.seoText}</p>
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
