import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { searchListingsFn } from "@/lib/listings.functions";
import { PropertyCard } from "@/components/listings/PropertyCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Search = {
  city?: string;
  zip?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  beds?: number;
  baths?: number;
  propertyType?: string;
  sort?: string;
  filter?: string;
  page?: number;
};

type ResolvedSearch = Required<Search>;

const s = (v: unknown, d = "") => (typeof v === "string" && v ? v : d);
const n = (v: unknown, d = 0) => (Number.isFinite(Number(v)) && v !== "" && v != null ? Number(v) : d);

export const Route = createFileRoute("/search")({
  validateSearch: (raw: Record<string, unknown>): Search => ({
    city: s(raw["city"]),
    zip: s(raw["zip"]),
    type: s(raw["type"], "buy"),
    minPrice: n(raw["minPrice"]),
    maxPrice: n(raw["maxPrice"]),
    beds: n(raw["beds"]),
    baths: n(raw["baths"]),
    propertyType: s(raw["propertyType"]),
    sort: s(raw["sort"], "newest"),
    filter: s(raw["filter"]),
    page: n(raw["page"], 1) || 1,
  }),
  head: () => ({
    meta: [
      { title: "Search Miami Listings | Cays Realty" },
      {
        name: "description",
        content:
          "Search live Miami MLS listings by city, ZIP, price, beds and property type — updated directly from the MLS feed.",
      },
      { property: "og:title", content: "Search Miami Listings | Cays Realty" },
      {
        property: "og:description",
        content: "Live Miami MLS search with price, bed and property type filters.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SearchPage,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-10 text-sm text-muted-foreground">
      {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="p-10 text-sm">No listings found.</div>,
});

const PROPERTY_TYPES = [
  ["", "Any type"],
  ["Condominium", "Condominium"],
  ["SingleFamilyResidence", "Single family"],
  ["Townhouse", "Townhouse"],
  ["Duplex", "Duplex"],
];

const SORTS = [
  ["newest", "Newest first"],
  ["price_asc", "Price (low to high)"],
  ["price_desc", "Price (high to low)"],
  ["ppsf", "Price per sq ft"],
];

function SearchPage() {
  const raw = Route.useSearch();
  const search: ResolvedSearch = {
    city: raw.city ?? "",
    zip: raw.zip ?? "",
    type: raw.type ?? "buy",
    minPrice: raw.minPrice ?? 0,
    maxPrice: raw.maxPrice ?? 0,
    beds: raw.beds ?? 0,
    baths: raw.baths ?? 0,
    propertyType: raw.propertyType ?? "",
    sort: raw.sort ?? "newest",
    filter: raw.filter ?? "",
    page: raw.page ?? 1,
  };
  const navigate = useNavigate({ from: "/search" });
  const run = useServerFn(searchListingsFn);
  const pageSize = 24;

  const { data, isFetching } = useQuery({
    queryKey: ["search", search],
    queryFn: () =>
      run({
        data: {
          city: search.city || undefined,
          zip: search.zip || undefined,
          type: search.type || undefined,
          minPrice: search.minPrice || undefined,
          maxPrice: search.maxPrice || undefined,
          beds: search.beds || undefined,
          baths: search.baths || undefined,
          propertyType: search.propertyType || undefined,
          sort: search.sort,
          filter: search.filter || undefined,
          page: search.page,
          pageSize,
        },
      }),
    placeholderData: keepPreviousData,
  });

  const set = (patch: Partial<Search>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch, page: patch.page ?? 1 }) });

  const [compare, setCompare] = useState<string[]>([]);
  const toggleCompare = (key: string) =>
    setCompare((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : prev.length >= 4 ? prev : [...prev, key],
    );

  const total = data?.total ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / pageSize));

  return (
    <main className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link to="/" className="brand-mark text-lg text-foreground">
          Cays
        </Link>
        <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground">
          Sign in
        </Link>
      </header>

      <div className="mx-auto grid max-w-7xl gap-10 px-6 pb-20 lg:grid-cols-[17rem_1fr]">
        <Filters search={search} set={set} />

        <section>
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
            <p className="text-sm text-muted-foreground">
              {isFetching ? "Searching the MLS…" : `${total.toLocaleString()} active listings`}
            </p>
            <div className="flex items-center gap-2">
              <Label htmlFor="sort" className="text-xs uppercase tracking-widest text-muted-foreground">
                Sort
              </Label>
              <select
                id="sort"
                value={search.sort}
                onChange={(e) => set({ sort: e.target.value })}
                className="h-9 rounded-sm border border-input bg-background px-3 text-sm"
              >
                {SORTS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {data?.error && (
            <p role="alert" className="mt-6 text-sm text-destructive">
              {data.error}
            </p>
          )}

          <div className="mt-8 grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {(data?.items ?? []).map((listing) => (
              <PropertyCard
                key={listing.listing_key}
                listing={listing}
                compareSelected={compare.includes(listing.listing_key)}
                onToggleCompare={toggleCompare}
              />
            ))}
          </div>

          {!isFetching && (data?.items.length ?? 0) === 0 && !data?.error && (
            <p className="mt-16 text-center text-sm text-muted-foreground">
              No listings match these filters.
            </p>
          )}

          <div className="mt-12 flex items-center justify-between">
            <Button
              variant="outline"
              disabled={search.page <= 1}
              onClick={() => set({ page: search.page - 1 })}
            >
              Previous
            </Button>
            <span className="text-xs uppercase tracking-widest text-muted-foreground">
              Page {search.page} of {lastPage.toLocaleString()}
            </span>
            <Button
              variant="outline"
              disabled={search.page >= lastPage}
              onClick={() => set({ page: search.page + 1 })}
            >
              Next
            </Button>
          </div>
        </section>
      </div>

      {compare.length > 0 && (
        <div className="sticky bottom-0 z-20 border-t border-border bg-card/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
            <p className="text-sm text-muted-foreground">
              {compare.length} of 4 selected for comparison
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setCompare([])}>
                Clear
              </Button>
              <Button asChild>
                <Link to="/compare" search={{ ids: compare.join(",") }}>
                  Compare {compare.length}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Filters({ search, set }: { search: ResolvedSearch; set: (patch: Partial<Search>) => void }) {
  const [city, setCity] = useState(search.city);
  const [zip, setZip] = useState(search.zip);
  const [minPrice, setMin] = useState(search.minPrice ? String(search.minPrice) : "");
  const [maxPrice, setMax] = useState(search.maxPrice ? String(search.maxPrice) : "");

  return (
    <aside className="h-max lg:sticky lg:top-8">
      <div className="rounded-sm border border-border bg-card p-6">
        <div className="grid grid-cols-2 gap-2">
          {[
            ["buy", "Buy"],
            ["rent", "Rent"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => set({ type: value as string })}
              className={`rounded-sm border px-3 py-2 text-xs uppercase tracking-widest transition-colors ${
                search.type === value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-secondary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            set({
              city,
              zip,
              minPrice: Number(minPrice) || 0,
              maxPrice: Number(maxPrice) || 0,
            });
          }}
        >
          <div>
            <Label htmlFor="f-city">City</Label>
            <Input id="f-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Miami" />
          </div>
          <div>
            <Label htmlFor="f-zip">ZIP code</Label>
            <Input id="f-zip" value={zip} onChange={(e) => setZip(e.target.value)} placeholder="33139" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="f-min">Min price</Label>
              <Input id="f-min" inputMode="numeric" value={minPrice} onChange={(e) => setMin(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="f-max">Max price</Label>
              <Input id="f-max" inputMode="numeric" value={maxPrice} onChange={(e) => setMax(e.target.value)} />
            </div>
          </div>
          <Button type="submit" className="w-full">
            Apply
          </Button>
        </form>

        <div className="mt-6 space-y-4">
          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Beds</Label>
            <div className="mt-2 grid grid-cols-5 gap-1">
              {[0, 1, 2, 3, 4].map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => set({ beds: b })}
                  className={`rounded-sm border py-1.5 text-xs ${
                    search.beds === b ? "border-primary bg-primary text-primary-foreground" : "border-border"
                  }`}
                >
                  {b === 0 ? "Any" : `${b}+`}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Baths</Label>
            <div className="mt-2 grid grid-cols-5 gap-1">
              {[0, 1, 2, 3, 4].map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => set({ baths: b })}
                  className={`rounded-sm border py-1.5 text-xs ${
                    search.baths === b ? "border-primary bg-primary text-primary-foreground" : "border-border"
                  }`}
                >
                  {b === 0 ? "Any" : `${b}+`}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="f-type">Property type</Label>
            <select
              id="f-type"
              value={search.propertyType}
              onChange={(e) => set({ propertyType: e.target.value })}
              className="mt-1 h-9 w-full rounded-sm border border-input bg-background px-3 text-sm"
            >
              {PROPERTY_TYPES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </aside>
  );
}