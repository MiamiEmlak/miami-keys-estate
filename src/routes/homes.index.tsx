import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getHomesIndexFn } from "@/lib/market.functions";
import { HomeCard } from "@/components/market/HomeCard";
import { PropertyGridSkeleton } from "@/components/listings/Skeletons";
import { MarketStatsPanel } from "@/components/market/MarketStatsPanel";
import { AlertButton } from "@/components/market/AlertButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CITIES = [
  "Miami",
  "Coral Gables",
  "Coconut Grove",
  "Miami Beach",
  "Pinecrest",
  "Key Biscayne",
  "Fort Lauderdale",
  "Weston",
  "Parkland",
  "Hollywood",
  "Boca Raton",
  "Delray Beach",
  "West Palm Beach",
  "Jupiter",
];

export const Route = createFileRoute("/homes/")({
  head: () => ({
    meta: [
      { title: "Southeast Florida Single-Family Homes for Sale | Cays Realty" },
      {
        name: "description",
        content:
          "Browse live MLS single-family homes across Miami-Dade, Broward and Palm Beach — lot sizes, price per square foot, school zones and neighborhood intelligence on every listing.",
      },
      { property: "og:title", content: "Southeast Florida Single-Family Homes for Sale | Cays Realty" },
      {
        property: "og:description",
        content: "Live single-family listings with lot size, $/sq ft and neighborhood data.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/homes" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/homes" }],
  }),
  component: HomesIndex,
});

function HomesIndex() {
  const run = useServerFn(getHomesIndexFn);
  const [city, setCity] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [beds, setBeds] = useState("");

  const { data, isFetching } = useQuery({
    queryKey: ["homes", city, minPrice, maxPrice, beds],
    queryFn: () =>
      run({
        data: {
          ...(city ? { city } : {}),
          ...(minPrice ? { minPrice: Number(minPrice) } : {}),
          ...(maxPrice ? { maxPrice: Number(maxPrice) } : {}),
          ...(beds ? { beds: Number(beds) } : {}),
        },
      }),
    staleTime: 5 * 60 * 1000,
  });

  const homes = data?.homes ?? [];

  return (
    <main className="bg-background">
      <section className="mx-auto max-w-7xl px-6 pb-8 pt-8">
        <p className="eyebrow text-muted-foreground">Single-family intelligence</p>
        <h1 className="mt-5 max-w-3xl font-display text-5xl leading-tight text-foreground sm:text-6xl">
          Southeast Florida Single-Family Homes
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Houses, lots and renovation plays across Miami-Dade, Broward and Palm Beach — priced live from the MLS.
        </p>

        <div className="mt-8">
          <AlertButton
            name="New single-family listings"
            criteria={{ property_type: "single_family", ...(city ? { city } : {}) }}
          />
        </div>

        <div className="mt-8 grid gap-4 rounded-sm border border-border bg-card p-6 sm:grid-cols-4">
          <div>
            <Label htmlFor="h-city">City</Label>
            <select
              id="h-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="mt-1 h-9 w-full rounded-sm border border-input bg-background px-3 text-sm"
            >
              <option value="">All cities</option>
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="h-min">Min price</Label>
            <Input
              id="h-min"
              inputMode="numeric"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value.replace(/\D/g, ""))}
              placeholder="750000"
            />
          </div>
          <div>
            <Label htmlFor="h-max">Max price</Label>
            <Input
              id="h-max"
              inputMode="numeric"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value.replace(/\D/g, ""))}
              placeholder="3000000"
            />
          </div>
          <div>
            <Label htmlFor="h-beds">Min beds</Label>
            <Input
              id="h-beds"
              inputMode="numeric"
              value={beds}
              onChange={(e) => setBeds(e.target.value.replace(/\D/g, ""))}
              placeholder="3"
            />
          </div>
        </div>

        <div className="mt-8">
          <MarketStatsPanel stats={data?.stats} loading={isFetching} />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <p className="border-b border-border pb-4 text-sm text-muted-foreground">
          {isFetching ? "Loading live MLS homes…" : `${homes.length} homes`}
        </p>

        {isFetching && homes.length === 0 ? (
          <PropertyGridSkeleton count={6} />
        ) : (
          <div className="mt-8 grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {homes.map((h) => (
              <HomeCard key={h.listing_key} home={h} />
            ))}
          </div>
        )}

        {!isFetching && homes.length === 0 && (
          <p className="mt-16 text-center text-sm text-muted-foreground">
            No single-family homes match these filters right now.
          </p>
        )}
      </section>
    </main>
  );
}
