import { createFileRoute, Link } from "@tanstack/react-router";

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
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <main className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
        <span className="brand-mark text-lg text-foreground">Cays</span>
        <nav className="flex items-center gap-8 text-sm">
          <Link to="/auth" className="text-muted-foreground transition-colors hover:text-foreground">
            Sign in
          </Link>
          <Link
            to="/admin/trestle"
            className="rounded-sm border border-border px-4 py-2 text-xs tracking-widest uppercase text-foreground transition-colors hover:bg-secondary"
          >
            Console
          </Link>
        </nav>
      </header>

      <section className="hero-surface relative mx-auto max-w-6xl overflow-hidden rounded-sm px-6 py-24 text-primary-foreground sm:px-14 sm:py-36">
        <p className="eyebrow text-primary-foreground/60">Miami · Coral Gables · Key Biscayne</p>
        <h1 className="mt-8 max-w-2xl font-display text-5xl leading-[1.05] sm:text-7xl">
          A quieter way to buy and hold Miami real estate.
        </h1>
        <p className="mt-8 max-w-xl text-base leading-relaxed text-primary-foreground/75">
          Cays connects directly to the MLS and layers it with building intelligence, price history
          and ownership analytics — so decisions are made on evidence, not listings theatre.
        </p>
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

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-10 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span className="brand-mark text-foreground">Cays Realty</span>
          <span>Foundation build · Miami, Florida</span>
        </div>
      </footer>
    </main>
  );
}
