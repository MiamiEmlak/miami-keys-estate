import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/buildings")({
  head: () => ({
    meta: [
      { title: "Monitor a Building | Cays Realty" },
      {
        name: "description",
        content:
          "Track a Miami condo building — new listings, price changes and closings delivered by a Cays advisor.",
      },
      { property: "og:title", content: "Monitor a Building | Cays Realty" },
      {
        property: "og:description",
        content: "Track a Miami condo building's listings, price changes and closings.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BuildingsPage,
});

function BuildingsPage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="brand-mark text-lg text-foreground">
          Cays
        </Link>
        <Link to="/search" search={{}} className="text-sm text-muted-foreground hover:text-foreground">
          Search listings
        </Link>
      </header>
      <section className="mx-auto max-w-3xl px-6 py-24">
        <p className="eyebrow text-muted-foreground">Building intelligence</p>
        <h1 className="mt-6 font-display text-5xl">Monitor a building</h1>
        <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
          Building-level monitoring — new listings, price changes, rentals and closings for a single
          address — is being wired to the MLS feed next. In the meantime, search the live MLS and
          save any listing to start a watch on it.
        </p>
        <Link
          to="/search"
          search={{}}
          className="mt-10 inline-flex rounded-sm bg-primary px-6 py-3 text-xs uppercase tracking-widest text-primary-foreground"
        >
          Search live listings
        </Link>
      </section>
    </main>
  );
}