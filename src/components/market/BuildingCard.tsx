import { Link } from "@tanstack/react-router";
import { ListingImage } from "@/components/listings/ListingImage";
import { STRBadge } from "@/components/market/STRBadge";
import { money, num } from "@/lib/format";
import type { Building } from "@/lib/buildings";

export function BuildingCard({
  building,
  stats,
}: {
  building: Building;
  stats?:
    | { photo: string | null; avgPpsf: number | null; activeCount: number; rentalCount: number }
    | undefined;
}) {
  return (
    <article className="group overflow-hidden rounded-sm border border-border bg-card transition-shadow hover:shadow-[var(--shadow-elevated)]">
      <Link to="/buildings/$slug" params={{ slug: building.slug }} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
          <ListingImage
            src={stats?.photo ?? null}
            alt={`${building.name} in ${building.neighborhood}, Miami`}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
          {stats?.avgPpsf ? (
            <span className="absolute left-3 top-3 rounded-sm bg-primary/90 px-2 py-1 text-[10px] uppercase tracking-widest text-primary-foreground">
              Avg {money(stats.avgPpsf)}/sq ft
            </span>
          ) : null}
        </div>
      </Link>
      <div className="p-6">
        <p className="eyebrow text-muted-foreground">{building.neighborhood}</p>
        <h2 className="mt-2 font-display text-2xl text-foreground">{building.name}</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{building.blurb}</p>
        <div className="mt-4">
          <STRBadge friendly={building.strFriendly} />
        </div>
        <dl className="mt-5 grid grid-cols-3 gap-4 border-t border-border pt-5 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-widest text-muted-foreground">Units</dt>
            <dd className="mt-1 text-foreground">{num(building.units)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-widest text-muted-foreground">For sale</dt>
            <dd className="mt-1 text-foreground">{stats ? num(stats.activeCount) : "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-widest text-muted-foreground">Rentals</dt>
            <dd className="mt-1 text-foreground">{stats ? num(stats.rentalCount) : "—"}</dd>
          </div>
        </dl>
        <Link
          to="/buildings/$slug"
          params={{ slug: building.slug }}
          className="mt-6 inline-flex w-full items-center justify-center rounded-sm bg-primary px-4 py-3 text-xs uppercase tracking-widest text-primary-foreground"
        >
          View building intelligence
        </Link>
      </div>
    </article>
  );
}
