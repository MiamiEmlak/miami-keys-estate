import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CalendarClock, Download, Lock, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { money, num } from "@/lib/format";
import {
  DEMO_DEVELOPMENTS,
  DEMO_SCHEDULE,
  DEMO_UNITS,
  completionYear,
  depositLadder,
  groupByLine,
  type BuildingUnit,
  type DepositMilestone,
  type Development,
} from "@/lib/new-developments";
import { requestBrochureFn } from "@/lib/new-developments.functions";
import { useEspoLead } from "@/hooks/useEspoLead";
import { ListingImage } from "@/components/listings/ListingImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type DocRow = { id: string; title: string; requires_registration: boolean };

export const Route = createFileRoute("/new-projects/$id")({
  head: ({ params }) => ({
    meta: [
      { title: "Pre-Construction Residence — Deposit Ladder & Floor Plans | Cays Realty" },
      {
        name: "description",
        content:
          "Deposit ladder, floor plan lines, unit pricing and VIP developer brochures for this Miami pre-construction tower.",
      },
      { property: "og:title", content: "Miami Pre-Construction Residence | Cays Realty" },
      {
        property: "og:description",
        content: "See the full deposit schedule, unit inventory and VIP brochure access.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: `/new-projects/${params.id}` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `/new-projects/${params.id}` }],
  }),
  component: DevelopmentDetail,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-10 text-sm text-muted-foreground">
      {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="p-10 text-sm">Development not found.</div>,
});

function DevelopmentDetail() {
  const { id } = Route.useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["new-development", id],
    queryFn: async () => {
      const { data: dev } = await supabase
        .from("new_developments")
        .select(
          "id, slug, name, developer_name, city, neighborhood, description, hero_image_url, starting_price, completion_date, str_friendly",
        )
        .eq("slug", id)
        .eq("is_published", true)
        .maybeSingle();
      if (!dev) return null;
      const [units, schedule, docs] = await Promise.all([
        supabase.from("building_units").select("*").eq("development_id", dev.id),
        supabase.from("deposit_schedules").select("*").eq("development_id", dev.id),
        supabase
          .from("developer_documents")
          .select("id, title, requires_registration")
          .eq("development_id", dev.id),
      ]);
      return {
        development: dev as Development,
        units: (units.data ?? []) as BuildingUnit[],
        schedule: (schedule.data ?? []) as DepositMilestone[],
        docs: (docs.data ?? []) as DocRow[],
      };
    },
  });

  const demo = DEMO_DEVELOPMENTS.find((d) => d.slug === id);
  const development = data?.development ?? demo ?? null;
  const units = data?.units?.length ? data.units : demo ? DEMO_UNITS : [];
  const schedule = data?.schedule?.length ? data.schedule : demo ? DEMO_SCHEDULE : [];
  const docs = data?.docs ?? [];

  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const selected = units.find((u) => u.id === selectedUnitId) ?? units[0] ?? null;
  const price = selected?.price ?? development?.starting_price ?? 0;
  const ladder = useMemo(() => depositLadder(schedule, price), [schedule, price]);
  const lines = useMemo(() => groupByLine(units), [units]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12">
        <Skeleton className="h-[24rem] w-full rounded-sm" />
        <Skeleton className="mt-8 h-64 w-full rounded-sm" />
      </div>
    );
  }

  if (!development) {
    return (
      <div className="p-16 text-center text-sm text-muted-foreground">
        This development is no longer listed.{" "}
        <Link to="/new-projects" className="underline">
          Back to new developments
        </Link>
      </div>
    );
  }

  return (
    <main className="bg-background">
      <div className="mx-auto max-w-7xl px-6 py-8 pb-24">
        <div className="overflow-hidden rounded-sm bg-secondary">
          <ListingImage
            src={development.hero_image_url}
            alt={`${development.name} — pre-construction rendering`}
            loading="eager"
            className="h-[20rem] w-full object-cover sm:h-[30rem]"
          />
        </div>

        <div className="mt-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow text-muted-foreground">
              Pre-construction · {development.developer_name ?? "Developer TBA"}
            </p>
            <h1 className="mt-3 font-display text-5xl text-foreground">{development.name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {[development.neighborhood, development.city].filter(Boolean).join(", ") || "Miami"}
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-3xl">
              From {money(development.starting_price, { compact: true })}
            </p>
            <p className="mt-1 flex items-center justify-end gap-2 text-xs text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5" /> Delivery{" "}
              {completionYear(development.completion_date) ?? "TBD"}
              {development.str_friendly ? " · STR friendly" : ""}
            </p>
          </div>
        </div>

        {development.description && (
          <p className="mt-6 max-w-3xl whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {development.description}
          </p>
        )}

        {/* Deposit ladder */}
        <section className="mt-12 rounded-sm border border-border bg-card p-6 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-muted-foreground">Cash planning</p>
              <h2 className="mt-2 font-display text-2xl">Deposit ladder calculator</h2>
            </div>
            {units.length > 0 && (
              <div>
                <Label htmlFor="unit-pick" className="text-xs uppercase tracking-widest text-muted-foreground">
                  Selected unit
                </Label>
                <select
                  id="unit-pick"
                  value={selected?.id ?? ""}
                  onChange={(e) => setSelectedUnitId(e.target.value)}
                  className="mt-2 h-10 rounded-sm border border-input bg-background px-3 text-sm"
                >
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.unit_number ?? "Unit"} · {u.floor_plan_line ?? "—"} · {money(u.price)}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {ladder.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">
              The deposit schedule for this project has not been published yet.
            </p>
          ) : (
            <>
              <div className="mt-8 flex h-2 w-full overflow-hidden rounded-full bg-secondary">
                {ladder.map((step, i) => (
                  <div
                    key={step.id}
                    title={`${step.milestone} — ${step.percent}%`}
                    className={i % 2 === 0 ? "bg-accent" : "bg-primary"}
                    style={{ width: `${step.percent}%` }}
                  />
                ))}
              </div>
              <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {ladder.map((step, i) => (
                  <li key={step.id} className="rounded-sm border border-border bg-secondary/40 p-5">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">
                      Step {i + 1} · {step.percent}%
                    </p>
                    <p className="mt-2 font-display text-2xl">{money(Math.round(step.amount))}</p>
                    <p className="mt-1 text-sm text-foreground">{step.milestone}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{step.due_label ?? ""}</p>
                    <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
                      Cumulative {step.cumulativePercent}% ·{" "}
                      {money(Math.round(step.cumulativeAmount))}
                    </p>
                  </li>
                ))}
              </ol>
              <p className="mt-6 text-xs text-muted-foreground">
                Based on a purchase price of {money(price)}. Excludes developer fees, closing costs
                and taxes — confirm with the developer contract.
              </p>
            </>
          )}
        </section>

        {/* Floor plan matrix */}
        <section className="mt-12">
          <h2 className="font-display text-2xl">Floor plan matrix</h2>
          {lines.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Unit inventory coming soon.</p>
          ) : (
            <div className="mt-6 space-y-8">
              {lines.map(([line, lineUnits]) => (
                <div key={line} className="overflow-hidden rounded-sm border border-border">
                  <div className="flex items-baseline justify-between gap-4 bg-secondary/50 px-5 py-3">
                    <h3 className="font-display text-lg">{line}</h3>
                    <p className="text-xs text-muted-foreground">
                      {lineUnits.length} units · from{" "}
                      {money(Math.min(...lineUnits.map((u) => u.price ?? Infinity)))}
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                        <tr className="border-b border-border">
                          {["Unit", "Floor", "Beds", "Baths", "Interior", "Balcony", "View", "Price"].map(
                            (h) => (
                              <th key={h} className="px-5 py-3 font-normal">
                                {h}
                              </th>
                            ),
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {lineUnits.map((u) => (
                          <tr
                            key={u.id}
                            onClick={() => setSelectedUnitId(u.id)}
                            className={`cursor-pointer border-b border-border last:border-0 hover:bg-secondary/40 ${
                              selected?.id === u.id ? "bg-secondary/60" : ""
                            }`}
                          >
                            <td className="px-5 py-3">{u.unit_number ?? "—"}</td>
                            <td className="px-5 py-3">{u.floor ?? "—"}</td>
                            <td className="px-5 py-3">{num(u.bedrooms)}</td>
                            <td className="px-5 py-3">{num(u.bathrooms)}</td>
                            <td className="px-5 py-3">{num(u.interior_sqft)} sq ft</td>
                            <td className="px-5 py-3">{num(u.balcony_sqft)} sq ft</td>
                            <td className="px-5 py-3 text-muted-foreground">
                              {u.view_description ?? "—"}
                            </td>
                            <td className="px-5 py-3">{money(u.price)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <VipAccess
          developmentName={development.name}
          neighborhood={development.neighborhood}
          docs={docs}
        />
      </div>
    </main>
  );
}

function VipAccess({
  developmentName,
  neighborhood,
  docs,
}: {
  developmentName: string;
  neighborhood: string | null;
  docs: DocRow[];
}) {
  const { submit, isSubmitting } = useEspoLead({
    successMessage: "VIP access granted — an advisor will follow up shortly.",
  });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const primaryDoc = docs[0] ?? null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const [firstName, ...rest] = form.name.trim().split(" ");
    await submit({
      firstName: firstName || undefined,
      lastName: rest.join(" ") || firstName || "VIP Lead",
      email: form.email || undefined,
      phoneNumber: form.phone || undefined,
      leadSource: "New Development VIP Brochure",
      buyingTimeline: "Pre-construction",
      preferredNeighborhoods: neighborhood ? [neighborhood] : undefined,
      interactionContext: `🔥 HOT / Pre-Construction — requested developer brochure for ${developmentName}`,
    });

    if (!primaryDoc) {
      setError("Brochure is being finalised — an advisor will email it to you.");
      return;
    }
    try {
      const res = await requestBrochureFn({
        data: {
          documentId: primaryDoc.id,
          name: form.name,
          email: form.email,
          phone: form.phone,
        },
      });
      if (res.url) setLink(res.url);
      else setError(res.error ?? "Could not prepare the download.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not prepare the download.");
    }
  }

  return (
    <section className="mt-12 rounded-sm border border-border bg-card p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div>
          <p className="eyebrow text-muted-foreground">VIP access</p>
          <h2 className="mt-2 flex items-center gap-2 font-display text-2xl">
            <Lock className="h-5 w-5 text-accent" /> Developer brochure & price sheet
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Full floor plates, finishes schedule and the complete developer price sheet — released
            to registered buyers only.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <Sparkles className="mr-2 h-4 w-4" /> Unlock VIP brochure
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Get the {developmentName} brochure</DialogTitle>
              <DialogDescription>
                Enter your details and we&apos;ll unlock the complete developer package.
              </DialogDescription>
            </DialogHeader>
            {link ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Your download is ready.</p>
                <Button asChild className="w-full">
                  <a href={link} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-4 w-4" /> Download brochure
                  </a>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="vip-name">Full name</Label>
                  <Input
                    id="vip-name"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="vip-email">Email</Label>
                  <Input
                    id="vip-email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="vip-phone">Phone</Label>
                  <Input
                    id="vip-phone"
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="mt-2"
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Sending…" : "Unlock brochure"}
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}