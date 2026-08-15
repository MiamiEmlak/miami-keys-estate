import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { trestleProperties } from "@/lib/trestle.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/admin/trestle")({
  head: () => ({
    meta: [
      { title: "Trestle Console | Cays Realty" },
      { name: "description", content: "Internal console for testing the Cays MLS data connection." },
      { property: "og:title", content: "Trestle Console | Cays Realty" },
      { property: "og:description", content: "Internal MLS connection testing console." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TrestleConsole,
});

function TrestleConsole() {
  const run = useServerFn(trestleProperties);
  const mutation = useMutation({
    mutationFn: (vars: { city?: string; top: number }) => run({ data: vars }),
  });
  const result = mutation.data;

  return (
    <main className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-8">
        <Link to="/" className="brand-mark text-lg">
          Cays
        </Link>
        <span className="eyebrow">Internal console</span>
      </header>

      <section className="mx-auto max-w-5xl px-6 pb-24">
        <p className="eyebrow">MLS connection</p>
        <h1 className="mt-4 font-display text-4xl">Trestle diagnostics</h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Runs a live authenticated request against the Cotality Trestle OData feed from the server.
          Credentials stay server-side and are never sent to the browser.
        </p>

        <form
          className="mt-10 flex flex-wrap items-end gap-4 rounded-sm border border-border bg-card p-6"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const city = String(form.get("city") ?? "").trim();
            mutation.mutate({
              ...(city ? { city } : {}),
              top: Number(form.get("top") ?? 5),
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="city">City filter (optional)</Label>
            <Input id="city" name="city" placeholder="Miami Beach" className="w-56" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="top">Records</Label>
            <Input id="top" name="top" type="number" min={1} max={50} defaultValue={5} className="w-24" />
          </div>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Testing…" : "Test connection"}
          </Button>
        </form>

        {mutation.isError && (
          <p className="mt-6 text-sm text-destructive">
            Request failed. You must be signed in with an admin role.
          </p>
        )}

        {result && (
          <div className="mt-10 space-y-8">
            <div className="grid gap-4 sm:grid-cols-3">
              <Stat label="Connection" value={result.connected ? "Connected" : "Not connected"} />
              <Stat label="Total matching" value={String(result.count)} />
              <Stat label="Media returned" value={String(result.media.length)} />
            </div>

            {result.error && (
              <div className="rounded-sm border border-destructive/30 bg-destructive/5 p-5 text-sm">
                {result.error}
                {result.missingEnv.length > 0 && (
                  <ul className="mt-3 list-disc pl-5 text-muted-foreground">
                    {result.missingEnv.map((name) => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {result.properties.length > 0 && (
              <div className="overflow-x-auto rounded-sm border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-secondary text-xs uppercase tracking-widest text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Listing key</th>
                      <th className="px-4 py-3">Address</th>
                      <th className="px-4 py-3">City</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.properties.map((p) => (
                      <tr key={p.listing_key} className="border-t border-border">
                        <td className="px-4 py-3 font-mono text-xs">{p.listing_key}</td>
                        <td className="px-4 py-3">{p.street_address ?? "—"}</td>
                        <td className="px-4 py-3">{p.city ?? "—"}</td>
                        <td className="px-4 py-3">{p.standard_status ?? "—"}</td>
                        <td className="px-4 py-3">
                          {p.list_price ? `$${p.list_price.toLocaleString()}` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-border bg-card p-6 elevated">
      <p className="eyebrow">{label}</p>
      <p className="mt-3 font-display text-3xl">{value}</p>
    </div>
  );
}
