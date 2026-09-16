import { Link } from "@tanstack/react-router";
import { ListingImage } from "@/components/listings/ListingImage";
import { PriceChangeBadge } from "@/components/market/PriceChangeBadge";
import { money, num, perSqFt, fullAddress } from "@/lib/format";
import type { MarketCard } from "@/lib/market.server";

export function HomeCard({ home }: { home: MarketCard }) {
  return (
    <article className="group overflow-hidden rounded-sm border border-border bg-card transition-shadow hover:shadow-[var(--shadow-elevated)]">
      <Link to="/homes/$slug" params={{ slug: home.listing_key }} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
          <ListingImage
            src={home.photo}
            alt={`${fullAddress(home) || "Miami single-family home"} — primary MLS photo`}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        </div>
      </Link>
      <div className="p-5">
        <p className="font-display text-2xl text-foreground">{money(home.list_price)}</p>
        <Link
          to="/homes/$slug"
          params={{ slug: home.listing_key }}
          className="mt-1 block text-sm text-muted-foreground hover:text-foreground"
        >
          {fullAddress(home) || "Address withheld"}
        </Link>
        <p className="mt-4 text-sm text-foreground">
          {num(home.bedrooms_total)} bd · {num(home.bathrooms_total)} ba · {num(home.living_area)} sq ft
          {home.lot_size ? ` · ${num(home.lot_size)} sq ft lot` : ""}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {perSqFt(home.list_price, home.living_area)}
          {home.year_built ? ` · Built ${home.year_built}` : ""}
        </p>
        <div className="mt-3">
          <PriceChangeBadge
            current={home.list_price}
            prior={home.previous_list_price ?? home.original_list_price}
          />
        </div>
      </div>
    </article>
  );
}
