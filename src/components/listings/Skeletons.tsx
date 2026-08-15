import { Skeleton } from "@/components/ui/skeleton";

export function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-sm border border-border bg-card">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

export function PropertyGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="mt-8 grid gap-8 sm:grid-cols-2 xl:grid-cols-3" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <PropertyCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function GallerySkeleton() {
  return (
    <div aria-hidden>
      <Skeleton className="h-[28rem] w-full rounded-sm sm:h-[34rem]" />
      <div className="mt-3 flex gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-28 shrink-0 rounded-sm" />
        ))}
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-6 pb-20 pt-6">
      <GallerySkeleton />
      <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-4 w-80" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
        <Skeleton className="h-72 w-full" />
      </div>
    </div>
  );
}

export function BuildingProfileSkeleton() {
  return (
    <div className="space-y-6" aria-hidden>
      <Skeleton className="h-10 w-72" />
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
      <PropertyGridSkeleton count={3} />
    </div>
  );
}

export function BuildingCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-sm border border-border bg-card">
      <Skeleton className="aspect-[3/2] w-full rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}
