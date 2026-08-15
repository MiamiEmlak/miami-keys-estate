import { Link } from "@tanstack/react-router";
import { Heart, Menu } from "lucide-react";
import { useState } from "react";
import { useSavedProperties } from "@/hooks/useSavedProperties";
import { money, fullAddress } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const NAV = [
  { label: "Search", to: "/search" as const, search: {} },
  { label: "Buildings", to: "/buildings" as const, search: {} },
  { label: "Sell", to: "/sell" as const, search: {} },
  { label: "Compare", to: "/compare" as const, search: { ids: "" } },
  { label: "Ask AI", to: "/ask" as const, search: {} },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const { rows, count, signedIn } = useSavedProperties();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <Link to="/" className="brand-mark text-lg text-foreground">
          Cays
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-7 text-sm md:flex">
          {NAV.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              search={item.search}
              activeProps={{ className: "text-foreground" }}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Sheet open={savedOpen} onOpenChange={setSavedOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label={`Saved properties (${count})`}
                className="relative rounded-sm border border-border px-3 py-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <Heart className="h-4 w-4" />
                {count > 0 && (
                  <span className="absolute -right-2 -top-2 rounded-full bg-accent px-1.5 text-[10px] font-medium text-accent-foreground">
                    {count}
                  </span>
                )}
              </button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-sm">
              <SheetHeader>
                <SheetTitle className="font-display text-2xl">Saved properties</SheetTitle>
                <SheetDescription>
                  {signedIn
                    ? "Listings you've saved from the live MLS."
                    : "Sign in to save listings and price-drop alerts."}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-3">
                {signedIn && rows.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Nothing saved yet — tap the heart on any listing.
                  </p>
                )}
                {rows.map((row) => (
                  <Link
                    key={row.listing_key}
                    to="/property/$id"
                    params={{ id: row.listing_key }}
                    onClick={() => setSavedOpen(false)}
                    className="block rounded-sm border border-border p-4 transition-colors hover:bg-secondary"
                  >
                    <p className="font-display text-xl">{money(row.properties?.list_price ?? null)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {row.properties
                        ? fullAddress({
                            street_address: row.properties.street_address,
                            city: row.properties.city,
                            state: row.properties.state,
                            postal_code: row.properties.postal_code,
                          })
                        : row.listing_key}
                    </p>
                  </Link>
                ))}
                {!signedIn && (
                  <Button asChild className="w-full" onClick={() => setSavedOpen(false)}>
                    <Link to="/auth">Sign in</Link>
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>

          <Link
            to="/auth"
            className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground md:block md:px-2"
          >
            Sign in
          </Link>

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Open menu"
                className="rounded-sm border border-border px-3 py-2 text-foreground md:hidden"
              >
                <Menu className="h-4 w-4" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader>
                <SheetTitle className="brand-mark text-lg">Cays</SheetTitle>
                <SheetDescription className="sr-only">Site navigation</SheetDescription>
              </SheetHeader>
              <nav aria-label="Mobile" className="mt-8 flex flex-col gap-1">
                {[...NAV, { label: "Sign in", to: "/auth" as const, search: {} }].map((item) => (
                  <Link
                    key={item.label}
                    to={item.to}
                    search={item.search}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-sm px-3 py-3 text-base text-foreground transition-colors hover:bg-secondary"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
