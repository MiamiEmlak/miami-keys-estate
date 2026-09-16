import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { FileText, Heart } from "lucide-react";
import { getBuildingProfileFn } from "@/lib/buildings.functions";
import { getBuilding, getBuilding as findBuilding } from "@/lib/buildings";
import { PropertyCard } from "@/components/listings/PropertyCard";
import { PropertyGridSkeleton } from "@/components/listings/Skeletons";
import { MarketStatsPanel } from "@/components/market/MarketStatsPanel";
import { HOAInfoPanel } from "@/components/market/HOAInfoPanel";
import { STRBadge } from "@/components/market/STRBadge";
import { WatchButton } from "@/components/market/WatchButton";
import { AlertButton } from "@/components/market/AlertButton";
import { TrendGraphPlaceholder } from "@/components/market/TrendGraphPlaceholder";
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
    const title = `${b.name} — ${b.neighborhood} Condos | Cays Realty`;
    const description = `${b.name} at ${b.address}: active listings, HOA range, unit mix and live MLS pricing for this ${b.neighborhood} tower.`;
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

function BuildingProfile() {
  const { building } = Route.useLoaderData();
  const run = useServerFn(getBuildingProfileFn);
  const { data, isFetching } = useQuery({
    queryKey: ["building", building.slug],
    queryFn: () => run({ data: { slug: building.slug } }),
  });

  const units = data?.units ?? [];
  const sales = units.filter((u) => u.property_type !== "ResidentialLease");
  const rentals = units.filter((u) => u.property_type === "ResidentialLease");
  const similar = building.similarBuildings
    .map((s) => findBuilding(s))
    .filter((b): b is NonNullable<ReturnType<typeof findBuilding>> => !!b);

  const jsonLd = {
    "@context": "https://schema.org",
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
  };

  return (
    <main className="bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-7xl px-6 pb-24 pt-10">
        <p className="eyebrow text-muted-foreground">
          <Link
            to="/neighborhoods/$slug"
            params={{ slug: building.neighborhoodSlug }}
            className="underline-offset-4 hover:underline"
          >
            {building.neighborhood}
          </Link>
        </p>
        <h1 className="mt-4 font-display text-5xl text-foreground">{building.name}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{building.address}</p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <STRBadge friendly={building.strFriendly} />
          <span className="rounded-sm bg-secondary px-2.5 py-1 text-xs text-foreground">
            Walk score {building.walkScore}
          </span>
          <span className="rounded-sm bg-secondary px-2.5 py-1 text-xs text-foreground">
            Avg price {money(building.avgPrice, { compact: true })}
          </span>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <SaveBuildingButton slug={building.slug} name={building.name} />
          <WatchButton watchType="building" value={building.slug} label={building.name} />
          <AlertButton
            name={`New listings at ${building.name}`}
            criteria={{ building: building.slug }}
          />
        </div>

        <dl className="mt-8 grid grid-cols-2 gap-6 border-y border-border py-8 sm:grid-cols-5">
          {[
            ["Year built", String(building.yearBuilt)],
            ["Floors", num(building.floors)],
            ["Units", num(building.units)],
            ["HOA range", `${money(building.hoaLow)} – ${money(building.hoaHigh)}/mo`],
            ["Avg $/sq ft", data?.stats?.avgPpsf ? `${money(data.stats.avgPpsf)}/sq ft` : "—"],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs uppercase tracking-widest text-muted-foreground">{label}</dt>
              <dd className="mt-1 text-sm text-foreground">{value}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-8 max-w-3xl text-sm leading-relaxed text-muted-foreground">{building.blurb}</p>

        <div className="mt-10 space-y-8">
          <MarketStatsPanel stats={data?.stats} loading={isFetching} saleLabel="Median list price" />
          <TrendGraphPlaceholder title={`${building.name} price trend`} />
          <HOAInfoPanel
            hoaRange={building.hoaRange}
            hoaLow={building.hoaLow}
            hoaHigh={building.hoaHigh}
            amenities={building.amenities}
            floorPlans={building.floorPlans}
          />

          <section className="rounded-sm border border-border bg-card p-6">
            <h2 className="font-display text-xl">Walkability &amp; nearby hotspots</h2>
            <p className="mt-2 text-sm text-muted-foreground">Walk score {building.walkScore}/100</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {building.hotspots.map((h) => (
                <li key={h} className="rounded-sm bg-secondary px-2.5 py-1 text-xs text-foreground">
                  {h}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_22rem]">
          <div>
            <h2 className="font-display text-3xl">Active units</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {isFetching
                ? "Loading live MLS units…"
                : `${sales.length} for sale · ${rentals.length} for rent`}
            </p>
            {data?.error && (
              <p role="alert" className="mt-4 text-sm text-destructive">
                {data.error}
              </p>
            )}

            {isFetching && units.length === 0 ? (
              <PropertyGridSkeleton count={4} />
            ) : (
              <div className="mt-8 grid gap-8 sm:grid-cols-2">
                {units.map((u) => (
                  <PropertyCard key={u.listing_key} listing={{ ...u, photo_count: u.photo ? 1 : 0 }} />
                ))}
              </div>
            )}

            {!isFetching && units.length === 0 && !data?.error && (
              <p className="mt-12 text-sm text-muted-foreground">
                No active units in this tower right now — start monitoring and we'll alert you when
                one lists.
              </p>
            )}

            <section className="mt-16">
              <h2 className="font-display text-3xl">Similar buildings nearby</h2>
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
          </div>

          <MonitorSidebar buildingName={building.name} buildingSlug={building.slug} />
        </div>
      </div>
    </main>
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
