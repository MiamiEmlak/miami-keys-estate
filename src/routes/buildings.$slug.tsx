import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { FileText, Heart } from "lucide-react";
import { getBuildingProfileFn } from "@/lib/buildings.functions";
import { getBuilding, getBuilding as findBuilding, countyOf } from "@/lib/buildings";
import type { BuildingUnit } from "@/lib/buildings.server";
import { PropertyCard } from "@/components/listings/PropertyCard";
import { PropertyGridSkeleton } from "@/components/listings/Skeletons";
import { ListingImage } from "@/components/listings/ListingImage";
import { MarketStatsPanel } from "@/components/market/MarketStatsPanel";
import { HOAInfoPanel } from "@/components/market/HOAInfoPanel";
import { STRBadge } from "@/components/market/STRBadge";
import { WatchButton } from "@/components/market/WatchButton";
import { AlertButton } from "@/components/market/AlertButton";
import { TrendGraphPlaceholder } from "@/components/market/TrendGraphPlaceholder";
import { SectionHeader } from "@/components/market/SectionHeader";
import { StatsPanel } from "@/components/market/StatsPanel";
import { ScheduleShowingDialog } from "@/components/leads/ScheduleShowingDialog";
import { supabase } from "@/integrations/supabase/client";
import { money, num } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/buildings/$slug")({
  loader: ({ params }) => {
    const building = getBuilding(params.slug);
    if (!building) throw notFound();
    return { building };
  },
  head: ({ params, loaderData }) => {
    const canonical = `/buildings/${params.slug}`;
    if (!loaderData) {
      return {
        meta: [{ title: "Building unavailable | Cays Realty" }, { name: "robots", content: "noindex" }],
        links: [{ rel: "canonical", href: canonical }],
      };
    }
    const b = loaderData.building;
    const title = `${b.name} — ${b.neighborhood} Condos for Sale & Rent | Cays Realty`;
    const description = `${b.name} at ${b.address}: live MLS condos for sale and for rent, HOA range, amenities, price per square foot and recent price drops.`;
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
  component: BuildingProfile,
  notFoundComponent: () => (
    <div className="p-16 text-center text-sm text-muted-foreground">
      We don't track that building yet.{" "}
      <Link to="/buildings" className="underline">
        Browse the directory
      </Link>
    </div>
  ),
});

const text = (u: BuildingUnit) =>
  `${u.description ?? ""} ${u.street_address ?? ""}`.toLowerCase();

function BuildingProfile() {
  const { building } = Route.useLoaderData();
  const county = countyOf(building);
  const run = useServerFn(getBuildingProfileFn);
  const { data, isFetching } = useQuery({
    queryKey: ["building", building.slug],
    queryFn: () => run({ data: { slug: building.slug } }),
  });

  const units = data?.units ?? [];
  const sales = data?.saleUnits ?? [];
  const rentals = data?.rentalUnits ?? [];
  const drops = data?.priceDropUnits ?? [];
  const fresh = data?.newUnits ?? [];
  const stats = data?.stats ?? null;

  const similar = building.similarBuildings
    .map((s) => findBuilding(s))
    .filter((b): b is NonNullable<ReturnType<typeof findBuilding>> => !!b);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ApartmentComplex",
        name: building.name,
        description: building.blurb,
        numberOfAccommodationUnits: building.units,
        yearBuilt: building.yearBuilt,
        amenityFeature: building.amenities.map((a) => ({
          "@type": "LocationFeatureSpecification",
          name: a,
          value: true,
        })),
        address: {
          "@type": "PostalAddress",
          streetAddress: building.addressPrefix,
          addressLocality: building.city,
          addressRegion: "FL",
          addressCountry: "US",
        },
      },
      ...sales.slice(0, 6).map((u) => ({
        "@type": "RealEstateListing",
        name: u.street_address ?? building.name,
        url: `/property/${u.listing_key}`,
        ...(u.list_price
          ? { offers: { "@type": "Offer", price: u.list_price, priceCurrency: "USD" } }
          : {}),
      })),
    ],
  };

  return (
    <main className="bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="relative">
        <ListingImage
          src={stats?.photo}
          alt={`${building.name} — ${building.neighborhood}, ${building.city}`}
          loading="eager"
          className="h-[46vh] min-h-80 w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/35 to-transparent" />
        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto max-w-7xl px-6 pb-10">
            <p className="text-[11px] uppercase tracking-[0.22em] text-background/80">
              <Link
                to="/neighborhoods/$slug"
                params={{ slug: building.neighborhoodSlug }}
                className="underline-offset-4 hover:underline"
              >
                {building.neighborhood}
              </Link>{" "}
              · {county} County
            </p>
            <h1 className="mt-3 font-display text-4xl text-background sm:text-6xl">
              {building.name}
            </h1>
            <p className="mt-3 text-sm text-background/85">{building.address}</p>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-background">
              <STRBadge friendly={building.strFriendly} />
              <span className="rounded-sm bg-background/15 px-2.5 py-1 text-xs backdrop-blur">
                For sale{" "}
                {stats?.minPrice
                  ? `${money(stats.minPrice, { compact: true })} – ${money(stats.maxPrice, { compact: true })}`
                  : "—"}
              </span>
              <span className="rounded-sm bg-background/15 px-2.5 py-1 text-xs backdrop-blur">
                For rent{" "}
                {stats?.minRent ? `${money(stats.minRent)} – ${money(stats.maxRent)}/mo` : "—"}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 pb-24 pt-10">
        <div className="flex flex-wrap gap-3">
          <SaveBuildingButton slug={building.slug} name={building.name} />
          <WatchButton watchType="building" value={building.slug} label={building.name} />
          <AlertButton
            name={`New listings at ${building.name}`}
            criteria={{ building: building.slug }}
          />
          <ScheduleShowingDialog
            listingKey={sales[0]?.listing_key ?? building.slug}
            address={building.address}
          />
        </div>

        {/* Overview */}
        <dl className="mt-8 grid grid-cols-2 gap-6 border-y border-border py-8 sm:grid-cols-6">
          {[
            ["Developer", building.developer ?? "—"],
            ["Year built", String(building.yearBuilt)],
            ["Floors", num(building.floors)],
            ["Residences", num(building.units)],
            ["HOA range", `${money(building.hoaLow)} – ${money(building.hoaHigh)}/mo`],
            ["Walk score", `${building.walkScore}/100`],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                {label}
              </dt>
              <dd className="mt-1 text-sm text-foreground">{value}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-8 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {building.blurb}
        </p>

        {/* Market intelligence */}
        <div className="mt-12">
          <SectionHeader
            eyebrow="Market intelligence"
            title="Live sale and rental pricing"
            description="Pulled from the MLS each time this page loads, split between resale and lease inventory."
          />
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <StatsPanel
              title="For sale"
              stats={[
                { label: "Average price", value: money(stats?.avgPrice, { compact: true }) },
                {
                  label: "Price per sq ft",
                  value: stats?.salePerSqFt ? `${money(stats.salePerSqFt)}` : "—",
                },
                { label: "Lowest listing", value: money(stats?.minPrice, { compact: true }) },
                { label: "Highest listing", value: money(stats?.maxPrice, { compact: true }) },
              ]}
              footnote={`${stats?.saleCount ?? 0} active resale listings tracked in this tower.`}
            />
            <StatsPanel
              title="For rent"
              stats={[
                { label: "Average rent", value: stats?.avgRent ? `${money(stats.avgRent)}/mo` : "—" },
                {
                  label: "Rent per sq ft",
                  value: stats?.rentPerSqFt ? `${money(stats.rentPerSqFt)}` : "—",
                },
                { label: "Lowest rental", value: stats?.minRent ? money(stats.minRent) : "—" },
                { label: "Highest rental", value: stats?.maxRent ? money(stats.maxRent) : "—" },
              ]}
              footnote={`${stats?.rentCount ?? 0} active rentals tracked in this tower.`}
            />
          </div>
        </div>

        <div className="mt-10 space-y-8">
          <MarketStatsPanel stats={data?.stats} loading={isFetching} saleLabel="Median list price" />
          <div className="grid gap-6 lg:grid-cols-2">
            <TrendGraphPlaceholder title={`${building.name} sale price trend`} />
            <TrendGraphPlaceholder
              title={`${building.name} rent trend`}
              note="Rent trend fills in as nightly lease snapshots accumulate."
            />
          </div>
          <HOAInfoPanel
            hoaRange={building.hoaRange}
            hoaLow={building.hoaLow}
            hoaHigh={building.hoaHigh}
            amenities={building.amenities}
            floorPlans={building.floorPlans}
          />

          <section className="rounded-sm border border-border bg-card p-6">
            <h2 className="font-display text-xl">Short-term rental rules &amp; walkability</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {building.strFriendly
                ? "This building permits flexible and short-term leasing, subject to association registration. Confirm minimum stay and registration fees before closing."
                : "This association restricts short-term rentals; plan on annual or seasonal leases with association approval."}{" "}
              Walk score {building.walkScore}/100.
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {building.hotspots.map((h) => (
                <li key={h} className="rounded-sm bg-secondary px-2.5 py-1 text-xs text-foreground">
                  {h}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {data?.error && (
          <p role="alert" className="mt-8 text-sm text-destructive">
            {data.error}
          </p>
        )}

        <div className="mt-14 grid gap-12 lg:grid-cols-[1fr_22rem]">
          <div className="space-y-16">
            <SaleSection units={sales} loading={isFetching && units.length === 0} />
            <RentSection
              units={rentals}
              loading={isFetching && units.length === 0}
              strFriendly={building.strFriendly}
            />

            <section>
              <SectionHeader
                eyebrow="Movement"
                title="Price drops & new listings"
                description="Reductions and fresh inventory recorded in this building over the last 30 days."
              />
              <div className="mt-6 grid gap-8 sm:grid-cols-2">
                {[...drops, ...fresh.filter((f) => !drops.some((d) => d.listing_key === f.listing_key))]
                  .slice(0, 6)
                  .map((u) => (
                    <PropertyCard
                      key={u.listing_key}
                      listing={{ ...u, photo_count: u.photo ? 1 : 0 }}
                    />
                  ))}
              </div>
              {drops.length === 0 && fresh.length === 0 && (
                <p className="mt-6 text-sm text-muted-foreground">
                  No price changes or new listings in the last 30 days. Set an alert and we'll tell
                  you the day that changes.
                </p>
              )}
            </section>

            <section>
              <SectionHeader eyebrow="Nearby" title="Similar buildings" />
              <ul className="mt-6 grid gap-4 sm:grid-cols-3">
                {similar.map((b) => (
                  <li key={b.slug} className="rounded-sm border border-border bg-card p-5">
                    <Link
                      to="/buildings/$slug"
                      params={{ slug: b.slug }}
                      className="font-display text-lg text-foreground underline-offset-4 hover:underline"
                    >
                      {b.name}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">{b.neighborhood}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{b.hoaRange}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-sm border border-border bg-secondary/40 p-8">
              <h2 className="font-display text-2xl">
                Buying or renting at {building.name}, {building.city}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {building.name} is a {building.floors}-story, {building.units}-residence tower at{" "}
                {building.address}, in the {building.neighborhood} area of {county} County. Completed
                in {building.yearBuilt}
                {building.developer ? ` by ${building.developer}` : ""}, it carries HOA dues of{" "}
                {building.hoaRange}, covering {building.amenities.slice(0, 4).join(", ").toLowerCase()}.
                Cays Realty tracks every {building.name} condo for sale and for rent directly from the
                MLS, so the price per square foot, average price and active unit counts above reflect
                today's market rather than a monthly export.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Buyers comparing {building.name} typically also look at{" "}
                {similar.map((s) => s.name).join(", ") || "nearby towers"}. Investors should note that{" "}
                {building.strFriendly
                  ? "short-term leasing is permitted here, which materially changes the income model versus annual-lease buildings nearby."
                  : "short-term leasing is not permitted here, so underwrite annual leases only."}{" "}
                Request the full sales-history report for line-by-line closings, days on market and
                per-line pricing.
              </p>
            </section>
          </div>

          <MonitorSidebar buildingName={building.name} buildingSlug={building.slug} />
        </div>
      </div>
    </main>
  );
}

const selectClass =
  "h-9 w-full rounded-sm border border-input bg-background px-3 text-sm text-foreground";

function SaleSection({ units, loading }: { units: BuildingUnit[]; loading: boolean }) {
  const [maxPrice, setMaxPrice] = useState("");
  const [beds, setBeds] = useState("");
  const [minSqft, setMinSqft] = useState("");
  const [waterfront, setWaterfront] = useState(false);
  const [penthouse, setPenthouse] = useState(false);

  const filtered = useMemo(
    () =>
      units.filter((u) => {
        if (maxPrice && (u.list_price ?? 0) > Number(maxPrice)) return false;
        if (beds && (u.bedrooms_total ?? 0) < Number(beds)) return false;
        if (minSqft && (u.living_area ?? 0) < Number(minSqft)) return false;
        if (waterfront && !/water|bay|ocean|intracoastal/.test(text(u))) return false;
        if (penthouse && !/penthouse|\bph\b/.test(text(u))) return false;
        return true;
      }),
    [units, maxPrice, beds, minSqft, waterfront, penthouse],
  );

  return (
    <section>
      <SectionHeader
        eyebrow="For sale"
        title="Condos for sale"
        description={`${units.length} active resale listings in this building, straight from the MLS.`}
      />
      <div className="mt-6 grid gap-3 rounded-sm border border-border bg-card p-4 sm:grid-cols-3 lg:grid-cols-5">
        <select className={selectClass} value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}>
          <option value="">Any price</option>
          <option value="750000">Up to $750K</option>
          <option value="1500000">Up to $1.5M</option>
          <option value="3000000">Up to $3M</option>
          <option value="10000000">Up to $10M</option>
        </select>
        <select className={selectClass} value={beds} onChange={(e) => setBeds(e.target.value)}>
          <option value="">Any beds</option>
          <option value="1">1+ beds</option>
          <option value="2">2+ beds</option>
          <option value="3">3+ beds</option>
          <option value="4">4+ beds</option>
        </select>
        <select className={selectClass} value={minSqft} onChange={(e) => setMinSqft(e.target.value)}>
          <option value="">Any size</option>
          <option value="800">800+ sq ft</option>
          <option value="1200">1,200+ sq ft</option>
          <option value="2000">2,000+ sq ft</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" checked={waterfront} onChange={(e) => setWaterfront(e.target.checked)} />
          Waterfront
        </label>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" checked={penthouse} onChange={(e) => setPenthouse(e.target.checked)} />
          Penthouse
        </label>
      </div>

      {loading ? (
        <PropertyGridSkeleton count={4} />
      ) : (
        <div className="mt-8 grid gap-8 sm:grid-cols-2">
          {filtered.map((u) => (
            <PropertyCard key={u.listing_key} listing={{ ...u, photo_count: u.photo ? 1 : 0 }} />
          ))}
        </div>
      )}
      {!loading && filtered.length === 0 && (
        <p className="mt-8 text-sm text-muted-foreground">
          No resale units match those filters right now.
        </p>
      )}
    </section>
  );
}

function RentSection({
  units,
  loading,
  strFriendly,
}: {
  units: BuildingUnit[];
  loading: boolean;
  strFriendly: boolean;
}) {
  const [maxRent, setMaxRent] = useState("");
  const [beds, setBeds] = useState("");
  const [term, setTerm] = useState("");
  const [furnished, setFurnished] = useState(false);
  const [strOnly, setStrOnly] = useState(false);

  const filtered = useMemo(
    () =>
      units.filter((u) => {
        if (maxRent && (u.list_price ?? 0) > Number(maxRent)) return false;
        if (beds && (u.bedrooms_total ?? 0) < Number(beds)) return false;
        if (furnished && !/furnished/.test(text(u))) return false;
        if (term === "monthly" && !/month[- ]to[- ]month|seasonal|short term/.test(text(u)))
          return false;
        if (term === "annual" && /seasonal|short term/.test(text(u))) return false;
        if (strOnly && !strFriendly) return false;
        return true;
      }),
    [units, maxRent, beds, term, furnished, strOnly, strFriendly],
  );

  return (
    <section>
      <SectionHeader
        eyebrow="For rent"
        title="Condos for rent"
        description={`${units.length} active lease listings in this building.`}
      />
      <div className="mt-6 grid gap-3 rounded-sm border border-border bg-card p-4 sm:grid-cols-3 lg:grid-cols-5">
        <select className={selectClass} value={maxRent} onChange={(e) => setMaxRent(e.target.value)}>
          <option value="">Any rent</option>
          <option value="3500">Up to $3,500</option>
          <option value="6000">Up to $6,000</option>
          <option value="12000">Up to $12,000</option>
          <option value="30000">Up to $30,000</option>
        </select>
        <select className={selectClass} value={beds} onChange={(e) => setBeds(e.target.value)}>
          <option value="">Any beds</option>
          <option value="1">1+ beds</option>
          <option value="2">2+ beds</option>
          <option value="3">3+ beds</option>
        </select>
        <select className={selectClass} value={term} onChange={(e) => setTerm(e.target.value)}>
          <option value="">Any lease term</option>
          <option value="annual">Annual</option>
          <option value="monthly">Monthly / seasonal</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" checked={furnished} onChange={(e) => setFurnished(e.target.checked)} />
          Furnished
        </label>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" checked={strOnly} onChange={(e) => setStrOnly(e.target.checked)} />
          STR friendly
        </label>
      </div>

      {loading ? (
        <PropertyGridSkeleton count={2} />
      ) : (
        <div className="mt-8 grid gap-8 sm:grid-cols-2">
          {filtered.map((u) => (
            <PropertyCard key={u.listing_key} listing={{ ...u, photo_count: u.photo ? 1 : 0 }} />
          ))}
        </div>
      )}
      {!loading && filtered.length === 0 && (
        <p className="mt-8 text-sm text-muted-foreground">
          No rentals match those filters right now.
        </p>
      )}
    </section>
  );
}

function SaveBuildingButton({ slug, name }: { slug: string; name: string }) {
  const [done, setDone] = useState(false);
  async function act() {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      toast.error("Sign in to save buildings.");
      return;
    }
    const { error } = await supabase.from("property_watches").insert({
      user_id: session.session.user.id,
      watch_type: "building_saved",
      watch_value: slug,
    });
    if (error) toast.error("We couldn't save that building.");
    else {
      setDone(true);
      toast.success(`${name} saved to your collection.`);
    }
  }
  return (
    <Button type="button" variant="outline" onClick={act} disabled={done}>
      <Heart className="mr-2 h-4 w-4" /> {done ? "Saved" : "Save building"}
    </Button>
  );
}

function MonitorSidebar({ buildingName, buildingSlug }: { buildingName: string; buildingSlug: string }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", frequency: "instant" });
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Name and email are required.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("leads").insert({
      name: form.name,
      email: form.email,
      phone: form.phone,
      lead_type: "building_monitor",
      source: `building:${buildingSlug}`,
      notes: `Monitor ${buildingName} — alert frequency: ${form.frequency}.`,
    });
    setBusy(false);
    if (error) toast.error("We couldn't set up that alert. Please try again.");
    else {
      toast.success(`You're monitoring ${buildingName}.`);
      setForm({ name: "", email: "", phone: "", frequency: "instant" });
    }
  }

  async function requestReport() {
    if (!form.email.trim()) {
      toast.error("Add your email above and we'll send the report.");
      return;
    }
    const { error } = await supabase.from("leads").insert({
      name: form.name || "Report request",
      email: form.email,
      phone: form.phone,
      lead_type: "building_report",
      source: `building:${buildingSlug}`,
      notes: `Sales history PDF requested for ${buildingName}.`,
    });
    if (error) toast.error("We couldn't queue that report.");
    else toast.success("Report request received — we'll email the PDF shortly.");
  }

  return (
    <aside className="lg:sticky lg:top-8 lg:self-start">
      <div className="rounded-sm border border-border bg-card p-6">
        <h2 className="font-display text-2xl">Monitor this building</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          New listings, price changes and closings in {buildingName}.
        </p>
        <form className="mt-5 space-y-4" onSubmit={submit}>
          <div>
            <Label htmlFor="m-name">Name</Label>
            <Input
              id="m-name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="m-email">Email</Label>
            <Input
              id="m-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="m-phone">Phone</Label>
            <Input
              id="m-phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="m-freq">Alert frequency</Label>
            <select
              id="m-freq"
              value={form.frequency}
              onChange={(e) => setForm({ ...form, frequency: e.target.value })}
              className="mt-1 h-9 w-full rounded-sm border border-input bg-background px-3 text-sm"
            >
              <option value="instant">Instant</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Setting up…" : "Monitor this building"}
          </Button>
        </form>

        <div className="mt-6 border-t border-border pt-6">
          <Button variant="outline" className="w-full" onClick={requestReport}>
            <FileText className="mr-2 h-4 w-4" /> Get building sales history report (PDF)
          </Button>
        </div>
      </div>
    </aside>
  );
}
