// Server-only market intelligence built on the Trestle OData feed.
import { readTrestleEnv, trestleGet, normalizeProperty } from "./trestle.server";
import { NEIGHBORHOOD_LIST, getNeighborhood } from "./neighborhoods";

export type MarketStats = {
  activeCount: number;
  rentalCount: number;
  medianPrice: number | null;
  medianRent: number | null;
  avgPpsf: number | null;
  priceDrops: number;
  priceIncreases: number;
};

export type MarketCard = ReturnType<typeof normalizeProperty> & { photo: string | null };

const esc = (v: string) => v.replace(/'/g, "''");
const SAMPLE = 60;

export const EMPTY_STATS: MarketStats = {
  activeCount: 0,
  rentalCount: 0,
  medianPrice: null,
  medianRent: null,
  avgPpsf: null,
  priceDrops: 0,
  priceIncreases: 0,
};

export function photoOf(raw: Record<string, unknown>): string | null {
  const media = raw["Media"];
  if (!Array.isArray(media)) return null;
  const photos = (media as Record<string, unknown>[])
    .filter((m) => typeof m["MediaURL"] === "string" && m["MediaCategory"] !== "Document")
    .sort((a, b) => Number(a["Order"] ?? 0) - Number(b["Order"] ?? 0));
  return (photos[0]?.["MediaURL"] as string) ?? null;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : Math.round(((s[mid - 1] ?? 0) + (s[mid] ?? 0)) / 2);
}

type Row = ReturnType<typeof normalizeProperty>;

const priorPrice = (r: Row) => r.previous_list_price ?? r.original_list_price;

export function summarize(rows: Row[]): MarketStats {
  const sales = rows.filter((r) => r.property_type !== "ResidentialLease");
  const rentals = rows.filter((r) => r.property_type === "ResidentialLease");
  const ppsf = sales
    .filter((r) => r.list_price && r.living_area)
    .map((r) => r.list_price! / r.living_area!);

  return {
    activeCount: sales.length,
    rentalCount: rentals.length,
    medianPrice: median(sales.map((r) => r.list_price).filter((p): p is number => !!p)),
    medianRent: median(rentals.map((r) => r.list_price).filter((p): p is number => !!p)),
    avgPpsf: ppsf.length ? Math.round(ppsf.reduce((a, c) => a + c, 0) / ppsf.length) : null,
    priceDrops: rows.filter((r) => {
      const prior = priorPrice(r);
      return !!prior && !!r.list_price && r.list_price < prior;
    }).length,
    priceIncreases: rows.filter((r) => {
      const prior = priorPrice(r);
      return !!prior && !!r.list_price && r.list_price > prior;
    }).length,
  };
}

const cache = new Map<string, { at: number; data: unknown }>();
const TTL = 10 * 60 * 1000;

async function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.data as T;
  const data = await fn();
  cache.set(key, { at: Date.now(), data });
  return data;
}

async function fetchRows(filter: string, top = SAMPLE, expandMedia = false) {
  const { env } = readTrestleEnv();
  if (!env) return { raw: [] as Record<string, unknown>[], error: "MLS not configured" };
  try {
    const res = await trestleGet(env, "Property", {
      $top: String(top),
      $filter: filter,
      $orderby: "ModificationTimestamp desc",
      ...(expandMedia ? { $expand: "Media" } : {}),
    });
    return { raw: res.value, error: null as string | null };
  } catch (error) {
    console.error("market query failed", { filter, error });
    return {
      raw: [] as Record<string, unknown>[],
      error: error instanceof Error ? error.message : "MLS request failed",
    };
  }
}

/* ------------------------------ neighborhoods ------------------------------ */

function neighborhoodFilter(slug: string): string | null {
  const n = getNeighborhood(slug);
  if (!n) return null;
  return `StandardStatus eq 'Active' and City eq '${esc(n.city)}'`;
}

// Run async work with limited concurrency so a large directory doesn't open
// dozens of simultaneous MLS connections.
export async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      out[i] = await fn(items[i]!);
    }
  });
  await Promise.all(workers);
  return out;
}

export async function getNeighborhoodDirectory() {
  const stats = await mapLimit(NEIGHBORHOOD_LIST, 6, async (n) =>
    cached(`nbhd-dir:${n.slug}`, async () => {
      const filter = neighborhoodFilter(n.slug)!;
      const { raw } = await fetchRows(filter, 40, true);
      const rows = raw.map(normalizeProperty);
      const withPhoto = raw.find((r) => photoOf(r));
      return {
        slug: n.slug,
        ...summarize(rows),
        photo: withPhoto ? photoOf(withPhoto) : null,
      };
    }),
  );
  return { stats };
}

export async function getNeighborhoodProfile(slug: string) {
  const empty = {
    stats: EMPTY_STATS,
    listings: [] as MarketCard[],
    saleListings: [] as MarketCard[],
    rentListings: [] as MarketCard[],
  };
  const filter = neighborhoodFilter(slug);
  if (!filter) return { ...empty, error: "Unknown neighborhood" };

  const { raw, error } = await fetchRows(filter, SAMPLE, true);
  const rows = raw.map(normalizeProperty);
  const cards: MarketCard[] = raw.map((r) => ({ ...normalizeProperty(r), photo: photoOf(r) }));
  const saleListings = cards.filter((c) => c.property_type !== "ResidentialLease").slice(0, 12);
  const rentListings = cards.filter((c) => c.property_type === "ResidentialLease").slice(0, 12);
  return {
    stats: summarize(rows),
    listings: cards.slice(0, 12),
    saleListings,
    rentListings,
    error,
  };
}

/* --------------------------------- homes ---------------------------------- */

const SINGLE_FAMILY = `(PropertySubType eq 'SingleFamilyResidence' or PropertySubType eq 'SingleFamilyDetached')`;

export async function getHomesIndex(input: {
  city?: string | undefined;
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
  beds?: number | undefined;
}) {
  const filters = [`StandardStatus eq 'Active'`, SINGLE_FAMILY];
  if (input.city) filters.push(`City eq '${esc(input.city)}'`);
  if (input.minPrice) filters.push(`ListPrice ge ${Math.round(input.minPrice)}`);
  if (input.maxPrice) filters.push(`ListPrice le ${Math.round(input.maxPrice)}`);
  if (input.beds) filters.push(`BedroomsTotal ge ${Math.round(input.beds)}`);

  const { raw, error } = await fetchRows(filters.join(" and "), 36, true);
  const rows = raw.map(normalizeProperty);
  return {
    homes: raw.map((r) => ({ ...normalizeProperty(r), photo: photoOf(r) })) as MarketCard[],
    stats: summarize(rows),
    error,
  };
}

export async function getHomeProfile(listingKey: string) {
  const { env } = readTrestleEnv();
  if (!env)
    return {
      home: null,
      nearby: [] as MarketCard[],
      similar: [] as MarketCard[],
      error: "MLS not configured",
    };

  try {
    const res = await trestleGet(env, "Property", {
      $top: "1",
      $filter: `ListingKey eq '${esc(listingKey)}'`,
      $expand: "Media",
    });
    const rawHome = res.value[0];
    if (!rawHome)
      return { home: null, nearby: [] as MarketCard[], similar: [] as MarketCard[], error: null };

    const home: MarketCard = { ...normalizeProperty(rawHome), photo: photoOf(rawHome) };

    const nearFilters = [`StandardStatus eq 'Active'`];
    if (home.postal_code) nearFilters.push(`PostalCode eq '${esc(home.postal_code)}'`);
    else if (home.city) nearFilters.push(`City eq '${esc(home.city)}'`);

    const simFilters = [...nearFilters, SINGLE_FAMILY];
    if (home.list_price) {
      simFilters.push(`ListPrice ge ${Math.round(home.list_price * 0.7)}`);
      simFilters.push(`ListPrice le ${Math.round(home.list_price * 1.3)}`);
    }

    const [near, sim] = await Promise.all([
      fetchRows(nearFilters.join(" and "), 8, true),
      fetchRows(simFilters.join(" and "), 9, true),
    ]);

    const map = (rows: Record<string, unknown>[]) =>
      rows
        .map((r) => ({ ...normalizeProperty(r), photo: photoOf(r) }) as MarketCard)
        .filter((r) => r.listing_key !== listingKey);

    return { home, nearby: map(near.raw).slice(0, 6), similar: map(sim.raw).slice(0, 6), error: null };
  } catch (error) {
    console.error("getHomeProfile failed", error);
    return {
      home: null,
      nearby: [] as MarketCard[],
      similar: [] as MarketCard[],
      error: error instanceof Error ? error.message : "MLS request failed",
    };
  }
}
