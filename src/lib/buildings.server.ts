// Server-only: live building statistics and unit lists from the Trestle OData feed.
import { readTrestleEnv, trestleGet, normalizeProperty } from "./trestle.server";
import { summarize, photoOf, EMPTY_STATS, type MarketStats } from "./market.server";
import { BUILDINGS, getBuilding, type Building } from "./buildings";

export type BuildingStats = MarketStats & {
  slug: string;
  avgPrice: number | null;
  avgRent: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  minRent: number | null;
  maxRent: number | null;
  salePerSqFt: number | null;
  rentPerSqFt: number | null;
  saleCount: number;
  rentCount: number;
  photo: string | null;
};

export type BuildingUnit = ReturnType<typeof normalizeProperty> & { photo: string | null };

const esc = (v: string) => v.replace(/'/g, "''");

const cache = new Map<string, { at: number; data: BuildingStats }>();
const TTL = 10 * 60 * 1000;

function buildingFilter(b: Building, extra?: string) {
  const base = `StandardStatus eq 'Active' and City eq '${esc(b.city)}' and startswith(UnparsedAddress,'${esc(b.addressPrefix)}')`;
  return extra ? `${base} and ${extra}` : base;
}

const avg = (values: number[]) =>
  values.length ? Math.round(values.reduce((a, c) => a + c, 0) / values.length) : null;

async function statsFor(b: Building): Promise<BuildingStats> {
  const hit = cache.get(b.slug);
  if (hit && Date.now() - hit.at < TTL) return hit.data;

  const { env } = readTrestleEnv();
  const empty: BuildingStats = {
    ...EMPTY_STATS,
    slug: b.slug,
    avgPrice: null,
    avgRent: null,
    minPrice: null,
    maxPrice: null,
    minRent: null,
    maxRent: null,
    salePerSqFt: null,
    rentPerSqFt: null,
    saleCount: 0,
    rentCount: 0,
    photo: null,
  };
  if (!env) return empty;

  try {
    const res = await trestleGet(env, "Property", {
      $top: "40",
      $count: "true",
      $filter: buildingFilter(b),
      $orderby: "ListPrice asc",
      $expand: "Media",
    });

    const rows = res.value.map(normalizeProperty);
    const sales = rows.filter((r) => r.property_type !== "ResidentialLease");
    const rentals = rows.filter((r) => r.property_type === "ResidentialLease");
    const prices = sales.map((r) => r.list_price).filter((p): p is number => typeof p === "number");
    const rents = rentals.map((r) => r.list_price).filter((p): p is number => typeof p === "number");
    const withPhoto = res.value.find((raw) => photoOf(raw));

    const ppsf = (list: typeof sales) => {
      const values = list
        .filter((r) => r.list_price && r.living_area && r.living_area > 200)
        .map((r) => r.list_price! / r.living_area!);
      return values.length ? Math.round(values.reduce((a, c) => a + c, 0) / values.length) : null;
    };

    const data: BuildingStats = {
      ...summarize(rows),
      slug: b.slug,
      avgPrice: avg(prices),
      avgRent: avg(rents),
      minPrice: prices.length ? Math.min(...prices) : null,
      maxPrice: prices.length ? Math.max(...prices) : null,
      minRent: rents.length ? Math.min(...rents) : null,
      maxRent: rents.length ? Math.max(...rents) : null,
      salePerSqFt: ppsf(sales),
      rentPerSqFt: ppsf(rentals),
      saleCount: sales.length,
      rentCount: rentals.length,
      photo: withPhoto ? photoOf(withPhoto) : null,
    };
    cache.set(b.slug, { at: Date.now(), data });
    return data;
  } catch (error) {
    console.error("building stats failed", b.slug, error);
    return empty;
  }
}

export async function getBuildingDirectory() {
  const stats = await Promise.all(BUILDINGS.map(statsFor));
  return { stats };
}

const DAY = 24 * 60 * 60 * 1000;

function split(units: BuildingUnit[]) {
  const saleUnits = units.filter((u) => u.property_type !== "ResidentialLease");
  const rentalUnits = units.filter((u) => u.property_type === "ResidentialLease");
  const priceDropUnits = units.filter((u) => {
    const prior = u.previous_list_price ?? u.original_list_price;
    return typeof prior === "number" && typeof u.list_price === "number" && u.list_price < prior;
  });
  const since = Date.now() - 30 * DAY;
  const newUnits = units.filter((u) => {
    const d = u.listing_contract_date ? new Date(u.listing_contract_date).getTime() : NaN;
    return !Number.isNaN(d) && d >= since;
  });
  return { saleUnits, rentalUnits, priceDropUnits, newUnits };
}

export async function getBuildingProfile(slug: string) {
  const b = getBuilding(slug);
  const none = { units: [] as BuildingUnit[], ...split([]) };
  if (!b) return { stats: null, ...none, error: "Unknown building" };

  const { env } = readTrestleEnv();
  const stats = await statsFor(b);
  if (!env) return { stats, ...none, error: "MLS not configured" };

  try {
    const res = await trestleGet(env, "Property", {
      $top: "60",
      $filter: buildingFilter(b),
      $orderby: "ListPrice desc",
      $expand: "Media",
    });
    const units: BuildingUnit[] = res.value.map((raw) => ({
      ...normalizeProperty(raw),
      photo: photoOf(raw),
    }));
    return { stats, units, ...split(units), error: null as string | null };
  } catch (error) {
    console.error("building units failed", slug, error);
    return {
      stats,
      ...none,
      error: error instanceof Error ? error.message : "MLS request failed",
    };
  }
}
