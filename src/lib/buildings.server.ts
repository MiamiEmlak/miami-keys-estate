// Server-only: live building statistics and unit lists from the Trestle OData feed.
import { readTrestleEnv, trestleGet, normalizeProperty } from "./trestle.server";
import { BUILDINGS, getBuilding, type Building } from "./buildings";

export type BuildingStats = {
  slug: string;
  activeCount: number;
  rentalCount: number;
  avgPpsf: number | null;
  minPrice: number | null;
  photo: string | null;
};

export type BuildingUnit = ReturnType<typeof normalizeProperty> & { photo: string | null };

const esc = (v: string) => v.replace(/'/g, "''");

const cache = new Map<string, { at: number; data: BuildingStats }>();
const TTL = 10 * 60 * 1000;

function photoOf(raw: Record<string, unknown>): string | null {
  const media = raw["Media"];
  if (!Array.isArray(media)) return null;
  const photos = (media as Record<string, unknown>[])
    .filter((m) => typeof m["MediaURL"] === "string" && m["MediaCategory"] !== "Document")
    .sort((a, b) => Number(a["Order"] ?? 0) - Number(b["Order"] ?? 0));
  return (photos[0]?.["MediaURL"] as string) ?? null;
}

function buildingFilter(b: Building, extra?: string) {
  const base = `StandardStatus eq 'Active' and City eq '${esc(b.city)}' and startswith(UnparsedAddress,'${esc(b.addressPrefix)}')`;
  return extra ? `${base} and ${extra}` : base;
}

async function statsFor(b: Building): Promise<BuildingStats> {
  const hit = cache.get(b.slug);
  if (hit && Date.now() - hit.at < TTL) return hit.data;

  const { env } = readTrestleEnv();
  const empty: BuildingStats = {
    slug: b.slug,
    activeCount: 0,
    rentalCount: 0,
    avgPpsf: null,
    minPrice: null,
    photo: null,
  };
  if (!env) return empty;

  try {
    const res = await trestleGet(env, "Property", {
      $top: "20",
      $count: "true",
      $filter: buildingFilter(b),
      $orderby: "ListPrice asc",
      $expand: "Media",
    });

    const rows = res.value.map(normalizeProperty);
    const sales = rows.filter((r) => r.property_type !== "ResidentialLease");
    const ppsf = sales
      .filter((r) => r.list_price && r.living_area)
      .map((r) => r.list_price! / r.living_area!);
    const prices = sales.map((r) => r.list_price).filter((p): p is number => typeof p === "number");
    const withPhoto = res.value.find((raw) => photoOf(raw));

    const data: BuildingStats = {
      slug: b.slug,
      activeCount: res.count ?? rows.length,
      rentalCount: rows.filter((r) => r.property_type === "ResidentialLease").length,
      avgPpsf: ppsf.length ? Math.round(ppsf.reduce((a, c) => a + c, 0) / ppsf.length) : null,
      minPrice: prices.length ? Math.min(...prices) : null,
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

export async function getBuildingProfile(slug: string) {
  const b = getBuilding(slug);
  if (!b) return { stats: null, units: [] as BuildingUnit[], error: "Unknown building" };

  const { env } = readTrestleEnv();
  const stats = await statsFor(b);
  if (!env) return { stats, units: [] as BuildingUnit[], error: "MLS not configured" };

  try {
    const res = await trestleGet(env, "Property", {
      $top: "40",
      $filter: buildingFilter(b),
      $orderby: "ListPrice desc",
      $expand: "Media",
    });
    const units: BuildingUnit[] = res.value.map((raw) => ({
      ...normalizeProperty(raw),
      photo: photoOf(raw),
    }));
    return { stats, units, error: null as string | null };
  } catch (error) {
    console.error("building units failed", slug, error);
    return {
      stats,
      units: [] as BuildingUnit[],
      error: error instanceof Error ? error.message : "MLS request failed",
    };
  }
}
