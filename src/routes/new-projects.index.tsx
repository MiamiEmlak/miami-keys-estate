import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Building2, CalendarClock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { money } from "@/lib/format";
import { completionYear, DEMO_DEVELOPMENTS, type Development } from "@/lib/new-developments";
import { ListingImage } from "@/components/listings/ListingImage";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/new-projects/")({
  head: () => ({
    meta: [
      { title: "New Developments in Miami — Pre-Construction | Cays Realty" },
      {
        name: "description",
        content:
          "Browse Miami pre-construction condos: starting prices, completion dates, deposit schedules and short-term-rental friendly towers.",
      },
      { property: "og:title", content: "Miami New Developments — Pre-Construction" },
      {
        property: "og:description",
        content: "Pre-construction towers with deposit ladders, floor plan lines and VIP brochures.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/new-projects" }],
  }),
  component: NewProjectsPage,
});

function NewProjectsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["new-developments"],
    queryFn: async () => {
      const { data } = await supabase
        .from("new_developments")
        .select(
          "id, slug, name, developer_name, city, neighborhood, description, hero_image_url, starting_price, completion_date, str_friendly",
        )
        .eq("is_published", true)
        .order("completion_date", { ascending: true });
      return (data ?? []) as Development[];
    },
  });

  const developments = data && data.length > 0 ? data : DEMO_DEVELOPMENTS;
  const usingDemo = !isLoading && (!data || data.length === 0);

  const [year, setYear] = useState("all");
  const [maxBudget, setMaxBudget] = useState("");
  const [strOnly, setStrOnly] = useState(false);

  const years = useMemo(
    () =>
      [...new Set(developments.map((d) => completionYear(d.completion_date)).filter(Boolean))].sort() as number[],
    [developments],
  );

  const filtered = developments.filter((d) => {
    if (year !== "all" && String(completionYear(d.completion_date)) !== year) return false;
    const budget = Number(maxBudget);
    if (budget > 0 && (d.starting_price ?? 0) > budget) return false;
    if (strOnly && !d.str_friendly) return false;
    return true;
  });

  return (
    <main className="bg-background">
      <div className="mx-auto max-w-7xl px-6 py-12 pb-24">
        <p className="eyebrow text-muted-foreground">Pre-construction</p>
        <h1 className="mt-3 font-display text-5xl text-foreground">New developments</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Miami towers still under construction — compare starting prices, delivery dates and
          deposit structures before public release.
        </p>

        <div className="mt-8 flex flex-wrap items-end gap-6 rounded-sm border border-border bg-card p-5">
          <div>
            <Label htmlFor="nd-year" className="text-xs uppercase tracking-widest text-muted-foreground">
              Completion year
            </Label>
            <select
              id="nd-year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="mt-2 h-10 rounded-sm border border-input bg-background px-3 text-sm"
            >
              <option value="all">Any year</option>
              {years.map((y) => (
                <option key={y} value={String(y)}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="nd-budget" className="text-xs uppercase tracking-widest text-muted-foreground">
              Max starting price
            </Label>
            <Input
              id="nd-budget"
              type="number"
              inputMode="numeric"
              step={50_000}
              placeholder="e.g. 1200000"
              value={maxBudget}
              onChange={(e) => setMaxBudget(e.target.value)}
              className="mt-2 w-48"
            />
          </div>
          <div className="flex items-center gap-3 pb-2">
            <Switch id="nd-str" checked={strOnly} onCheckedChange={setStrOnly} />
            <Label htmlFor="nd-str" className="text-sm">
              STR / flexible leasing friendly
            </Label>
          </div>
        </div>

        {usingDemo && (
          <p className="mt-4 text-xs text-muted-foreground">
            Showing sample projects — publish a development in the admin portal to replace them.
          </p>
        )}

        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading &&
            [0, 1, 2].map((i) => <Skeleton key={i} className="h-80 w-full rounded-sm" />)}

          {!isLoading &&
            filtered.map((d) => (
              <Link
                key={d.id}
                to="/new-projects/$id"
                params={{ id: d.slug }}
                className="group overflow-hidden rounded-sm border border-border bg-card transition-colors hover:border-accent"
              >
                <ListingImage
                  src={d.hero_image_url}
                  alt={`${d.name} — pre-construction tower`}
                  className="h-52 w-full object-cover"
                />
                <div className="p-6">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-display text-xl">{d.name}</h2>
                    {d.str_friendly && (
                      <span className="rounded-full border border-accent px-2 py-0.5 text-[10px] uppercase tracking-widest text-accent">
                        STR
                      </span>
                    )}
                  </div>
                  <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5" />
                    {[d.neighborhood, d.city].filter(Boolean).join(", ") || "Miami"}
                  </p>
                  <p className="mt-4 font-display text-2xl">
                    From {money(d.starting_price, { compact: true })}
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarClock className="h-3.5 w-3.5" />
                    Delivery {completionYear(d.completion_date) ?? "TBD"}
                  </p>
                </div>
              </Link>
            ))}
        </div>

        {!isLoading && filtered.length === 0 && (
          <p className="mt-16 text-center text-sm text-muted-foreground">
            No developments match those filters yet.
          </p>
        )}
      </div>
    </main>
  );
}