// Server-only Trestle (Cotality) OData client.
// Credentials are read from server environment variables and never leave the server.

export type TrestleEnv = {
  baseUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
};

export type TrestleProperty = {
  listing_key: string;
  listing_id: string | null;
  standard_status: string | null;
  list_price: number | null;
  property_type: string | null;
  property_sub_type: string | null;
  street_address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  bedrooms_total: number | null;
  bathrooms_total: number | null;
  living_area: number | null;
  lot_size: number | null;
  year_built: number | null;
  tax_annual_amount: number | null;
  association_fee: number | null;
  association_fee_frequency: string | null;
  list_agent_id: string | null;
  list_office_id: string | null;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  original_list_price: number | null;
  previous_list_price: number | null;
  modification_timestamp: string | null;
  listing_contract_date: string | null;
  close_price: number | null;
  close_date: string | null;
};

export function readTrestleEnv(): { env: TrestleEnv | null; missing: string[] } {
  const names = [
    "TRESTLE_BASE_URL",
    "TRESTLE_TOKEN_URL",
    "TRESTLE_CLIENT_ID",
    "TRESTLE_CLIENT_SECRET",
  ] as const;
  const missing = names.filter((n) => !process.env[n]);
  if (missing.length > 0) return { env: null, missing: [...missing] };
  return {
    env: {
      baseUrl: process.env["TRESTLE_BASE_URL"]!.replace(/\/$/, ""),
      tokenUrl: process.env["TRESTLE_TOKEN_URL"]!,
      clientId: process.env["TRESTLE_CLIENT_ID"]!,
      clientSecret: process.env["TRESTLE_CLIENT_SECRET"]!,
    },
    missing: [],
  };
}

// Trestle uses OAuth2 client_credentials.
export async function getTrestleToken(env: TrestleEnv): Promise<string> {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: env.clientId,
    client_secret: env.clientSecret,
    scope: "api",
  });
  const res = await fetch(env.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new Error(`Trestle token request failed (${res.status})`);
  }
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error("Trestle token response had no access_token");
  return json.access_token;
}

export async function trestleGet(
  env: TrestleEnv,
  path: string,
  query: Record<string, string>,
): Promise<{ value: Record<string, unknown>[]; count: number | undefined }> {
  const token = await getTrestleToken(env);
  const url = new URL(`${env.baseUrl}/${path.replace(/^\//, "")}`);
  for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Trestle request failed (${res.status}) for ${path}`);
  }
  const json = (await res.json()) as {
    value?: Record<string, unknown>[];
    "@odata.count"?: number;
  };
  return { value: json.value ?? [], count: json["@odata.count"] };
}

const num = (v: unknown): number | null =>
  typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : null;
const str = (v: unknown): string | null => (typeof v === "string" && v !== "" ? v : null);

// Maps a raw Trestle Property record onto the properties table shape.
export function normalizeProperty(raw: Record<string, unknown>): TrestleProperty {
  return {
    listing_key: String(raw["ListingKey"] ?? ""),
    listing_id: str(raw["ListingId"]),
    standard_status: str(raw["StandardStatus"]),
    list_price: num(raw["ListPrice"]),
    property_type: str(raw["PropertyType"]),
    property_sub_type: str(raw["PropertySubType"]),
    street_address: str(raw["UnparsedAddress"]),
    city: str(raw["City"]),
    state: str(raw["StateOrProvince"]),
    postal_code: str(raw["PostalCode"]),
    bedrooms_total: num(raw["BedroomsTotal"]),
    bathrooms_total: num(raw["BathroomsTotalInteger"]),
    living_area: num(raw["LivingArea"]),
    lot_size: num(raw["LotSizeSquareFeet"]),
    year_built: num(raw["YearBuilt"]),
    tax_annual_amount: num(raw["TaxAnnualAmount"]),
    association_fee: num(raw["AssociationFee"]),
    association_fee_frequency: str(raw["AssociationFeeFrequency"]),
    list_agent_id: str(raw["ListAgentMlsId"]),
    list_office_id: str(raw["ListOfficeMlsId"]),
    description: str(raw["PublicRemarks"]),
    latitude: num(raw["Latitude"]),
    longitude: num(raw["Longitude"]),
    original_list_price: num(raw["OriginalListPrice"]),
    previous_list_price: num(raw["PreviousListPrice"]),
    modification_timestamp: str(raw["ModificationTimestamp"]),
    listing_contract_date: str(raw["ListingContractDate"]),
    close_price: num(raw["ClosePrice"]),
    close_date: str(raw["CloseDate"]),
  };
}

export function normalizeMedia(raw: Record<string, unknown>) {
  return {
    media_key: String(raw["MediaKey"] ?? ""),
    listing_key: str(raw["ResourceRecordKey"]),
    media_url: str(raw["MediaURL"]),
    media_type: str(raw["MediaType"]),
    media_category: str(raw["MediaCategory"]),
    order_number: num(raw["Order"]),
    short_description: str(raw["ShortDescription"]),
    modification_timestamp: str(raw["ModificationTimestamp"]),
  };
}
