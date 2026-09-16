import { Link } from "@tanstack/react-router";
import { ListingImage } from "@/components/listings/ListingImage";
import { STRBadge } from "@/components/market/STRBadge";
import { money, num } from "@/lib/format";
import type { Neighborhood } from "@/lib/neighborhoods";

export function NeighborhoodCard({
  neighborhood,
  stats,
}: {
  neighborhood: Neighborhood;
  stats?:
    | { photo: string | null; medianPrice: number | null; activeCount: number; avgPpsf: number | null }
    | undefined;
}) {
  return (
    <article className="group overflow-hidden rounded-sm border border-border bg-card transition-shadow hover:shadow-[var(--shadow-elevated)]">
      <Link to="/neighborhoods/$slug" params={{ slug: neighborhood.slug }} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
          <ListingImage
            src={stats?.photo ?? null}
            alt={`${neighborhood.name}, Miami real estate`}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
          {stats?.medianPrice ? (
            <span className="absolute left-3 top-3 rounded-sm bg-primary/90 px-2 py-1 text-[10px] uppercase tracking-widest text-primary-foreground">
              Median {money(stats.medianPrice, { compact: true })}
            </span>
          ) : null}
        </div>
      </Link>
      <div className="p-6">
        <p className="eyebrow text-muted-foreground">Walk score {neighborhood.walkScore}</p>
        <h2 className="mt-2 font-display text-2xl text-foreground">{neighborhood.name}</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{neighborhood.overview}</p>
        <div className="mt-4">
          <STRBadge friendly={neighborhood.strFriendly} />
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-5 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-widest text-muted-foreground">Active listings</dt>
            <dd className="mt-1 text-foreground">{stats ? num(stats.activeCount) : "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-widest text-muted-foreground">Avg $/sq ft</dt>
            <dd className="mt-1 text-foreground">{stats?.avgPpsf ? money(stats.avgPpsf) : "—"}</dd>
          </div>
        </dl>
        <Link
          to="/neighborhoods/$slug"
          params={{ slug: neighborhood.slug }}
          className="mt-6 inline-flex w-full items-center justify-center rounded-sm bg-primary px-4 py-3 text-xs uppercase tracking-widest text-primary-foreground"
        >
          Explore {neighborhood.name}
        </Link>
      </div>
    </article>
  );
}
