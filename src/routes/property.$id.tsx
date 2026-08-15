import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Bell, Heart } from "lucide-react";
import { getListingFn, saveListingFn } from "@/lib/listings.functions";
import { supabase } from "@/integrations/supabase/client";
import { money, num, perSqFt, fullAddress } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/property/$id")({
  head: () => ({
    meta: [
      { title: "Property Detail | Cays Realty" },
      {
        name: "description",
        content:
          "Live MLS listing detail — photos, pricing, specs and features for Miami luxury real estate.",
      },
      { property: "og:title", content: "Property Detail | Cays Realty" },
      {
        property: "og:description",
        content: "Live MLS listing detail for Miami luxury real estate.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PropertyPage,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-10 text-sm text-muted-foreground">
      {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="p-10 text-sm">Listing not found.</div>,
});

const FEATURE_LABELS: Record<string, string> = {
  appliances: "Appliances",
  cooling: "Cooling",
  heating: "Heating",
  view: "Views",
  waterfront: "Waterfront",
  parking: "Parking",
  interior: "Interior features",
  exterior: "Exterior features",
  pool: "Pool",
  flooring: "Flooring",
};

function PropertyPage() {
  const { id } = Route.useParams();
  const getListing = useServerFn(getListingFn);
  const { data, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: () => getListing({ data: { listingKey: id } }),
  });
  const [active, setActive] = useState(0);

  if (isLoading) {
    return <div className="p-16 text-center text-sm text-muted-foreground">Loading listing…</div>;
  }
  if (!data?.listing) {
    return (
      <div className="p-16 text-center text-sm text-muted-foreground">
        {data?.error ?? "This listing is no longer available."}{" "}
        <Link to="/search" search={{}} className="underline">
          Back to search
        </Link>
      </div>
    );
  }

  const p = data.listing;
  const photos = data.media.filter((m) => m.media_url);
  const hero = photos[active]?.media_url ?? photos[0]?.media_url ?? null;

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

      <div className="mx-auto max-w-7xl px-6 pb-20">
        <div className="overflow-hidden rounded-sm bg-secondary">
          {hero ? (
            <img
              src={hero}
              alt={`${fullAddress(p)} — MLS photo`}
              className="h-[28rem] w-full object-cover sm:h-[34rem]"
            />
          ) : (
            <div className="flex h-80 items-center justify-center text-muted-foreground">
              No photos provided by the MLS
            </div>
          )}
        </div>
        {photos.length > 1 && (
          <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
            {photos.map((m, i) => (
              <button
                key={m.media_key}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Photo ${i + 1}`}
                className={`h-20 w-28 shrink-0 overflow-hidden rounded-sm border ${
                  i === active ? "border-accent" : "border-border"
                }`}
              >
                <img src={m.media_url!} alt="" className="h-full w-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        )}

        <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_22rem]">
          <div>
            <p className="eyebrow text-muted-foreground">
              {p.standard_status} · {p.property_sub_type ?? p.property_type}
            </p>
            <h1 className="mt-3 font-display text-5xl text-foreground">{money(p.list_price)}</h1>
            <p className="mt-2 text-base text-muted-foreground">{fullAddress(p)}</p>

            <dl className="mt-8 grid grid-cols-2 gap-6 border-y border-border py-8 sm:grid-cols-4">
              {[
                ["Beds", num(p.bedrooms_total)],
                ["Baths", num(p.bathrooms_total)],
                ["Living area", `${num(p.living_area)} sq ft`],
                ["$ / sq ft", perSqFt(p.list_price, p.living_area)],
                ["Year built", p.year_built ? String(p.year_built) : "—"],
                ["Lot size", p.lot_size ? `${num(p.lot_size)} sq ft` : "—"],
                [
                  "HOA fee",
                  p.association_fee
                    ? `${money(p.association_fee)} ${p.association_fee_frequency ?? ""}`.trim()
                    : "—",
                ],
                ["Annual tax", money(p.tax_annual_amount)],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs uppercase tracking-widest text-muted-foreground">{label}</dt>
                  <dd className="mt-1 text-sm text-foreground">{value}</dd>
                </div>
              ))}
            </dl>

            {p.description && (
              <section className="mt-10">
                <h2 className="font-display text-2xl">About this property</h2>
                <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {p.description}
                </p>
              </section>
            )}

            <section className="mt-12">
              <h2 className="font-display text-2xl">Interior & exterior features</h2>
              <div className="mt-6 grid gap-8 sm:grid-cols-2">
                {Object.entries(data.features)
                  .filter(([, values]) => values.length > 0)
                  .map(([key, values]) => (
                    <div key={key}>
                      <h3 className="text-xs uppercase tracking-widest text-muted-foreground">
                        {FEATURE_LABELS[key] ?? key}
                      </h3>
                      <ul className="mt-2 space-y-1 text-sm text-foreground">
                        {values.map((v) => (
                          <li key={v}>{v}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
              </div>
            </section>
          </div>

          <LeadSidebar listingKey={p.listing_key} address={fullAddress(p)} />
        </div>
      </div>
    </main>
  );
}

function LeadSidebar({ listingKey, address }: { listingKey: string; address: string }) {
  const navigate = useNavigate();
  const save = useServerFn(saveListingFn);
  const [form, setForm] = useState({ name: "", email: "", phone: "", date: "" });
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("leads").insert({
      name: form.name,
      email: form.email,
      phone: form.phone,
      lead_type: "showing_request",
      source: "property_detail",
      notes: `Showing request for ${address} (MLS ${listingKey}). Preferred date: ${form.date || "flexible"}.`,
    });
    setBusy(false);
    if (error) toast.error("We couldn't send that request. Please try again.");
    else {
      toast.success("Request sent — an advisor will contact you shortly.");
      setForm({ name: "", email: "", phone: "", date: "" });
    }
  }

  async function act(mode: "save" | "watch") {
    try {
      await save({ data: { listingKey, mode } });
      toast.success(mode === "save" ? "Property saved" : "You'll be notified on price changes");
    } catch {
      toast.error("Sign in to continue");
      navigate({ to: "/auth" });
    }
  }

  return (
    <aside className="lg:sticky lg:top-8 lg:self-start">
      <div className="rounded-sm border border-border bg-card p-6">
        <h2 className="font-display text-2xl">Schedule a showing</h2>
        <form className="mt-5 space-y-4" onSubmit={submit}>
          <div>
            <Label htmlFor="lead-name">Name</Label>
            <Input
              id="lead-name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="lead-email">Email</Label>
            <Input
              id="lead-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="lead-phone">Phone</Label>
            <Input
              id="lead-phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="lead-date">Preferred date</Label>
            <Input
              id="lead-date"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Sending…" : "Request showing"}
          </Button>
        </form>

        <div className="mt-6 space-y-3 border-t border-border pt-6">
          <Button variant="outline" className="w-full" onClick={() => act("watch")}>
            <Bell className="mr-2 h-4 w-4" /> Notify me when price drops
          </Button>
          <Button variant="outline" className="w-full" onClick={() => act("save")}>
            <Heart className="mr-2 h-4 w-4" /> Save property
          </Button>
        </div>
      </div>
    </aside>
  );
}