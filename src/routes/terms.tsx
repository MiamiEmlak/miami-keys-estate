import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Use | Cays Realty" },
      {
        name: "description",
        content:
          "Terms governing use of the Cays Realty Miami MLS search platform, including IDX listing data and consumer use restrictions.",
      },
      { property: "og:title", content: "Terms of Use | Cays Realty" },
      {
        property: "og:description",
        content: "Terms governing use of the Cays Realty Miami MLS search platform.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/terms" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/terms" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="font-display text-4xl">Terms of use</h1>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
        <p>
          Listing information displayed here is provided in part by the IDX program of the
          participating MLS and is deemed reliable but not guaranteed. It is intended for
          consumers' personal, non-commercial use and may not be used for any purpose other than
          identifying prospective properties.
        </p>
        <p>
          Investment figures, rental estimates and yield calculations are illustrative only and do
          not constitute financial advice. Verify all figures independently before transacting.
        </p>
        <p>
          Automated scraping, redistribution or resale of listing data from this site is
          prohibited.
        </p>
      </div>
    </main>
  );
}
