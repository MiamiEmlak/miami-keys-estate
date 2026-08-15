import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Building2, LineChart, Sparkles, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cays | Miami Luxury Real Estate" },
      {
        name: "description",
        content:
          "Cays Realty pairs live MLS data with private market intelligence for buyers and owners across Miami's waterfront neighborhoods.",
      },
      { property: "og:title", content: "Cays | Miami Luxury Real Estate" },
      {
        property: "og:description",
        content: "Live MLS data and private market intelligence for Miami luxury real estate.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  const [location, setLocation] = useState("");
  const [type, setType] = useState("buy");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [beds, setBeds] = useState(0);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const value = location.trim();
    const isZip = /^\d{5}$/.test(value);
    navigate({
      to: "/search",
      search: {
        ...(isZip ? { zip: value } : value ? { city: value } : {}),
        type,
        ...(Number(minPrice) ? { minPrice: Number(minPrice) } : {}),
        ...(Number(maxPrice) ? { maxPrice: Number(maxPrice) } : {}),
        ...(beds ? { beds } : {}),
        page: 1,
      },
    });
  }

  return (
    <main className="bg-background">
      <section className="hero-surface isolate mx-auto mt-8 max-w-6xl overflow-hidden rounded-sm px-6 pb-32 pt-24 text-primary-foreground sm:px-14 sm:pb-40 sm:pt-36">
        <p className="eyebrow text-primary-foreground/60">Miami · Coral Gables · Key Biscayne</p>
        <h1 className="mt-8 max-w-3xl font-display text-5xl leading-[1.05] sm:text-7xl">
          Find a Property You'll Love — or Invest In
        </h1>
        <p className="mt-6 text-lg tracking-wide text-primary-foreground/75">
          Find. Analyze. Invest.
        </p>
      </section>

      <section className="relative z-10 mx-auto -mt-16 max-w-5xl px-6">
        <form
          onSubmit={submit}
          className="rounded-sm border border-border bg-card p-6 shadow-[var(--shadow-elevated)] sm:p-8"
        >
          <div className="flex flex-wrap gap-2">
            {[
              ["buy", "Buy"],
              ["rent", "Rent"],
              ["investment", "Investment"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setType(value as string)}
                className={`rounded-sm border px-5 py-2 text-xs uppercase tracking-widest transition-colors ${
                  type === value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:bg-secondary"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <Label htmlFor="h-location">City or ZIP code</Label>
              <Input
                id="h-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Miami Beach or 33139"
              />
            </div>
            <div>
              <Label htmlFor="h-min">Min price</Label>
              <Input
                id="h-min"
                inputMode="numeric"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="500,000"
              />
            </div>
            <div>
              <Label htmlFor="h-max">Max price</Label>
              <Input
                id="h-max"
                inputMode="numeric"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="3,000,000"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Bedrooms</Label>
              <div className="mt-2 flex gap-2">
                {[1, 2, 3, 4].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBeds(beds === b ? 0 : b)}
                    className={`rounded-sm border px-4 py-2 text-xs ${
                      beds === b
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {b}+
                  </button>
                ))}
              </div>
            </div>
            <Button type="submit" size="lg" className="px-10 text-xs uppercase tracking-widest">
              Search
            </Button>
          </div>
        </form>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Just Listed", icon: Sparkles, to: "/search" as const, search: { sort: "newest" } },
            {
              title: "Price Drops",
              icon: TrendingDown,
              to: "/search" as const,
              search: { filter: "price_drops" },
            },
            {
              title: "Investment Deals",
              icon: LineChart,
              to: "/search" as const,
              search: { type: "investment" },
            },
            { title: "Monitor a Building", icon: Building2, to: "/buildings" as const, search: {} },
          ].map((card) => (
            <Link
              key={card.title}
              to={card.to}
              search={card.search}
              className="group rounded-sm border border-border bg-card p-6 transition-colors hover:bg-secondary"
            >
              <card.icon className="h-5 w-5 text-accent" />
              <p className="mt-4 font-display text-xl text-foreground">{card.title}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-14 px-6 py-28 sm:grid-cols-3">
        {[
          {
            title: "Live MLS foundation",
            body: "Normalized listing and media data synced from the Cotality Trestle feed through a secured server layer.",
          },
          {
            title: "Ownership intelligence",
            body: "Watch a unit, a building or a street. Price history, rentals and comparables build on the same schema.",
          },
          {
            title: "Advisory, not volume",
            body: "Saved searches and alerts route to a real advisor rather than an anonymous lead pool.",
          },
        ].map((item) => (
          <article key={item.title}>
            <h2 className="font-display text-2xl">{item.title}</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
          </article>
        ))}
      </section>

    </main>
  );
}
