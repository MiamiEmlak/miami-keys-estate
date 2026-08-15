import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/sell")({
  head: () => ({
    meta: [
      { title: "Sell With Cays — Miami Home Valuation | Cays Realty" },
      {
        name: "description",
        content:
          "Request a no-obligation valuation of your Miami condo or home. A Cays advisor prepares a market-backed price opinion within one business day.",
      },
      { property: "og:title", content: "Sell With Cays — Miami Home Valuation" },
      {
        property: "og:description",
        content: "Get a market-backed valuation of your Miami property from a Cays advisor.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/sell" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/sell" }],
  }),
  component: SellPage,
});

const CONDITIONS = ["Fully renovated", "Updated", "Original / as-is", "Needs work"];

function SellPage() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    address: "",
    unit: "",
    beds: "",
    baths: "",
    condition: CONDITIONS[0]!,
    name: "",
    email: "",
    phone: "",
    notes: "",
  });

  const update = (patch: Partial<typeof form>) => setForm({ ...form, ...patch });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.address.trim() || !form.name.trim() || !form.email.trim()) {
      toast.error("Address, name and email are required.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("leads").insert({
      name: form.name,
      email: form.email,
      phone: form.phone,
      lead_type: "home_valuation",
      source: "sell_page",
      notes: `Valuation request — ${form.address}${form.unit ? ` #${form.unit}` : ""}; ${form.beds || "?"} bd / ${form.baths || "?"} ba; condition: ${form.condition}.${form.notes ? ` Notes: ${form.notes}` : ""}`,
    });
    setBusy(false);
    if (error) {
      toast.error("We couldn't submit that request. Please try again.");
      return;
    }
    toast.success("Valuation request received.");
    setSent(true);
  }

  return (
    <main className="bg-background">
      <section className="mx-auto max-w-3xl px-6 pb-24 pt-10">
        <p className="eyebrow text-muted-foreground">Sell with Cays</p>
        <h1 className="mt-5 font-display text-5xl leading-tight text-foreground">
          Discover Your Miami Home's Current Market Value
        </h1>
        <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
          Tell us about the property and a Cays advisor prepares a market-backed price opinion using
          live MLS comparables — no obligation.
        </p>

        {sent ? (
          <div className="mt-12 rounded-sm border border-border bg-card p-8">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-accent" />
              <h2 className="font-display text-2xl">Request received</h2>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              We're preparing a valuation for{" "}
              <span className="text-foreground">
                {form.address}
                {form.unit ? ` #${form.unit}` : ""}
              </span>
              . An advisor will reach {form.email} within one business day.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/search"
                search={{}}
                className="inline-flex rounded-sm bg-primary px-5 py-3 text-xs uppercase tracking-widest text-primary-foreground"
              >
                Browse the market
              </Link>
              <Button variant="outline" onClick={() => setSent(false)}>
                Submit another property
              </Button>
            </div>
          </div>
        ) : (
          <form className="mt-12 space-y-6 rounded-sm border border-border bg-card p-8" onSubmit={submit}>
            <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
              <div>
                <Label htmlFor="v-address">Street address</Label>
                <Input
                  id="v-address"
                  required
                  value={form.address}
                  onChange={(e) => update({ address: e.target.value })}
                  placeholder="1425 Brickell Avenue"
                />
              </div>
              <div>
                <Label htmlFor="v-unit">Unit #</Label>
                <Input id="v-unit" value={form.unit} onChange={(e) => update({ unit: e.target.value })} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="v-beds">Bedrooms</Label>
                <Input
                  id="v-beds"
                  inputMode="numeric"
                  value={form.beds}
                  onChange={(e) => update({ beds: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="v-baths">Bathrooms</Label>
                <Input
                  id="v-baths"
                  inputMode="numeric"
                  value={form.baths}
                  onChange={(e) => update({ baths: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="v-condition">Condition</Label>
                <select
                  id="v-condition"
                  value={form.condition}
                  onChange={(e) => update({ condition: e.target.value })}
                  className="mt-1 h-9 w-full rounded-sm border border-input bg-background px-3 text-sm"
                >
                  {CONDITIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="v-name">Name</Label>
                <Input
                  id="v-name"
                  required
                  value={form.name}
                  onChange={(e) => update({ name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="v-email">Email</Label>
                <Input
                  id="v-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => update({ email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="v-phone">Phone</Label>
                <Input id="v-phone" value={form.phone} onChange={(e) => update({ phone: e.target.value })} />
              </div>
            </div>

            <div>
              <Label htmlFor="v-notes">Anything we should know?</Label>
              <Textarea
                id="v-notes"
                rows={4}
                value={form.notes}
                onChange={(e) => update({ notes: e.target.value })}
                placeholder="Recent renovations, tenant in place, timing…"
              />
            </div>

            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Submitting…" : "Request my valuation"}
            </Button>
          </form>
        )}
      </section>
    </main>
  );
}
