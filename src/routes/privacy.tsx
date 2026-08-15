import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | Cays Realty" },
      {
        name: "description",
        content:
          "How Cays Realty collects, uses and protects the information you share when searching Miami MLS listings or requesting a showing.",
      },
      { property: "og:title", content: "Privacy Policy | Cays Realty" },
      {
        property: "og:description",
        content: "How Cays Realty handles the information you share on this site.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/privacy" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="font-display text-4xl">Privacy policy</h1>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
        <p>
          Cays Realty collects the contact details you submit through showing requests, valuation
          requests and building alerts so a licensed advisor can respond. We do not sell your
          personal information.
        </p>
        <p>
          Saved properties, watches and saved searches are stored against your account and are
          visible only to you and the advisor assigned to your inquiry.
        </p>
        <p>
          Listing content is sourced from the MLS under the IDX program and is subject to the
          rules of the originating MLS.
        </p>
        <p>Questions about your data? Contact privacy@cays.com.</p>
      </div>
    </main>
  );
}
