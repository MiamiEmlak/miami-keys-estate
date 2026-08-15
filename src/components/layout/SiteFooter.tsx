import { Link } from "@tanstack/react-router";

const NEIGHBORHOODS = ["Brickell", "Edgewater", "Miami Beach", "Miami", "Sunny Isles Beach"];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <span className="brand-mark text-foreground">Cays Realty</span>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            MLS-powered search and private market intelligence for Miami buyers, sellers and
            investors.
          </p>
        </div>

        <nav aria-label="Neighborhoods">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground">Neighborhoods</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {NEIGHBORHOODS.map((city) => (
              <li key={city}>
                <Link
                  to="/search"
                  search={{ city, type: "buy", page: 1 }}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {city}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Tools">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground">Tools</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link
                to="/compare"
                search={{ ids: "" }}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                ROI &amp; comparison calculator
              </Link>
            </li>
            <li>
              <Link
                to="/search"
                search={{ filter: "price_drops", page: 1 }}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Price drops
              </Link>
            </li>
            <li>
              <Link
                to="/buildings"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Building directory
              </Link>
            </li>
            <li>
              <Link to="/ask" className="text-muted-foreground transition-colors hover:text-foreground">
                AI search
              </Link>
            </li>
            <li>
              <Link to="/sell" className="text-muted-foreground transition-colors hover:text-foreground">
                Home valuation
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground">Compliance</h2>
          <div className="mt-4 flex items-center gap-3">
            <span
              aria-label="Equal Housing Opportunity"
              className="flex h-10 w-10 items-center justify-center rounded-sm border border-border text-[9px] font-semibold uppercase leading-tight text-muted-foreground"
            >
              EHO
            </span>
            <p className="text-xs text-muted-foreground">Equal Housing Opportunity</p>
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link to="/privacy" className="text-muted-foreground transition-colors hover:text-foreground">
                Privacy policy
              </Link>
            </li>
            <li>
              <Link to="/terms" className="text-muted-foreground transition-colors hover:text-foreground">
                Terms of use
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl space-y-2 px-6 py-8 text-[11px] leading-relaxed text-muted-foreground">
          <p>
            Listing data is provided in part by the IDX program of the participating MLS and is
            deemed reliable but not guaranteed. Information is for consumers' personal,
            non-commercial use and may not be used for any purpose other than to identify
            prospective properties. Data last refreshed directly from the MLS feed.
          </p>
          <p>© {year} Cays Realty. All rights reserved. Licensed real estate brokerage, Florida.</p>
        </div>
      </div>
    </footer>
  );
}
