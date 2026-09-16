import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { getHomeProfileFn } from "@/lib/market.functions";
import { saveListingFn } from "@/lib/listings.functions";
import { supabase } from "@/integrations/supabase/client";
import { HomeCard } from "@/components/market/HomeCard";
import { PropertyCard } from "@/components/listings/PropertyCard";
import { PropertyGridSkeleton } from "@/components/listings/Skeletons";
import { ListingImage } from "@/components/listings/ListingImage";
import { WatchButton } from "@/components/market/WatchButton";
import { AlertButton } from "@/components/market/AlertButton";
import { PriceChangeBadge } from "@/components/market/PriceChangeBadge";
import { TrendGraphPlaceholder } from "@/components/market/TrendGraphPlaceholder";
import { NEIGHBORHOOD_LIST } from "@/lib/neighborhoods";
import { money, num, perSqFt, fullAddress } from "@/lib/format";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/homes/$slug")({
  head: ({ params }) => {
    const canonical = `/homes/${params.slug}`;
    const title = "Miami Single-Family Home | Cays Realty";
    const description =
      "Live MLS detail for this Miami single-family home: beds, baths, lot size, price history, school zone and nearby comparable listings.";
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
  component: HomeProfile,
});

type PriceRow = { price: number | null; recorded_at: string };

function HomeProfile() {
  const { slug } = Route.useParams();
  const run = useServerFn(getHomeProfileFn);
  const save = useServerFn(saveListingFn);
  const { data, isFetching } = useQuery({
    queryKey: ["home", slug],
    queryFn: () => run({ data: { slug } }),
  });

  const [history, setHistory] = useState<PriceRow[]>([]);
  useEffect(() => {
    let active = true;
    void supabase
      .from("price_history")
      .select("price, recorded_at")
      .eq("listing_key", slug)
      .order("recorded_at", { ascending: false })
      .limit(24)
      .then(({ data: rows }) => {
        if (active) setHistory((rows as PriceRow[] | null) ?? []);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  const home = data?.home ?? null;
  const neighborhood =
    NEIGHBORHOOD_LIST.find((n) => n.city === home?.city) ?? NEIGHBORHOOD_LIST[0]!;

  if (!home) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-16">
        {isFetching ? (
          <PropertyGridSkeleton count={3} />
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            That home is no longer active.{" "}
            <Link to="/homes" className="underline">
              Browse single-family homes
            </Link>
          </p>
        )}
      </main>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SingleFamilyResidence",
        name: fullAddress(home),
        numberOfRooms: home.bedrooms_total ?? undefined,
        floorSize: home.living_area
          ? { "@type": "QuantitativeValue", value: home.living_area, unitCode: "FTK" }
          : undefined,
        address: {
          "@type": "PostalAddress",
          streetAddress: home.street_address ?? undefined,
          addressLocality: home.city ?? undefined,
          addressRegion: home.state ?? "FL",
          postalCode: home.postal_code ?? undefined,
        },
      },
      {
        "@type": "RealEstateListing",
        name: fullAddress(home),
        url: `/homes/${home.listing_key}`,
        datePosted: home.listing_contract_date ?? undefined,
        offers: home.list_price
          ? { "@type": "Offer", price: home.list_price, priceCurrency: "USD" }
          : undefined,
      },
    ],
  };

  async function saveHome() {
    try {
      await save({ data: { listingKey: slug, mode: "save" } });
      toast.success("Saved to your properties");
    } catch {
      toast.error("Sign in to save homes.");
    }
  }

  return (
    <main className="bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-7xl px-6 pb-24 pt-10">
        <div className="overflow-hidden rounded-sm border border-border bg-secondary">
          <ListingImage
            src={home.photo}
            alt={`${fullAddress(home)} — primary MLS photo`}
            className="aspect-[16/9] w-full object-cover"
          />
        </div>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="font-display text-4xl text-foreground">{fullAddress(home)}</h1>
            <p className="mt-3 font-display text-3xl text-foreground">{money(home.list_price)}</p>
            <div className="mt-3">
              <PriceChangeBadge
                current={home.list_price}
                prior={home.previous_list_price ?? home.original_list_price}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={saveHome}>
              <Heart className="mr-2 h-4 w-4" /> Save home
            </Button>
            <WatchButton
              watchType="property"
              value={home.listing_key}
              listingKey={home.listing_key}
              label={fullAddress(home)}
            />
            <AlertButton
              name="Single-family alerts"
              criteria={{ property_type: "single_family", ...(home.city ? { city: home.city } : {}) }}
            />
          </div>
        </div>

        <dl className="mt-8 grid grid-cols-2 gap-6 border-y border-border py-8 sm:grid-cols-6">
          {[
            ["Beds", num(home.bedrooms_total)],
            ["Baths", num(home.bathrooms_total)],
            ["Living area", `${num(home.living_area)} sq ft`],
            ["Lot size", home.lot_size ? `${num(home.lot_size)} sq ft` : "—"],
            ["Year built", home.year_built ? String(home.year_built) : "—"],
            ["$/sq ft", perSqFt(home.list_price, home.living_area)],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs uppercase tracking-widest text-muted-foreground">{label}</dt>
              <dd className="mt-1 text-sm text-foreground">{value}</dd>
            </div>
          ))}
        </dl>

        {home.description && (
          <p className="mt-8 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {home.description}
          </p>
        )}

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          <section className="rounded-sm border border-border bg-card p-6">
            <h2 className="font-display text-xl">Neighborhood &amp; schools</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Closest covered neighborhood:{" "}
              <Link
                to="/neighborhoods/$slug"
                params={{ slug: neighborhood.slug }}
                className="text-foreground underline underline-offset-4"
              >
                {neighborhood.name}
              </Link>{" "}
              · Walk score {neighborhood.walkScore}
            </p>
            <ul className="mt-4 divide-y divide-border text-sm">
              {neighborhood.schools.map((s) => (
                <li key={s.name} className="flex items-center justify-between py-2.5">
                  <span className="text-foreground">{s.name}</span>
                  <span className="text-muted-foreground">
                    {s.level} · {s.rating}/10
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-sm border border-border bg-card p-6">
            <h2 className="font-display text-xl">Price history</h2>
            {history.length > 0 ? (
              <ul className="mt-4 divide-y divide-border text-sm">
                {history.map((h) => (
                  <li key={h.recorded_at} className="flex items-center justify-between py-2.5">
                    <span className="text-muted-foreground">
                      {new Date(h.recorded_at).toLocaleDateString()}
                    </span>
                    <span className="text-foreground">{money(h.price)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                No recorded price changes yet — nightly snapshots start tracking this listing from
                today.
              </p>
            )}
          </section>

          <section className="rounded-sm border border-border bg-card p-6">
            <h2 className="font-display text-xl">Renovation notes</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Our team reviews permit history, roof and impact-window age, and kitchen/bath condition
              before every showing. Request a renovation walkthrough and we'll send a line-item
              estimate with this listing's report.
            </p>
          </section>

          <section className="rounded-sm border border-border bg-card p-6">
            <h2 className="font-display text-xl">Investment potential</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {neighborhood.investmentPotential}
            </p>
          </section>
        </div>

        <div className="mt-8">
          <TrendGraphPlaceholder title="Local price trend" />
        </div>

        <section className="mt-16">
          <h2 className="font-display text-3xl">Active nearby listings</h2>
          <div className="mt-6 grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {(data?.nearby ?? []).map((l) => (
              <PropertyCard key={l.listing_key} listing={{ ...l, photo_count: l.photo ? 1 : 0 }} />
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="font-display text-3xl">Similar homes nearby</h2>
          <div className="mt-6 grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {(data?.similar ?? []).map((h) => (
              <HomeCard key={h.listing_key} home={h} />
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-sm border border-border bg-secondary/40 p-8">
          <h2 className="font-display text-2xl">
            Buying a single-family home in {home.city ?? "Southeast Florida"}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            This {home.bedrooms_total ?? "—"}-bedroom home at {fullAddress(home)} sits in the{" "}
            {neighborhood.name} area of {neighborhood.county} County, zoned to schools including{" "}
            {neighborhood.schools
              .slice(0, 2)
              .map((s) => s.name)
              .join(" and ")}
            . Cays Realty pulls the beds, baths, lot size, year built and price history above
            directly from the MLS, then layers on renovation and investment context our advisors
            gather from permit records and recent nearby closings.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {neighborhood.investmentPotential} Set an alert on this search and we'll email you the
            moment a comparable {neighborhood.name} home lists or drops in price.
          </p>
        </section>
      </div>
    </main>
  );
}
