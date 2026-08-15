// Server-only listing search/detail logic built on the Trestle OData feed.
import { readTrestleEnv, trestleGet, normalizeProperty, normalizeMedia } from "./trestle.server";

export type SearchParamsInput = {
  city?: string;
  zip?: string;
  type?: string; // buy | rent | investment
  minPrice?: number;
  maxPrice?: number;
  beds?: number;
  baths?: number;
  propertyType?: string;
  sort?: string; // newest | price_asc | price_desc | ppsf
  filter?: string; // price_drops
  page?: number;
  pageSize?: number;
};

export type ListingCard = ReturnType<typeof normalizeProperty> & {
  photo: string | null;
  photo_count: number;
};

const esc = (v: string) => v.replace(/'/g, "''");

function typeFilter(type: string | undefined): string | null {
  switch (type) {
    case "rent":
      return "PropertyType eq 'ResidentialLease'";
    case "investment":
      return "(PropertyType eq 'ResidentialIncome' or PropertyType eq 'CommercialSale')";
    case "buy":
      return "(PropertyType eq 'Residential' or PropertyType eq 'ResidentialIncome')";
    default:
      return null;
  }
}

function orderBy(sort: string | undefined): string {
  switch (sort) {
    case "price_asc":
      return "ListPrice asc";
    case "price_desc":
      return "ListPrice desc";
    default:
      return "ModificationTimestamp desc";
  }
}

function firstPhoto(media: unknown): { photo: string | null; count: number } {
  if (!Array.isArray(media)) return { photo: null, count: 0 };
  const photos = (media as Record<string, unknown>[])
    .filter((m) => typeof m["MediaURL"] === "string" && m["MediaCategory"] !== "Document")
    .sort((a, b) => Number(a["Order"] ?? 0) - Number(b["Order"] ?? 0));
  return { photo: (photos[0]?.["MediaURL"] as string) ?? null, count: photos.length };
}

export async function searchListings(input: SearchParamsInput) {
  const { env, missing } = readTrestleEnv();
  if (!env) {
    return {
      items: [] as ListingCard[],
      total: 0,
      page: 1,
      pageSize: 24,
      error: `MLS not configured: ${missing.join(", ")}`,
    };
  }

  // Hard pagination: never request the full result set.
  const pageSize = Math.min(Math.max(input.pageSize ?? 24, 1), 50);
  const page = Math.max(input.page ?? 1, 1);

  const filters = ["StandardStatus eq 'Active'"];
  const t = typeFilter(input.type);
  if (t) filters.push(t);
  if (input.city) filters.push(`City eq '${esc(input.city)}'`);
  if (input.zip) filters.push(`PostalCode eq '${esc(input.zip)}'`);
  if (input.minPrice) filters.push(`ListPrice ge ${Math.round(input.minPrice)}`);
  if (input.maxPrice) filters.push(`ListPrice le ${Math.round(input.maxPrice)}`);
  if (input.beds) filters.push(`BedroomsTotal ge ${Math.round(input.beds)}`);
  if (input.baths) filters.push(`BathroomsTotalInteger ge ${Math.round(input.baths)}`);
  if (input.propertyType) filters.push(`PropertySubType eq '${esc(input.propertyType)}'`);
  if (input.filter === "price_drops") filters.push("ListPrice lt PreviousListPrice");

  try {
    const result = await trestleGet(env, "Property", {
      $top: String(pageSize),
      $skip: String((page - 1) * pageSize),
      $count: "true",
      $filter: filters.join(" and "),
      $orderby: orderBy(input.sort),
      $expand: "Media",
    });

    let items: ListingCard[] = result.value.map((raw) => {
      const { photo, count } = firstPhoto(raw["Media"]);
      return { ...normalizeProperty(raw), photo, photo_count: count };
    });

    if (input.sort === "ppsf") {
      const ppsf = (i: ListingCard) =>
        i.list_price && i.living_area ? i.list_price / i.living_area : Number.POSITIVE_INFINITY;
      items = [...items].sort((a, b) => ppsf(a) - ppsf(b));
    }

    return { items, total: result.count ?? items.length, page, pageSize, error: null as string | null };
  } catch (error) {
    console.error("searchListings failed", error);
    return {
      items: [] as ListingCard[],
      total: 0,
      page,
      pageSize,
      error: error instanceof Error ? error.message : "MLS request failed",
    };
  }
}

export async function getListingDetail(listingKey: string) {
  const { env } = readTrestleEnv();
  if (!env) return { listing: null, media: [], features: {}, error: "MLS not configured" };

  try {
    const result = await trestleGet(env, "Property", {
      $top: "1",
      $filter: `ListingKey eq '${esc(listingKey)}'`,
    });
    const raw = result.value[0];
    if (!raw) return { listing: null, media: [], features: {}, error: null as string | null };

    const mediaResult = await trestleGet(env, "Media", {
      $top: "40",
      $filter: `ResourceRecordKey eq '${esc(listingKey)}'`,
      $orderby: "Order asc",
    });

    const list = (v: unknown): string[] =>
      Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

    return {
      listing: normalizeProperty(raw),
      media: mediaResult.value.map(normalizeMedia).filter((m) => m.media_url),
      features: {
        appliances: list(raw["Appliances"]),
        cooling: list(raw["Cooling"]),
        heating: list(raw["Heating"]),
        view: list(raw["View"]),
        waterfront: list(raw["WaterfrontFeatures"]),
        parking: list(raw["ParkingFeatures"]),
        interior: list(raw["InteriorFeatures"]),
        exterior: list(raw["ExteriorFeatures"]),
        pool: list(raw["PoolFeatures"]),
        flooring: list(raw["Flooring"]),
      } as Record<string, string[]>,
      error: null as string | null,
    };
  } catch (error) {
    console.error("getListingDetail failed", error);
    return {
      listing: null,
      media: [] as ReturnType<typeof normalizeMedia>[],
      features: {} as Record<string, string[]>,
      error: error instanceof Error ? error.message : "MLS request failed",
    };
  }
}