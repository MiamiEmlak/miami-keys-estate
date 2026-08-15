import { Link } from "@tanstack/react-router";
import { Bell, Heart, Scale } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { saveListingFn } from "@/lib/listings.functions";
import { money, num, perSqFt, fullAddress } from "@/lib/format";
import { ListingImage } from "@/components/listings/ListingImage";
import type { ListingCard } from "@/lib/listings.server";

export function PropertyCard({
  listing,
  compareSelected,
  onToggleCompare,
}: {
  listing: ListingCard;
  compareSelected?: boolean;
  onToggleCompare?: (listingKey: string) => void;
}) {
  const save = useServerFn(saveListingFn);
  const [busy, setBusy] = useState<"save" | "watch" | null>(null);

  async function act(mode: "save" | "watch") {
    setBusy(mode);
    try {
      await save({ data: { listingKey: listing.listing_key, mode } });
      toast.success(mode === "save" ? "Saved to your properties" : "Watching this listing");
    } catch {
      toast.error("Sign in to save or watch listings");
    } finally {
      setBusy(null);
    }
  }

  return (
    <article className="group overflow-hidden rounded-sm border border-border bg-card transition-shadow hover:shadow-[var(--shadow-elevated)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        <Link to="/property/$id" params={{ id: listing.listing_key }}>
          <ListingImage
            src={listing.photo}
            alt={`${fullAddress(listing) || "Miami listing"} — primary MLS photo`}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        </Link>
        <div className="absolute right-3 top-3 flex gap-2">
          {onToggleCompare && (
            <button
              type="button"
              aria-label={compareSelected ? "Remove from comparison" : "Add to comparison"}
              aria-pressed={compareSelected}
              onClick={() => onToggleCompare(listing.listing_key)}
              className={`rounded-full p-2 transition-colors ${
                compareSelected
                  ? "bg-accent text-accent-foreground"
                  : "bg-background/90 text-foreground hover:bg-background"
              }`}
            >
              <Scale className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            aria-label="Save property"
            disabled={busy !== null}
            onClick={() => act("save")}
            className="rounded-full bg-background/90 p-2 text-foreground transition-colors hover:bg-background"
          >
            <Heart className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Watch property"
            disabled={busy !== null}
            onClick={() => act("watch")}
            className="rounded-full bg-background/90 p-2 text-foreground transition-colors hover:bg-background"
          >
            <Bell className="h-4 w-4" />
          </button>
        </div>
        <span className="absolute left-3 top-3 rounded-sm bg-primary/90 px-2 py-1 text-[10px] uppercase tracking-widest text-primary-foreground">
          {listing.standard_status ?? "Active"}
        </span>
      </div>

      <div className="p-5">
        <p className="font-display text-2xl text-foreground">{money(listing.list_price)}</p>
        <Link
          to="/property/$id"
          params={{ id: listing.listing_key }}
          className="mt-1 block text-sm text-muted-foreground hover:text-foreground"
        >
          {fullAddress(listing) || "Address withheld"}
        </Link>
        <p className="mt-4 text-sm text-foreground">
          {num(listing.bedrooms_total)} bd · {num(listing.bathrooms_total)} ba ·{" "}
          {num(listing.living_area)} sq ft
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {perSqFt(listing.list_price, listing.living_area)} ·{" "}
          {listing.property_sub_type ?? listing.property_type ?? "Residential"}
        </p>
      </div>
    </article>
  );
}