import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { SendHorizonal, Sparkles } from "lucide-react";
import { askCaysFn } from "@/lib/ask.functions";
import type { CompactListing } from "@/lib/ask.server";
import { money, num } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/ask")({
  head: () => ({
    meta: [
      { title: "Ask Cays AI — Miami Property Assistant | Cays Realty" },
      {
        name: "description",
        content:
          "Ask natural questions about Miami real estate — find condos, estimate rental yields and track market trends with live MLS data.",
      },
      { property: "og:title", content: "Ask Cays AI — Miami Property Assistant" },
      {
        property: "og:description",
        content: "Natural-language Miami property search, ROI estimates and market trends.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AskPage,
});

const CHIPS = [
  "Find Brickell condos under $800k with HOA under $1,000",
  "Which Miami Beach neighborhoods have the highest rental yields?",
  "Show properties with price drops in Edgewater this week",
];

type ChatTurn = { role: "user" | "assistant"; content: string; listings?: CompactListing[] };

function AskPage() {
  const ask = useServerFn(askCaysFn);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, busy]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    const next: ChatTurn[] = [...turns, { role: "user", content: question }];
    setTurns(next);
    setInput("");
    setBusy(true);
    try {
      const res = await ask({
        data: { messages: next.map((t) => ({ role: t.role, content: t.content })) },
      });
      setTurns([
        ...next,
        { role: "assistant", content: res.reply, listings: res.listings ?? [] },
      ]);
    } catch (error) {
      setTurns([
        ...next,
        {
          role: "assistant",
          content: error instanceof Error ? error.message : "Something went wrong. Try again.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <Link to="/" className="brand-mark text-lg text-foreground">
          Cays
        </Link>
        <Link to="/search" search={{}} className="text-sm text-muted-foreground hover:text-foreground">
          Browse listings
        </Link>
      </header>

      <div className="mx-auto max-w-5xl px-6 pb-28">
        <p className="eyebrow text-muted-foreground">Cays intelligence</p>
        <h1 className="mt-3 flex items-center gap-3 font-display text-5xl text-foreground">
          <Sparkles className="h-7 w-7 text-accent" /> Ask Cays AI Property Assistant
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Ask natural questions to discover Miami properties, ROI estimates, and market trends.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          {CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => void send(chip)}
              className="rounded-full border border-border px-4 py-2 text-xs text-muted-foreground transition-colors hover:border-accent hover:text-foreground"
            >
              {chip}
            </button>
          ))}
        </div>

        <div className="mt-10 space-y-6">
          {turns.length === 0 && (
            <div className="rounded-sm border border-border bg-card p-8 text-sm text-muted-foreground">
              Start with a question — try a neighborhood, a budget, or an investment goal.
            </div>
          )}

          {turns.map((t, i) => (
            <div key={i} className={t.role === "user" ? "flex justify-end" : ""}>
              <div
                className={
                  t.role === "user"
                    ? "max-w-xl rounded-sm bg-primary px-5 py-3 text-sm text-primary-foreground"
                    : "max-w-3xl rounded-sm border border-border bg-card px-5 py-4 text-sm leading-relaxed text-foreground"
                }
              >
                <p className="whitespace-pre-line">{t.content}</p>
                {t.listings && t.listings.length > 0 && (
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    {t.listings.map((l) => (
                      <Link
                        key={l.listing_key}
                        to="/property/$id"
                        params={{ id: l.listing_key }}
                        className="group overflow-hidden rounded-sm border border-border transition-colors hover:border-accent"
                      >
                        {l.photo && (
                          <img
                            src={l.photo}
                            alt={l.address ?? "MLS listing"}
                            className="h-32 w-full object-cover"
                            loading="lazy"
                          />
                        )}
                        <div className="p-4">
                          <p className="font-display text-lg">{money(l.price)}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {l.address}
                            {l.city ? `, ${l.city}` : ""}
                          </p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {num(l.beds)} bd · {num(l.baths)} ba ·{" "}
                            {l.sqft ? `${num(l.sqft)} sq ft` : "—"}
                          </p>
                        </div>
                      </Link>
                    ))}
                    <Link
                      to="/search"
                      search={{}}
                      className="flex items-center justify-center rounded-sm border border-dashed border-border p-4 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
                    >
                      See all matching listings
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}

          {busy && (
            <div className="flex items-center gap-2 rounded-sm border border-border bg-card px-5 py-4">
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
              <span className="ml-2 text-xs text-muted-foreground">Cays AI is thinking…</span>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
          className="sticky bottom-6 mt-10 flex gap-3 rounded-sm border border-border bg-card p-3 shadow-sm"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about Miami properties, yields or neighborhoods…"
            aria-label="Ask Cays AI"
            className="border-0 shadow-none focus-visible:ring-0"
          />
          <Button type="submit" disabled={busy || !input.trim()}>
            <SendHorizonal className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </main>
  );
}